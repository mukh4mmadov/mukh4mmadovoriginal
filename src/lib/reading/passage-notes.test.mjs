import test from "node:test";
import assert from "node:assert/strict";
import { makeNote, notedTokens, readNotes, sortNotes, writeNotes } from "./passage-notes.mjs";

const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
};

test("makes a note only with text and selected words", () => {
  assert.equal(makeNote({ tokenKeys: ["A-0-1"], text: "   " }), null);
  assert.equal(makeNote({ tokenKeys: [], text: "hi" }), null);
  const note = makeNote({ id: "n1", paragraphKey: "A-0", tokenKeys: ["A-0-1", "A-0-3"], quote: "  scanning   techniques ", text: " key paraphrase " }, "2026-01-01T00:00:00Z");
  assert.deepEqual(note, { id: "n1", paragraphKey: "A-0", tokenKeys: ["A-0-1", "A-0-3"], quote: "scanning techniques", text: "key paraphrase", createdAt: "2026-01-01T00:00:00Z" });
});

test("saves and reads notes per passage, ignoring broken data", () => {
  const storage = memoryStorage();
  writeNotes(storage, "sleep", [{ id: "n1", tokenKeys: ["a"], text: "x" }, { id: "bad" }]);
  assert.deepEqual(readNotes(storage, "sleep").map((note) => note.id), ["n1"]);
  assert.deepEqual(readNotes(storage, "other"), []);
  storage.setItem("ielts-passage-notes-v1:sleep", "{oops");
  assert.deepEqual(readNotes(storage, "sleep"), []);
});

test("orders notes by where they are in the passage and maps noted words", () => {
  const notes = [{ id: "late", tokenKeys: ["t5"] }, { id: "early", tokenKeys: ["t1", "t2"] }];
  assert.deepEqual(sortNotes(notes, ["t1", "t2", "t3", "t4", "t5"]).map((note) => note.id), ["early", "late"]);
  assert.deepEqual([...notedTokens(notes)], [["t5", "late"], ["t1", "early"], ["t2", "early"]]);
});
