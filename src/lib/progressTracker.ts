import { readingProgressRepository } from '@/lib/supabase/repositories';

export interface TestProgress {
  slug: string;
  completed: boolean;
  bestScore: number;
  attempts: number;
  lastAttempt: number;
  totalTime: number;
}

const LOCAL_STORAGE_PREFIX = 'ielts_progress_';

function readStoredProgress(key: string): TestProgress | null {
  if (typeof window === "undefined") return null;
  const data = window.localStorage.getItem(key);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as Partial<TestProgress>;
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

async function getSupabaseProgress(userId: string, slug: string): Promise<TestProgress | null> {
  try {
    const data = await readingProgressRepository.getProgress(userId, slug);
    if (!data) return null;

    const bestScoreEntry = data.answers?.find((a: any) => a?.type === '_best_score');
    const bestScore = bestScoreEntry?.value ?? (data.answers?.filter((a: any) => a?.isCorrect === true).length || 0);

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

async function saveSupabaseProgress(userId: string, slug: string, progress: TestProgress): Promise<void> {
  try {
    const existing = await readingProgressRepository.getProgress(userId, slug);
    const existingAnswers = existing?.answers ?? [];
    const filtered = existingAnswers.filter((a: any) => a?.type !== '_best_score');
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

export async function getProgress(slug: string, userId?: string): Promise<TestProgress | null> {
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
  slug: string,
  progress: Partial<TestProgress>,
  userId?: string,
): Promise<void> {
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

export async function getAllProgress(userId?: string): Promise<TestProgress[]> {
  // Try Supabase first if user is authenticated
  if (userId) {
    try {
      const supabaseData = await readingProgressRepository.getAllProgress(userId);
      if (supabaseData.length > 0) {
        return supabaseData.map((data: any) => {
          const slug = data.passage_id;
          const localProgress = readStoredProgress(`${LOCAL_STORAGE_PREFIX}${slug}`);
          const bestScoreEntry = data.answers?.find((a: any) => a?.type === '_best_score');
          const supabaseBestScore =
            bestScoreEntry?.value ?? (data.answers?.filter((a: any) => a?.isCorrect === true).length || 0);

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
  const keys = Object.keys(window.localStorage).filter((key) =>
    key.startsWith(LOCAL_STORAGE_PREFIX),
  );
  return keys
    .map((key) => readStoredProgress(key))
    .filter(Boolean) as TestProgress[];
}

export async function resetProgress(slug: string, userId?: string): Promise<void> {
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
