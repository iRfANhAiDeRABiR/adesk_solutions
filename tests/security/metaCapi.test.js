/**
 * Meta Conversions API (CAPI) & Pixel Integration Security Test Suite
 * Test Runner: Node.js Test Runner (node --test)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import {
  normalizeEmail,
  normalizeBdPhone,
  hashSha256,
  buildUserData,
  buildPurchaseEventPayload,
  sendMetaCapiEvent,
  dispatchCapiPurchaseForOrder,
  getMetaCapiConfig
} from '../../api/_lib/metaCapi.js';

import { OrderStateMachine } from '../../api/_lib/store.js';
import { calculateAuthoritativePrice, validateOrderInput } from '../../api/_lib/security.js';

describe('Meta CAPI Normalization & Hashing Tests', () => {
  it('should trim and lowercase emails, then compute valid SHA-256 hash', () => {
    const rawEmail = '  Tamim.Iqbal@Example.COM  ';
    const normalized = normalizeEmail(rawEmail);
    assert.strictEqual(normalized, 'tamim.iqbal@example.com');

    const expectedHash = crypto.createHash('sha256').update('tamim.iqbal@example.com').digest('hex');
    const hash = hashSha256(normalized);
    assert.strictEqual(hash, expectedHash);
    assert.strictEqual(hash.length, 64);
  });

  it('should correctly normalize Bangladeshi phone numbers to E.164 without leading plus', () => {
    // 11 digits starting with 01
    const p1 = normalizeBdPhone('01712345678');
    assert.strictEqual(p1, '8801712345678');

    // 10 digits starting with 1
    const p2 = normalizeBdPhone('1712345678');
    assert.strictEqual(p2, '8801712345678');

    // With leading +880 and formatting hyphens
    const p3 = normalizeBdPhone('+880-1712-345678');
    assert.strictEqual(p3, '8801712345678');

    // With spaces
    const p4 = normalizeBdPhone('018 9999 8888');
    assert.strictEqual(p4, '8801899998888');

    // Computed SHA-256
    const expectedHash = crypto.createHash('sha256').update('8801712345678').digest('hex');
    assert.strictEqual(hashSha256(p1), expectedHash);
  });

  it('should not re-hash an already hashed 64-character hex string (idempotency)', () => {
    const originalHash = crypto.createHash('sha256').update('test@example.com').digest('hex');
    const rehashed = hashSha256(originalHash);
    assert.strictEqual(rehashed, originalHash, 'Already-hashed 64-char hex string must not be hashed again');
  });

  it('should omit missing optional fields and NEVER include null inside arrays', () => {
    const userData = buildUserData({
      email: null,
      phone: '',
      clientIp: '103.145.12.34',
      userAgent: 'Mozilla/5.0 Synthetic Test Agent',
      fbp: null,
      fbc: undefined
    });

    assert.strictEqual(userData.em, undefined, 'em array must not exist if email is null');
    assert.strictEqual(userData.ph, undefined, 'ph array must not exist if phone is empty');
    assert.strictEqual(userData.fbp, undefined, 'fbp must be omitted if null');
    assert.strictEqual(userData.fbc, undefined, 'fbc must be omitted if undefined');
    assert.strictEqual(userData.client_ip_address, '103.145.12.34');
    assert.strictEqual(userData.client_user_agent, 'Mozilla/5.0 Synthetic Test Agent');
  });

  it('should correctly include unhashed fbp and fbc cookies when provided', () => {
    const userData = buildUserData({
      email: 'customer@test.com',
      phone: '01700000000',
      clientIp: '103.145.12.34',
      userAgent: 'Chrome/128.0',
      fbp: 'fb.1.1596403881.1764643037',
      fbc: 'fb.1.1554763741.AbCdEfGhIjKlMnOpQrStUvWxYz'
    });

    assert.ok(Array.isArray(userData.em) && userData.em.length === 1);
    assert.ok(Array.isArray(userData.ph) && userData.ph.length === 1);
    assert.strictEqual(userData.fbp, 'fb.1.1596403881.1764643037');
    assert.strictEqual(userData.fbc, 'fb.1.1554763741.AbCdEfGhIjKlMnOpQrStUvWxYz');
  });
});

describe('Meta CAPI Payload & Deduplication Tests', () => {
  const sampleOrder = {
    refId: 'SOFT-ATD-882194A1',
    name: 'Shakib Al Hasan',
    email: 'shakib@example.com',
    phone: '01711223344',
    product: 'Autodesk All Apps',
    duration: '1 Year',
    quantity: 1,
    finalTotalPrice: 649,
    displayPrice: '৳ 649',
    paymentMethod: 'Bkash',
    trxId: 'DJ9A8B7C6D',
    clientIp: '103.205.71.12',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    fbp: 'fb.1.1729440000.123456789',
    fbc: 'fb.1.1729440000.test_fbclid_123',
    purchaseEventId: 'purchase_SOFT-ATD-882194A1',
    eventSourceUrl: 'https://adesk.solutionsbd.com/#payment'
  };

  it('should construct authoritative Purchase payload with matching event_id and BDT currency', () => {
    const payload = buildPurchaseEventPayload(sampleOrder);

    assert.strictEqual(payload.event_name, 'Purchase');
    assert.strictEqual(payload.event_id, 'purchase_SOFT-ATD-882194A1', 'event_id must match purchase_${refId}');
    assert.strictEqual(payload.action_source, 'website');
    assert.strictEqual(payload.custom_data.currency, 'BDT');
    assert.strictEqual(payload.custom_data.value, 649);
    assert.strictEqual(payload.custom_data.order_id, 'SOFT-ATD-882194A1');
    assert.deepStrictEqual(payload.custom_data.content_ids, ['AUTODESK-ALL-APPS']);

    // Check event_time is a valid current Unix timestamp in seconds
    const nowSec = Math.floor(Date.now() / 1000);
    assert.ok(Math.abs(payload.event_time - nowSec) < 5, 'Timestamp must be genuine current seconds');

    // Verify absence of fabricated or unstandardized fields
    assert.strictEqual(payload.attribution_data, undefined, 'Must not include fabricated attribution_data');
    assert.strictEqual(payload.original_event_data, undefined, 'Must not include fabricated original_event_data');
  });

  it('should use authoritative BDT price and reject arbitrary USD or client-manipulated prices', () => {
    // 2 Years with 10% coupon
    const pricing = calculateAuthoritativePrice('2 Years', 1, 'SAVE10');
    assert.strictEqual(pricing.baseTotalPrice, 1149);
    assert.strictEqual(pricing.discountAmount, 115);
    assert.strictEqual(pricing.finalTotalPrice, 1034);

    const orderWithDiscount = {
      ...sampleOrder,
      duration: '2 Years',
      finalTotalPrice: pricing.finalTotalPrice,
      displayPrice: pricing.displayPrice
    };

    const payload = buildPurchaseEventPayload(orderWithDiscount);
    assert.strictEqual(payload.custom_data.value, 1034, 'Value must strictly match authoritative calculated BDT amount');
    assert.strictEqual(payload.custom_data.currency, 'BDT');
  });
});

describe('Meta CAPI Payment Confirmation & Idempotency State Machine Tests', () => {
  it('should reject CAPI Purchase dispatch if order status is still PENDING', async () => {
    const pendingOrder = {
      refId: 'SOFT-ATD-TEST-PENDING',
      status: 'PENDING',
      finalTotalPrice: 649,
      email: 'test@example.com'
    };

    const result = await dispatchCapiPurchaseForOrder(pendingOrder, OrderStateMachine);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'ORDER_NOT_CONFIRMED');
  });

  it('should reject CAPI Purchase dispatch if order status is INVALID', async () => {
    const invalidOrder = {
      refId: 'SOFT-ATD-TEST-INVALID',
      status: 'INVALID',
      finalTotalPrice: 649,
      email: 'fake@example.com'
    };

    const result = await dispatchCapiPurchaseForOrder(invalidOrder, OrderStateMachine);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'ORDER_NOT_CONFIRMED');
  });

  it('should enforce idempotency: second confirmation attempt does NOT trigger duplicate CAPI dispatch', async () => {
    const testRef = 'SOFT-ATD-IDEM-' + Date.now();
    const created = OrderStateMachine.createOrder({
      refId: testRef,
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '01712345678',
      product: 'Autodesk All Apps',
      duration: '1 Year',
      quantity: 1,
      finalTotalPrice: 649,
      displayPrice: '৳ 649',
      paymentMethod: 'Bkash',
      senderNumber: '01712345678',
      trxId: 'DJ' + Math.random().toString(36).substring(2, 10).toUpperCase()
    });

    assert.ok(created.success);

    // First confirmation (authorized admin)
    const firstConfirm = OrderStateMachine.updateStatus(testRef, 'CONFIRMED', {
      userId: '5696241698',
      username: 'AuthorizedAdmin'
    });
    assert.strictEqual(firstConfirm.success, true);
    assert.strictEqual(firstConfirm.isFirstConfirmation, true);

    // Simulate CAPI dispatch success
    OrderStateMachine.markCapiDispatched(firstConfirm.order.purchaseEventId, {
      fbtraceId: 'mock_trace_12345'
    });

    // Second confirmation attempt (e.g. repeated webhook callback or double button press)
    const secondConfirm = OrderStateMachine.updateStatus(testRef, 'CONFIRMED', {
      userId: '5696241698',
      username: 'AuthorizedAdmin'
    });
    assert.strictEqual(secondConfirm.success, true);
    assert.strictEqual(secondConfirm.isFirstConfirmation, false, 'Second confirmation must NOT be flagged as first confirmation');

    // Attempt CAPI dispatch on already-dispatched order
    const capiResult = await dispatchCapiPurchaseForOrder(secondConfirm.order, OrderStateMachine);
    assert.strictEqual(capiResult.success, true);
    assert.strictEqual(capiResult.alreadyDispatched, true, 'Must prevent duplicate CAPI dispatch');
  });

  it('should function correctly even if the customer browser is closed (server-side webhook execution)', async () => {
    // When customer browser is closed, the webhook receives the admin click and updates state
    const bgRef = 'SOFT-ATD-BG-' + Date.now();
    const bgOrder = OrderStateMachine.createOrder({
      refId: bgRef,
      name: 'Offline Customer',
      email: 'offline@example.com',
      phone: '01912345678',
      product: 'Autodesk All Apps',
      duration: '1 Year',
      quantity: 1,
      finalTotalPrice: 649,
      displayPrice: '৳ 649',
      paymentMethod: 'Nagad',
      senderNumber: '01912345678',
      trxId: 'NG' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      clientIp: '103.45.67.89',
      userAgent: 'Mobile Safari / Closed Tab'
    });

    assert.ok(bgOrder.success);

    // Admin confirms via webhook
    const update = OrderStateMachine.updateStatus(bgRef, 'CONFIRMED', {
      userId: '5696241698',
      username: 'Admin'
    });

    assert.strictEqual(update.order.status, 'CONFIRMED');
    assert.ok(update.order.purchaseEventId.startsWith('purchase_'));

    // Check CAPI payload generated server-side without any active browser
    const payload = buildPurchaseEventPayload(update.order);
    assert.strictEqual(payload.user_data.client_ip_address, '103.45.67.89');
    assert.strictEqual(payload.user_data.client_user_agent, 'Mobile Safari / Closed Tab');
    assert.ok(Array.isArray(payload.user_data.em));
  });
});

describe('Meta CAPI Security & Credential Scanning Tests', () => {
  it('should not contain exposed META_CAPI_ACCESS_TOKEN in client source files (src/)', () => {
    const srcDir = path.resolve('src');
    const walk = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.html') || file.endsWith('.css')) {
          results.push(file);
        }
      });
      return results;
    };

    const files = walk(srcDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      assert.ok(!content.includes('META_CAPI_ACCESS_TOKEN'), `META_CAPI_ACCESS_TOKEN must never be referenced in client file: ${path.relative(process.cwd(), file)}`);
      assert.ok(!content.includes('EAANoux'), `Compromised token string must never appear in: ${path.relative(process.cwd(), file)}`);
    }
  });

  it('should not contain exposed META_CAPI_ACCESS_TOKEN or live credentials in production dist bundle', () => {
    const distDir = path.resolve('dist');
    if (!fs.existsSync(distDir)) return;

    const list = fs.readdirSync(distDir);
    for (const item of list) {
      const fullPath = path.join(distDir, item);
      if (fs.statSync(fullPath).isFile() && (item.endsWith('.js') || item.endsWith('.html'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        assert.ok(!content.includes('META_CAPI_ACCESS_TOKEN'), `No CAPI token variable in dist: ${item}`);
        assert.ok(!content.includes('EAANoux'), `No compromised token in dist: ${item}`);
      }
    }
  });

  it('should verify .env.example contains safe placeholders only', () => {
    const examplePath = path.resolve('.env.example');
    assert.ok(fs.existsSync(examplePath), '.env.example must exist');
    const content = fs.readFileSync(examplePath, 'utf-8');

    assert.ok(content.includes('META_CAPI_ACCESS_TOKEN=SET_PRIVATELY_IN_VERCEL'));
    assert.ok(content.includes('META_PIXEL_ID=YOUR_META_DATASET_ID'));
    assert.ok(content.includes('VITE_FB_PIXEL_ID=YOUR_META_DATASET_ID'));
    assert.ok(!content.includes('EAANoux'), 'Compromised token must not be in .env.example');
  });

  it('should verify .gitignore includes .env and local environment files', () => {
    const gitignorePath = path.resolve('.gitignore');
    assert.ok(fs.existsSync(gitignorePath));
    const content = fs.readFileSync(gitignorePath, 'utf-8');

    assert.ok(content.includes('.env'));
    assert.ok(content.includes('.env.local'));
  });
});

describe('Meta Graph API Network & Mock Dispatch Tests', () => {
  it('should skip network call and report missing configuration when credentials are absent', async () => {
    const origToken = process.env.META_CAPI_ACCESS_TOKEN;
    const origPixel = process.env.META_PIXEL_ID;
    const origVite = process.env.VITE_FB_PIXEL_ID;

    try {
      delete process.env.META_CAPI_ACCESS_TOKEN;
      delete process.env.META_PIXEL_ID;
      delete process.env.VITE_FB_PIXEL_ID;

      const res = await sendMetaCapiEvent({
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000)
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.skipped, true);
      assert.strictEqual(res.reason, 'META_CAPI_NOT_CONFIGURED');
    } finally {
      if (origToken) process.env.META_CAPI_ACCESS_TOKEN = origToken;
      if (origPixel) process.env.META_PIXEL_ID = origPixel;
      if (origVite) process.env.VITE_FB_PIXEL_ID = origVite;
    }
  });

  it('should successfully parse mock 200 response from Meta Graph API', async () => {
    const origFetch = global.fetch;
    try {
      process.env.META_PIXEL_ID = '6925345297741031';
      process.env.META_CAPI_ACCESS_TOKEN = 'mock_valid_access_token_123';
      process.env.META_TEST_EVENT_CODE = 'TEST998811';

      global.fetch = async (url, opts) => {
        assert.ok(url.includes('graph.facebook.com/v21.0/6925345297741031/events'));
        assert.strictEqual(opts.headers.Authorization, 'Bearer mock_valid_access_token_123');
        const body = JSON.parse(opts.body);
        assert.strictEqual(body.test_event_code, 'TEST998811');
        assert.strictEqual(body.data[0].event_name, 'Purchase');

        return {
          ok: true,
          status: 200,
          json: async () => ({
            events_received: 1,
            fbtrace_id: 'mock_fbtrace_xyz789',
            messages: []
          })
        };
      };

      const res = await sendMetaCapiEvent({
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: 'purchase_test_mock_1'
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.eventsReceived, 1);
      assert.strictEqual(res.fbtraceId, 'mock_fbtrace_xyz789');
    } finally {
      global.fetch = origFetch;
      delete process.env.META_TEST_EVENT_CODE;
    }
  });

  it('should handle Meta Graph API error response gracefully without crashing', async () => {
    const origFetch = global.fetch;
    try {
      process.env.META_PIXEL_ID = '6925345297741031';
      process.env.META_CAPI_ACCESS_TOKEN = 'mock_invalid_token';

      global.fetch = async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid OAuth access token.',
            type: 'OAuthException',
            code: 190,
            fbtrace_id: 'error_trace_404'
          }
        })
      });

      const res = await sendMetaCapiEvent({
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: 'purchase_error_test'
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.error, 'Invalid OAuth access token.');
      assert.strictEqual(res.fbtraceId, 'error_trace_404');
    } finally {
      global.fetch = origFetch;
    }
  });

  it('should handle request timeout using AbortController safely', async () => {
    const origFetch = global.fetch;
    try {
      process.env.META_PIXEL_ID = '6925345297741031';
      process.env.META_CAPI_ACCESS_TOKEN = 'mock_token';

      global.fetch = async (url, opts) => {
        return new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      };

      const res = await sendMetaCapiEvent(
        { event_name: 'Purchase', event_time: Math.floor(Date.now() / 1000) },
        { timeoutMs: 50 } // Short 50ms timeout for test
      );

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.reason, 'TIMEOUT');
    } finally {
      global.fetch = origFetch;
    }
  });
});
