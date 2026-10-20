import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAuthoritativePrice, AUTHORITATIVE_PLANS } from '../../api/_lib/security.js';

describe('Pricing & Discount Integrity Tests', () => {
  it('Test 2: Server-side price recalculation ignores client-manipulated prices', () => {
    // Attacker sends 1 Year plan with manipulated price 1 BDT
    const clientSuppliedPrice = 1;
    const authoritative = calculateAuthoritativePrice('1 Year', 1, null);

    assert.strictEqual(authoritative.baseUnitPrice, 649, '1 Year must strictly be 649 BDT');
    assert.strictEqual(authoritative.finalTotalPrice, 649, 'Calculated total must strictly be 649 BDT');
    assert.notStrictEqual(authoritative.finalTotalPrice, clientSuppliedPrice, 'Manipulated price must be discarded');

    // 2 Years plan
    const twoYear = calculateAuthoritativePrice('2 Years', 1, null);
    assert.strictEqual(twoYear.baseUnitPrice, 1149, '2 Years must strictly be 1149 BDT');
    assert.strictEqual(twoYear.finalTotalPrice, 1149);

    // 3 Years plan
    const threeYear = calculateAuthoritativePrice('3 Years', 1, null);
    assert.strictEqual(threeYear.baseUnitPrice, 1749, '3 Years must strictly be 1749 BDT');
    assert.strictEqual(threeYear.finalTotalPrice, 1749);
  });

  it('Test 3: Coupon tampering prevents fake coupon exploitation', () => {
    // Attack scenario: Attacker tries fake 100% off coupon
    const fakeCoupon = calculateAuthoritativePrice('1 Year', 1, 'FREE100');
    assert.strictEqual(fakeCoupon.couponApplied, null, 'Fake coupon must be rejected');
    assert.strictEqual(fakeCoupon.discountRate, 0, 'Discount must be 0%');
    assert.strictEqual(fakeCoupon.finalTotalPrice, 649, 'Total must remain full price 649 BDT');

    // Legitimate SAVE10 coupon gives exact 10% discount
    const validCoupon = calculateAuthoritativePrice('1 Year', 1, 'SAVE10');
    assert.strictEqual(validCoupon.couponApplied, 'SAVE10');
    assert.strictEqual(validCoupon.discountRate, 0.10);
    assert.strictEqual(validCoupon.discountAmount, 65); // round(649 * 0.10) = 65
    assert.strictEqual(validCoupon.finalTotalPrice, 584); // 649 - 65 = 584
  });

  it('Test 4: Invalid order quantity handling (clamp and type safety)', () => {
    // Attack scenario: negative quantity
    const negativeQty = calculateAuthoritativePrice('1 Year', -5, null);
    assert.strictEqual(negativeQty.quantity, 1, 'Negative quantity must clamp to 1');
    assert.strictEqual(negativeQty.finalTotalPrice, 649);

    // Attack scenario: zero quantity
    const zeroQty = calculateAuthoritativePrice('1 Year', 0, null);
    assert.strictEqual(zeroQty.quantity, 1, 'Zero quantity must clamp to 1');

    // Attack scenario: massive number for resource exhaustion
    const overflowQty = calculateAuthoritativePrice('1 Year', 9999999, null);
    assert.strictEqual(overflowQty.quantity, 50, 'Excessive quantity must clamp to max 50');

    // Non-numeric quantity
    const nanQty = calculateAuthoritativePrice('1 Year', 'invalid_string', null);
    assert.strictEqual(nanQty.quantity, 1, 'Malformed quantity must fallback to 1');
  });
});

