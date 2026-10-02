export const READING_ATTEMPT_OUTBOX_PREFIX = 'reading-attempt-outbox-v1:';
export const READING_ATTEMPT_OUTBOX_FAILED_PREFIX = 'reading-attempt-outbox-failed-v1:';
export const READING_ATTEMPT_OUTBOX_FAILED_LIMIT = 100;
const flushLocks = new Map();

export function readFailedReadingAttempts(storage, userId) {
  if (!storage || !userId) return [];
  try {
    const value = JSON.parse(storage.getItem(`${READING_ATTEMPT_OUTBOX_FAILED_PREFIX}${userId}`) || '[]');
    return Array.isArray(value) ? value.slice(-READING_ATTEMPT_OUTBOX_FAILED_LIMIT) : [];
  } catch {
    return [];
  }
}

export function isReadingAttemptValidationError(error) {
  const code = String(error?.code || '');
  const status = Number(error?.status || error?.statusCode || 0);
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  if (/auth|sign in|permission|forbidden|admin access/.test(message)) return false;
  if (['42883', '42P01', '42501', 'PGRST202', 'PGRST205', 'PGRST301'].includes(code)) return false;
  if (status === 401 || status === 403 || status >= 500) return false;
  if (code === 'P0001') return true;
  return status === 400 && /answer|duration|attempt key|question|passage|limit|invalid|must be|required|exceeds/.test(message);
}

export function readReadingAttemptOutbox(storage, userId) {
  if (!storage || !userId) return [];
  try {
    const value = JSON.parse(storage.getItem(`${READING_ATTEMPT_OUTBOX_PREFIX}${userId}`) || '[]');
    return Array.isArray(value) ? value.filter((item) => item?.attemptKey && Array.isArray(item.answers)) : [];
  } catch {
    return [];
  }
}

export function enqueueReadingAttempt(storage, userId, attempt) {
  if (!storage || !userId || !attempt?.attemptKey) return false;
  const key = `${READING_ATTEMPT_OUTBOX_PREFIX}${userId}`;
  const queue = readReadingAttemptOutbox(storage, userId);
  if (!queue.some((item) => item.attemptKey === attempt.attemptKey)) queue.push(attempt);
  try {
    storage.setItem(key, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

export function flushReadingAttemptOutbox(storage, userId, client) {
  if (!storage || !userId || !client?.rpc) return { confirmed: 0, pending: readReadingAttemptOutbox(storage, userId).length };
  if (flushLocks.has(userId)) return flushLocks.get(userId);
  const task = flushReadingAttemptOutboxUnlocked(storage, userId, client);
  flushLocks.set(userId, task);
  return task.finally(() => {
    if (flushLocks.get(userId) === task) flushLocks.delete(userId);
  });
}

async function flushReadingAttemptOutboxUnlocked(storage, userId, client) {
  const key = `${READING_ATTEMPT_OUTBOX_PREFIX}${userId}`;
  const queue = readReadingAttemptOutbox(storage, userId);
  let confirmed = 0;
  for (const attempt of queue) {
    try {
      const { data, error } = await client.rpc('submit_reading_attempt', {
        p_attempt_key: attempt.attemptKey,
        p_passage_id: attempt.passageId,
        p_duration_seconds: attempt.durationSeconds,
        p_answers: attempt.answers,
        ...(attempt.completedAt ? { p_completed_at: attempt.completedAt } : {}),
      });
      if (error || !data) {
        if (!error || !isReadingAttemptValidationError(error)) break;
        const failedKey = `${READING_ATTEMPT_OUTBOX_FAILED_PREFIX}${userId}`;
        const failures = readFailedReadingAttempts(storage, userId);
        if (failures.length >= READING_ATTEMPT_OUTBOX_FAILED_LIMIT) break;
        failures.push({ ...attempt, failure: { code: error.code || null, message: error.message || 'Attempt validation failed' } });
        try {
          storage.setItem(failedKey, JSON.stringify(failures));
          const current = readReadingAttemptOutbox(storage, userId).filter((item) => item.attemptKey !== attempt.attemptKey);
          storage.setItem(key, JSON.stringify(current));
        } catch {
          break;
        }
        continue;
      }
      const current = readReadingAttemptOutbox(storage, userId).filter((item) => item.attemptKey !== attempt.attemptKey);
      storage.setItem(key, JSON.stringify(current));
      confirmed += 1;
    } catch (error) {
      if (!isReadingAttemptValidationError(error)) break;
      const failedKey = `${READING_ATTEMPT_OUTBOX_FAILED_PREFIX}${userId}`;
      const failures = readFailedReadingAttempts(storage, userId);
      if (failures.length >= READING_ATTEMPT_OUTBOX_FAILED_LIMIT) break;
      failures.push({ ...attempt, failure: { code: error.code || null, message: error.message || 'Attempt validation failed' } });
      try {
        storage.setItem(failedKey, JSON.stringify(failures));
        const current = readReadingAttemptOutbox(storage, userId).filter((item) => item.attemptKey !== attempt.attemptKey);
        storage.setItem(key, JSON.stringify(current));
      } catch {
        break;
      }
    }
  }
  return { confirmed, pending: readReadingAttemptOutbox(storage, userId).length };
}

export function makeAttemptUuid(cryptoObject = globalThis.crypto) {
  if (typeof cryptoObject?.randomUUID === 'function') return cryptoObject.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof cryptoObject?.getRandomValues === 'function') cryptoObject.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((byte, index) => `${[4, 6, 8, 10].includes(index) ? '-' : ''}${byte.toString(16).padStart(2, '0')}`).join('');
}
