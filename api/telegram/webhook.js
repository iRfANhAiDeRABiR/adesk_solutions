/**
 * Serverless API: /api/telegram/webhook
 * Receives and Authenticates Real-Time Telegram Bot Webhook Events
 */

import { OrderStateMachine } from '../_lib/store.js';
import { updateTelegramMessageRemark } from '../_lib/security.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
const ALLOWED_ADMIN_IDS = (process.env.ALLOWED_ADMIN_IDS || process.env.TELEGRAM_ADMIN_CHAT_ID || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Webhook Secret Token Verification
  if (TELEGRAM_WEBHOOK_SECRET) {
    const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (receivedSecret !== TELEGRAM_WEBHOOK_SECRET) {
      return res.status(403).json({ error: 'Forbidden: Invalid webhook secret token' });
    }
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const cb = body?.callback_query;

    if (!cb || !cb.data) {
      return res.status(200).json({ ok: true, ignored: 'No callback query in payload' });
    }

    // 2. Administrator Authorization Verification
    const senderId = String(cb.from?.id || '');
    if (ALLOWED_ADMIN_IDS.length > 0 && !ALLOWED_ADMIN_IDS.includes(senderId)) {
      if (TELEGRAM_BOT_TOKEN && cb.id) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: cb.id,
            text: '⛔ Unauthorized: You are not an authorized administrator.',
            show_alert: true
          })
        }).catch(() => {});
      }
      return res.status(403).json({ error: 'Forbidden: Unauthorized Telegram user' });
    }

    // 3. Parse action and order reference
    const dataStr = String(cb.data).trim();
    let action = null;
    let orderRef = null;

    if (dataStr.startsWith('confirm_')) {
      action = 'CONFIRMED';
      orderRef = dataStr.replace(/^confirm_/, '');
    } else if (dataStr.startsWith('invalid_')) {
      action = 'INVALID';
      orderRef = dataStr.replace(/^invalid_/, '');
    }

    if (!action || !orderRef) {
      return res.status(200).json({ ok: true, ignored: 'Unknown callback action' });
    }

    // 4. Update Order State Machine
    const updateResult = OrderStateMachine.updateStatus(orderRef, action, {
      userId: senderId,
      username: cb.from?.username || cb.from?.first_name || 'Admin'
    });

    // 5. Answer Callback Query
    if (TELEGRAM_BOT_TOKEN && cb.id) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: cb.id,
          text: action === 'CONFIRMED'
            ? `✅ Order #${orderRef} Confirmed!`
            : `❌ Order #${orderRef} marked as Invalid!`,
          show_alert: false
        })
      }).catch(() => {});
    }

    // 6. Update Message Text & Inline Buttons in Telegram Message with visible remarks
    if (TELEGRAM_BOT_TOKEN && cb.message?.chat?.id && cb.message?.message_id) {
      const orderRec = OrderStateMachine.getOrder(orderRef);
      await updateTelegramMessageRemark({
        botToken: TELEGRAM_BOT_TOKEN,
        chatId: cb.message.chat.id,
        messageId: cb.message.message_id,
        orderRef,
        action,
        adminName: cb.from?.username ? `@${cb.from.username}` : (cb.from?.first_name || 'Admin'),
        originalText: cb.message.text,
        orderRecord: orderRec
      }).catch(() => {});
    }

    return res.status(200).json({
      ok: true,
      action,
      orderRef,
      stateUpdated: updateResult.success
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error processing webhook' });
  }
}

