import { readingProgressRepository } from '@/lib/supabase/repositories';

const LOCAL_STORAGE_PREFIX = 'ielts_progress_';

function readStoredProgress(key) {
  if (typeof window === "undefined") return null;
  const data = window.localStorage.getItem(key);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      slug: parsed.slug ?? key.replace(LOCAL_STORAGE_PREFIX, ""),
      completed: Boolean(parsed.completed),
      bestScore: Number(parsed.bestScore) || 0,
      lastScore: Number.isFinite(Number(parsed.lastScore)) ? Number(parsed.lastScore) : Number(parsed.bestScore) || 0,
      attempts: Number(parsed.attempts) || 0,
      lastAttempt: Number(parsed.lastAttempt) || 0,
      totalTime: Number(parsed.totalTime) || 0,
      attemptHistory: Array.isArray(parsed.attemptHistory) ? parsed.attemptHistory : [],
    };
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

async function getSupabaseProgress(userId, slug) {
  try {
    const data = await readingProgressRepository.getProgress(userId, slug);
    if (!data) return null;

    const bestScoreEntry = data.answers?.find((a) => a?.type === '_best_score');
    const bestScore = bestScoreEntry?.value ?? (data.answers?.filter((a) => a?.isCorrect === true).length || 0);
    const lastScoreEntry = data.answers?.find((entry) => entry?.type === '_last_score');
    const attemptHistoryEntry = data.answers?.find((entry) => entry?.type === '_attempt_history');
    const attemptCountEntry = data.answers?.find((entry) => entry?.type === '_attempt_count');

    return {
      slug: data.passage_id,
      completed: data.is_completed,
      bestScore,
      lastScore: lastScoreEntry ? Number(lastScoreEntry.value) || 0 : bestScore,
      attempts: Number(attemptCountEntry?.value) || (data.is_completed ? 1 : 0),
      lastAttempt: new Date(data.updated_at).getTime(),
      totalTime: data.time_spent_seconds,
      attemptHistory: Array.isArray(attemptHistoryEntry?.value) ? attemptHistoryEntry.value : [],
    };
  } catch (error) {
    console.error('Error fetching Supabase progress:', error);
    return null;
  }
}

async function saveSupabaseProgress(userId, slug, progress) {
  try {
    const existing = await readingProgressRepository.getProgress(userId, slug);
    const existingAnswers = existing?.answers ?? [];
    const storedHistory = existingAnswers.find((entry) => entry?.type === '_attempt_history')?.value;
    const mergedHistory = new Map();
    [...(Array.isArray(storedHistory) ? storedHistory : []), ...(progress.attemptHistory || [])].forEach((attempt) => {
      if (attempt?.id) mergedHistory.set(attempt.id, attempt);
    });
    const filtered = existingAnswers.filter((a) => a?.type !== '_best_score' && a?.type !== '_last_score' && a?.type !== '_attempt_history' && a?.type !== '_attempt_count');
    const mergedAnswers = [
      ...filtered,
      { type: '_best_score', value: progress.bestScore },
      { type: '_last_score', value: progress.lastScore },
      { type: '_attempt_count', value: progress.attempts || 0 },
      { type: '_attempt_history', value: [...mergedHistory.values()].slice(-100) },
    ];

    await readingProgressRepository.upsertProgress(userId, slug, {
      current_question_index: 0,
      answers: mergedAnswers,
      time_spent_seconds: progress.totalTime,
      is_completed: progress.completed,
    });
  } catch (error) {
    console.error('Error saving Supabase progress:', error);
    throw error;
  }
}

export async function getProgress(slug, userId) {
  const localProgress = readStoredProgress(`${LOCAL_STORAGE_PREFIX}${slug}`);

  if (userId) {
    const supabaseProgress = await getSupabaseProgress(userId, slug);
    if (supabaseProgress) {
      const attempts = new Map();
      [...(supabaseProgress.attemptHistory || []), ...(localProgress?.attemptHistory || [])].forEach((attempt) => {
        if (attempt?.id) attempts.set(attempt.id, attempt);
      });
      return {
        ...supabaseProgress,
        bestScore: Math.max(supabaseProgress.bestScore, localProgress?.bestScore || 0),
        lastScore: localProgress?.lastAttempt > supabaseProgress.lastAttempt
          ? localProgress.lastScore
          : supabaseProgress.lastScore,
        attempts: Math.max(supabaseProgress.attempts || 0, localProgress?.attempts || 0),
        attemptHistory: [...attempts.values()].sort((first, second) => first.timestamp - second.timestamp).slice(-100),
      };
    }
  }

  return localProgress;
}

