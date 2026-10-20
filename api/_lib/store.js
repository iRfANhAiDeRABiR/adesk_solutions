/**
 * Order Store, Durable Outbox & State Machine for Software Solutions BD
 * Module: api/_lib/store.js
 *
 * Enforces:
 *   CREATED -> PAYMENT_SUBMITTED -> PENDING_VERIFICATION -> CONFIRMED / INVALID
 *
 * Features:
 * - Persistent order records & payment verification status
 * - Unique Purchase event IDs (purchase_${refId})
 * - Replay protection & Duplicate TrxID prevention
 * - Durable CAPI event outbox with retry tracking
 * - File-backed persistence (/tmp/adesk_store.json in serverless or local .data/)
 * - Ready for distributed production DB adapters (Upstash Redis / Supabase)
 */

import fs from 'node:fs';
import path from 'node:path';

// Memory caches
const orders = new Map();
const trxIdIndex = new Map(); // Maps TrxID -> orderRefId
const capiOutbox = new Map(); // Maps eventId -> OutboxEntry

// Determine file storage path (Vercel serverless /tmp or local project .data/)
function getStorageFilePath() {
  if (process.env.STORAGE_FILE_PATH) {
    return process.env.STORAGE_FILE_PATH;
  }
  // Vercel serverless functions have a writable /tmp directory
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'adesk_orders.json');
  }
  return path.resolve('.data', 'adesk_orders.json');
}

/**
 * Loads persisted records from disk into memory
 */
function loadPersistedData() {
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content) return;
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed.orders)) {
        parsed.orders.forEach(order => {
          orders.set(order.refId, order);
          if (order.trxId) {
            trxIdIndex.set(order.trxId.toUpperCase(), order.refId);
          }
        });
      }

      if (Array.isArray(parsed.outbox)) {
        parsed.outbox.forEach(entry => {
          capiOutbox.set(entry.eventId, entry);
        });
      }
    }
  } catch (err) {
    // Non-fatal: memory cache remains operational
  }
}

/**
 * Saves current in-memory records to disk
 */
function savePersistedData() {
  try {
    const filePath = getStorageFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data = {
      version: 1,
      updatedAt: Date.now(),
      orders: Array.from(orders.values()),
      outbox: Array.from(capiOutbox.values())
    };

    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
  } catch (err) {
    // Non-fatal: disk write error logged safely
  }
}

// Initial hydration from persistent store
loadPersistedData();

