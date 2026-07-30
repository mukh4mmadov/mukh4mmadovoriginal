/**
 * Date helpers for the `YYYY-MM-DD` strings used across storage keys,
 * Supabase date columns and daily-rotation caches.
 */

/** UTC calendar date of `date` as `YYYY-MM-DD`. */
export function toISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/** Today's UTC calendar date as `YYYY-MM-DD`. */
export function todayISODate(): string {
  return toISODate();
}

/** Yesterday's UTC calendar date as `YYYY-MM-DD`. */
export function yesterdayISODate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toISODate(yesterday);
}

/** Calendar date of `date` in the viewer's timezone as `YYYY-MM-DD`. */
export function toLocalISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
