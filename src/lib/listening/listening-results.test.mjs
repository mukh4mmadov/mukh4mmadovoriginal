import assert from "node:assert/strict";
import test from "node:test";
import { getListeningBand } from "./listening-scoring.mjs";
import {
  buildListeningAttempt,
  listeningResultSignature,
  mergeListeningHistory,
  normalizeListeningPayload,
  readListeningHistory,
  saveListeningAttemptLocally,
  summarizeListeningHistory,
} from "./listening-results.mjs";

const sampleTest = { slug: "campus-art-business", title: "Campus, Art & Business", sectionTitles: ["A", "B", "C", "D"] };
const answer = (number, correct, extra = {}) => ({
  number, section: Math.ceil(number / 10), type: number % 2 ? "text" : "radio",
  userAnswer: correct === null ? "" : "x", correctAnswer: "y", score: correct ? 1 : 0, max: 1, ...extra,
});
const fullPayload = (correctCount) => ({
  answers: Array.from({ length: 40 }, (_, index) => answer(index + 1, index < correctCount)),
});

test("listening band thresholds", () => {
  assert.equal(getListeningBand(40), 9);
  assert.equal(getListeningBand(35), 8);
  assert.equal(getListeningBand(30), 7);
  assert.equal(getListeningBand(29), 6.5);
  assert.equal(getListeningBand(10), 4);
  assert.equal(getListeningBand(9), null);
  assert.equal(getListeningBand(30, 38), null);
});

test("normalizes untrusted payloads", () => {
  assert.equal(normalizeListeningPayload(null), null);
  assert.equal(normalizeListeningPayload({ answers: [] }), null);
  const normalized = normalizeListeningPayload({
    answers: [
      { number: 1, score: 5, max: 1, userAnswer: "a".repeat(500), section: 9 },
      { number: 99, score: 1, max: 1 },
      { number: "21", label: "21-22", score: 2, max: 2, userAnswer: "B, D" },
    ],
  });
  assert.equal(normalized.answers.length, 2);
  assert.equal(normalized.answers[0].score, 1);
  assert.equal(normalized.answers[0].userAnswer.length, 120);
  assert.equal(normalized.answers[0].section, null);
  assert.equal(normalized.score, 3);
  assert.equal(normalized.total, 3);
});

test("builds an attempt with band, sections and question types", () => {
  const attempt = buildListeningAttempt(sampleTest, fullPayload(31), { id: "a1", startedAt: 0, completedAt: 1_800_000 });
  assert.equal(attempt.score, 31);
  assert.equal(attempt.total, 40);
  assert.equal(attempt.band, 7);
  assert.equal(attempt.elapsedSeconds, 1800);
  assert.equal(attempt.sections.length, 4);
  assert.deepEqual(attempt.sections[3], { number: 4, title: "D", correct: 1, total: 10 });
  assert.equal(attempt.questionTypes.length, 2);
  assert.equal(buildListeningAttempt(sampleTest, { answers: [] }, { id: "a2" }), null);
});

test("signatures dedupe repeated posts of the same result", () => {
  assert.equal(listeningResultSignature(fullPayload(20)), listeningResultSignature(fullPayload(20)));
  assert.notEqual(listeningResultSignature(fullPayload(20)), listeningResultSignature(fullPayload(21)));
});

test("stores, merges and summarizes history", () => {
  const store = new Map();
  const storage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const first = buildListeningAttempt(sampleTest, fullPayload(25), { id: "1", completedAt: Date.UTC(2026, 0, 1) });
  const second = buildListeningAttempt(sampleTest, fullPayload(33), { id: "2", completedAt: Date.UTC(2026, 0, 2) });
  assert.equal(saveListeningAttemptLocally(storage, first), true);
  assert.equal(saveListeningAttemptLocally(storage, second), true);
  assert.equal(saveListeningAttemptLocally(storage, second), true);
  assert.equal(readListeningHistory(storage).length, 2);
  const merged = mergeListeningHistory([first], [second, first]);
  assert.deepEqual(merged.map((item) => item.id), ["2", "1"]);
  const summary = summarizeListeningHistory(merged).get(sampleTest.slug);
  assert.equal(summary.attempts, 2);
  assert.equal(summary.best.id, "2");
  assert.equal(readListeningHistory({ getItem: () => "{bad" }).length, 0);
});
