import assert from "node:assert/strict";
import test from "node:test";
import { createFullMock, fullMockFor, fullMockOverall, readFullMock, recordPartResult, saveFullMockResult, writeFullMock } from "./full-mock.mjs";

const memoryStorage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) };
};
const choices = { listeningSlugs: ["l1", "l2"], readingVariantIds: ["r1"], writingSlugs: ["t1", "t2"] };

test("a full mock runs Listening, Reading, then Writing", () => {
  const session = createFullMock(choices, { random: () => 0.9, now: 1000, id: "fm" });
  assert.deepEqual([session.listeningSlug, session.readingVariantId, session.stage], ["l2", "r1", "listening"]);
  // A result for a part that is not due yet is ignored.
  assert.equal(recordPartResult(session, "reading", { band: 7 }), session);
  const afterListening = recordPartResult(session, "listening", { score: 30, total: 40, band: 7 }, { now: 2000 });
  assert.equal(afterListening.stage, "reading");
  const afterReading = recordPartResult(afterListening, "reading", { score: 33, band: 7.5 }, { now: 3000 });
  const done = recordPartResult(afterReading, "writing", { band: 6 }, { now: 4000 });
  assert.equal(done.stage, "done");
  assert.ok(done.completedAt);
  assert.equal(createFullMock({ ...choices, writingSlugs: ["t1"] }), null);
});

test("overall band averages the parts with a band and rounds like IELTS", () => {
  assert.deepEqual(fullMockOverall({ results: { listening: { band: 7 }, reading: { band: 7.5 }, writing: { band: 6 } } }), { overall: 7, count: 3 }); // 6.83
  assert.deepEqual(fullMockOverall({ results: { listening: { band: 6.5 }, reading: { band: 6 }, writing: { band: 6 } } }), { overall: 6, count: 3 }); // 6.17
  assert.deepEqual(fullMockOverall({ results: { listening: { band: 7 }, reading: { band: 6.5 }, writing: { band: null } } }), { overall: 7, count: 2 }); // 6.75
  assert.deepEqual(fullMockOverall({ results: { listening: { band: 7 } } }), { overall: null, count: 1 });
});

test("pages only join the full mock for the part that is due", () => {
  const storage = memoryStorage();
  const session = createFullMock(choices, { random: () => 0, id: "fm" });
  writeFullMock(storage, session);
  assert.equal(fullMockFor(storage, "listening", "?fullmock=1")?.id, "fm");
  assert.equal(fullMockFor(storage, "listening", ""), null);
  assert.equal(fullMockFor(storage, "reading", "?fullmock=1"), null);
  saveFullMockResult(storage, "listening", { band: 6.5 });
  saveFullMockResult(storage, "reading", { band: 7 });
  saveFullMockResult(storage, "writing", { band: 6 });
  const { active, history } = readFullMock(storage);
  assert.equal(active, null);
  assert.equal(history[0].stage, "done");
  assert.equal(saveFullMockResult(storage, "writing", { band: 9 }), null);
});
