export interface TestProgress {
  slug: string;
  completed: boolean;
  bestScore: number;
  attempts: number;
  lastAttempt: number;
  totalTime: number;
}

export function getProgress(slug: string): TestProgress | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(`ielts_progress_${slug}`);
  return data ? JSON.parse(data) : null;
}

export function saveProgress(slug: string, progress: Partial<TestProgress>): void {
  if (typeof window === 'undefined') return;
  const existing = getProgress(slug) || {
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
  
  localStorage.setItem(`ielts_progress_${slug}`, JSON.stringify(updated));
}

export function getAllProgress(): TestProgress[] {
  if (typeof window === 'undefined') return [];
  const keys = Object.keys(localStorage).filter(key => key.startsWith('ielts_progress_'));
  return keys.map(key => JSON.parse(localStorage.getItem(key) || '{}'));
}

export function resetProgress(slug: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`ielts_progress_${slug}`);
}
