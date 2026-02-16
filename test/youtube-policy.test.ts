import test from 'node:test';
import assert from 'node:assert/strict';

import { deriveFinalStatus, shouldSkipStreamUpsert } from '@/lib/services/youtube-policy';

test('deriveFinalStatus returns live only when stream actually started and not ended', () => {
  const start = new Date('2025-01-01T10:00:00Z');
  const end = new Date('2025-01-01T12:00:00Z');

  assert.equal(deriveFinalStatus('live', start, null), 'live');
  assert.equal(deriveFinalStatus('live', null, null), 'none');
  assert.equal(deriveFinalStatus('live', start, end), 'none');
});

test('deriveFinalStatus returns upcoming for scheduled broadcasts', () => {
  assert.equal(deriveFinalStatus('upcoming', null, null), 'upcoming');
});

test('shouldSkipStreamUpsert blocks new VOD records only when retention is disabled', () => {
  assert.equal(shouldSkipStreamUpsert(false, 'none', false), true);
  assert.equal(shouldSkipStreamUpsert(false, 'none', true), false);
  assert.equal(shouldSkipStreamUpsert(true, 'none', false), false);
  assert.equal(shouldSkipStreamUpsert(false, 'live', false), false);
});
