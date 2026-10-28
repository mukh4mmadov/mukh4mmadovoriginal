import test from "node:test";
import assert from "node:assert/strict";
import {
  addVocabularyItem,
  cleanTerm,
  makeVocabularyItem,
  mergeVocabulary,
  sentenceContaining,
  updateVocabularyItem,
} from "./vocabulary-notebook.mjs";

test("cleans saved terms and rejects long selections", () => {
  assert.equal(cleanTerm("  “unequivocal,” "), "unequivocal");
  assert.equal(cleanTerm("long   overlap"), "long overlap");
  assert.equal(cleanTerm("one two three four five six seven"), "");
  assert.equal(cleanTerm("..."), "");
});

test("finds the sentence around a term", () => {
  const text = "Sleep matters. Researchers found unequivocal evidence of overlap. More work is needed.";
  assert.equal(sentenceContaining(text, "Unequivocal"), "Researchers found unequivocal evidence of overlap.");
  assert.equal(sentenceContaining(text, "absent"), "");
});

test("saving a word again refreshes its context but keeps the note", () => {
  const first = makeVocabularyItem({ term: "Mitigate", sentence: "Old.", passageSlug: "a" }, "2026-01-01T00:00:00Z");
  let list = addVocabularyItem([], first);
  list = updateVocabularyItem(list, "mitigate", { note: "make less severe", status: "known" }, "2026-01-02T00:00:00Z");
  list = addVocabularyItem(list, makeVocabularyItem({ term: "mitigate", sentence: "New.", passageSlug: "b" }, "2026-01-03T00:00:00Z"));
  assert.equal(list.length, 1);
  assert.equal(list[0].term, "Mitigate");
  assert.equal(list[0].note, "make less severe");
  assert.equal(list[0].sentence, "New.");
  assert.equal(list[0].status, "learning");
});

test("merges local and account words with removals respected", () => {
  const local = [
    { id: "new", term: "new", updatedAt: "2026-01-05T00:00:00Z" },
    { id: "gone", term: "gone", updatedAt: "2026-01-01T00:00:00Z" },
  ];
  const rows = [
    { item_id: "gone", data: { id: "gone", term: "gone", updatedAt: "2026-01-01T00:00:00Z" }, removed_at: "2026-01-02T00:00:00Z" },
    { item_id: "remote", data: { id: "remote", term: "remote", updatedAt: "2026-01-04T00:00:00Z" }, removed_at: null },
  ];
  const { items, toUpsert } = mergeVocabulary(local, rows);
  assert.deepEqual(items.map((item) => item.id), ["new", "remote"]);
  assert.deepEqual(toUpsert.map((row) => row.item_id), ["new"]);
});
