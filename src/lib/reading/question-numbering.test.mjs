import assert from "node:assert/strict";
import test from "node:test";
import { renumberInstructions } from "./question-numbering.mjs";

test("shifts question and answer-box ranges to the displayed numbers", () => {
  assert.equal(
    renumberInstructions("Look at the following statements (Questions 27–32). Write the letter in boxes 27–32 on your answer sheet.", 1),
    "Look at the following statements (Questions 1–6). Write the letter in boxes 1–6 on your answer sheet.",
  );
});

test("handles single boxes, 'and' pairs and hyphen ranges", () => {
  assert.equal(renumberInstructions("Write the correct letter in box 40.", 14), "Write the correct letter in box 14.");
  assert.equal(renumberInstructions("Questions 20 and 21. Write the letters in boxes 20 and 21.", 7), "Questions 7 and 8. Write the letters in boxes 7 and 8.");
  assert.equal(renumberInstructions("Questions 1–6. Look at the issues (Questions 1-6). Write A-F in boxes 1-6.", 28), "Questions 28–33. Look at the issues (Questions 28-33). Write A-F in boxes 28-33.");
});

test("leaves passage references, letter ranges and matching numbers alone", () => {
  const text = "Questions 14–19. Reading Passage 2 has six paragraphs, A–F. Write the correct number, i–ix, in boxes 14–19.";
  assert.equal(renumberInstructions(text, 14), text);
  assert.equal(
    renumberInstructions(text, 1),
    "Questions 1–6. Reading Passage 2 has six paragraphs, A–F. Write the correct number, i–ix, in boxes 1–6.",
  );
  assert.equal(renumberInstructions("Choose NO MORE THAN TWO WORDS.", 5), "Choose NO MORE THAN TWO WORDS.");
});
