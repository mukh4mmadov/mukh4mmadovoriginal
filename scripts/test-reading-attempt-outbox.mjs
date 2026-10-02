import assert from 'node:assert/strict';
import { enqueueReadingAttempt, flushReadingAttemptOutbox, readFailedReadingAttempts, readReadingAttemptOutbox } from '../src/lib/reading/reading-attempt-outbox.mjs';
import { collectLegacyAttempts } from '../src/lib/reading/legacy-attempt-import.mjs';
import { formatAggregateTime, getHomeMetricsSource, getTashkentTodayRange } from '../src/lib/reading/metrics.mjs';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  key(index) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
}

{
  const storage = new MemoryStorage();
  storage.setItem('reading-attempt-outbox-failed-v1:cap-user', JSON.stringify(Array.from({ length: 100 }, (_, index) => ({ attemptKey: String(index) }))));
  assert.equal(readFailedReadingAttempts(storage, 'cap-user').length, 100);
  enqueueReadingAttempt(storage, 'cap-user', { attemptKey: 'keep-pending-at-cap', passageId: 'sample', durationSeconds: 1, answers: [] });
  await flushReadingAttemptOutbox(storage, 'cap-user', { rpc: async () => ({ data: null, error: { code: 'P0001', message: 'invalid answer' } }) });
  assert.equal(readReadingAttemptOutbox(storage, 'cap-user')[0].attemptKey, 'keep-pending-at-cap');
  assert.equal(readFailedReadingAttempts(storage, 'cap-user').length, 100);
}

const attempt = { attemptKey: 'stable-key', passageId: 'sample', durationSeconds: 30, completedAt: '2026-10-02T09:00:00.000Z', answers: [{ question_id: 'q1' }] };

{
  const storage = new MemoryStorage();
  enqueueReadingAttempt(storage, 'u1', attempt);
  let rpcArgs;
  const result = await flushReadingAttemptOutbox(storage, 'u1', { rpc: async (_name, args) => { rpcArgs = args; return { data: 'id-1', error: null }; } });
  assert.deepEqual(result, { confirmed: 1, pending: 0 });
  assert.equal(rpcArgs.p_completed_at, attempt.completedAt);
}

{
  const storage = new MemoryStorage();
  const middle = { ...attempt, attemptKey: 'invalid-middle' };
  const last = { ...attempt, attemptKey: 'valid-after' };
  enqueueReadingAttempt(storage, 'validation-user', { ...attempt, attemptKey: 'valid-before' });
  enqueueReadingAttempt(storage, 'validation-user', middle);
  enqueueReadingAttempt(storage, 'validation-user', last);
  const sent = [];
  const result = await flushReadingAttemptOutbox(storage, 'validation-user', { rpc: async (_name, args) => {
    sent.push(args.p_attempt_key);
    if (args.p_attempt_key === middle.attemptKey) return { data: null, error: { code: 'P0001', message: 'answers must contain a valid response' } };
    return { data: 'saved', error: null };
  } });
  assert.deepEqual(sent, ['valid-before', 'invalid-middle', 'valid-after']);
  assert.deepEqual(result, { confirmed: 2, pending: 0 });
  assert.equal(readFailedReadingAttempts(storage, 'validation-user')[0].attemptKey, 'invalid-middle');
}
{
  const storage = new MemoryStorage();
  enqueueReadingAttempt(storage, 'transient-user', { ...attempt, attemptKey: 'one' });
  enqueueReadingAttempt(storage, 'transient-user', { ...attempt, attemptKey: 'two' });
  const result = await flushReadingAttemptOutbox(storage, 'transient-user', { rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'function not found' } }) });
  assert.deepEqual(result, { confirmed: 0, pending: 2 });
}
{
  const storage = new MemoryStorage();
  enqueueReadingAttempt(storage, 'locked-user', { ...attempt, attemptKey: 'only-once' });
  let calls = 0;
  let release;
  const client = { rpc: async () => { calls += 1; await new Promise((resolve) => { release = resolve; }); return { data: 'same-row', error: null }; } };
  const first = flushReadingAttemptOutbox(storage, 'locked-user', client);
  const second = flushReadingAttemptOutbox(storage, 'locked-user', client);
  release();
  const both = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.deepEqual(both[0], both[1]);
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

{
  const storage = new MemoryStorage();
  storage.setItem('ielts_progress_sample', JSON.stringify({ slug: 'sample', attemptHistory: [
    { id: '27e68ebc-d297-4cc2-a8ee-05fb1581d015', questionResults: [{ id: 'q1', type: 'multiple-choice', correct: true, selectedAnswer: 'A' }] },
    { id: 'old-aggregate-only' },
  ] }));
  storage.setItem('ielts-reading-sample', JSON.stringify({ answers: {} }));
  const result = collectLegacyAttempts(storage);
  assert.equal(result.importable.length, 1);
  assert.equal(result.importable[0].answers[0].selected_answer, 'A');
  assert.equal(result.notImportable, 1);
}

console.log('PASS: validation poison-pill continuation, transient retention, duplicate confirmation, flush locking, and legacy import filtering');
assert.equal(formatAggregateTime(59), '59s');
assert.equal(formatAggregateTime(90), '2m');
assert.equal(formatAggregateTime(3600), '1h 0m');
const tashkentRange = getTashkentTodayRange(new Date('2026-10-02T10:00:00.000Z'));
assert.equal(new Date(tashkentRange.from).toISOString(), '2026-10-01T19:00:00.000Z');
assert.equal(new Date(tashkentRange.to).toISOString(), '2026-10-02T19:00:00.000Z');
console.log('PASS: aggregate time rounding and Asia/Tashkent day range');
assert.equal(getHomeMetricsSource({ attempts: 0 }, { attempts: 0 }, true), 'local-older');
assert.equal(getHomeMetricsSource({ attempts: 0 }, { attempts: 4 }, true), 'server');
assert.equal(getHomeMetricsSource({ attempts: 0 }, null, true), 'local');
assert.equal(getHomeMetricsSource({ attempts: 0 }, null, false), 'server');
assert.equal(getHomeMetricsSource(null, null, true), 'local');
assert.equal(getHomeMetricsSource({ attempts: 2 }, null, true), 'server');
console.log('PASS: Home distinguishes local history, all-time server history, and unavailable metrics');
