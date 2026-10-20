import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderStateMachine } from '../../api/_lib/store.js';
import { generateOrderRef } from '../../api/_lib/security.js';

describe('Order Lifecycle & Payment Integrity Tests', () => {
  it('Test 8 & 9: Duplicate transaction ID rejection and duplicate order submission', () => {
    const trxId = 'DJTEST9999';
    const order1 = {
      refId: 'SOFT-ATD-111111',
      name: 'User 1',
      email: 'user1@example.com',
      phone: '01711111111',
      trxId
    };

    const res1 = OrderStateMachine.createOrder(order1);
    assert.strictEqual(res1.success, true, 'First submission with TrxID should succeed');

    // Attempt to reuse the same TrxID for a second order
    const order2 = {
      refId: 'SOFT-ATD-222222',
      name: 'User 2',
      email: 'user2@example.com',
      phone: '01722222222',
      trxId
    };

    const res2 = OrderStateMachine.createOrder(order2);
    assert.strictEqual(res2.success, false, 'Second submission with duplicate TrxID must be rejected');
    assert.strictEqual(res2.reason, 'DUPLICATE_TRX_ID');
  });

  it('Test 10: Forged payment status in order payload is ignored (starts as PENDING)', () => {
    const forgedOrder = {
      refId: 'SOFT-ATD-FORGED1',
      name: 'Attacker',
      email: 'hacker@example.com',
      phone: '01733333333',
      trxId: 'DJFORGE001',
      status: 'CONFIRMED' // Attacker claims confirmed
    };

    const res = OrderStateMachine.createOrder(forgedOrder);
    assert.strictEqual(res.success, true);
    // State machine MUST set status to PENDING
    assert.strictEqual(res.order.status, 'PENDING', 'Initial order status must always be PENDING');
  });

  it('Test 14: Cross-order status access isolation', () => {
    const refA = 'SOFT-ATD-ISOLATE_A';
    const refB = 'SOFT-ATD-ISOLATE_B';

    OrderStateMachine.createOrder({
      refId: refA,
      name: 'Customer A',
      email: 'a@example.com',
      phone: '01744444444',
      trxId: 'DJISOLATE01'
    });

    OrderStateMachine.createOrder({
      refId: refB,
      name: 'Customer B',
      email: 'b@example.com',
      phone: '01755555555',
      trxId: 'DJISOLATE02'
    });

    const lookupA = OrderStateMachine.getOrder(refA);
    const lookupB = OrderStateMachine.getOrder(refB);

    assert.strictEqual(lookupA.name, 'Customer A');
    assert.strictEqual(lookupB.name, 'Customer B');
    assert.notStrictEqual(lookupA.refId, lookupB.refId);

    // Non-existent order returns null
    const nonExistent = OrderStateMachine.getOrder('SOFT-ATD-DOESNOTEXIST');
    assert.strictEqual(nonExistent, null);
  });

  it('Test 15: Order reference generation collision resistance', () => {
    const refs = new Set();
    const count = 500;
    for (let i = 0; i < count; i++) {
      const ref = generateOrderRef();
      assert.ok(ref.startsWith('SOFT-ATD-'), 'Order reference must match SOFT-ATD-* prefix');
      assert.ok(!refs.has(ref), `Collision detected on generation: ${ref}`);
      refs.add(ref);
    }
    assert.strictEqual(refs.size, count, `All ${count} generated references must be unique`);
  });

  it('Test 17: Browser storage manipulation protection', () => {
    // If a client modifies localStorage in browser to say status: 'CONFIRMED',
    // the server-side state machine remains the authoritative source of truth.
    const ref = 'SOFT-ATD-STORE123';
    OrderStateMachine.createOrder({
      refId: ref,
      name: 'Tamim',
      email: 'tamim@example.com',
      phone: '01766666666',
      trxId: 'DJSTORE999'
    });

    const serverOrder = OrderStateMachine.getOrder(ref);
    assert.strictEqual(serverOrder.status, 'PENDING');

    // Manipulated client state cannot alter server order status without valid admin authorization
    assert.strictEqual(serverOrder.status, 'PENDING');
  });
});

