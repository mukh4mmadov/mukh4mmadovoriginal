// Daily missions: four small goals a day, measured from practice the site
// already records in this browser.

export const MISSIONS_KEY = "ielts-daily-missions-v2";
export const DRILL_HISTORY_KEY = "ielts-drill-rounds-v1";
export const missionsStorageKey = (userId) => `${MISSIONS_KEY}:${userId || "guest"}`;

export const MISSIONS = {
  "reading-passage": { title: "Complete a Reading passage", target: 1, href: "/reading" },
  "review-mistakes": { title: "Mark 3 saved mistakes as reviewed", target: 3, href: "/review" },
  "listening-test": { title: "Finish a Listening test", target: 1, href: "/listening" },
  "save-words": { title: "Save 3 new words to your notebook", target: 3, href: "/reading" },
  "drill-round": { title: "Finish a question-type drill", target: 1, href: "/reading/practice" },
  "writing-feedback": { title: "Get feedback on a Writing task", target: 1, href: "/writing" },
};

// YYYY-MM-DD in the learner's own time zone.
export function localDayKey(value = Date.now()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function hash(text) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
  return value;
}

// Reading every day, plus three of the eligible others, chosen by the date so
// the set stays the same all day.
export function chooseMissions(day, { signedIn = false, reviewable = 0 } = {}) {
  const optional = Object.keys(MISSIONS).filter((id) => {
    if (id === "reading-passage") return false;
    if (id === "review-mistakes") return reviewable >= 3;
    if (id === "writing-feedback") return signedIn;
    return true;
  });
  const ordered = [...optional].sort((first, second) => hash(`${day}:${first}`) - hash(`${day}:${second}`));
  return ["reading-passage", ...ordered.slice(0, 3)];
}

const countOnDay = (values, day) => values.filter((value) => localDayKey(value) === day).length;

/**
 * Progress for each mission. `activity` holds timestamps/dates of what the
 * learner did: readingAttempts, listeningAttempts, wordsSaved, drillRounds,
 * writingFeedback, plus reviewedIds and the day's baselineReviewedIds.
 */
export function evaluateMissions(missionIds, day, activity) {
  const baseline = new Set(activity.baselineReviewedIds || []);
  const counts = {
    "reading-passage": countOnDay(activity.readingAttempts || [], day),
    "review-mistakes": (activity.reviewedIds || []).filter((id) => !baseline.has(id)).length,
    "listening-test": countOnDay(activity.listeningAttempts || [], day),
    "save-words": countOnDay(activity.wordsSaved || [], day),
    "drill-round": countOnDay(activity.drillRounds || [], day),
    "writing-feedback": countOnDay(activity.writingFeedback || [], day),
  };
  return missionIds.filter((id) => MISSIONS[id]).map((id) => {
    const { title, target, href } = MISSIONS[id];
    const progress = Math.min(target, counts[id] || 0);
    return { id, title, target, href, progress, done: progress >= target };
  });
}

/**
 * Returns today's record, starting a new one when the stored record is from
 * another day. Records: { date, missions, baselineReviewedIds, completedDays }.
 */
export function ensureTodayRecord(stored, day, { signedIn, reviewable, reviewedIds }) {
  if (stored?.date === day && Array.isArray(stored.missions)) return stored;
  return {
    date: day,
    missions: chooseMissions(day, { signedIn, reviewable }),
    baselineReviewedIds: [...(reviewedIds || [])],
    completedDays: Array.isArray(stored?.completedDays) ? stored.completedDays.slice(-60) : [],
  };
}

export function markDayComplete(record) {
  if (record.completedDays.includes(record.date)) return record;
  return { ...record, completedDays: [...record.completedDays, record.date].slice(-60) };
}

// Days in a row (ending today or yesterday) with every mission done.
export function missionStreak(completedDays, today) {
  const days = new Set(completedDays || []);
  const cursor = new Date(`${today}T12:00:00`);
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function readDrillRounds(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(DRILL_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordDrillRound(storage, round) {
  try {
    const next = [...readDrillRounds(storage), round].slice(-100);
    storage.setItem(DRILL_HISTORY_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}
