import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateOrderInput, escapeTelegramHtml } from '../../api/_lib/security.js';

describe('Input Validation & Sanitization Security Tests', () => {
  const validBaseOrder = {
    name: 'Tamim Iqbal',
    email: 'tamim@example.com',
    phone: '01712345678',
    duration: '1 Year',
    quantity: 1,
    paymentMethod: 'Bkash',
    senderNumber: '01712345678',
    trxId: 'DJ1A2B3C4D'
  };

  it('Test 5: Malformed phone and email inputs are strictly rejected', () => {
    // Malformed email
    const invalidEmail = validateOrderInput({ ...validBaseOrder, email: 'not-an-email' });
    assert.strictEqual(invalidEmail.isValid, false, 'Invalid email format must fail validation');
    assert.ok(invalidEmail.errors.some(e => e.includes('email')));

    // Malformed phone numbers
    const shortPhone = validateOrderInput({ ...validBaseOrder, phone: '01712' });
    assert.strictEqual(shortPhone.isValid, false, 'Short phone must fail validation');

    const nonBdPhone = validateOrderInput({ ...validBaseOrder, phone: '12345678901' });
    assert.strictEqual(nonBdPhone.isValid, false, 'Non-Bangladeshi prefix must fail validation');

    const alphaPhone = validateOrderInput({ ...validBaseOrder, phone: '01712ABCDEF' });
    assert.strictEqual(alphaPhone.isValid, false, 'Alphanumeric phone must fail validation');
  });

  it('Test 6: XSS payload handling and safe Telegram HTML escaping', () => {
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    const escaped = escapeTelegramHtml(xssPayload);

    assert.ok(!escaped.includes('<script>'), 'Raw script tags must not exist');
    assert.ok(!escaped.includes('<img'), 'Raw img tags must not exist');
    assert.ok(escaped.includes('&lt;script&gt;'), 'Angle brackets must be converted to &lt; and &gt;');
    assert.ok(escaped.includes('&quot;'), 'Quotes must be converted to &quot;');

    // Verify sanitization in order input
    const orderWithXss = validateOrderInput({
      ...validBaseOrder,
      requirements: '<b onmouseover=alert(1)>Need AutoCAD 2025</b>'
    });
    assert.strictEqual(orderWithXss.isValid, true);
    const safeOutput = escapeTelegramHtml(orderWithXss.sanitized.requirements);
    assert.ok(!safeOutput.includes('<b onmouseover'));
  });

  it('Test 7: Invalid transaction ID formats are strictly rejected', () => {
    // bKash: 8 to 12 alphanumeric characters
    const bkashShort = validateOrderInput({
      ...validBaseOrder,
      paymentMethod: 'Bkash',
      trxId: 'BK123'
    });
    assert.strictEqual(bkashShort.isValid, false, 'bKash TrxID under 8 characters must be rejected');

    const bkashNonAlpha = validateOrderInput({
      ...validBaseOrder,
      paymentMethod: 'Bkash',
      trxId: 'BL84J2K9!@'
    });
    assert.strictEqual(bkashNonAlpha.isValid, false, 'Non-alphanumeric bKash TrxID must be rejected');

    const bkashValidReal = validateOrderInput({
      ...validBaseOrder,
      paymentMethod: 'Bkash',
      trxId: 'BL84J2K9LM'
    });
    assert.strictEqual(bkashValidReal.isValid, true, 'Valid real-world bKash TrxID (BL prefix) must be accepted');

    const bkashDjValid = validateOrderInput({
      ...validBaseOrder,
      paymentMethod: 'Bkash',
      trxId: 'DJ1A2B3C4D'
    });
    assert.strictEqual(bkashDjValid.isValid, true, '10-char alphanumeric bKash TrxID must be accepted');

    // Nagad: 8-12 characters
    const nagadInvalid = validateOrderInput({
      ...validBaseOrder,
      paymentMethod: 'Nagad',
      trxId: 'NG123'
    });
    assert.strictEqual(nagadInvalid.isValid, false, 'Nagad TrxID under 8 characters must be rejected');

    const nagadValid = validateOrderInput({
      ...validBaseOrder,
      paymentMethod: 'Nagad',
      trxId: '72AK94X2'
    });
    assert.strictEqual(nagadValid.isValid, true, 'Valid Nagad TrxID must be accepted');

    // Rocket: 6-12 characters
    const rocketInvalid = validateOrderInput({
      ...validBaseOrder,
      paymentMethod: 'Rocket',
      trxId: 'RC123'
    });
    assert.strictEqual(rocketInvalid.isValid, false, 'Rocket TrxID under 6 characters must be rejected');

    const rocketValid = validateOrderInput({
      ...validBaseOrder,
      paymentMethod: 'Rocket',
      trxId: '2938471928'
    });
    assert.strictEqual(rocketValid.isValid, true, 'Valid Rocket TrxID must be accepted');
  });

  it('Test 21: 404 error page & scanner bot protection verification', () => {
    // 1. Verify standalone static 404.html
    const public404 = path.resolve('public/404.html');
    assert.ok(fs.existsSync(public404), 'public/404.html must exist for static edge delivery');
    const htmlContent = fs.readFileSync(public404, 'utf-8');
    assert.ok(htmlContent.includes('404'), '404.html must contain 404 code');
    assert.ok(htmlContent.includes('Software Solutions BD'), '404.html must contain Software Solutions BD branding');
    assert.ok(htmlContent.includes('id="home-link"'), '404.html must contain home-link button');
    assert.ok(htmlContent.includes('href="/"'), '404.html must link directly to root');
    assert.ok(!htmlContent.includes('segments[0]'), '404.html must not contain buggy path segment hijacking');

    // 2. Verify React SPA NotFoundPage component
    const react404 = path.resolve('src/components/NotFoundPage.jsx');
    assert.ok(fs.existsSync(react404), 'src/components/NotFoundPage.jsx must exist for SPA routing');

    // 3. Verify vercel.json rewrites sensitive scanner probes to /404.html
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf-8'));
    const rewrites = vercelConfig.rewrites || [];
    assert.ok(
      rewrites.some(r => r.source.includes('.env') && r.destination === '/404.html'),
      'vercel.json must rewrite .env probes to 404.html'
    );
    assert.ok(
      rewrites.some(r => r.source.includes('.git') && r.destination === '/404.html'),
      'vercel.json must rewrite .git probes to 404.html'
    );
  });
});

