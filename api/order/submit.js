/**
 * Serverless API: /api/order/submit
 * Secure Order Submission and Authoritative Payment Verification Dispatch
 */

import fs from 'node:fs';
import {
  validateOrderInput,
  calculateAuthoritativePrice,
  generateOrderRef,
  escapeTelegramHtml,
  checkRateLimit
} from '../_lib/security.js';
import { OrderStateMachine } from '../_lib/store.js';

// Dynamically resolve environment variables (supports Vercel, Node, and local .env fallback)
function getTelegramConfig() {
  let token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN || '';
  let chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID || '';

  if (!token || !chatId) {
    try {
      if (fs.existsSync('.env')) {
        const text = fs.readFileSync('.env', 'utf-8');
        const mToken = text.match(/TELEGRAM_BOT_TOKEN=([^\r\n]+)/);
        const mChat = text.match(/TELEGRAM_ADMIN_CHAT_ID=([^\r\n]+)/);
        if (mToken && !token) token = mToken[1].trim();
        if (mChat && !chatId) chatId = mChat[1].trim();
      }
    } catch (e) {}
  }
  return { token, chatId };
}

export default async function handler(req, res) {
  // Enforce POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Use POST.'
    });
  }

  // Rate Limiting: 10 submissions per 5 minutes per client IP
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(`submit_${clientIp}`, 10, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too many order submissions. Please wait a few minutes before trying again.',
      retryAfterMs: rateLimit.retryAfterMs
    });
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // 1. Strict Input Validation
    const validation = validateOrderInput(rawBody);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const input = validation.sanitized;

    // 2. Authoritative Price Recalculation (Server-Side Source of Truth)
    const pricing = calculateAuthoritativePrice(input.duration, input.quantity, input.couponCode);

    // 3. Generate Unpredictable Reference ID (ignore client-supplied refId for security)
    const orderRef = generateOrderRef();

    // 4. Register in Order State Machine & Check Duplicate TrxID
    const registration = OrderStateMachine.createOrder({
      refId: orderRef,
      name: input.name,
      email: input.email,
      phone: input.phone,
      product: input.product,
      duration: pricing.duration,
      quantity: pricing.quantity,
      baseUnitPrice: pricing.baseUnitPrice,
      baseTotalPrice: pricing.baseTotalPrice,
      finalTotalPrice: pricing.finalTotalPrice,
      displayPrice: pricing.displayPrice,
      couponApplied: pricing.couponApplied,
      discountAmount: pricing.discountAmount,
      paymentMethod: input.paymentMethod,
      senderNumber: input.senderNumber,
      trxId: input.trxId,
      requirements: input.requirements
    });

    if (!registration.success) {
      return res.status(409).json({
        success: false,
        reason: registration.reason,
        error: registration.error
      });
    }

    // 5. Send Notification to Telegram Bot (Server-to-Telegram Privately)
    let telegramDispatched = false;
    let telegramError = null;

    const { token: botToken, chatId: adminChatId } = getTelegramConfig();

    if (botToken && adminChatId) {
      const safeRefId = escapeTelegramHtml(orderRef);
      const safeName = escapeTelegramHtml(input.name);
      const safeEmail = escapeTelegramHtml(input.email);
      const safePhone = escapeTelegramHtml(input.phone);
      const safeProduct = escapeTelegramHtml(input.product);
      const safeDuration = escapeTelegramHtml(pricing.duration);
      const safeQty = escapeTelegramHtml(pricing.quantity);
      const safeTotalPrice = escapeTelegramHtml(pricing.displayPrice);
      const safeGateway = escapeTelegramHtml(input.paymentMethod);
      const safeSender = escapeTelegramHtml(input.senderNumber);
      const safeTrxId = escapeTelegramHtml(input.trxId);

      const couponLine = pricing.couponApplied
        ? `\n🏷️ <b>Coupon:</b> <code>${escapeTelegramHtml(pricing.couponApplied)}</code> (-10%, saved ৳ ${pricing.discountAmount})`
        : '';

      const messageText = `
🔔 <b>NEW SOFTWARE SOLUTIONS BD ORDER</b>
━━━━━━━━━━━━━━━━━━━━━
📋 <b>Order Ref:</b> <code>${safeRefId}</code>
👤 <b>Customer:</b> <b>${safeName}</b>
📧 <b>Delivery Email:</b> <code>${safeEmail}</code>
📱 <b>Customer Phone:</b> <code>${safePhone}</code>
━━━━━━━━━━━━━━━━━━━━━
📦 <b>Product:</b> ${safeProduct}
⏳ <b>Duration:</b> ${safeDuration}
🪑 <b>Seats/Qty:</b> ${safeQty} Seat(s)
💰 <b>Authoritative Total:</b> <b>${safeTotalPrice}</b>${couponLine}
━━━━━━━━━━━━━━━━━━━━━
💳 <b>Payment Gateway:</b> <b>${safeGateway}</b>
📤 <b>Sender Number:</b> <code>${safeSender}</code>
🔑 <b>Transaction ID:</b> <code>${safeTrxId}</code>
⏰ <b>Time:</b> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}
━━━━━━━━━━━━━━━━━━━━━
Status: ⏳ <b>PENDING MANUAL VERIFICATION</b>
      `.trim();

      try {
        const teleRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: messageText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Confirm (বৈধ)', callback_data: `confirm_${orderRef}` },
                  { text: '❌ Invalid (ভুল TrxID)', callback_data: `invalid_${orderRef}` }
                ]
              ]
            }
          })
        });

        const teleData = await teleRes.json();
        telegramDispatched = teleData.ok === true;
        if (!telegramDispatched) {
          telegramError = teleData.description || 'Telegram API returned error';
        }
      } catch (err) {
        telegramError = 'Failed to reach Telegram API';
      }
    } else {
      telegramError = 'TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured on server';
    }

    // 6. Return response to browser (Without any secret disclosure)
    return res.status(200).json({
      success: true,
      refId: orderRef,
      status: 'PENDING',
      pricing: {
        duration: pricing.duration,
        quantity: pricing.quantity,
        totalPrice: pricing.displayPrice,
        finalTotalPrice: pricing.finalTotalPrice,
        couponApplied: pricing.couponApplied
      },
      telegramDispatched,
      telegramError: telegramDispatched ? null : telegramError,
      message: 'Order submitted successfully and awaiting administrator payment verification.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing the order.'
    });
  }
}
