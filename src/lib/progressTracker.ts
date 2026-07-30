import { readingProgressRepository } from '@/lib/supabase/repositories';
import { keysWithPrefix, readJSON, removeKey, writeJSON } from '@/lib/storage';

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
  const parsed = readJSON<Partial<TestProgress>>(key);
  if (!parsed || typeof parsed !== "object") return null;

  return {
    slug: parsed.slug ?? key.replace(LOCAL_STORAGE_PREFIX, ""),
    completed: Boolean(parsed.completed),
    bestScore: Number(parsed.bestScore) || 0,
    attempts: Number(parsed.attempts) || 0,
    lastAttempt: Number(parsed.lastAttempt) || 0,
    totalTime: Number(parsed.totalTime) || 0,
  };
}

function toTestProgress(row: any): TestProgress {
  return {
    slug: row.passage_id,
    completed: row.is_completed,
    bestScore: row.answers?.filter((a: any) => a.isCorrect).length || 0,
    attempts: 1,
    lastAttempt: new Date(row.updated_at).getTime(),
    totalTime: row.time_spent_seconds,
  };
}

async function getSupabaseProgress(userId: string, slug: string): Promise<TestProgress | null> {
  try {
    const data = await readingProgressRepository.getProgress(userId, slug);
    if (!data) return null;

    return toTestProgress(data);
  } catch (error) {
    console.error('Error fetching Supabase progress:', error);
    return null;
  }
}

async function saveSupabaseProgress(userId: string, slug: string, progress: TestProgress): Promise<void> {
  try {
    await readingProgressRepository.upsertProgress(userId, slug, {
      current_question_index: 0,
      answers: [],
      time_spent_seconds: progress.totalTime,
      is_completed: progress.completed,
    });
  } catch (error) {
    console.error('Error saving Supabase progress:', error);
    throw error;
  }
}

export async function getProgress(slug: string, userId?: string): Promise<TestProgress | null> {
  // Try Supabase first if user is authenticated
  if (userId) {
    const supabaseProgress = await getSupabaseProgress(userId, slug);
    if (supabaseProgress) return supabaseProgress;
  }
  
  // Fallback to localStorage
  return readStoredProgress(`${LOCAL_STORAGE_PREFIX}${slug}`);
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
  writeJSON(`${LOCAL_STORAGE_PREFIX}${slug}`, updated);

  // Sync to Supabase if user is authenticated and online
  if (userId && navigator.onLine) {
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
        return supabaseData.map(toTestProgress);
      }
    } catch (error) {
      console.error('Error fetching Supabase progress:', error);
    }
  }
  
  // Fallback to localStorage
  return keysWithPrefix(LOCAL_STORAGE_PREFIX)
    .map((key) => readStoredProgress(key))
    .filter(Boolean) as TestProgress[];
}

export async function resetProgress(slug: string, userId?: string): Promise<void> {
  // Remove from localStorage
  removeKey(`${LOCAL_STORAGE_PREFIX}${slug}`);

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
