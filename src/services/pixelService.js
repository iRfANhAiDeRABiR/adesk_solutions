// Meta (Facebook) Pixel & Conversion Tracking Service for Software Solutions BD
// Client Dataset ID: 6925345297741031
// Implements client-side Pixel with Meta CAPI Event ID deduplication and privacy consent

export const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || "6925345297741031";

/**
 * Checks whether user has granted marketing analytics consent.
 * Default: true (unless user explicitly stored 'false' in localStorage).
 */
export const isConsentGranted = () => {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem('softwaresolutions_marketing_consent') !== 'false';
  } catch (e) {
    return true;
  }
};

/**
 * Allows user to grant or revoke marketing tracking consent.
 */
export const setMarketingConsent = (granted) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('softwaresolutions_marketing_consent', granted ? 'true' : 'false');
    if (window.fbq) {
      window.fbq('consent', granted ? 'grant' : 'revoke');
    }
    if (granted && !window._fbq_initialized) {
      initFacebookPixel();
    }
  } catch (e) {}
};

/**
 * Extracts first-party Meta browser cookies (_fbp, _fbc)
 */
export const getBrowserFbpCookie = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const getBrowserFbcCookie = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);

  // Construct from fbclid query parameter if present
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      return `fb.1.${Date.now()}.${fbclid}`;
    }
  } catch (e) {}

  return null;
};

/**
 * Generates a stable unique event ID for browser/server deduplication
 */
