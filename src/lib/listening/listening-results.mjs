import { getListeningBand } from "./listening-scoring.mjs";

export const LISTENING_HISTORY_KEY = "ielts-listening-results-v1";
const MAX_HISTORY = 50;
const MAX_ANSWERS = 60;

const text = (value, limit) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
const wholeNumber = (value) => (Number.isFinite(Number(value)) ? Math.round(Number(value)) : null);

// The embedded test page is third-party HTML, so treat everything it posts as
// untrusted: keep only known fields, clamp numbers and cap string lengths.
export function normalizeListeningPayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.answers)) return null;
  const answers = payload.answers.slice(0, MAX_ANSWERS).map((answer) => {
    const max = Math.min(4, Math.max(1, wholeNumber(answer?.max) || 1));
    const section = wholeNumber(answer?.section);
    return {
      number: wholeNumber(answer?.number),
      label: text(answer?.label || answer?.number, 12),
      section: section >= 1 && section <= 4 ? section : null,
      type: text(answer?.type, 40) || null,
      prompt: text(answer?.prompt, 200),
      userAnswer: text(answer?.userAnswer, 120),
      correctAnswer: text(answer?.correctAnswer, 120),
      score: Math.min(max, Math.max(0, wholeNumber(answer?.score) || 0)),
      max,
    };
  }).filter((answer) => answer.number >= 1 && answer.number <= 40);
  if (!answers.length) return null;
  const score = answers.reduce((total, answer) => total + answer.score, 0);
  const total = answers.reduce((sum, answer) => sum + answer.max, 0);
  if (total < 1 || total > 40) return null;
  return { score, total, answers };
}

export function buildListeningAttempt(test, payload, { id, startedAt, completedAt = Date.now() } = {}) {
  const normalized = normalizeListeningPayload(payload);
  if (!normalized || !test?.slug || !id) return null;
  const { score, total, answers } = normalized;

  const sections = (test.sectionTitles || []).map((title, index) => {
    const items = answers.filter((answer) => answer.section === index + 1);
    return {
      number: index + 1,
      title,
      correct: items.reduce((sum, answer) => sum + answer.score, 0),
      total: items.reduce((sum, answer) => sum + answer.max, 0),
    };
  }).filter((section) => section.total > 0);

  const typeMap = new Map();
  answers.forEach((answer) => {
    if (!answer.type) return;
    const stats = typeMap.get(answer.type) || { type: answer.type, correct: 0, total: 0 };
    stats.correct += answer.score;
    stats.total += answer.max;
    typeMap.set(answer.type, stats);
  });

  const elapsedSeconds = Number.isFinite(startedAt)
    ? Math.max(0, Math.min(3 * 60 * 60, Math.round((completedAt - startedAt) / 1000)))
    : null;

  return {
    id,
    testSlug: test.slug,
    testTitle: test.title,
    completedAt: new Date(completedAt).toISOString(),
    score,
    total,
    band: getListeningBand(score, total),
    elapsedSeconds,
    skipped: answers.filter((answer) => !answer.userAnswer).length,
    sections,
    questionTypes: [...typeMap.values()],
    answers,
  };
}

// Results posted again for the same attempt (e.g. reopening the results
// dialog) share this signature and are not saved twice.
export function listeningResultSignature(payload) {
  const normalized = normalizeListeningPayload(payload);
  if (!normalized) return "";
  return normalized.answers.map((answer) => `${answer.label}:${answer.score}:${answer.userAnswer}`).join("|");
}

export function readListeningHistory(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(LISTENING_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.testSlug) : [];
  } catch {
    return [];
  }
}

export function saveListeningAttemptLocally(storage, attempt) {
  const history = readListeningHistory(storage).filter((item) => item.id !== attempt.id);
  const next = [...history, attempt]
    .sort((a, b) => String(a.completedAt).localeCompare(String(b.completedAt)))
    .slice(-MAX_HISTORY);
  try {
    storage?.setItem(LISTENING_HISTORY_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function mergeListeningHistory(...lists) {
  const merged = new Map();
  lists.flat().forEach((item) => {
    if (item?.id && item?.testSlug) merged.set(item.id, item);
  });
  return [...merged.values()].sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
}

export function summarizeListeningHistory(history) {
  const byTest = new Map();
  history.forEach((attempt) => {
    const current = byTest.get(attempt.testSlug) || { attempts: 0, best: null, last: null };
    current.attempts += 1;
    if (!current.best || attempt.score > current.best.score) current.best = attempt;
    if (!current.last || String(attempt.completedAt) > String(current.last.completedAt)) current.last = attempt;
    byTest.set(attempt.testSlug, current);
  });
  return byTest;
}