export async function saveProgress(
  slug,
  progress,
  userId,
) {
  const existing = await getProgress(slug, userId) || {
    slug,
    completed: false,
    bestScore: 0,
    attempts: 0,
    lastAttempt: 0,
    totalTime: 0,
  };

  const { questionAttempt, ...progressFields } = progress;
  const attemptHistory = [...(existing.attemptHistory || [])];
  if (questionAttempt?.id) attemptHistory.push(questionAttempt);

  const updated = {
    ...existing,
    ...progressFields,
    bestScore: Math.max(existing.bestScore || 0, Number(progressFields.bestScore) || 0),
    lastScore: Number(progressFields.bestScore) || 0,
    attempts: questionAttempt ? (existing.attempts || 0) + 1 : progress.attempts ?? existing.attempts ?? 0,
    attemptHistory: attemptHistory.slice(-100),
    lastAttempt: Date.now(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      `${LOCAL_STORAGE_PREFIX}${slug}`,
      JSON.stringify(updated),
    );
  }

  if (userId && typeof window !== 'undefined' && navigator.onLine) {
    try {
      await saveSupabaseProgress(userId, slug, updated);
    } catch (error) {
      console.error('Failed to sync to Supabase, data saved locally:', error);
    }
  }
}

export function saveAttemptLocally(slug, progress) {
  if (typeof window === 'undefined') return null;
  const key = `${LOCAL_STORAGE_PREFIX}${slug}`;
  let existing = readStoredProgress(key) || {
    slug, completed: false, bestScore: 0, lastScore: 0, attempts: 0,
    lastAttempt: 0, totalTime: 0, attemptHistory: [],
  };
  const attempt = progress.questionAttempt;
  const history = [...(existing.attemptHistory || [])];
  if (attempt?.id && !history.some((item) => item?.id === attempt.id)) history.push(attempt);
  const updated = {
    ...existing,
    completed: true,
    bestScore: Math.max(Number(existing.bestScore) || 0, Number(progress.bestScore) || 0),
    lastScore: Number(progress.bestScore) || 0,
    attempts: (Number(existing.attempts) || 0) + (attempt ? 1 : 0),
    totalTime: Number(progress.totalTime) || 0,
    attemptHistory: history.slice(-100),
    lastAttempt: attempt?.timestamp || Date.now(),
  };
  window.localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export async function getAllProgress(userId) {
  if (userId) {
    try {
      const supabaseData = await readingProgressRepository.getAllProgress(userId);
      if (supabaseData && supabaseData.length > 0) {
        return supabaseData.map((data) => {
          const slug = data.passage_id;
          const localProgress = readStoredProgress(`${LOCAL_STORAGE_PREFIX}${slug}`);
          const bestScoreEntry = data.answers?.find((a) => a?.type === '_best_score');
          const supabaseBestScore =
            bestScoreEntry?.value ?? (data.answers?.filter((a) => a?.isCorrect === true).length || 0);
          const lastScoreEntry = data.answers?.find((entry) => entry?.type === '_last_score');
          const supabaseLastScore = lastScoreEntry ? Number(lastScoreEntry.value) || 0 : supabaseBestScore;

          return {
            slug,
            completed: data.is_completed,
            bestScore:
              localProgress && localProgress.bestScore > supabaseBestScore
                ? localProgress.bestScore
                : supabaseBestScore,
            lastScore: localProgress?.lastAttempt > new Date(data.updated_at).getTime()
              ? localProgress.lastScore
              : supabaseLastScore,
            lastAttempt: new Date(data.updated_at).getTime(),
            totalTime: data.time_spent_seconds,
            attempts: Math.max(
              Number(data.answers?.find((entry) => entry?.type === '_attempt_count')?.value) || 0,
              localProgress?.attempts || 0,
            ),
            attemptHistory: (() => {
              const remoteHistory = data.answers?.find((entry) => entry?.type === '_attempt_history')?.value;
              const mergedHistory = new Map();
              [...(Array.isArray(remoteHistory) ? remoteHistory : []), ...(localProgress?.attemptHistory || [])].forEach((attempt) => {
                if (attempt?.id) mergedHistory.set(attempt.id, attempt);
              });
              return [...mergedHistory.values()].sort((first, second) => first.timestamp - second.timestamp).slice(-100);
            })(),
          };
        });
      }
    } catch (error) {
      console.error('Error fetching Supabase progress:', error);
    }
  }

  if (typeof window === "undefined") return [];
  try {
    const keys = Object.keys(window.localStorage).filter((key) =>
      key.startsWith(LOCAL_STORAGE_PREFIX),
    );
    return keys
      .map((key) => readStoredProgress(key))
      .filter(Boolean);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

export async function resetProgress(slug, userId) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${slug}`);
  }

  if (userId) {
    try {
      const progress = await readingProgressRepository.getProgress(userId, slug);
      if (progress) {
        await readingProgressRepository.deleteProgress(progress.id);
      }
    } catch (error) {
      console.error('Error deleting Supabase progress:', error);
    }
  }
}
