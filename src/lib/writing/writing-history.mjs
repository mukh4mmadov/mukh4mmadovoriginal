export const WRITING_HISTORY_KEY = "ielts-writing-results-v1";
const MAX_LOCAL = 20;

export const writingDraftKey = (slug) => `ielts-writing-draft-${slug}`;

export function readWritingHistory(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(WRITING_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.taskSlug) : [];
  } catch {
    return [];
  }
}

export function saveWritingResultLocally(storage, result) {
  const next = [result, ...readWritingHistory(storage).filter((item) => item.id !== result.id)].slice(0, MAX_LOCAL);
  try {
    storage?.setItem(WRITING_HISTORY_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function fromSubmissionRow(row) {
  return {
    id: row.id,
    taskSlug: row.task_slug,
    taskNumber: row.task_number,
    essay: row.essay,
    wordCount: row.word_count,
    timeSpentSeconds: row.time_spent_seconds,
    overall: row.overall_band == null ? null : Number(row.overall_band),
    feedback: row.feedback,
    createdAt: row.created_at,
  };
}

export function mergeWritingHistory(...lists) {
  const merged = new Map();
  lists.flat().forEach((item) => {
    if (item?.id && item?.taskSlug) merged.set(item.id, item);
  });
  return [...merged.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function summarizeWritingHistory(history) {
  const byTask = new Map();
  history.forEach((item) => {
    const current = byTask.get(item.taskSlug) || { attempts: 0, best: null, last: null };
    current.attempts += 1;
    if (item.overall != null && (current.best == null || item.overall > current.best)) current.best = item.overall;
    if (!current.last || String(item.createdAt) > String(current.last.createdAt)) current.last = item;
    byTask.set(item.taskSlug, current);
  });
  return byTask;
}
