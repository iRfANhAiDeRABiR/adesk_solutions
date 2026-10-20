/**
 * Serverless API: /api/order/verify
 * Secure Payment Verification Status Lookup
 * Replaces client-side Telegram polling, shielding bot tokens and customer data.
 */

import fs from 'node:fs';
import { OrderStateMachine } from '../_lib/store.js';
import { checkRateLimit } from '../_lib/security.js';

function getTelegramConfig() {
  let token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN || '';
  let allowedIds = (process.env.ALLOWED_ADMIN_IDS || process.env.TELEGRAM_ADMIN_CHAT_ID || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  if (!token) {
    try {
      if (fs.existsSync('.env')) {
        const text = fs.readFileSync('.env', 'utf-8');
        const mToken = text.match(/TELEGRAM_BOT_TOKEN=([^\r\n]+)/);
        const mChat = text.match(/TELEGRAM_ADMIN_CHAT_ID=([^\r\n]+)/);
        const mAllowed = text.match(/ALLOWED_ADMIN_IDS=([^\r\n]+)/);
        if (mToken && !token) token = mToken[1].trim();
        if (mAllowed && allowedIds.length === 0) {
          allowedIds = mAllowed[1].split(',').map(s => s.trim()).filter(Boolean);
        } else if (mChat && allowedIds.length === 0) {
          allowedIds = [mChat[1].trim()];
        }
      }
    } catch (e) {}
  }
  return { token, allowedIds };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET.' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(`verify_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too many status check requests. Please slow down.'
    });
  }

  const { ref } = req.query || {};
  if (!ref || typeof ref !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing order reference parameter (ref).'
    });
  }

  const cleanRef = ref.trim().toUpperCase();
  const order = OrderStateMachine.getOrder(cleanRef);
  const { token: botToken, allowedIds } = getTelegramConfig();

  if (!order) {
    // Check if Telegram updates contain info if memory was reset
    if (botToken) {
      try {
        const updateStatus = await syncStatusFromTelegram(cleanRef, botToken, allowedIds);
        if (updateStatus && updateStatus.status !== 'PENDING') {
          return res.status(200).json({
            success: true,
            refId: cleanRef,
            status: updateStatus.status,
            verifiedAt: updateStatus.verifiedAt,
            verifiedBy: updateStatus.verifiedBy,
            note: updateStatus.note
          });
        }
      } catch (e) {
        // Fallback
      }
    }

    return res.status(200).json({
      success: true,
      refId: cleanRef,
      status: 'PENDING',
      message: 'Order reference is pending initial verification.'
    });
  }

  // If already confirmed or marked invalid in state machine, return immediately
  if (order.status !== OrderStateMachine.STATUS.PENDING) {
    return res.status(200).json({
      success: true,
      refId: order.refId,
      status: order.status,
      verifiedAt: order.verifiedAt,
      verifiedBy: order.verifiedBy,
      note: order.verificationNote
    });
  }

  // If pending, check server-side Telegram updates if available
  if (botToken) {
    try {
      const updateStatus = await syncStatusFromTelegram(cleanRef, botToken, allowedIds);
      if (updateStatus && updateStatus.status !== 'PENDING') {
        OrderStateMachine.updateStatus(cleanRef, updateStatus.status, {
          username: updateStatus.verifiedBy,
          userId: updateStatus.userId
        });

        return res.status(200).json({
          success: true,
          refId: order.refId,
          status: updateStatus.status,
          verifiedAt: updateStatus.verifiedAt,
          verifiedBy: updateStatus.verifiedBy,
          note: updateStatus.note
        });
      }
    } catch (e) {}
  }

  return res.status(200).json({
    success: true,
    refId: order.refId,
    status: OrderStateMachine.STATUS.PENDING,
    message: 'Payment verification is in progress by administrator.'
  });
}

/**
 * Server-side helper: Sync status from Telegram Bot API without exposing anything to client
 */
async function syncStatusFromTelegram(targetRef, botToken, allowedIds) {
  if (!botToken) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return null;

    for (let i = data.result.length - 1; i >= 0; i--) {
      const item = data.result[i];
      const cb = item.callback_query;
      if (!cb || !cb.data) continue;

      // Verify Admin Authorization if allowlist configured
      if (allowedIds && allowedIds.length > 0) {
        const senderId = String(cb.from?.id || '');
        if (!allowedIds.includes(senderId)) {
          continue; // Ignore callbacks from unauthorized Telegram users
        }
      }

      const dataStr = String(cb.data).trim().toUpperCase();
      const isConfirm = dataStr === `CONFIRM_${targetRef}` || dataStr === `CONFIRMED_DONE_${targetRef}`;
      const isInvalid = dataStr === `INVALID_${targetRef}` || dataStr === `INVALID_DONE_${targetRef}`;

      if (isConfirm || isInvalid) {
        // Answer callback query server-side
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: cb.id,
              text: isConfirm ? `✅ Order ${targetRef} Confirmed` : `❌ Order ${targetRef} marked Invalid`,
              show_alert: false
            })
          });
        } catch (e) {}

        return {
          status: isConfirm ? 'CONFIRMED' : 'INVALID',
          verifiedBy: cb.from?.first_name || 'Admin',
          userId: cb.from?.id,
          verifiedAt: new Date(cb.message?.date ? cb.message.date * 1000 : Date.now()),
          note: isConfirm
            ? 'Payment verified by administrator on Telegram.'
            : 'Transaction ID was rejected as invalid by administrator on Telegram.'
        };
      }
    }
  } catch (e) {}

  return null;
}
