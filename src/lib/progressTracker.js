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
      attempts: Number(parsed.attempts) || 0,
      lastAttempt: Number(parsed.lastAttempt) || 0,
      totalTime: Number(parsed.totalTime) || 0,
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

    return {
      slug: data.passage_id,
      completed: data.is_completed,
      bestScore,
      attempts: 1,
      lastAttempt: new Date(data.updated_at).getTime(),
      totalTime: data.time_spent_seconds,
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
    const filtered = existingAnswers.filter((a) => a?.type !== '_best_score');
    const mergedAnswers = [...filtered, { type: '_best_score', value: progress.bestScore }];

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
      if (localProgress && localProgress.bestScore > supabaseProgress.bestScore) {
        return { ...supabaseProgress, bestScore: localProgress.bestScore };
      }
      return supabaseProgress;
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

  const updated = {
    ...existing,
    ...progress,
    lastAttempt: Date.now(),
  };

  // Save to localStorage for offline support
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      `${LOCAL_STORAGE_PREFIX}${slug}`,
      JSON.stringify(updated),
    );
  }

  // Sync to Supabase if user is authenticated and online
  if (userId && typeof window !== 'undefined' && navigator.onLine) {
    try {
      await saveSupabaseProgress(userId, slug, updated);
    } catch (error) {
      console.error('Failed to sync to Supabase, data saved locally:', error);
    }
  }
}

export async function getAllProgress(userId) {
  // Try Supabase first if user is authenticated
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

          return {
            slug,
            completed: data.is_completed,
            bestScore:
              localProgress && localProgress.bestScore > supabaseBestScore
                ? localProgress.bestScore
                : supabaseBestScore,
            attempts: 1,
            lastAttempt: new Date(data.updated_at).getTime(),
            totalTime: data.time_spent_seconds,
          };
        });
      }
    } catch (error) {
      console.error('Error fetching Supabase progress:', error);
    }
  }
  
  // Fallback to localStorage
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
  // Remove from localStorage
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${slug}`);
  }

  // Remove from Supabase if user is authenticated
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
