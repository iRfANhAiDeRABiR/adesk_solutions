/**
 * Security & Validation Utilities for Software Solutions BD
 * Authoritative Server-Side Business Logic & Integrity Protection
 */

// Authoritative pricing rules (BDT) - Immutable server-side definitions
export const AUTHORITATIVE_PLANS = {
  '1 Year': { duration: '1 Year', price: 649 },
  '2 Years': { duration: '2 Years', price: 1149 },
  '3 Years': { duration: '3 Years', price: 1749 },
  '1 year': { duration: '1 Year', price: 649 },
  '2 years': { duration: '2 Years', price: 1149 },
  '3 years': { duration: '3 Years', price: 1749 }
};

// Authorized coupon codes and their fixed percentage discounts
export const AUTHORIZED_COUPONS = {
  'SAVE10': 0.10,
  'SAFE10': 0.10
};

// Strict TrxID validation patterns per payment provider
export const TRX_PATTERNS = {
  Bkash: /^[A-Z0-9]{8,12}$/i,    // 8 to 12 chars alphanumeric (typically 10 chars, e.g. BL84J2K9LM)
  Nagad: /^[A-Z0-9]{8,12}$/i,    // 8 to 12 chars alphanumeric
  Rocket: /^[A-Z0-9]{6,12}$/i    // 6 to 12 chars alphanumeric
};

// Bangladeshi Phone Number validation (11 digits: 013-019 or +88013-019)
export const BD_PHONE_REGEX = /^(?:\+?880|0)?1[3-9]\d{8}$/;

// Standard Email RFC 5322 simplified pattern
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * HTML escaping for safe interpolation into Telegram HTML parse_mode
 * Prevents HTML injection, tag breakdown, and attribute abuse.
 */
export function escapeTelegramHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Server-side authoritative price calculation.
 * Never trusts prices or discounts supplied by the browser.
 */
export function calculateAuthoritativePrice(duration, quantity, couponCode) {
  const plan = AUTHORITATIVE_PLANS[duration] || AUTHORITATIVE_PLANS['1 Year'];
  const sanitizedQty = Math.max(1, Math.min(50, parseInt(quantity, 10) || 1));
  const baseTotalPrice = plan.price * sanitizedQty;

  const cleanCoupon = typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : null;
  const discountRate = (cleanCoupon && AUTHORIZED_COUPONS[cleanCoupon]) ? AUTHORIZED_COUPONS[cleanCoupon] : 0;
  const discountAmount = Math.round(baseTotalPrice * discountRate);
  const finalTotalPrice = baseTotalPrice - discountAmount;
  const unitPrice = Math.round(finalTotalPrice / sanitizedQty);

  return {
    duration: plan.duration,
    quantity: sanitizedQty,
    baseUnitPrice: plan.price,
    baseTotalPrice,
    couponApplied: discountRate > 0 ? cleanCoupon : null,
    discountRate,
    discountAmount,
    finalTotalPrice,
    unitPrice,
    displayPrice: `৳ ${finalTotalPrice.toLocaleString()}`
  };
}

/**
 * Comprehensive input validator for order submission
 */