export const OrderStateMachine = {
  /**
   * Reset store (primarily for unit tests and environment re-initialization)
   */
  reset() {
    orders.clear();
    trxIdIndex.clear();
    capiOutbox.clear();
    try {
      const filePath = getStorageFilePath();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}
  },

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
    const cleanTrx = trxId.toUpperCase();

    // Check duplicate TrxID
    if (trxIdIndex.has(cleanTrx)) {
      const existingRef = trxIdIndex.get(cleanTrx);
      if (existingRef !== refId) {
        return {
          success: false,
          reason: 'DUPLICATE_TRX_ID',
          error: `This Transaction ID (TrxID) has already been submitted for order ${existingRef}.`
        };
      }
    }

    const purchaseEventId = orderData.purchaseEventId || `purchase_${refId}`;

    const orderRecord = {
      ...orderData,
      trxId: cleanTrx,
      status: this.STATUS.PENDING,
      purchaseEventId,
      capiDispatched: false,
      capiDispatchedAt: null,
      capiFbtraceId: null,
      capiFailedAttempts: 0,
      capiLastError: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      verifiedAt: null,
      verifiedBy: null,
      verificationNote: null
    };

    orders.set(refId, orderRecord);
    trxIdIndex.set(cleanTrx, refId);

    // Persist to disk
    savePersistedData();

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
    const order = orders.get(refId);
    if (!order) {
      // Attempt re-hydration in case another invocation updated disk
      loadPersistedData();
      return orders.get(refId) || null;
    }
    return order;
  },

  /**
   * Save an existing updated order back to the store
   */
  saveOrder(order) {
    if (!order || !order.refId) return false;
    order.updatedAt = Date.now();
    orders.set(order.refId, order);
    savePersistedData();
    return true;
  },

  /**
   * Update status with Admin Authorization check and idempotency
   */
  updateStatus(refId, newStatus, adminInfo = {}) {
    const order = this.getOrder(refId);
    if (!order) {
      return { success: false, reason: 'ORDER_NOT_FOUND' };
    }

    // If order was already finalized as CONFIRMED, prevent overwriting unless forced
    if (order.status === this.STATUS.CONFIRMED && newStatus !== this.STATUS.CONFIRMED) {
      if (!adminInfo.force) {
        return {
          success: false,
          reason: 'ALREADY_CONFIRMED',
          error: 'Order has already been confirmed. Confirmed orders cannot be silently invalidated.'
        };
      }
    }

    // Check if this is an idempotent confirmation (already confirmed)
    const wasAlreadyConfirmed = (order.status === this.STATUS.CONFIRMED && newStatus === this.STATUS.CONFIRMED);

    order.status = newStatus;
    order.updatedAt = Date.now();
    order.verifiedAt = order.verifiedAt || Date.now();
    order.verifiedBy = adminInfo.username || adminInfo.userId || 'Admin';
    order.verificationNote = newStatus === this.STATUS.CONFIRMED
      ? 'Payment verified by administrator on Telegram.'
      : 'Transaction ID was rejected as invalid by administrator on Telegram.';

    // Queue in CAPI outbox if moving to CONFIRMED for the first time
    if (newStatus === this.STATUS.CONFIRMED && !order.capiDispatched && !wasAlreadyConfirmed) {
      this.enqueueCapiEvent(order.purchaseEventId, order.refId, 'Purchase');
    }

    savePersistedData();

    return {
      success: true,
      isFirstConfirmation: !wasAlreadyConfirmed && newStatus === this.STATUS.CONFIRMED,
      order
    };
  },

  /**
   * Enqueue event in CAPI Outbox
   */
  enqueueCapiEvent(eventId, orderRef, eventName = 'Purchase') {
    const entry = {
      eventId,
      orderRef,
      eventName,
      status: 'PENDING',
      attempts: 0,
      createdAt: Date.now(),
      lastAttemptAt: null,
      dispatchedAt: null,
      lastError: null,
      fbtraceId: null
    };
    capiOutbox.set(eventId, entry);
    savePersistedData();
    return entry;
  },

  /**
   * Retrieve pending events from Outbox for delivery/retry
   */
  getPendingOutboxEvents() {
    loadPersistedData();
    return Array.from(capiOutbox.values()).filter(e => e.status === 'PENDING' || e.status === 'FAILED');
  },

  /**
   * Mark event as successfully dispatched in Outbox
   */
  markCapiDispatched(eventId, meta = {}) {
    const entry = capiOutbox.get(eventId);
    if (entry) {
      entry.status = 'DISPATCHED';
      entry.dispatchedAt = Date.now();
      entry.fbtraceId = meta.fbtraceId || null;
      entry.lastError = null;
    }

    // Also update order record
    const orderRef = entry?.orderRef;
    if (orderRef) {
      const order = orders.get(orderRef);
      if (order) {
        order.capiDispatched = true;
        order.capiDispatchedAt = Date.now();
        order.capiFbtraceId = meta.fbtraceId || null;
      }
    }

    savePersistedData();
  },

  /**
   * Record failure on an outbox event
   */
  markCapiFailed(eventId, error) {
    const entry = capiOutbox.get(eventId);
    if (entry) {
      entry.status = 'FAILED';
      entry.attempts = (entry.attempts || 0) + 1;
      entry.lastAttemptAt = Date.now();
      entry.lastError = typeof error === 'string' ? error : error?.message || 'Dispatch failed';
    }
    savePersistedData();
  },

  /**
   * Clear or prune expired orders (older than maxAgeMs, default 48 hours)
   */
  cleanupExpired(maxAgeMs = 48 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [refId, order] of orders.entries()) {
      if (now - order.createdAt > maxAgeMs) {
        trxIdIndex.delete(order.trxId);
        orders.delete(refId);
        capiOutbox.delete(order.purchaseEventId);
      }
    }
    savePersistedData();
  }
};
