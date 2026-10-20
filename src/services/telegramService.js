/**
 * Telegram & Payment Verification Service for Software Solutions BD
 * Secure Client-to-Backend Architecture
 *
 * NOTE: Telegram Bot Tokens and privileged API methods are strictly
 * managed on the server-side via Serverless APIs (/api/order/submit & /api/order/verify).
 * No privileged Bot Tokens are ever embedded in client JavaScript bundles.
 */

/**
 * Sanitizes strings for HTML escaping
 */
export const escapeHtml = (text) => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

export const getAdminChatId = () => {
  return localStorage.getItem('softwaresolutions_telegram_chat_id') || "";
};

export const setAdminChatId = (chatId) => {
  if (chatId) {
    localStorage.setItem('softwaresolutions_telegram_chat_id', chatId.toString().trim());
  }
};

export const autoDetectAdminChatId = async () => {
  // In secure mode, Chat ID detection is managed server-side
  return {
    chatId: getAdminChatId() || "ServerConfigured",
    firstName: "Admin",
    username: "Admin"
  };
};

/**
 * Submits order to backend API (/api/order/submit)
 * Backend recalculates authoritative pricing, validates TrxID, and notifies Telegram privately.
 */
export const sendOrderToTelegram = async (orderPayload, options = {}) => {
  try {
    const response = await fetch('/api/order/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refId: orderPayload.refId,
        name: orderPayload.name,
        email: orderPayload.email,
        phone: orderPayload.phone,
        duration: orderPayload.duration,
        quantity: orderPayload.quantity,
        paymentMethod: orderPayload.paymentMethod,
        senderNumber: orderPayload.senderNumber,
        trxId: orderPayload.trxId,
        couponCode: orderPayload.couponApplied,
        requirements: orderPayload.requirements,
        fbp: orderPayload.fbp,
        fbc: orderPayload.fbc,
        eventSourceUrl: orderPayload.eventSourceUrl,
        consentGranted: orderPayload.consentGranted,
        options
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        refId: data.refId,
        pricing: data.pricing,
        status: data.status || 'PENDING',
        data
      };
    }

    // Handle specific server-side errors
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 409) {
      return {
        success: false,
        reason: 'DUPLICATE_TRX_ID',
        error: errorData.error || 'This TrxID was already submitted for an existing order.'
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        reason: 'RATE_LIMITED',
        error: errorData.error || 'Rate limit reached. Please wait a few moments.'
      };
    }

    return {
      success: false,
      reason: errorData.reason || 'SERVER_ERROR',
      error: errorData.error || errorData.details?.join(', ') || 'Failed to submit order to server.'
    };
  } catch (err) {
    // If running in purely static local Vite dev mode without Vercel serverless functions:
    if (import.meta.env.DEV) {
      console.warn('[DEV MOCK] Backend /api/order/submit not available in static dev server. Simulating order dispatch.');
      return {
        success: true,
        refId: orderPayload.refId || `SOFT-DEV-${Date.now().toString().slice(-6)}`,
        status: 'PENDING',
        mock: true
      };
    }

    return {
      success: false,
      reason: 'NETWORK_ERROR',
      error: 'Network error connecting to payment verification service.'
    };
  }
};

/**
 * Checks order verification status via backend API (/api/order/verify)
 * Shielded from client-side Telegram polling.
 */
export const checkOrderStatusFromTelegram = async (orderRefId) => {
  if (!orderRefId) {
    return { status: 'PENDING' };
  }

  try {
    const response = await fetch(`/api/order/verify?ref=${encodeURIComponent(orderRefId)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        status: data.status || 'PENDING',
        purchaseEventId: data.purchaseEventId || null,
        totalPrice: data.totalPrice || null,
        product: data.product || null,
        quantity: data.quantity || 1,
        currency: data.currency || 'BDT',
        verifiedBy: data.verifiedBy || 'Admin',
        verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : null,
        note: data.note || null
      };
    }
  } catch (err) {
    // Fallback in local development preview
    if (import.meta.env.DEV) {
      return { status: 'PENDING' };
    }
  }

  return { status: 'PENDING' };
};
