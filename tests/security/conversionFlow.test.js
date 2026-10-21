/**
 * Meta Conversion Events Flow & Milestone Regression Tests
 * Test Runner: Node.js Test Runner (node --test)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  sendMetaCapiEvent,
  dispatchCapiPurchaseForOrder,
  buildPurchaseEventPayload
} from '../../api/_lib/metaCapi.js';

import { OrderStateMachine } from '../../api/_lib/store.js';
import trackingRelayHandler from '../../api/tracking/event.js';

describe('Meta Conversion Flow & Milestone Regression Tests', () => {
  const pixelServicePath = path.resolve('src/services/pixelService.js');
  const paymentPagePath = path.resolve('src/components/payment/PaymentGatewayPage.jsx');
  const orderSectionPath = path.resolve('src/components/OrderSection.jsx');
  const appPath = path.resolve('src/App.jsx');

  it('1. InitiateCheckout milestone is wired to checkout start and payment gateway step 1', () => {
    const paymentPage = fs.readFileSync(paymentPagePath, 'utf8');
    const orderSection = fs.readFileSync(orderSectionPath, 'utf8');
    const app = fs.readFileSync(appPath, 'utf8');
    const pixelService = fs.readFileSync(pixelServicePath, 'utf8');

    // InitiateCheckout is exported by pixelService
    assert.ok(pixelService.includes('export const trackInitiateCheckout'), 'pixelService must export trackInitiateCheckout');
    assert.ok(pixelService.includes("generateEventId('ic')"), 'trackInitiateCheckout must generate ic_ event ID');
    assert.ok(pixelService.includes("currency: 'BDT'"), 'trackInitiateCheckout must use BDT currency');

    // Fired on order submission
    assert.ok(orderSection.includes('trackInitiateCheckout(orderPayload)'), 'OrderSection must fire InitiateCheckout on submit');

    // Fired in PaymentGatewayPage Step 1
    assert.ok(paymentPage.includes('step === 1'), 'PaymentGatewayPage must guard Step 1');
    assert.ok(paymentPage.includes('trackInitiateCheckout(order)'), 'PaymentGatewayPage must fire InitiateCheckout in Step 1');

    // Fired on #order hash routing
    assert.ok(app.includes("newHash === '#order'"), 'App.jsx must listen to #order hash');
    assert.ok(app.includes('trackInitiateCheckout('), 'App.jsx must trigger InitiateCheckout on #order');
  });

  it('2. AddPaymentInfo milestone fires strictly upon valid payment information acceptance in Step 1 -> Step 2', () => {
    const paymentPage = fs.readFileSync(paymentPagePath, 'utf8');
    const pixelService = fs.readFileSync(pixelServicePath, 'utf8');

    assert.ok(pixelService.includes('export const trackAddPaymentInfo'), 'pixelService must export trackAddPaymentInfo');
    assert.ok(pixelService.includes("generateEventId('api')"), 'trackAddPaymentInfo must generate api_ event ID');
    assert.ok(pixelService.includes("content_category: 'Payment Gateway'"), 'AddPaymentInfo must categorize as Payment Gateway');

    // Fired in handleProceedToStep2 after sender number is validated
    assert.ok(paymentPage.includes('handleProceedToStep2'), 'PaymentGatewayPage must contain handleProceedToStep2');
    assert.ok(paymentPage.includes('trackAddPaymentInfo(method, numericPrice'), 'handleProceedToStep2 must call trackAddPaymentInfo');
    assert.ok(paymentPage.includes('hasTrackedPaymentInfoRef.current = true'), 'handleProceedToStep2 must mark milestone tracked to avoid duplicates');
  });

  it('3. ViewContent implements deduplication to prevent duplicate triggers on initial load', () => {
    const pixelService = fs.readFileSync(pixelServicePath, 'utf8');
    const plansPath = path.resolve('src/components/SubscriptionPlans.jsx');
    const plansContent = fs.readFileSync(plansPath, 'utf8');

    // Deduplication cache exists
    assert.ok(pixelService.includes('lastViewContentKey'), 'pixelService must maintain lastViewContentKey');
    assert.ok(pixelService.includes('lastViewContentTime'), 'pixelService must maintain lastViewContentTime');
    assert.ok(pixelService.includes('(now - lastViewContentTime) < 3000'), 'pixelService must enforce 3000ms deduplication window for ViewContent');

    // Redundant mount effect was removed from SubscriptionPlans to avoid simultaneous dual firing
    assert.ok(
      !plansContent.includes("trackViewContent('Autodesk All Apps Subscription Plans'"),
      'SubscriptionPlans must not contain redundant mount effect firing duplicate ViewContent'
    );
  });

  it('4. Browser and Server share identical event names and event IDs for deduplication', () => {
    const pixelService = fs.readFileSync(pixelServicePath, 'utf8');

    // In trackPixelEvent: eventID is passed to both window.fbq and relayEventToCapi
    assert.ok(pixelService.includes("window.fbq('track', eventName, params, { eventID })"), 'fbq must receive eventID');
    assert.ok(pixelService.includes('relayEventToCapi({'), 'trackPixelEvent must invoke relayEventToCapi');
    assert.ok(pixelService.includes('eventId: eventID'), 'relayEventToCapi must receive matching eventID');
    assert.ok(pixelService.includes('eventName,'), 'relayEventToCapi must receive matching eventName');
  });

  it('5. PENDING orders never trigger Purchase (both server relay and state machine enforce this)', async () => {
    // 5a. Public CAPI relay endpoint strictly rejects Purchase
    let statusCode = null;
    let jsonResult = null;

    const mockReq = {
      method: 'POST',
      headers: { 'user-agent': 'TestRunner' },
      body: {
        eventName: 'Purchase',
        eventId: 'purchase_unauthorized_attempt',
        customData: { value: 649, currency: 'BDT' }
      }
    };

    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      },
      setHeader() {}
    };

    await trackingRelayHandler(mockReq, mockRes);
    assert.strictEqual(statusCode, 403, 'Public CAPI relay must reject Purchase with 403 Forbidden');
    assert.ok(jsonResult.error.includes('Forbidden'));

    // 5b. dispatchCapiPurchaseForOrder strictly rejects non-CONFIRMED order
    const pendingOrder = {
      refId: 'SOFT-TEST-PENDING-001',
      status: 'PENDING_VERIFICATION',
      purchaseEventId: 'purchase_SOFT-TEST-PENDING-001'
    };

    const dispatchResult = await dispatchCapiPurchaseForOrder(pendingOrder, OrderStateMachine);
    assert.strictEqual(dispatchResult.success, false);
    assert.strictEqual(dispatchResult.reason, 'ORDER_NOT_CONFIRMED');
  });

  it('6. Proper handling when CAPI delivery fails or times out without throwing unhandled rejection', async () => {
    const origFetch = global.fetch;
    const origToken = process.env.META_CAPI_ACCESS_TOKEN;
    const origPixel = process.env.META_PIXEL_ID;

    try {
      process.env.META_PIXEL_ID = '6925345297741031';
      process.env.META_CAPI_ACCESS_TOKEN = 'mock_token_for_failure_test';

      // Mock network timeout
      global.fetch = async (url, opts) => {
        return new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      };

      const result = await sendMetaCapiEvent(
        {
          event_name: 'ViewContent',
          event_time: Math.floor(Date.now() / 1000),
          event_id: 'vc_timeout_test_001'
        },
        { timeoutMs: 50 }
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.reason, 'TIMEOUT');
      assert.ok(result.error.includes('timed out'));
    } finally {
      global.fetch = origFetch;
      if (origToken) process.env.META_CAPI_ACCESS_TOKEN = origToken;
      else delete process.env.META_CAPI_ACCESS_TOKEN;
      if (origPixel) process.env.META_PIXEL_ID = origPixel;
      else delete process.env.META_PIXEL_ID;
    }
  });

  it('7. Staging test_event_code is forwarded to Meta Graph API when provided in options or environment', async () => {
    const origFetch = global.fetch;
    const origToken = process.env.META_CAPI_ACCESS_TOKEN;
    const origPixel = process.env.META_PIXEL_ID;

    try {
      process.env.META_PIXEL_ID = '6925345297741031';
      process.env.META_CAPI_ACCESS_TOKEN = 'mock_token_test_code';

      let capturedBody = null;
      global.fetch = async (url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            events_received: 1,
            fbtrace_id: 'mock_trace_123',
            messages: []
          })
        };
      };

      const result = await sendMetaCapiEvent(
        {
          event_name: 'InitiateCheckout',
          event_time: Math.floor(Date.now() / 1000),
          event_id: 'ic_test_code_001'
        },
        { testEventCode: 'TEST98765' }
      );

      assert.strictEqual(result.success, true);
      assert.ok(capturedBody !== null);
      assert.strictEqual(capturedBody.test_event_code, 'TEST98765', 'test_event_code must be attached to Meta payload');
    } finally {
      global.fetch = origFetch;
      if (origToken) process.env.META_CAPI_ACCESS_TOKEN = origToken;
      else delete process.env.META_CAPI_ACCESS_TOKEN;
      if (origPixel) process.env.META_PIXEL_ID = origPixel;
      else delete process.env.META_PIXEL_ID;
    }
  });
});
