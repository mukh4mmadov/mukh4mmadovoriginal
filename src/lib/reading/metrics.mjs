function zonedParts(date, timeZone) {
  const values = new Map(new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
  }).formatToParts(date).map((part) => [part.type, Number(part.value)]));
  return { year: values.get('year'), month: values.get('month'), day: values.get('day'), hour: values.get('hour'), minute: values.get('minute'), second: values.get('second') };
}

function zonedMidnightUtc(year, month, day, timeZone) {
  const targetWallTime = Date.UTC(year, month - 1, day);
  let candidate = targetWallTime;
  for (let index = 0; index < 3; index += 1) {
    const parts = zonedParts(new Date(candidate), timeZone);
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    candidate += targetWallTime - represented;
  }
  return candidate;
}

export function getTashkentTodayRange(now = new Date()) {
  const { year, month, day } = zonedParts(now, 'Asia/Tashkent');
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    from: new Date(zonedMidnightUtc(year, month, day, 'Asia/Tashkent')).toISOString(),
    to: new Date(zonedMidnightUtc(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, nextDate.getUTCDate(), 'Asia/Tashkent')).toISOString(),
  };
}

export function formatAggregateTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  if (safeSeconds < 60) return `${safeSeconds}s`;
  const totalMinutes = Math.round(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${totalMinutes}m`;
}

export function getHomeMetricsSource(todayMetrics, allTimeMetrics, hasLocalAttemptHistory) {
  if (!todayMetrics) return 'local';
  if (todayMetrics.attempts > 0 || !hasLocalAttemptHistory) return 'server';
  if (!allTimeMetrics) return 'local';
  return allTimeMetrics.attempts > 0 ? 'server' : 'local-older';
}

export async function getMyReadingMetrics(client, from, to) {
  if (!client?.rpc) return null;
  try {
    const { data, error } = await client.rpc('get_my_reading_metrics', { p_from: from, p_to: to });
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      attempts: Number(row.attempts) || 0,
      question_exposures: Number(row.question_exposures) || 0,
      answered: Number(row.answered) || 0,
      correct: Number(row.correct) || 0,
      accuracy_percent: Number(row.accuracy_percent) || 0,
      total_seconds: Number(row.total_seconds) || 0,
      highlights_count: row.highlights_count == null ? null : Number(row.highlights_count) || 0,
    };
  } catch {
    return null;
  }
}
