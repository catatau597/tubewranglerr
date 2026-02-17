import test from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../lib/retry';

test('withRetry resolves on first attempt', async () => {
  const value = await withRetry(async () => 'ok', { retries: 1, baseDelayMs: 1, jitterMs: 1 });
  assert.equal(value, 'ok');
});

test('withRetry retries and eventually succeeds', async () => {
  let attempts = 0;
  const value = await withRetry(async () => {
    attempts += 1;
    if (attempts < 3) {
      throw new Error('temporary');
    }
    return 'success';
  }, { retries: 4, baseDelayMs: 1, jitterMs: 1 });

  assert.equal(value, 'success');
  assert.equal(attempts, 3);
});

test('withRetry throws when retries are exhausted', async () => {
  await assert.rejects(
    withRetry(async () => {
      throw new Error('fatal');
    }, { retries: 1, baseDelayMs: 1, jitterMs: 1 }),
    /fatal/
  );
});
