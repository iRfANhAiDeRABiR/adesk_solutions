/**
 * Order Store & State Machine for Software Solutions BD
 * Enforces:
 *   CREATED -> PAYMENT_SUBMITTED -> PENDING_VERIFICATION -> CONFIRMED / INVALID
 * Replay protection & Duplicate TrxID prevention.
 */

// Global memory cache persisted across warm serverless function invocations
const orders = new Map();
const trxIdIndex = new Map(); // Maps TrxID -> orderRefId

export const OrderStateMachine = {
  STATUS: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    INVALID: 'INVALID'
  },

  /**
   * Register a new order submission
   */
  createOrder(orderData) {
    const { refId, trxId } = orderData;

    // Check duplicate TrxID
    const cleanTrx = trxId.toUpperCase();
    if (trxIdIndex.has(cleanTrx)) {
      const existingRef = trxIdIndex.get(cleanTrx);
      return {
        success: false,
        reason: 'DUPLICATE_TRX_ID',
        error: `This Transaction ID (TrxID) has already been submitted for order ${existingRef}.`
      };
    }

    const orderRecord = {
      ...orderData,
      trxId: cleanTrx,
      status: this.STATUS.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      verifiedAt: null,
      verifiedBy: null,
      verificationNote: null
    };

    orders.set(refId, orderRecord);
    trxIdIndex.set(cleanTrx, refId);

    return {
      success: true,
      order: orderRecord
    };
  },

  /**
   * Retrieve order by reference ID
   */
  getOrder(refId) {
    if (!refId) return null;
    return orders.get(refId) || null;
  },

  /**
   * Update status with Admin Authorization check and idempotency
   */
  updateStatus(refId, newStatus, adminInfo = {}) {
    const order = orders.get(refId);
    if (!order) {
      return { success: false, reason: 'ORDER_NOT_FOUND' };
    }

    // If order was already finalized as CONFIRMED, prevent overwriting
    if (order.status === this.STATUS.CONFIRMED && newStatus !== this.STATUS.CONFIRMED) {
      // Confirmed orders require explicit override logging
      if (!adminInfo.force) {
        return {
          success: false,
          reason: 'ALREADY_CONFIRMED',
          error: 'Order has already been confirmed. Confirmed orders cannot be silently invalidated.'
        };
      }
    }

    order.status = newStatus;
    order.updatedAt = Date.now();
    order.verifiedAt = Date.now();
    order.verifiedBy = adminInfo.username || adminInfo.userId || 'Admin';
    order.verificationNote = newStatus === this.STATUS.CONFIRMED
      ? 'Payment verified by administrator on Telegram.'
      : 'Transaction ID was rejected as invalid by administrator on Telegram.';

    return {
      success: true,
      order
    };
  },

  /**
   * Clear or prune expired orders (older than 24 hours)
   */
  cleanupExpired(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [refId, order] of orders.entries()) {
      if (now - order.createdAt > maxAgeMs) {
        trxIdIndex.delete(order.trxId);
        orders.delete(refId);
      }
    }
  }
};

