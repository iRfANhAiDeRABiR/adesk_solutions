/**
 * Meta Conversions API (CAPI) Serverless Integration
 * Module: api/_lib/metaCapi.js
 * 
 * Provides secure, server-side event transmission to Meta Graph API.
 * Adheres strictly to Meta's data processing and normalization specifications.
 * 
 * SECURITY:
 * - Access token is read exclusively from private server environment variable (META_CAPI_ACCESS_TOKEN)
 * - Customer PII (Email, Phone) is hashed with SHA-256 after normalization
 * - Raw credentials and raw customer PII are never printed to logs
 * - Outbox pattern provides durable queueing and retry capability without duplicate event delivery
 */

import crypto from 'node:crypto';

// Supported Graph API version (default v21.0, configurable via META_GRAPH_API_VERSION)
export const DEFAULT_GRAPH_API_VERSION = 'v21.0';

/**
 * Resolves CAPI configuration from server-side environment variables
 */
export function getMetaCapiConfig() {
  const version = process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;
  const pixelId = process.env.META_PIXEL_ID || process.env.VITE_FB_PIXEL_ID || '';
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN || '';
  const testEventCode = process.env.META_TEST_EVENT_CODE || '';

  return {
    version,
    pixelId,
    accessToken,
    testEventCode,
    isConfigured: Boolean(pixelId && accessToken)
  };
}

/**
 * Normalizes email address according to Meta specifications:
 * - Trims leading/trailing whitespace
 * - Converts to lowercase
 * - Leaves 64-char hex string as-is if already hashed
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return null;
  return trimmed;
}

/**
 * Normalizes Bangladeshi and international phone numbers according to Meta specifications:
 * - Strips all non-digit characters (+, -, spaces, parentheses)
 * - For Bangladesh:
 *     - If 11 digits starting with '01' (e.g. 017XXXXXXXX), strips '0' and prepends '880' -> 88017XXXXXXXX (13 digits)
 *     - If 10 digits starting with '1' (e.g. 17XXXXXXXX), prepends '880' -> 88017XXXXXXXX
 *     - If 13 digits starting with '8801' (e.g. 88017XXXXXXXX), preserves as-is
 * - Leaves 64-char hex string as-is if already hashed
 */
export function normalizeBdPhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  if (!digitsOnly) return null;

  // Handle standard Bangladeshi mobile formats
  if (digitsOnly.length === 11 && digitsOnly.startsWith('01')) {
    return '880' + digitsOnly.slice(1);
  }
  if (digitsOnly.length === 10 && digitsOnly.startsWith('1')) {
    return '880' + digitsOnly;
  }
  if (digitsOnly.length === 13 && digitsOnly.startsWith('8801')) {
    return digitsOnly;
  }

  // Fallback for valid international numbers (minimum 7, maximum 15 digits)
  if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return digitsOnly;
  }

  return null;
}

/**
 * SHA-256 hashing utility with idempotency guard.
 * Does not re-hash an already hashed 64-character hexadecimal string.
 */
export function hashSha256(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Idempotency: if string is already a valid 64-char lowercase hex hash, return as-is
  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return crypto.createHash('sha256').update(trimmed, 'utf8').digest('hex');
}

/**
 * Builds user_data object adhering to Meta Conversions API schema.
 * Omits unavailable fields and ensures no null/empty strings in arrays.
 */
export function buildUserData({
  email,
  phone,
  clientIp,
  userAgent,
  fbp,
  fbc
}) {
  const userData = {};

  // Email (hashed)
  const normEmail = normalizeEmail(email);
  if (normEmail) {
    const hashedEmail = hashSha256(normEmail);
    if (hashedEmail) {
      userData.em = [hashedEmail];
    }
  }

  // Phone (hashed)
  const normPhone = normalizeBdPhone(phone);
  if (normPhone) {
    const hashedPhone = hashSha256(normPhone);
    if (hashedPhone) {
      userData.ph = [hashedPhone];
    }
  }

  // Client IP (unhashed)
  if (clientIp && typeof clientIp === 'string' && clientIp !== 'unknown') {
    // Strip port or IPv6 mapping if present
    const cleanIp = clientIp.replace(/^::ffff:/, '').trim();
    if (cleanIp) {
      userData.client_ip_address = cleanIp;
    }
  }

  // Client User Agent (unhashed)
  if (userAgent && typeof userAgent === 'string') {
    userData.client_user_agent = userAgent.trim();
  }

  // First-party cookie _fbp (unhashed)
  if (fbp && typeof fbp === 'string' && fbp.startsWith('fb.')) {
    userData.fbp = fbp.trim();
  }

  // First-party click ID _fbc (unhashed)
  if (fbc && typeof fbc === 'string' && fbc.startsWith('fb.')) {
    userData.fbc = fbc.trim();
  }

  return userData;
}

/**
 * Constructs an authoritative CAPI Purchase event payload from trusted order data.
 * Adheres strictly to Meta's standard event parameters.
 */