export const generateEventId = (prefix = 'evt') => {
  const ts = Date.now();
  const rnd = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${ts}_${rnd}`;
};

/**
 * Concurrently relays upper-funnel events to the secure serverless CAPI endpoint
 * (/api/tracking/event) for server-side recording with matching eventID.
 */
export const relayEventToCapi = async (payload) => {
  try {
    if (typeof window === 'undefined') return;
    if (!isConsentGranted()) return;

    const bodyStr = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      navigator.sendBeacon('/api/tracking/event', blob);
    } else {
      fetch('/api/tracking/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true
      }).catch(() => {});
    }
  } catch (e) {
    // Non-fatal tracking relay error
  }
};

/**
 * Initializes the official Meta Pixel base tracking script
 */
export const initFacebookPixel = () => {
  if (typeof window === 'undefined') return;
  if (!FB_PIXEL_ID) return;
  if (!isConsentGranted()) {
    if (window.fbq) {
      window.fbq('consent', 'revoke');
    }
    return;
  }

  // Prevent multiple initializations
  if (window._fbq_initialized) return;

  // If already loaded/initialized by index.html snippet
  if (window.fbq && typeof window.fbq === 'function') {
    window._fbq_initialized = true;
    return;
  }

  /* eslint-disable */
  (function(f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  if (FB_PIXEL_ID) {
    window.fbq('init', FB_PIXEL_ID);
    window._fbq_initialized = true;
    trackPageView();
  }
};

// Internal PageView deduplication cache
// Seed with current page location so initial load from index.html isn't duplicated
let lastTrackedPage = typeof window !== 'undefined'
  ? (window.location.pathname + (window.location.search || '') + (window.location.hash || ''))
  : null;
let lastTrackedTime = Date.now();

/**
 * Safe wrapper to send standard or custom Meta Pixel and Google Tag Manager conversion events
 * Supports eventID for Meta Pixel + CAPI deduplication across all 5 events
 */
export const trackPixelEvent = (eventName, params = {}, options = {}) => {
  if (typeof window === 'undefined') return;
  if (!isConsentGranted()) return;

  if (eventName === 'PageView') {
    trackPageView();
    return;
  }

  // Ensure Meta Pixel is loaded
  if (typeof window !== 'undefined' && !window.fbq && !window._fbq_initialized) {
    initFacebookPixel();
  }

  const eventID = options.eventID || params.eventID || generateEventId(eventName.toLowerCase());

  // Console logging for verification
  console.log(
    `%c[Meta Event Fired] %c${eventName}`,
    'color: #06b6d4; font-weight: bold;',
    'color: #10b981; font-weight: bold;',
    params,
    eventID ? { eventID } : ''
  );

  // 1. Meta (Facebook) Pixel Event (Browser)
  if (window.fbq) {
    if (eventID) {
      window.fbq('track', eventName, params, { eventID });
    } else if (Object.keys(params).length > 0) {
      window.fbq('track', eventName, params);
    } else {
      window.fbq('track', eventName);
    }
  }

  // 2. Google Tag Manager (GTM) dataLayer Event
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      eventID: eventID || undefined,
      ...params
    });
  } catch (err) {
    // Silent fail if dataLayer isn't available
  }

  // 3. Meta Conversions API (CAPI) Server Relay for Upper-Funnel Events
  // (Purchase events are strictly generated server-side upon verified admin confirmation)
  if (eventName !== 'Purchase' && eventName !== 'PageView') {
    relayEventToCapi({
      eventName,
      eventId: eventID,
      eventSourceUrl: window.location.href,
      userData: {
        email: options.email,
        phone: options.phone,
        fbp: getBrowserFbpCookie(),
        fbc: getBrowserFbcCookie()
      },
      customData: params,
      consentGranted: isConsentGranted()
    });
  }
};

// =========================================================================
// Standard eCommerce Event Helpers for Meta Ads
// =========================================================================

/**
 * 1. Track Page Views
 * Dispatches standard Meta Pixel PageView and GTM page_view with deduplication against rapid duplicate triggers.
 */
export const trackPageView = (url) => {
  if (typeof window === 'undefined') return;
  if (!isConsentGranted()) return;

  const currentTarget = url || (window.location.pathname + (window.location.search || '') + (window.location.hash || ''));
  const now = Date.now();

  // Deduplicate rapid duplicate PageView calls (e.g. init + React StrictMode mount within 1000ms)
  if (lastTrackedPage === currentTarget && (now - lastTrackedTime) < 1000) {
    return;
  }
  lastTrackedPage = currentTarget;
  lastTrackedTime = now;

  console.log(
    `%c[Meta Event Fired] %cPageView`,
    'color: #06b6d4; font-weight: bold;',
    'color: #10b981; font-weight: bold;',
    { page: currentTarget }
  );

  // 1. Standard Meta Pixel PageView
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }

  // 2. Google Tag Manager / GA4 dataLayer
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.hash,
      page_title: document.title
    });
  } catch (err) {}
};

/**
 * 2. Track Product / Subscription View (ViewContent)
 * Dispatched to both Browser Pixel and Server CAPI with shared eventID
 */
// Internal deduplication caches for conversion events
let lastViewContentKey = null;
let lastViewContentTime = 0;

let lastInitiateCheckoutKey = null;
let lastInitiateCheckoutTime = 0;

let lastAddPaymentInfoKey = null;
let lastAddPaymentInfoTime = 0;

export const trackViewContent = (productName = 'Autodesk All Apps', price = 649) => {
  if (typeof window === 'undefined') return;
  if (!isConsentGranted()) return;

  const numericPrice = typeof price === 'number'
    ? price
    : (parseFloat(String(price).replace(/[^0-9.]/g, '')) || 649);
  const name = productName || 'Autodesk All Apps';
  const key = `${name}_${numericPrice}`;
  const now = Date.now();

  // Deduplicate rapid identical calls (e.g. React StrictMode mount / re-renders within 2000ms)
  if (lastViewContentKey === key && (now - lastViewContentTime) < 2000) {
    return;
  }
  lastViewContentKey = key;
  lastViewContentTime = now;

  const eventID = generateEventId('vc');

  trackPixelEvent(
    'ViewContent',
    {
      content_name: name,
      content_category: 'Software Subscription',
      content_ids: ['AUTODESK-ALL-APPS'],
      content_type: 'product',
      value: numericPrice,
      currency: 'BDT'
    },
    { eventID }
  );
};

/**
 * 3. Track Checkout Initiation (InitiateCheckout)
 * Dispatched to both Browser Pixel and Server CAPI with shared eventID
 */
export const trackInitiateCheckout = (orderPayload = {}) => {
  if (typeof window === 'undefined') return;
  if (!isConsentGranted()) return;

  const numericPrice = typeof orderPayload?.rawPrice === 'string'
    ? (parseFloat(orderPayload.rawPrice.replace(/[^0-9.]/g, '')) || 649)
    : (typeof orderPayload?.price === 'number'
      ? orderPayload.price
      : (parseFloat(String(orderPayload?.totalPrice || 649).replace(/[^0-9.]/g, '')) || 649));

  const name = orderPayload?.product || 'Autodesk All Apps';
  const qty = Number(orderPayload?.quantity) || 1;
  const key = `${name}_${numericPrice}_${qty}`;
  const now = Date.now();

  // Deduplicate rapid identical calls (e.g. OrderSection submit followed by PaymentGatewayPage mount within 3000ms)
  if (lastInitiateCheckoutKey === key && (now - lastInitiateCheckoutTime) < 3000) {
    return;
  }
  lastInitiateCheckoutKey = key;
  lastInitiateCheckoutTime = now;

  const eventID = generateEventId('ic');

  trackPixelEvent(
    'InitiateCheckout',
    {
      content_name: name,
      content_category: 'Software Subscription',
      content_ids: ['AUTODESK-ALL-APPS'],
      content_type: 'product',
      num_items: qty,
      value: numericPrice,
      currency: 'BDT'
    },
    {
      eventID,
      email: orderPayload?.email,
      phone: orderPayload?.phone
    }
  );
};

/**
 * 4. Track Payment Information Milestone (AddPaymentInfo)
 * Called strictly once per user payment method completion
 * Dispatched to both Browser Pixel and Server CAPI with shared eventID
 */
export const trackAddPaymentInfo = (gatewayName, price, customerInfo = {}) => {
  if (typeof window === 'undefined') return;
  if (!isConsentGranted()) return;

  const numericPrice = typeof price === 'number'
    ? price
    : (parseFloat(String(price || 649).replace(/[^0-9.]/g, '')) || 649);
  const method = gatewayName || 'Bkash';
  const phone = customerInfo?.phone || '';
  const key = `${method}_${numericPrice}_${phone}`;
  const now = Date.now();

  // Deduplicate rapid identical calls (within 3000ms)
  if (lastAddPaymentInfoKey === key && (now - lastAddPaymentInfoTime) < 3000) {
    return;
  }
  lastAddPaymentInfoKey = key;
  lastAddPaymentInfoTime = now;

  const eventID = generateEventId('api');

  trackPixelEvent(
    'AddPaymentInfo',
    {
      content_category: 'Payment Gateway',
      payment_method: method,
      value: numericPrice,
      currency: 'BDT'
    },
    {
      eventID,
      email: customerInfo?.email,
      phone: customerInfo?.phone
    }
  );
};

// Set to prevent duplicate Purchase events from firing multiple times in browser
const trackedPurchases = new Set();

/**
 * 5. Track Verified Purchase Confirmation (Purchase)
 * Fires ONLY upon administrator confirmation with matching server eventID
 */
export const trackPurchase = (orderPayload, options = {}) => {
  const refId = orderPayload?.refId || 'AUTODESK-SUB';
  const eventID = options.eventID || orderPayload?.purchaseEventId || `purchase_${refId}`;

  // Browser-level deduplication
  if (trackedPurchases.has(eventID)) {
    return;
  }
  trackedPurchases.add(eventID);

  const priceStr = String(orderPayload?.finalTotalPrice || orderPayload?.totalPrice || orderPayload?.rawPrice || orderPayload?.price || '649');
  const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 649;

  trackPixelEvent(
    'Purchase',
    {
      content_name: orderPayload?.product || 'Autodesk All Apps',
      content_type: 'product',
      content_ids: ['AUTODESK-ALL-APPS'],
      num_items: Number(orderPayload?.quantity) || 1,
      value: numericPrice,
      currency: 'BDT',
      order_id: refId
    },
    {
      eventID
    }
  );
};

/**
 * Track Customer Support Contact (Contact)
 * Dispatched to both Browser Pixel and Server CAPI with shared eventID
 */
export const trackContact = (channel = 'WhatsApp') => {
  const eventID = generateEventId('contact');

  trackPixelEvent(
    'Contact',
    {
      content_name: `${channel} Support`,
      channel: channel
    },
    { eventID }
  );
};
