/**
 * Meta Facebook Pixel Client Service Tests
 * Test Runner: Node.js Test Runner (node --test)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Meta Facebook Pixel Client Service & Configuration Tests', () => {
  const indexPath = path.resolve('index.html');
  const pixelServicePath = path.resolve('src/services/pixelService.js');
  const mainJsxPath = path.resolve('src/main.jsx');
  const paymentPagePath = path.resolve('src/components/payment/PaymentGatewayPage.jsx');

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

  it('3. index.html contains official Meta Pixel <script> code in <head> for immediate detector discovery', () => {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(
      indexContent.includes('connect.facebook.net/en_US/fbevents.js'),
      'index.html head must contain fbevents.js script for immediate extension detection'
    );
    assert.ok(
      indexContent.includes(`fbq('init', '${EXPECTED_PIXEL_ID}')`),
      `index.html head script must initialize Pixel ID ${EXPECTED_PIXEL_ID}`
    );
    assert.ok(
      indexContent.includes("fbq('track', 'PageView')"),
      'index.html head script must fire base PageView'
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
      serviceContent.includes("window.fbq('consent', 'revoke')"),
      'pixelService must communicate consent changes to Meta Pixel via fbq consent command'
    );
  });

  it('7. pixelService.js implements deduplication for all 5 conversion events', () => {
    const serviceContent = fs.readFileSync(pixelServicePath, 'utf8');
    assert.ok(serviceContent.includes('trackViewContent'), 'Must export trackViewContent');
    assert.ok(serviceContent.includes('trackInitiateCheckout'), 'Must export trackInitiateCheckout');
    assert.ok(serviceContent.includes('trackAddPaymentInfo'), 'Must export trackAddPaymentInfo');
    assert.ok(serviceContent.includes('trackPurchase'), 'Must export trackPurchase');
    assert.ok(serviceContent.includes('trackContact'), 'Must export trackContact');
    assert.ok(serviceContent.includes('trackPageView'), 'Must export trackPageView');

    assert.ok(serviceContent.includes('relayEventToCapi'), 'Must export relayEventToCapi');
    assert.ok(serviceContent.includes('generateEventId'), 'Must export generateEventId');
  });

  it('8. PaymentGatewayPage triggers InitiateCheckout on step 1 and AddPaymentInfo on step 2', () => {
    const pageContent = fs.readFileSync(paymentPagePath, 'utf8');
    assert.ok(
      pageContent.includes('trackInitiateCheckout'),
      'PaymentGatewayPage must import and call trackInitiateCheckout'
    );
    assert.ok(
      pageContent.includes('trackAddPaymentInfo'),
      'PaymentGatewayPage must import and call trackAddPaymentInfo'
    );
    assert.ok(
      pageContent.includes('trackPurchase'),
      'PaymentGatewayPage must import and call trackPurchase'
    );
  });

  it('9. App.jsx triggers ViewContent and InitiateCheckout based on hash routing and mount', () => {
    const appPath = path.resolve('src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert.ok(appContent.includes('trackViewContent'), 'App.jsx must import trackViewContent');
    assert.ok(appContent.includes('trackInitiateCheckout'), 'App.jsx must import trackInitiateCheckout');
    assert.ok(appContent.includes("newHash === '#order'"), 'App.jsx must detect #order hash navigation');
    assert.ok(appContent.includes("newHash === '#collections'"), 'App.jsx must detect #collections hash navigation');
  });

  it('10. SubscriptionPlans, Navbar, and ProductCategories wire conversion events to user actions', () => {
    const plansPath = path.resolve('src/components/SubscriptionPlans.jsx');
    const plansContent = fs.readFileSync(plansPath, 'utf8');
    assert.ok(plansContent.includes('trackInitiateCheckout'), 'SubscriptionPlans must call trackInitiateCheckout on plan CTA');

    const navbarPath = path.resolve('src/components/Navbar.jsx');
    const navbarContent = fs.readFileSync(navbarPath, 'utf8');
    assert.ok(navbarContent.includes('trackInitiateCheckout'), 'Navbar must call trackInitiateCheckout on Get Started CTAs');

    const catPath = path.resolve('src/components/ProductCategories.jsx');
    const catContent = fs.readFileSync(catPath, 'utf8');
    assert.ok(catContent.includes('trackViewContent'), 'ProductCategories must call trackViewContent on card click');
    assert.ok(catContent.includes('trackInitiateCheckout'), 'ProductCategories must call trackInitiateCheckout on catalog CTA');
  });
});

