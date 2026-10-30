// Spaced repetition for saved words: each word sits in a box, and a word
// you know moves to a later box, so it comes back after a longer gap.
// Box 0 means "due again today".

const DAY = 24 * 60 * 60 * 1000;
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
const LAST_BOX = INTERVAL_DAYS.length - 1;
// From this box on, a word counts as known.
const KNOWN_BOX = 4;

const boxOf = (item) => Math.max(0, Math.min(LAST_BOX, Number.isInteger(item?.box) ? item.box : item?.status === "known" ? KNOWN_BOX : 0));

// A word is due when its review date has come. Words saved before this
// trainer existed have no date: learning ones are due, known ones are not.
export function isDue(item, now = Date.now()) {
  const due = Date.parse(item?.dueAt || "");
  if (Number.isFinite(due)) return due <= now;
  return item?.status !== "known";
}

export function dueItems(items, now = Date.now()) {
  return (items || [])
    .filter((item) => isDue(item, now))
    .sort((first, second) => boxOf(first) - boxOf(second) || (Date.parse(first.dueAt || 0) || 0) - (Date.parse(second.dueAt || 0) || 0));
}

/**
 * Changes to save after an answer. grade: "again" (didn't know it),
 * "hard" (knew it with effort) or "easy".
 */
export function reviewUpdate(item, grade, now = Date.now()) {
  const current = boxOf(item);
  // "Easy" on a word still in the first box skips a step, so it differs from "Hard".
  const box = grade === "again" ? 0 : grade === "hard" ? Math.max(1, current) : Math.min(LAST_BOX, current + (current === 0 ? 2 : 1));
  return {
    box,
    dueAt: new Date(now + INTERVAL_DAYS[box] * DAY).toISOString(),
    status: box >= KNOWN_BOX ? "known" : "learning",
    reviewCount: (Number(item?.reviewCount) || 0) + 1,
    lastReviewedAt: new Date(now).toISOString(),
  };
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const shuffle = (list, random) => {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

/**
 * One multiple-choice question about a word, with three other saved words
 * as wrong answers: fill the gap in its sentence, or match its meaning
 * (the learner's own note). Returns null when neither is possible.
 */
export function buildQuizQuestion(item, pool, random = Math.random) {
  const others = shuffle((pool || []).filter((entry) => entry.id !== item.id && entry.term.toLowerCase() !== item.term.toLowerCase()), random).slice(0, 3);
  if (others.length < 3) return null;
  const options = shuffle([item.term, ...others.map((entry) => entry.term)], random);
  const pattern = new RegExp(`\\b${escapeRegExp(item.term)}\\b`, "i");
  if (item.sentence && pattern.test(item.sentence)) {
    return { id: item.id, kind: "gap", prompt: item.sentence.replace(pattern, "_____"), options, answer: item.term };
  }
  if (item.note?.trim()) {
    return { id: item.id, kind: "meaning", prompt: item.note.trim(), options, answer: item.term };
  }
  return null;
}