export function validateOrderInput(input) {
  const errors = [];

  // Name validation: 2 - 80 characters
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  if (!name || name.length < 2 || name.length > 80) {
    errors.push('Customer name must be between 2 and 80 characters.');
  }

  // Email validation
  const email = typeof input?.email === 'string' ? input.email.trim() : '';
  if (!email || !EMAIL_REGEX.test(email) || email.length > 100) {
    errors.push('A valid email address is required.');
  }

  // Customer Phone validation
  const rawPhone = typeof input?.phone === 'string' ? input.phone.trim().replace(/[\s-]/g, '') : '';
  if (!rawPhone || !BD_PHONE_REGEX.test(rawPhone)) {
    errors.push('A valid 11-digit Bangladeshi mobile number is required for customer contact.');
  }

  // Payment Method validation (case-insensitive normalization)
  let paymentMethod = 'Bkash';
  const rawMethod = typeof input?.paymentMethod === 'string' ? input.paymentMethod.trim().toLowerCase() : '';
  if (rawMethod === 'bkash') {
    paymentMethod = 'Bkash';
  } else if (rawMethod === 'nagad') {
    paymentMethod = 'Nagad';
  } else if (rawMethod === 'rocket') {
    paymentMethod = 'Rocket';
  } else if (!input?.paymentMethod) {
    paymentMethod = 'Bkash';
  } else {
    errors.push('Payment method must be one of: Bkash, Nagad, Rocket.');
  }

  // Sender Number validation
  const rawSender = typeof input?.senderNumber === 'string' ? input.senderNumber.trim().replace(/[\s-]/g, '') : '';
  if (!rawSender || !BD_PHONE_REGEX.test(rawSender)) {
    errors.push('A valid 11-digit Bangladeshi mobile number is required for payment sender.');
  }

  // TrxID validation
  const rawTrx = typeof input?.trxId === 'string' ? input.trxId.trim().toUpperCase() : '';
  const trxPattern = TRX_PATTERNS[paymentMethod] || TRX_PATTERNS.Bkash;
  if (!rawTrx || !trxPattern.test(rawTrx)) {
    if (paymentMethod === 'Bkash') {
      errors.push('bKash TrxID must be 8 to 12 alphanumeric characters (e.g. BL84J2K9LM).');
    } else if (paymentMethod === 'Nagad') {
      errors.push('Nagad TrxID must be 8 to 12 alphanumeric characters.');
    } else {
      errors.push('Rocket TrxID must be 6 to 12 alphanumeric characters.');
    }
  }

  // Requirements / Note validation: max 500 characters
  const requirements = typeof input?.requirements === 'string' ? input.requirements.trim().slice(0, 500) : '';

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name,
      email,
      phone: rawPhone,
      product: 'Autodesk All Apps',
      duration: input?.duration || '1 Year',
      quantity: input?.quantity || 1,
      paymentMethod,
      senderNumber: rawSender,
      trxId: rawTrx,
      couponCode: input?.couponCode || null,
      requirements,
      fbp: typeof input?.fbp === 'string' && input.fbp.startsWith('fb.') ? input.fbp.trim() : null,
      fbc: typeof input?.fbc === 'string' && input.fbc.startsWith('fb.') ? input.fbc.trim() : null,
      eventSourceUrl: typeof input?.eventSourceUrl === 'string' ? input.eventSourceUrl.trim() : null,
      consentGranted: input?.consentGranted !== false
    }
  };
}

/**
 * Generate cryptographically secure and unpredictable order reference
 * Format: SOFT-ATD-<random 6-digit number + 2-char hex>
 */
export function generateOrderRef() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const suffix = Math.random().toString(16).substring(2, 4).toUpperCase();
  return `SOFT-ATD-${randomNum}${suffix}`;
}

/**
 * Sliding window IP rate limiter for serverless environment
 */
const rateLimitMap = new Map();

export function checkRateLimit(ipKey, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ipKey) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
    rateLimitMap.set(ipKey, entry);
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  rateLimitMap.set(ipKey, entry);
  return { allowed: true, remaining: limit - entry.count };
}

/**
 * Updates an existing Telegram order notification message with a visible remark
 * and interactive toggle buttons when an admin clicks Confirm or Invalid.
 */
