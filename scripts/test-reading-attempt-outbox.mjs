import assert from 'node:assert/strict';
import { enqueueReadingAttempt, flushReadingAttemptOutbox, readReadingAttemptOutbox } from '../src/lib/reading/reading-attempt-outbox.mjs';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
}

const attempt = { attemptKey: 'stable-key', passageId: 'sample', durationSeconds: 30, answers: [{ question_id: 'q1' }] };

{
  const storage = new MemoryStorage();
  enqueueReadingAttempt(storage, 'u1', attempt);
  const result = await flushReadingAttemptOutbox(storage, 'u1', { rpc: async () => ({ data: 'id-1', error: null }) });
  assert.deepEqual(result, { confirmed: 1, pending: 0 });
}
{
  const storage = new MemoryStorage();
  enqueueReadingAttempt(storage, 'u1', attempt);
  const result = await flushReadingAttemptOutbox(storage, 'u1', { rpc: async () => ({ data: null, error: new Error('offline') }) });
  assert.deepEqual(result, { confirmed: 0, pending: 1 });
}
{
  const storage = new MemoryStorage();
  enqueueReadingAttempt(storage, 'u1', attempt);
  const result = await flushReadingAttemptOutbox(storage, 'u1', { rpc: async () => ({ data: 'existing-id', error: null }) });
  assert.deepEqual(result, { confirmed: 1, pending: 0 });
}
{
  const storage = new MemoryStorage();
  enqueueReadingAttempt(storage, 'u1', attempt);
  await flushReadingAttemptOutbox(storage, 'u1', { rpc: async () => ({ data: null, error: { code: '42883', message: 'function missing' } }) });
  assert.equal(readReadingAttemptOutbox(storage, 'u1').length, 1);
}

console.log('PASS: outbox success, offline retention, duplicate confirmation, and missing-function retention');
