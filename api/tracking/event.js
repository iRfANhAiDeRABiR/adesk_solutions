/**
 * Serverless API: /api/tracking/event
 * Secure Server-Side Relay for Upper-Funnel Meta Conversions API (CAPI) Events
 * Handles: ViewContent, Contact, InitiateCheckout, AddPaymentInfo
 *
 * SECURITY:
 * - Public callers CANNOT dispatch 'Purchase' events (strictly rejected with 403 Forbidden).
 *   Authoritative 'Purchase' events only originate server-side upon verified admin payment confirmation.
 * - Customer email and phone are normalized and hashed with SHA-256 server-side.
 * - Client IP and User-Agent are extracted securely from server HTTP request headers.
 * - Access token remains private and is never exposed to browser code.
 */

import {
  sendMetaCapiEvent,
  buildUserData
} from '../_lib/metaCapi.js';

import { checkRateLimit } from '../_lib/security.js';

// Allowed client-side events for CAPI relay
const ALLOWED_CAPI_RELAY_EVENTS = new Set([
  'ViewContent',
  'Contact',
  'InitiateCheckout',
  'AddPaymentInfo'
]);

export default async function handler(req, res) {
  // CORS Preflight handling
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Use POST.'
    });
  }

  // 1. Sliding Window Rate Limiting (60 events per minute per IP)
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(`capi_relay_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too many tracking requests. Rate limit in progress.',
      retryAfterMs: rateLimit.retryAfterMs
    });
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { eventName, eventId, eventSourceUrl, userData: clientUserData, customData, consentGranted, testEventCode: clientTestEventCode } = rawBody || {};
    const testEventCode = clientTestEventCode || rawBody?.test_event_code || process.env.META_TEST_EVENT_CODE || null;

    // 2. Privacy & Marketing Consent Verification
    if (consentGranted === false) {
      return res.status(200).json({
        success: true,
        skipped: true,
        reason: 'CONSENT_REVOKED',
        message: 'Marketing tracking consent was declined by user.'
      });
    }

    // 3. Security Check: Purchase is strictly forbidden via this public endpoint
    if (eventName === 'Purchase') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Purchase events cannot be dispatched through public client relay. Purchase requires authoritative backend payment verification.'
      });
    }

    if (!eventName || !ALLOWED_CAPI_RELAY_EVENTS.has(eventName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid eventName. Must be one of: ${Array.from(ALLOWED_CAPI_RELAY_EVENTS).join(', ')}`
      });
    }

    if (!eventId || typeof eventId !== 'string' || eventId.length < 5 || eventId.length > 120) {
      return res.status(400).json({
        success: false,
        error: 'A valid eventId matching the browser Pixel event is required for deduplication.'
      });
    }

    // 4. Extract and Sanitize User Data (IP & User-Agent from server headers)
    const userAgent = req.headers['user-agent'] || '';
    
    // Cookie parsing fallback for _fbp and _fbc
    const cookieHeader = req.headers['cookie'] || '';
    const cookieFbpMatch = cookieHeader.match(/(?:^|;\s*)_fbp=([^;]*)/);
    const cookieFbcMatch = cookieHeader.match(/(?:^|;\s*)_fbc=([^;]*)/);
    const fbp = clientUserData?.fbp || (cookieFbpMatch ? decodeURIComponent(cookieFbpMatch[1]) : null);
    const fbc = clientUserData?.fbc || (cookieFbcMatch ? decodeURIComponent(cookieFbcMatch[1]) : null);

    const userData = buildUserData({
      email: clientUserData?.email,
      phone: clientUserData?.phone,
      clientIp,
      userAgent,
      fbp,
      fbc
    });

    // 5. Build CAPI Event Payload
    const eventTime = Math.floor(Date.now() / 1000);
    const sourceUrl = eventSourceUrl || req.headers['referer'] || 'https://adesk.solutionsbd.com/';

    const cleanCustomData = {};
    if (customData && typeof customData === 'object') {
      cleanCustomData.currency = 'BDT';
      if (typeof customData.value === 'number') {
        cleanCustomData.value = customData.value;
      } else if (customData.value) {
        cleanCustomData.value = parseFloat(String(customData.value).replace(/[^0-9.]/g, '')) || 649;
      }
      if (customData.content_name) cleanCustomData.content_name = String(customData.content_name).slice(0, 100);
      if (customData.content_category) cleanCustomData.content_category = String(customData.content_category).slice(0, 100);
      if (Array.isArray(customData.content_ids)) cleanCustomData.content_ids = customData.content_ids.slice(0, 10);
      if (customData.content_type) cleanCustomData.content_type = String(customData.content_type).slice(0, 50);
      if (customData.num_items) cleanCustomData.num_items = parseInt(customData.num_items, 10) || 1;
      if (customData.payment_method) cleanCustomData.payment_method = String(customData.payment_method).slice(0, 50);
    }

    const capiPayload = {
      event_name: eventName,
      event_time: eventTime,
      event_id: eventId,
      action_source: 'website',
      event_source_url: sourceUrl,
      user_data: userData,
      custom_data: cleanCustomData
    };

    // 6. Send to Meta Graph API
    const result = await sendMetaCapiEvent(capiPayload, { testEventCode });

    return res.status(200).json({
      success: result.success,
      skipped: Boolean(result.skipped),
      eventId,
      eventName,
      fbtraceId: result.fbtraceId || null,
      message: result.message || (result.success ? 'CAPI event received by Meta.' : result.error)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error processing CAPI tracking relay.'
    });
  }
}
