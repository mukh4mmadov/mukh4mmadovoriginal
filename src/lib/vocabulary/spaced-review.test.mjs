import assert from "node:assert/strict";
import test from "node:test";
import { buildQuizQuestion, dueItems, isDue, reviewUpdate } from "./spaced-review.mjs";

const NOW = Date.parse("2026-10-30T10:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

test("words come back later the better you know them", () => {
  const word = { id: "w", term: "abundant", status: "learning", reviewCount: 2 };
  const easy = reviewUpdate(word, "easy", NOW);
  assert.deepEqual([easy.box, Date.parse(easy.dueAt) - NOW, easy.status, easy.reviewCount], [2, 3 * DAY, "learning", 3]);
  assert.equal(reviewUpdate({ ...word, box: 1 }, "easy", NOW).box, 2);
  const later = reviewUpdate({ ...word, box: 3 }, "easy", NOW);
  assert.deepEqual([later.box, Date.parse(later.dueAt) - NOW, later.status], [4, 14 * DAY, "known"]);
  assert.equal(reviewUpdate({ ...word, box: 5 }, "easy", NOW).box, 5);
  const again = reviewUpdate({ ...word, box: 4, status: "known" }, "again", NOW);
  assert.deepEqual([again.box, again.dueAt, again.status], [0, new Date(NOW).toISOString(), "learning"]);
  assert.equal(reviewUpdate({ ...word, box: 0 }, "hard", NOW).box, 1);
  assert.equal(reviewUpdate({ ...word, box: 3 }, "hard", NOW).box, 3);
});

test("due words: dated ones by date, older words by status", () => {
  const items = [
    { id: "a", term: "a", box: 2, dueAt: new Date(NOW + DAY).toISOString() },
    { id: "b", term: "b", box: 1, dueAt: new Date(NOW - DAY).toISOString() },
    { id: "c", term: "c", status: "learning" },
    { id: "d", term: "d", status: "known" },
  ];
  assert.equal(isDue(items[0], NOW), false);
  assert.deepEqual(dueItems(items, NOW).map((item) => item.id), ["c", "b"]);
});

test("quiz questions use the sentence, or the learner's meaning, with three other words", () => {
  const pool = ["abundant", "scarce", "vital", "decline"].map((term) => ({ id: term, term }));
  const sequence = [0.1, 0.7, 0.3, 0.9, 0.5, 0.2];
  let index = 0;
  const random = () => sequence[index++ % sequence.length];
  const gap = buildQuizQuestion({ id: "abundant", term: "abundant", sentence: "Water was abundant in the valley." }, pool, random);
  assert.equal(gap.kind, "gap");
  assert.equal(gap.prompt, "Water was _____ in the valley.");
  assert.deepEqual([...gap.options].sort(), ["abundant", "decline", "scarce", "vital"]);
  const meaning = buildQuizQuestion({ id: "vital", term: "vital", sentence: "No match here.", note: "very important" }, pool, random);
  assert.deepEqual([meaning.kind, meaning.prompt, meaning.answer], ["meaning", "very important", "vital"]);
  assert.equal(buildQuizQuestion({ id: "x", term: "x" }, pool, random), null);
  assert.equal(buildQuizQuestion({ id: "abundant", term: "abundant", note: "a lot" }, pool.slice(0, 3), random), null);
});
