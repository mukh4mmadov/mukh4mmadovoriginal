export interface TestProgress {
  slug: string;
  completed: boolean;
  bestScore: number;
  attempts: number;
  lastAttempt: number;
  totalTime: number;
}

function readStoredProgress(key: string): TestProgress | null {
  if (typeof window === "undefined") return null;
  const data = window.localStorage.getItem(key);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as Partial<TestProgress>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      slug: parsed.slug ?? key.replace("ielts_progress_", ""),
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

export function getProgress(slug: string): TestProgress | null {
  return readStoredProgress(`ielts_progress_${slug}`);
}

export function saveProgress(
  slug: string,
  progress: Partial<TestProgress>,
): void {
  if (typeof window === "undefined") return;
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

  window.localStorage.setItem(
    `ielts_progress_${slug}`,
    JSON.stringify(updated),
  );
}

export function getAllProgress(): TestProgress[] {
  if (typeof window === "undefined") return [];
  const keys = Object.keys(window.localStorage).filter((key) =>
    key.startsWith("ielts_progress_"),
  );
  return keys
    .map((key) => readStoredProgress(key))
    .filter(Boolean) as TestProgress[];
}

export function resetProgress(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`ielts_progress_${slug}`);
}
