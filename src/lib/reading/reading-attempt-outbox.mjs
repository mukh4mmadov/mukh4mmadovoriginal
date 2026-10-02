export const READING_ATTEMPT_OUTBOX_PREFIX = 'reading-attempt-outbox-v1:';

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

export async function flushReadingAttemptOutbox(storage, userId, client) {
  if (!storage || !userId || !client?.rpc) return { confirmed: 0, pending: readReadingAttemptOutbox(storage, userId).length };
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
      });
      if (error || !data) break;
      const current = readReadingAttemptOutbox(storage, userId).filter((item) => item.attemptKey !== attempt.attemptKey);
      storage.setItem(key, JSON.stringify(current));
      confirmed += 1;
    } catch {
      break;
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
