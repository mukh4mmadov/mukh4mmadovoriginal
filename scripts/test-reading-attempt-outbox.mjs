import assert from 'node:assert/strict';
import { enqueueReadingAttempt, flushReadingAttemptOutbox, readReadingAttemptOutbox } from '../src/lib/reading/reading-attempt-outbox.mjs';
import { collectLegacyAttempts } from '../src/lib/reading/legacy-attempt-import.mjs';
import { formatAggregateTime, getTashkentTodayRange } from '../src/lib/reading/metrics.mjs';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  key(index) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
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

console.log('PASS: outbox success, offline retention, duplicate confirmation, missing-function retention, and legacy import filtering');
assert.equal(formatAggregateTime(59), '59s');
assert.equal(formatAggregateTime(90), '2m');
assert.equal(formatAggregateTime(3600), '1h 0m');
const tashkentRange = getTashkentTodayRange(new Date('2026-10-02T10:00:00.000Z'));
assert.equal(new Date(tashkentRange.from).toISOString(), '2026-10-01T19:00:00.000Z');
assert.equal(new Date(tashkentRange.to).toISOString(), '2026-10-02T19:00:00.000Z');
console.log('PASS: aggregate time rounding and Asia/Tashkent day range');
