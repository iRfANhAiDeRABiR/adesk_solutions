/**
 * Meta Facebook Pixel Client Service Tests
 * Test Runner: Node.js Test Runner (node --test)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Meta Facebook Pixel Client Service & Configuration Tests', () => {
  const indexPath = path.resolve('index.html');
  const pixelServicePath = path.resolve('src/services/pixelService.js');
  const mainJsxPath = path.resolve('src/main.jsx');

  const EXPECTED_PIXEL_ID = '6925345297741031';

  it('1. Pixel ID in pixelService.js matches 6925345297741031', () => {
    const serviceContent = fs.readFileSync(pixelServicePath, 'utf8');
    assert.ok(
      serviceContent.includes(EXPECTED_PIXEL_ID),
      `pixelService.js must contain expected Pixel ID ${EXPECTED_PIXEL_ID}`
    );
    assert.ok(
      serviceContent.includes('import.meta.env.VITE_FB_PIXEL_ID || "6925345297741031"'),
      'pixelService.js should fall back to 6925345297741031 when env var is not set'
    );
  });

  it('2. index.html contains matching noscript fallback for 6925345297741031 and PageView', () => {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(
      indexContent.includes(`id=${EXPECTED_PIXEL_ID}`),
      `index.html noscript fallback must reference ${EXPECTED_PIXEL_ID}`
    );
    assert.ok(
      indexContent.includes('ev=PageView'),
      'index.html noscript fallback must trigger ev=PageView'
    );
  });

  it('3. index.html does NOT inject a duplicate <script> tag for Facebook Pixel', () => {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(
      !indexContent.includes('connect.facebook.net/en_US/fbevents.js'),
      'index.html should not duplicate the fbevents.js script tag (managed dynamically by pixelService)'
    );
  });

  it('4. main.jsx imports and initializes initFacebookPixel()', () => {
    const mainContent = fs.readFileSync(mainJsxPath, 'utf8');
    assert.ok(
      mainContent.includes("import { initFacebookPixel } from './services/pixelService'"),
      'main.jsx must import initFacebookPixel'
    );
    assert.ok(
      mainContent.includes('initFacebookPixel()'),
      'main.jsx must invoke initFacebookPixel()'
    );
  });

  it('5. pixelService.js does not leak or reference backend secrets', () => {
    const serviceContent = fs.readFileSync(pixelServicePath, 'utf8');
    assert.ok(
      !serviceContent.includes('META_CAPI_ACCESS_TOKEN'),
      'pixelService.js must never reference server secret META_CAPI_ACCESS_TOKEN'
    );
    assert.ok(
      !serviceContent.includes('TELEGRAM_BOT_TOKEN'),
      'pixelService.js must never reference TELEGRAM_BOT_TOKEN'
    );
    assert.ok(
      !serviceContent.includes('EAANoux'),
      'Compromised token string must never appear in pixelService.js'
    );
  });

  it('6. pixelService.js respects marketing consent storage and supports consent toggle', () => {
    const serviceContent = fs.readFileSync(pixelServicePath, 'utf8');
    assert.ok(
      serviceContent.includes('softwaresolutions_marketing_consent'),
      'pixelService must use softwaresolutions_marketing_consent localStorage key'
    );
    assert.ok(
      serviceContent.includes("window.fbq('consent', 'revoke')") || serviceContent.includes("window.fbq('consent', granted ? 'grant' : 'revoke')"),
      'pixelService must communicate consent changes to Meta Pixel via fbq consent command'
    );
  });

  it('7. pixelService.js implements deduplication for all 5 conversion events', () => {
    const serviceContent = fs.readFileSync(pixelServicePath, 'utf8');
    // All 5 events must be defined
    assert.ok(serviceContent.includes('trackViewContent'), 'Must export trackViewContent');
    assert.ok(serviceContent.includes('trackInitiateCheckout'), 'Must export trackInitiateCheckout');
    assert.ok(serviceContent.includes('trackAddPaymentInfo'), 'Must export trackAddPaymentInfo');
    assert.ok(serviceContent.includes('trackPurchase'), 'Must export trackPurchase');
    assert.ok(serviceContent.includes('trackContact'), 'Must export trackContact');
    assert.ok(serviceContent.includes('trackPageView'), 'Must export trackPageView');

    // Event ID and CAPI relay
    assert.ok(serviceContent.includes('relayEventToCapi'), 'Must export relayEventToCapi');
    assert.ok(serviceContent.includes('generateEventId'), 'Must export generateEventId');
  });
});
