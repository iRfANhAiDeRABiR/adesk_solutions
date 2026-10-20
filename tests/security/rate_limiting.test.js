import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../../api/_lib/security.js';
import handlerSubmit from '../../api/order/submit.js';
import handlerVerify from '../../api/order/verify.js';

describe('Rate Limiting & Privacy Security Tests', () => {
  it('Test 19: Server-side sliding-window rate limiting blocks request flooding', () => {
    const testIp = '192.168.1.100';
    const limit = 5;
    const windowMs = 10000;

    // First 5 requests should pass
    for (let i = 0; i < limit; i++) {
      const res = checkRateLimit(`test_${testIp}`, limit, windowMs);
      assert.strictEqual(res.allowed, true, `Request ${i + 1} must be allowed`);
    }

    // 6th request must be rejected
    const blockedRes = checkRateLimit(`test_${testIp}`, limit, windowMs);
    assert.strictEqual(blockedRes.allowed, false, 'Excessive request must be blocked');
    assert.strictEqual(blockedRes.remaining, 0);
    assert.ok(blockedRes.retryAfterMs > 0, 'Must provide retryAfterMs');
  });

  it('Test 20: Privacy and sensitive data leakage prevention in API responses', async () => {
    // Mock response object to inspect output
    const mockRes = () => {
      const res = {
        statusCode: 200,
        headers: {},
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        setHeader(k, v) {
          this.headers[k] = v;
          return this;
        },
        json(data) {
          this.body = data;
          return this;
        }
      };
      return res;
    };

    // 1. Submit with invalid data
    const reqSubmit = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: { name: 'A' } // too short
    };
    const resSubmit = mockRes();
    await handlerSubmit(reqSubmit, resSubmit);

    assert.strictEqual(resSubmit.statusCode, 400);
    const bodyStr = JSON.stringify(resSubmit.body);
    // Ensure no bot token or private API key leaks in error payload
    assert.ok(!bodyStr.includes('8879982228'), 'Must not leak bot ID in error output');
    assert.ok(!bodyStr.includes('bot'), 'Must not leak bot token');
    assert.ok(!bodyStr.includes('AAEg'), 'Must not leak token characters');

    // 2. Verify endpoint without ref
    const reqVerify = {
      method: 'GET',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      query: {}
    };
    const resVerify = mockRes();
    await handlerVerify(reqVerify, resVerify);

    assert.strictEqual(resVerify.statusCode, 400);
    const verifyBodyStr = JSON.stringify(resVerify.body);
    assert.ok(!verifyBodyStr.includes('8879982228'));
  });
});
