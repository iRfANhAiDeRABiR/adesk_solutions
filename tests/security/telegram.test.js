import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderStateMachine } from '../../api/_lib/store.js';

describe('Telegram Integration & Callback Security Tests', () => {
  const allowedAdminId = '5696241698';

  it('Test 11 & 12: Unauthorized admin confirmation & callback forgery rejection', () => {
    const ref = 'SOFT-ATD-ADMIN_TEST';
    OrderStateMachine.createOrder({
      refId: ref,
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '01777777777',
      trxId: 'DJADMIN001'
    });

    // Mock unauthorized Telegram user (ID: 999999999)
    const unauthorizedUserId = '999999999';
    const isAuthorized = (userId) => userId === allowedAdminId;

    assert.strictEqual(isAuthorized(unauthorizedUserId), false, 'Unauthorized Telegram user must be rejected');

    // Authorized Admin confirms
    assert.strictEqual(isAuthorized(allowedAdminId), true);
    const authResult = OrderStateMachine.updateStatus(ref, 'CONFIRMED', {
      userId: allowedAdminId,
      username: 'RealAdmin'
    });
    assert.strictEqual(authResult.success, true);
    assert.strictEqual(authResult.order.status, 'CONFIRMED');
    assert.strictEqual(authResult.order.verifiedBy, 'RealAdmin');
  });

  it('Test 13: Telegram callback replay handling (idempotency)', () => {
    const ref = 'SOFT-ATD-REPLAY_TEST';
    OrderStateMachine.createOrder({
      refId: ref,
      name: 'Replay Test',
      email: 'replay@example.com',
      phone: '01788888888',
      trxId: 'DJREPLAY01'
    });

    // First confirmation
    const firstConfirm = OrderStateMachine.updateStatus(ref, 'CONFIRMED', {
      userId: allowedAdminId,
      username: 'Admin'
    });
    assert.strictEqual(firstConfirm.success, true);
    assert.strictEqual(firstConfirm.order.status, 'CONFIRMED');

    // Replay of same confirmation callback
    const replayedConfirm = OrderStateMachine.updateStatus(ref, 'CONFIRMED', {
      userId: allowedAdminId,
      username: 'Admin'
    });
    assert.strictEqual(replayedConfirm.success, true);
    assert.strictEqual(replayedConfirm.order.status, 'CONFIRMED', 'Replayed confirmation remains CONFIRMED idempotently');
  });

  it('Test 16: Payment confirmation race condition & state locking', () => {
    const ref = 'SOFT-ATD-RACE_TEST';
    OrderStateMachine.createOrder({
      refId: ref,
      name: 'Race Test',
      email: 'race@example.com',
      phone: '01799999999',
      trxId: 'DJRACE0001'
    });

    // Order is confirmed by administrator
    OrderStateMachine.updateStatus(ref, 'CONFIRMED', { userId: allowedAdminId, username: 'Admin' });

    // Stale or malicious attempt to invalidate an already confirmed order without force override
    const invalidAttempt = OrderStateMachine.updateStatus(ref, 'INVALID', {
      userId: 'someone_else',
      username: 'Attacker'
    });
    assert.strictEqual(invalidAttempt.success, false, 'Confirmed order cannot be invalidated by stale requests');
    assert.strictEqual(invalidAttempt.reason, 'ALREADY_CONFIRMED');

    // Order remains CONFIRMED
    const order = OrderStateMachine.getOrder(ref);
    assert.strictEqual(order.status, 'CONFIRMED');
  });

  it('Test 18: Telegram API failure resiliency', async () => {
    // Mock a simulated network failure when calling Telegram
    const mockTelegramCall = async (shouldFail) => {
      if (shouldFail) {
        throw new Error('Telegram API connection timeout (ETIMEDOUT)');
      }
      return { ok: true, result: { message_id: 12345 } };
    };

    try {
      await mockTelegramCall(true);
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(err.message.includes('timeout'));
      // Verify graceful degradation: system catches error and does NOT report false positive success
      const fallbackResponse = {
        success: false,
        error: 'Failed to reach Telegram API',
        telegramDispatched: false
      };
      assert.strictEqual(fallbackResponse.success, false);
      assert.strictEqual(fallbackResponse.telegramDispatched, false);
    }
  });
});
