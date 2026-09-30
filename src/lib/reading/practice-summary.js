const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(timestamp) {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

function sessionTimestamps(progressBySlug) {
  const timestamps = [];
  Object.values(progressBySlug || {}).forEach((progress) => {
    const history = Array.isArray(progress?.attemptHistory) ? progress.attemptHistory : [];
    history.forEach((attempt) => {
      const timestamp = Number(attempt?.timestamp);
      if (Number.isFinite(timestamp) && timestamp > 0) timestamps.push(timestamp);
    });
    if (history.length === 0 && Number(progress?.attempts) > 0 && Number(progress?.lastAttempt) > 0) {
      timestamps.push(Number(progress.lastAttempt));
    }
  });
  return timestamps;
}

function getStreak(dateKeys, todayKey) {
  if (dateKeys.length === 0) return 0;
  const dates = [...new Set(dateKeys)].sort();
  const latest = dates[dates.length - 1];
  const age = Math.round((Date.parse(`${todayKey}T00:00:00Z`) - Date.parse(`${latest}T00:00:00Z`)) / DAY_MS);
  if (age > 2 || age < 0) return 0;

  let current = 1;
  let graceDayUsed = false;
  for (let index = dates.length - 1; index > 0; index -= 1) {
    const gap = Math.round((Date.parse(`${dates[index]}T00:00:00Z`) - Date.parse(`${dates[index - 1]}T00:00:00Z`)) / DAY_MS);
    if (gap === 1) {
      current += 1;
    } else if (gap === 2 && !graceDayUsed) {
      current += 1;
      graceDayUsed = true;
    } else {
      break;
    }
  }
  return current;
}

export function getPracticeSummary(progressBySlug, now = Date.now()) {
  const today = dayKey(now);
  const dateKeys = sessionTimestamps(progressBySlug).map(dayKey).filter(Boolean);
  const timestamp = new Date(now);
  timestamp.setUTCHours(0, 0, 0, 0);
  const weekStart = timestamp.getTime() - 6 * DAY_MS;
  const weeklyDates = new Set(
    sessionTimestamps(progressBySlug)
      .filter((sessionTime) => sessionTime >= weekStart && sessionTime <= now)
      .map(dayKey)
      .filter(Boolean),
  );

  return {
    todayCompleted: dateKeys.includes(today),
    weeklySessions: weeklyDates.size,
    currentStreak: getStreak(dateKeys, today),
    totalPracticeDays: new Set(dateKeys).size,
  };
}

export function getQuestionTypeAccuracy(progressBySlug) {
  const totals = {};
  Object.values(progressBySlug || {}).forEach((progress) => {
    (Array.isArray(progress?.attemptHistory) ? progress.attemptHistory : []).forEach((attempt) => {
      (Array.isArray(attempt?.questionResults) ? attempt.questionResults : []).forEach((result) => {
        if (!result?.type) return;
        totals[result.type] ||= { correct: 0, total: 0 };
        totals[result.type].total += 1;
        if (result.correct) totals[result.type].correct += 1;
      });
    });
  });

  return Object.entries(totals)
    .map(([type, counts]) => ({
      type,
      correct: counts.correct,
      total: counts.total,
      accuracy: counts.total ? counts.correct / counts.total : 0,
    }))
    .filter((item) => item.total >= 3)
    .sort((first, second) => first.accuracy - second.accuracy || second.total - first.total);
}
