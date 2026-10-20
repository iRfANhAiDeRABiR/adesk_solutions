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
 * Initializes the official Meta Pixel base tracking script
 */
export const initFacebookPixel = () => {
  if (typeof window === 'undefined') return;
  if (!FB_PIXEL_ID) return;
  if (!isConsentGranted()) return;

  // Prevent multiple initializations
  if (window.fbq) return;

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
  }
};

/**
 * Safe wrapper to send standard or custom Meta Pixel and Google Tag Manager conversion events
 * Supports eventID for Meta Pixel + CAPI deduplication
 */
export const trackPixelEvent = (eventName, params = {}, options = {}) => {
  if (typeof window === 'undefined') return;
  if (!isConsentGranted()) return;

  const eventID = options.eventID || params.eventID;

  // Console logging for verification
  console.log(
    `%c[Meta Pixel Event Fired] %c${eventName}`,
    'color: #06b6d4; font-weight: bold;',
    'color: #10b981; font-weight: bold;',
    params,
    eventID ? { eventID } : ''
  );

  // 1. Meta (Facebook) Pixel Event
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
};

// =========================================================================
// Standard eCommerce Event Helpers for Meta Ads
// =========================================================================

/**
 * 1. Track Page Views
 */
export const trackPageView = () => {
  trackPixelEvent('PageView');
};

/**
 * 2. Track Product / Subscription View (ViewContent)
 */
export const trackViewContent = (productName, price) => {
  const numericPrice = typeof price === 'number' ? price : (parseFloat(String(price).replace(/[^0-9.]/g, '')) || 649);
  trackPixelEvent('ViewContent', {
    content_name: productName || 'Autodesk All Apps',
    content_category: 'Software Subscription',
    content_ids: ['AUTODESK-ALL-APPS'],
    content_type: 'product',
    value: numericPrice,
    currency: 'BDT'
  });
};

/**
 * 3. Track Checkout Initiation (InitiateCheckout)
 */
export const trackInitiateCheckout = (orderPayload) => {
  const numericPrice = typeof orderPayload?.rawPrice === 'string'
    ? parseFloat(orderPayload.rawPrice.replace(/[^0-9.]/g, ''))
    : (orderPayload?.price || 649);

  trackPixelEvent('InitiateCheckout', {
    content_name: orderPayload?.product || 'Autodesk All Apps',
    content_ids: ['AUTODESK-ALL-APPS'],
    content_type: 'product',
    num_items: Number(orderPayload?.quantity) || 1,
    value: numericPrice,
    currency: 'BDT'
  });
};

/**
 * 4. Track Payment Information Milestone (AddPaymentInfo)
 * Called strictly once per user payment method completion
 */
export const trackAddPaymentInfo = (gatewayName, price) => {
  const numericPrice = typeof price === 'number' ? price : (parseFloat(String(price || 649).replace(/[^0-9.]/g, '')) || 649);
  trackPixelEvent('AddPaymentInfo', {
    content_category: 'Payment Gateway',
    payment_method: gatewayName || 'Bkash',
    value: numericPrice,
    currency: 'BDT'
  });
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
 */
export const trackContact = (channel = 'WhatsApp') => {
  trackPixelEvent('Contact', {
    content_name: `${channel} Support`,
    channel: channel
  });
};
