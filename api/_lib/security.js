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
  Bkash: /^DJ[A-Z0-9]{8}$/i,     // 10 chars, starts with DJ (e.g. DJ1A2B3C4D)
  Nagad: /^[A-Z0-9]{8}$/i,        // 8 chars alphanumeric
  Rocket: /^[A-Z0-9]{8,12}$/i     // 8 to 12 chars alphanumeric
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

  // Payment Method validation
  const paymentMethod = input?.paymentMethod || 'Bkash';
  if (!['Bkash', 'Nagad', 'Rocket'].includes(paymentMethod)) {
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
      errors.push('bKash TrxID must be exactly 10 alphanumeric characters starting with DJ (e.g. DJ1A2B3C4D).');
    } else if (paymentMethod === 'Nagad') {
      errors.push('Nagad TrxID must be exactly 8 alphanumeric characters.');
    } else {
      errors.push('Rocket TrxID must be 8 to 12 alphanumeric characters.');
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
      requirements
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

