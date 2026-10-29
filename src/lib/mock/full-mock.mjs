// A full IELTS mock: Listening, then Reading, then Writing, like exam day.
// Each part runs on its own page; this session (kept in the browser) knows
// which tests were chosen, which part comes next and the band of each part.
import { roundOverallBand } from "../progress/overall-band.mjs";

export const FULL_MOCK_KEY = "ielts-full-mock-v1";
export const FULL_MOCK_PARTS = [
  { id: "listening", label: "Listening", minutes: 30 },
  { id: "reading", label: "Reading", minutes: 60 },
  { id: "writing", label: "Writing", minutes: 60 },
];
const HISTORY_LIMIT = 10;

const pick = (list, random) => list[Math.floor(random() * list.length)] ?? null;

export function createFullMock({ listeningSlugs, readingVariantIds, writingSlugs }, { random = Math.random, now = Date.now(), id } = {}) {
  const listeningSlug = pick(listeningSlugs, random);
  const readingVariantId = pick(readingVariantIds, random);
  if (!listeningSlug || !readingVariantId || writingSlugs?.length !== 2) return null;
  return {
    id: id || `fm-${now.toString(36)}`,
    startedAt: new Date(now).toISOString(),
    listeningSlug,
    readingVariantId,
    writingSlugs,
    stage: "listening",
    results: {},
  };
}

export function currentPart(session) {
  return FULL_MOCK_PARTS.find((part) => part.id === session?.stage) || null;
}

// Records a part's result and moves on to the next part. Results for a part
// other than the current one are ignored, so an old tab cannot skip ahead.
export function recordPartResult(session, partId, result, { now = Date.now() } = {}) {
  if (!session || session.stage !== partId) return session;
  const index = FULL_MOCK_PARTS.findIndex((part) => part.id === partId);
  const next = FULL_MOCK_PARTS[index + 1];
  return {
    ...session,
    stage: next ? next.id : "done",
    completedAt: next ? session.completedAt : new Date(now).toISOString(),
    results: { ...session.results, [partId]: { ...result, at: new Date(now).toISOString() } },
  };
}

const validBand = (value) => value != null && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 9;

// Overall band from the parts that have a band (Speaking is not part of
// this mock), rounded the way IELTS rounds the overall score.
export function fullMockOverall(session) {
  const bands = FULL_MOCK_PARTS
    .map((part) => session?.results?.[part.id]?.band)
    .filter(validBand)
    .map(Number);
  if (bands.length < 2) return { overall: null, count: bands.length };
  return { overall: roundOverallBand(bands.reduce((sum, band) => sum + band, 0) / bands.length), count: bands.length };
}

export function readFullMock(storage) {
  try {
    const data = JSON.parse(storage.getItem(FULL_MOCK_KEY) || "null");
    return { active: data?.active || null, history: Array.isArray(data?.history) ? data.history : [] };
  } catch {
    return { active: null, history: [] };
  }
}

// Saves the session; a finished one moves into the history list.
export function writeFullMock(storage, session) {
  const { history } = readFullMock(storage);
  const finished = session?.stage === "done";
  const next = {
    active: finished ? null : session,
    history: finished ? [session, ...history.filter((item) => item.id !== session.id)].slice(0, HISTORY_LIMIT) : history,
  };
  try {
    storage.setItem(FULL_MOCK_KEY, JSON.stringify(next));
  } catch {
    // Storage is full or blocked; the part result is still saved on its own page.
  }
  return next;
}

// Used by each part's page: when the page was opened from the full mock for
// the part that is due, returns the session, otherwise null.
export function fullMockFor(storage, partId, search) {
  if (!new URLSearchParams(search || "").has("fullmock")) return null;
  const { active } = readFullMock(storage);
  return active?.stage === partId ? active : null;
}

export function saveFullMockResult(storage, partId, result) {
  const { active } = readFullMock(storage);
  if (!active || active.stage !== partId) return null;
  const next = recordPartResult(active, partId, result);
  writeFullMock(storage, next);
  return next;
}