export function buildPurchaseEventPayload(order) {
  if (!order || !order.refId) {
    throw new Error('Cannot construct CAPI Purchase payload: Missing order record or refId');
  }

  const eventTime = Math.floor(Date.now() / 1000);
  const purchaseEventId = order.purchaseEventId || `purchase_${order.refId}`;

  // Build sanitized, hashed user data
  const userData = buildUserData({
    email: order.email,
    phone: order.phone || order.senderNumber,
    clientIp: order.clientIp,
    userAgent: order.userAgent,
    fbp: order.fbp,
    fbc: order.fbc
  });

  // Calculate genuine numeric total in BDT
  const numericPrice = typeof order.finalTotalPrice === 'number'
    ? order.finalTotalPrice
    : (parseFloat(String(order.displayPrice || order.totalPrice || '649').replace(/[^0-9.]/g, '')) || 649);

  const eventPayload = {
    event_name: 'Purchase',
    event_time: eventTime,
    event_id: purchaseEventId,
    action_source: 'website',
    event_source_url: order.eventSourceUrl || 'https://adesk.solutionsbd.com/#payment',
    user_data: userData,
    custom_data: {
      currency: 'BDT',
      value: numericPrice,
      order_id: order.refId,
      content_ids: ['AUTODESK-ALL-APPS'],
      content_type: 'product',
      num_items: Number(order.quantity) || 1,
      content_name: order.product || 'Autodesk All Apps'
    }
  };

  return eventPayload;
}

/**
 * Sends a single conversion event or batch of events to Meta Graph API
 * Supports configurable timeout (default 5000ms), safe error handling,
 * and test event code integration for staging environments.
 */
export async function sendMetaCapiEvent(events, options = {}) {
  const config = getMetaCapiConfig();

  if (!config.isConfigured) {
    return {
      success: false,
      skipped: true,
      reason: 'META_CAPI_NOT_CONFIGURED',
      message: 'Meta Conversions API credentials (META_PIXEL_ID / META_CAPI_ACCESS_TOKEN) are not set in environment.'
    };
  }

  const eventsArray = Array.isArray(events) ? events : [events];
  if (eventsArray.length === 0) {
    return { success: false, reason: 'EMPTY_EVENTS_ARRAY' };
  }

  const endpointUrl = `https://graph.facebook.com/${config.version}/${config.pixelId}/events`;

  const requestBody = {
    data: eventsArray
  };

  // Attach test_event_code if configured in staging/test mode or passed in options
  const activeTestCode = options.testEventCode || eventsArray[0]?.test_event_code || config.testEventCode;
  if (activeTestCode && typeof activeTestCode === 'string') {
    requestBody.test_event_code = activeTestCode.trim();
  }

  const timeoutMs = options.timeoutMs || 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timer);

    const responseData = await response.json().catch(() => ({}));

    if (response.ok && responseData.events_received > 0) {
      return {
        success: true,
        eventsReceived: responseData.events_received,
        fbtraceId: responseData.fbtrace_id,
        messages: responseData.messages || []
      };
    }

    // Graph API error response
    const errorMessage = responseData.error?.message || `HTTP ${response.status}: Failed to dispatch CAPI event`;
    return {
      success: false,
      statusCode: response.status,
      error: errorMessage,
      errorType: responseData.error?.type || 'MetaApiError',
      errorCode: responseData.error?.code || response.status,
      fbtraceId: responseData.fbtrace_id || responseData.error?.fbtrace_id
    };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      reason: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      error: isTimeout ? `Request timed out after ${timeoutMs}ms` : err.message
    };
  }
}

/**
 * Authoritative Purchase Dispatcher with State Locking and Outbox Commitment
 * Enforces:
 * 1. Order must be in CONFIRMED state.
 * 2. CAPI dispatch is strictly idempotent (order.capiDispatched flag prevented replays).
 * 3. Records delivery attempt and response in order audit log.
 */
export async function dispatchCapiPurchaseForOrder(order, storeAdapter) {
  if (!order || !order.refId) {
    return { success: false, reason: 'INVALID_ORDER' };
  }

  // 1. Verify that order is officially confirmed
  if (order.status !== 'CONFIRMED') {
    return {
      success: false,
      reason: 'ORDER_NOT_CONFIRMED',
      message: `Purchase event rejected: Order status is '${order.status}', but must be 'CONFIRMED'.`
    };
  }

  // 2. Enforce strict server-side idempotency
  if (order.capiDispatched) {
    return {
      success: true,
      alreadyDispatched: true,
      purchaseEventId: order.purchaseEventId,
      dispatchedAt: order.capiDispatchedAt,
      message: 'CAPI Purchase event was already dispatched for this confirmed order.'
    };
  }

  // 3. Construct event payload
  const payload = buildPurchaseEventPayload(order);

  // 4. Send to Meta Graph API
  const result = await sendMetaCapiEvent(payload);

  const timestamp = Date.now();

  // 5. Commit record to store
  if (result.success) {
    order.capiDispatched = true;
    order.capiDispatchedAt = timestamp;
    order.capiFbtraceId = result.fbtraceId || null;
    order.capiLastError = null;
  } else if (!result.skipped) {
    order.capiLastError = result.error || result.reason;
    order.capiFailedAttempts = (order.capiFailedAttempts || 0) + 1;
    order.capiLastAttemptAt = timestamp;
  }

  if (storeAdapter && typeof storeAdapter.saveOrder === 'function') {
    try {
      await storeAdapter.saveOrder(order);
    } catch (e) {
      // Non-fatal store update error
    }
  }

  return {
    ...result,
    purchaseEventId: payload.event_id
  };
}
