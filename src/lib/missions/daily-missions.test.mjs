import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseMissions,
  ensureTodayRecord,
  evaluateMissions,
  localDayKey,
  markDayComplete,
  missionStreak,
} from "./daily-missions.mjs";

test("always includes Reading and three stable optional missions", () => {
  const first = chooseMissions("2026-10-28", { signedIn: true, reviewable: 5 });
  assert.equal(first.length, 4);
  assert.equal(first[0], "reading-passage");
  assert.deepEqual(chooseMissions("2026-10-28", { signedIn: true, reviewable: 5 }), first);
  assert.equal(new Set(first).size, 4);
});

test("leaves out missions the learner can't do yet", () => {
  for (const day of ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"]) {
    const missions = chooseMissions(day, { signedIn: false, reviewable: 1 });
    assert.ok(!missions.includes("writing-feedback"));
    assert.ok(!missions.includes("review-mistakes"));
  }
});

test("measures progress from today's activity only", () => {
  const today = localDayKey(new Date(2026, 9, 28, 15));
  const todayTime = new Date(2026, 9, 28, 9).getTime();
  const yesterday = new Date(2026, 9, 27, 9).toISOString();
  const result = evaluateMissions(["reading-passage", "save-words", "review-mistakes"], today, {
    readingAttempts: [todayTime, yesterday],
    wordsSaved: [new Date(todayTime).toISOString(), new Date(todayTime).toISOString(), yesterday],
    reviewedIds: ["a", "b", "c", "d"],
    baselineReviewedIds: ["a"],
  });
  assert.deepEqual(result.map(({ id, progress, done }) => [id, progress, done]), [
    ["reading-passage", 1, true],
    ["save-words", 2, false],
    ["review-mistakes", 3, true],
  ]);
});

test("starts a new record on a new day and keeps completed days", () => {
  const stored = { date: "2026-10-27", missions: ["reading-passage"], baselineReviewedIds: [], completedDays: ["2026-10-27"] };
  const kept = ensureTodayRecord(stored, "2026-10-27", { reviewedIds: [] });
  assert.equal(kept, stored);
  const next = ensureTodayRecord(stored, "2026-10-28", { signedIn: false, reviewable: 0, reviewedIds: ["x"] });
  assert.equal(next.date, "2026-10-28");
  assert.deepEqual(next.baselineReviewedIds, ["x"]);
  assert.deepEqual(next.completedDays, ["2026-10-27"]);
  assert.deepEqual(markDayComplete(next).completedDays, ["2026-10-27", "2026-10-28"]);
});

test("counts the streak of fully completed days", () => {
  assert.equal(missionStreak(["2026-10-26", "2026-10-27", "2026-10-28"], "2026-10-28"), 3);
  assert.equal(missionStreak(["2026-10-26", "2026-10-27"], "2026-10-28"), 2);
  assert.equal(missionStreak(["2026-10-25"], "2026-10-28"), 0);
});
