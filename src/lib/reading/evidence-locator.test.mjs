import test from "node:test";
import assert from "node:assert/strict";
import { extractQuotedPhrases, locateEvidence, segmentParagraph, summarizeEvidenceCoverage } from "./evidence-locator.mjs";

const passage = {
  paragraphs: [
    { label: "A", text: "Bees matter. They are the primary pollinators for approximately 75% of the world’s food crops. Without them, yields fall." },
    { label: "B", text: "Many  colonies   have collapsed since 2006, a trend scientists call colony collapse disorder." },
    { label: "C", text: "Superposition allows a quantum system to exist in multiple states simultaneously until measured, unlike classical bits." },
  ],
};

test("extracts quoted phrases without stopping at apostrophes", () => {
  assert.deepEqual(
    extractQuotedPhrases("Paragraph A says 'the primary pollinators for approximately 75% of the world's food crops'."),
    ["the primary pollinators for approximately 75% of the world's food crops"],
  );
  assert.deepEqual(extractQuotedPhrases("It says 'yes' and \"no\"."), []);
});

test("finds the exact sentence from an evidence field, ignoring spacing and quote style", () => {
  const located = locateEvidence(passage, { evidence: "many colonies have collapsed since 2006" });
  assert.equal(located.kind, "exact");
  assert.equal(located.paragraphIndex, 1);
  const text = passage.paragraphs[1].text;
  const [range] = located.ranges;
  assert.equal(text.slice(range.start, range.end), "Many  colonies   have collapsed since 2006");
  assert.equal(text.slice(range.sentence.start, range.sentence.end), text);
});

test("finds quotes from the explanation and limits the sentence to its bounds", () => {
  const located = locateEvidence(passage, { explanation: "The passage says 'the primary pollinators for approximately 75% of the world's food crops'." });
  assert.equal(located.kind, "exact");
  const text = passage.paragraphs[0].text;
  const [range] = located.ranges;
  assert.equal(text.slice(range.sentence.start, range.sentence.end), "They are the primary pollinators for approximately 75% of the world’s food crops.");
});

test("matches a lightly reworded quote to its sentence", () => {
  const located = locateEvidence(passage, { explanation: "It states 'a quantum system can exist in multiple states simultaneously until measured'." });
  assert.equal(located.kind, "exact");
  assert.equal(located.paragraphIndex, 2);
});

test("falls back to the paragraph named by the question or explanation", () => {
  assert.deepEqual(locateEvidence(passage, { paragraphLabel: "Paragraph B" }), { kind: "paragraph", paragraphIndex: 1, ranges: [] });
  assert.deepEqual(locateEvidence(passage, { explanation: "Paragraph C explains superposition." }), { kind: "paragraph", paragraphIndex: 2, ranges: [] });
  assert.equal(locateEvidence(passage, { explanation: "Not stated anywhere." }), null);
  assert.equal(locateEvidence(passage, { paragraphLabel: "Paragraph H" }), null);
});

test("segments a paragraph into plain, sentence and match parts", () => {
  const located = locateEvidence(passage, { evidence: "the primary pollinators" .padEnd(23) + " for approximately 75%" });
  const segments = segmentParagraph(passage.paragraphs[0].text, located.ranges);
  assert.deepEqual(segments.map((segment) => segment.kind), ["plain", "sentence", "match", "sentence", "plain"]);
  assert.equal(segments.map((segment) => segment.text).join(""), passage.paragraphs[0].text);
});

test("summarizes coverage across passages", () => {
  const totals = summarizeEvidenceCoverage([{ ...passage, questionGroups: [{ questions: [{ evidence: "colony collapse disorder" }, { paragraphLabel: "Paragraph A" }, {}] }] }]);
  assert.deepEqual(totals, { questions: 3, exact: 1, paragraph: 1, none: 1 });
});
