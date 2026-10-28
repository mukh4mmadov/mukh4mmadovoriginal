import assert from "node:assert/strict";
import test from "node:test";
import { overallWritingBand, parseWritingFeedback, roundToHalfBand } from "./writing-feedback.mjs";

const criteria = (task, coherence, lexical, grammar) => ({
  task: { band: task, comment: "t" },
  coherence: { band: coherence, comment: "c" },
  lexical: { band: lexical, comment: "l" },
  grammar: { band: grammar, comment: "g" },
});

test("overall band follows IELTS half-band rounding", () => {
  assert.equal(overallWritingBand({ task: 6, coherence: 6, lexical: 6, grammar: 6 }), 6);
  assert.equal(overallWritingBand({ task: 6.5, coherence: 6, lexical: 6, grammar: 6 }), 6); // 6.125
  assert.equal(overallWritingBand({ task: 6.5, coherence: 6.5, lexical: 6, grammar: 6 }), 6.5); // 6.25
  assert.equal(overallWritingBand({ task: 7, coherence: 7, lexical: 7, grammar: 6 }), 7); // 6.75
  assert.equal(overallWritingBand({ task: 7, coherence: 6.5, lexical: 6.5, grammar: 6 }), 6.5); // 6.5
  assert.equal(overallWritingBand({ task: 9, coherence: 9, lexical: 9, grammar: 9 }), 9);
  assert.equal(overallWritingBand({ task: 6 }), null);
  assert.equal(roundToHalfBand(6.3), 6.5);
});

test("parses fenced JSON and ignores the model's own overall band", () => {
  const raw = "Here you go:\n```json\n" + JSON.stringify({
    overall: 9,
    summary: "Clear position.",
    criteria: criteria(6.5, 6.5, 6, 6),
    strengths: ["Clear position", "", "Good paragraphs"],
    improvements: ["Develop examples"],
    corrections: [{ original: "peoples is", improved: "people are", reason: "plural" }, { original: "", improved: "x" }],
  }) + "\n```";
  const feedback = parseWritingFeedback(raw);
  assert.equal(feedback.overall, 6.5);
  assert.deepEqual(feedback.strengths, ["Clear position", "Good paragraphs"]);
  assert.equal(feedback.corrections.length, 1);
});

test("rejects malformed or out-of-range feedback", () => {
  assert.equal(parseWritingFeedback("not json"), null);
  assert.equal(parseWritingFeedback(JSON.stringify({ criteria: criteria(6, 6, 6) })), null);
  assert.equal(parseWritingFeedback(JSON.stringify({ criteria: criteria(10, 6, 6, 6) })), null);
  assert.equal(parseWritingFeedback(JSON.stringify({ criteria: criteria("six", 6, 6, 6) })), null);
});
