import { enqueueReadingAttempt } from './reading-attempt-outbox.mjs';

export const LEGACY_ATTEMPT_CONSENT_PREFIX = 'reading-attempt-import-consent-v1:';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function collectLegacyAttempts(storage) {
  const importable = [];
  let notImportable = 0;
  if (!storage) return { importable, notImportable };
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith('ielts_progress_')) continue;
    try {
      const progress = JSON.parse(storage.getItem(key));
      const slug = progress?.slug || key.slice('ielts_progress_'.length);
      for (const attempt of Array.isArray(progress?.attemptHistory) ? progress.attemptHistory : []) {
        const rows = attempt?.questionResults;
        if (!UUID_PATTERN.test(attempt?.id || '') || !Array.isArray(rows) || rows.length === 0 || rows.some((row) => !row?.id || !row?.type || typeof row.correct !== 'boolean')) {
          notImportable += 1;
          continue;
        }
        importable.push({
          attemptKey: attempt.id,
          passageId: slug,
          durationSeconds: Math.max(0, Math.min(7200, Number.isFinite(Number(attempt.durationSeconds ?? attempt.timeSpentSeconds)) ? Number(attempt.durationSeconds ?? attempt.timeSpentSeconds) : 0)),
          answers: rows.map((row) => ({
            question_id: String(row.id),
            question_type: String(row.type),
            selected_answer: typeof row.selectedAnswer === 'string' ? row.selectedAnswer : null,
            is_correct: row.correct,
          })),
        });
      }
    } catch {
      notImportable += 1;
    }
  }
  return { importable, notImportable };
}

export function rememberLegacyAttemptChoice(storage, userId, choice) {
  if (!storage || !userId || !['yes', 'no'].includes(choice)) return;
  storage.setItem(`${LEGACY_ATTEMPT_CONSENT_PREFIX}${userId}`, choice);
}

export function queueLegacyAttempts(storage, userId, attempts) {
  return attempts.reduce((count, attempt) => count + (enqueueReadingAttempt(storage, userId, attempt) ? 1 : 0), 0);
}
