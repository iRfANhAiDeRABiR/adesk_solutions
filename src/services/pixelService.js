// Meta (Facebook) Pixel Service for Software Solutions BD Ads Tracking
// Add your Pixel ID to .env: VITE_FB_PIXEL_ID=your_pixel_id

export const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || "6925345297741031";

/**
 * Initializes the official Meta Pixel base tracking script
 */
export const initFacebookPixel = () => {
  if (typeof window === 'undefined') return;
  if (!FB_PIXEL_ID) return;

  // Prevent multiple initializations if already loaded in index.html
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
 */
export const trackPixelEvent = (eventName, params = {}) => {
  if (typeof window === 'undefined') return;

  // Always log in browser console so it is 100% visible during testing
  console.log(`%c[Tracking Event Fired] %c${eventName}`, 'color: #06b6d4; font-weight: bold;', 'color: #10b981; font-weight: bold;', params);

  // 1. Meta (Facebook) Pixel Event
  if (window.fbq) {
    window.fbq('track', eventName, params);
  }

  // 2. Google Tag Manager (GTM) dataLayer Event
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
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
 * Track Page Views
 */
export const trackPageView = () => {
  trackPixelEvent('PageView');
};

/**
 * Track Product View
 */
export const trackViewContent = (productName, price) => {
  trackPixelEvent('ViewContent', {
    content_name: productName || 'Autodesk All Apps',
    content_category: 'Software Subscription',
    value: price || 649,
    currency: 'BDT'
  });
};

/**
 * Track when user fills the order form and initiates checkout
 */
export const trackInitiateCheckout = (orderPayload) => {
  const numericPrice = typeof orderPayload?.rawPrice === 'string'
    ? parseFloat(orderPayload.rawPrice.replace(/[^0-9.]/g, ''))
    : (orderPayload?.price || 649);

  trackPixelEvent('InitiateCheckout', {
    content_name: orderPayload?.product || 'Autodesk All Apps',
    content_ids: [orderPayload?.refId || 'AUTODESK-SUB'],
    content_type: 'product',
    num_items: orderPayload?.quantity || 1,
    value: numericPrice,
    currency: 'BDT'
  });
};

/**
 * Track when user selects payment gateway and enters phone number
 */
export const trackAddPaymentInfo = (gatewayName) => {
  trackPixelEvent('AddPaymentInfo', {
    content_category: 'Payment Gateway',
    payment_method: gatewayName || 'bKash',
    currency: 'BDT'
  });
};

// Set to prevent duplicate Purchase events from firing multiple times
const trackedPurchases = new Set();

/**
 * Track verified purchase confirmation (fires only upon administrator verification)
 */
export const trackPurchase = (orderPayload) => {
  const refId = orderPayload?.refId || 'AUTODESK-SUB';
  if (trackedPurchases.has(refId)) {
    return; // Deduplicate: Purchase event already dispatched for this order ref
  }
  trackedPurchases.add(refId);

  const priceStr = String(orderPayload?.totalPrice || orderPayload?.rawPrice || orderPayload?.price || '649');
  const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 649;

  trackPixelEvent('Purchase', {
    content_name: orderPayload?.product || 'Autodesk All Apps',
    content_type: 'product',
    content_ids: [refId],
    num_items: Number(orderPayload?.quantity) || 1,
    value: numericPrice,
    currency: 'BDT'
  });
};

/**
 * Track customer support contact (e.g. WhatsApp clicks)
 */
export const trackContact = (channel = 'WhatsApp') => {
  trackPixelEvent('Contact', {
    channel: channel
  });
};