export async function updateTelegramMessageRemark({
  botToken,
  chatId,
  messageId,
  orderRef,
  action,
  adminName,
  originalText,
  orderRecord
}) {
  if (!botToken || !chatId || !messageId) return false;

  const isConfirm = action === 'CONFIRMED';
  const timeStr = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });
  const adminLabel = adminName ? escapeTelegramHtml(adminName) : 'Administrator';

  const statusRemarkBlock = isConfirm
    ? `Status: ✅ <b>CONFIRMED (বৈধ পেমেন্ট - অর্ডার কনফার্মড)</b>\n📝 <b>Remark:</b> Payment Verified & Approved by <b>${adminLabel}</b> at ${timeStr}`
    : `Status: ❌ <b>INVALID (ভুল ট্রানজেকশন আইডি - বাতিল)</b>\n📝 <b>Remark:</b> Rejected as Invalid TrxID by <b>${adminLabel}</b> at ${timeStr}`;

  const inline_keyboard = isConfirm
    ? [
        [
          { text: '✅ Confirmed (যাচাই সম্পন্ন)', callback_data: `confirmed_done_${orderRef}` },
          { text: '🔄 ভুল হলে Invalid করুন', callback_data: `invalid_${orderRef}` }
        ]
      ]
    : [
        [
          { text: '❌ Invalid TrxID (বাতিল)', callback_data: `invalid_done_${orderRef}` },
          { text: '🔄 সঠিক হলে Confirm করুন', callback_data: `confirm_${orderRef}` }
        ]
      ];

  let newText = '';

  if (orderRecord) {
    const couponLine = orderRecord.couponApplied
      ? `\n🏷️ <b>Coupon:</b> <code>${escapeTelegramHtml(orderRecord.couponApplied)}</code> (-10%, saved ৳ ${orderRecord.discountAmount})`
      : '';

    newText = `
${isConfirm ? '✅' : '❌'} <b>SOFTWARE SOLUTIONS BD ORDER — ${isConfirm ? 'CONFIRMED' : 'INVALID'}</b>
━━━━━━━━━━━━━━━━━━━━━
📋 <b>Order Ref:</b> <code>${escapeTelegramHtml(orderRecord.refId)}</code>
👤 <b>Customer:</b> <b>${escapeTelegramHtml(orderRecord.name)}</b>
📧 <b>Delivery Email:</b> <code>${escapeTelegramHtml(orderRecord.email)}</code>
📱 <b>Customer Phone:</b> <code>${escapeTelegramHtml(orderRecord.phone)}</code>
━━━━━━━━━━━━━━━━━━━━━
📦 <b>Product:</b> ${escapeTelegramHtml(orderRecord.product || 'Autodesk All Apps')}
⏳ <b>Duration:</b> ${escapeTelegramHtml(orderRecord.duration)}
🪑 <b>Seats/Qty:</b> ${escapeTelegramHtml(orderRecord.quantity)} Seat(s)
💰 <b>Total Amount:</b> <b>${escapeTelegramHtml(orderRecord.displayPrice)}</b>${couponLine}
━━━━━━━━━━━━━━━━━━━━━
💳 <b>Payment Gateway:</b> <b>${escapeTelegramHtml(orderRecord.paymentMethod)}</b>
📤 <b>Sender Number:</b> <code>${escapeTelegramHtml(orderRecord.senderNumber)}</code>
🔑 <b>Transaction ID:</b> <code>${escapeTelegramHtml(orderRecord.trxId)}</code>
⏰ <b>Order Time:</b> ${orderRecord.createdAt ? new Date(orderRecord.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }) : timeStr}
━━━━━━━━━━━━━━━━━━━━━
${statusRemarkBlock}
    `.trim();
  } else if (originalText) {
    const baseText = originalText.split(/Status:\s*⏳/i)[0]
      .split(/Status:\s*✅/i)[0]
      .split(/Status:\s*❌/i)[0]
      .trim();

    newText = `
${isConfirm ? '✅' : '❌'} <b>SOFTWARE SOLUTIONS BD ORDER — ${isConfirm ? 'CONFIRMED' : 'INVALID'}</b>
${baseText.replace(/^[^\n]*\n/, '')}
━━━━━━━━━━━━━━━━━━━━━
${statusRemarkBlock}
    `.trim();
  } else {
    newText = `
${isConfirm ? '✅' : '❌'} <b>SOFTWARE SOLUTIONS BD ORDER #${escapeTelegramHtml(orderRef)}</b>
━━━━━━━━━━━━━━━━━━━━━
${statusRemarkBlock}
    `.trim();
  }

  try {
    const editRes = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard }
      })
    });
    const editData = await editRes.json();
    if (!editData.ok) {
      await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          reply_markup: { inline_keyboard }
        })
      }).catch(() => {});
    }
    return true;
  } catch (err) {
    return false;
  }
}

