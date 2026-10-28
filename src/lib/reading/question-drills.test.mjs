import test from "node:test";
import assert from "node:assert/strict";
import { buildDrillPool, pickDrillRound } from "./question-drills.mjs";

const readingTests = [{
  passages: [{
    slug: "bees",
    title: "Bees",
    paragraphs: [
      { label: "A", text: "Bees pollinate crops. Colonies have collapsed since 2006." },
      { label: "B", text: "Some farmers now rent hives." },
    ],
    questionGroups: [{
      questions: [
        { id: "q1", type: "true-false-not-given", prompt: "Colonies are growing.", answer: "FALSE", evidence: "Colonies have collapsed since 2006" },
        { id: "q2", type: "true-false-not-given", prompt: "Hives are cheap.", answer: "NOT GIVEN", explanation: "Not mentioned." },
        { id: "q3", type: "matching-headings", paragraphLabel: "Paragraph B", answer: "ii" },
        { id: "q4", type: "multiple-choice", prompt: "Who rents?", answer: "A", explanation: "Paragraph B says farmers rent hives." },
        { id: "q5", type: "sentence-completion", before: "Farmers rent", after: ".", answer: ["hives"], explanation: "Paragraph B." },
        { id: "q6", type: "sentence-completion", before: "Colonies have", after: ".", answer: ["C"], explanation: "Paragraph A." },
      ],
    }],
  }],
}];

test("collects questions of one type with their evidence paragraph", () => {
  const pool = buildDrillPool(readingTests, "true-false-not-given");
  assert.deepEqual(pool.map((item) => item.key), ["bees:q1"]);
  assert.equal(pool[0].paragraph.label, "A");
  assert.equal(pool[0].location.kind, "exact");
  assert.equal(buildDrillPool(readingTests, "multiple-choice")[0].paragraph.label, "B");
});

test("skips word-list summary questions answered with a letter", () => {
  assert.deepEqual(buildDrillPool(readingTests, "sentence-completion").map((item) => item.key), ["bees:q5"]);
});

test("skips matching questions when the passage has no heading list", () => {
  assert.deepEqual(buildDrillPool(readingTests, "matching-headings"), []);
  const withBank = [{ passages: [{ ...readingTests[0].passages[0], headingBank: [{ id: "ii", text: "Renting hives" }] }] }];
  assert.equal(buildDrillPool(withBank, "matching-headings").length, 1);
});

test("picks a shuffled round without repeats", () => {
  const pool = Array.from({ length: 20 }, (_, index) => ({ key: String(index) }));
  let seed = 1;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const round = pickDrillRound(pool, 10, random);
  assert.equal(round.length, 10);
  assert.equal(new Set(round.map((item) => item.key)).size, 10);
  assert.equal(pickDrillRound(pool.slice(0, 3), 10).length, 3);
});
