import assert from "node:assert/strict";
import test from "node:test";
import { buildExamPlan, daysUntil, examPhase } from "./exam-plan.mjs";

test("days until the exam and the study phase", () => {
  assert.equal(daysUntil("2026-11-29", "2026-10-30"), 30);
  assert.equal(daysUntil("2026-10-29", "2026-10-30"), -1);
  assert.equal(daysUntil("", "2026-10-30"), null);
  assert.deepEqual([60, 42, 14, 2, 0, -1].map((days) => examPhase(days).id), ["build", "exam-practice", "sprint", "rest", "rest", "passed"]);
  assert.equal(examPhase(null), null);
});

const estimate = {
  overall: 6.5,
  missing: [],
  weakest: { id: "writing", label: "Writing", result: { band: 6 } },
};

test("plan focuses on the weakest skill and question type, with mocks closer to the exam", () => {
  const plan = buildExamPlan({ daysLeft: 10, targetBand: 7, estimate, weakestQuestionType: { type: "matching-headings", accuracy: 0.42 }, daysSinceFullMock: 5, savedWords: 12 });
  assert.equal(plan.phase.id, "sprint");
  assert.equal(plan.gap, 0.5);
  assert.deepEqual(plan.tasks.map((task) => task.id), ["full-mock", "skill-writing", "drill", "words"]);
  assert.match(plan.tasks[1].why, /Writing is your lowest band \(6\.0\)/);
  assert.equal(plan.tasks[2].href, "/reading/practice/matching-headings");

  const far = buildExamPlan({ daysLeft: 90, targetBand: 7, estimate, weakestQuestionType: null, daysSinceFullMock: 5, savedWords: 0 });
  assert.deepEqual(far.tasks.map((task) => task.id), ["skill-writing", "words"]);
});

test("missing skills come first; the last days are for rest", () => {
  const plan = buildExamPlan({ daysLeft: 30, targetBand: 6.5, estimate: { overall: null, missing: [{ id: "listening", label: "Listening" }], weakest: null }, weakestQuestionType: null, daysSinceFullMock: null });
  assert.deepEqual(plan.tasks.map((task) => task.id), ["full-mock", "skill-listening", "words"]);
  const noReading = buildExamPlan({ daysLeft: 30, targetBand: 7, estimate: { overall: null, missing: [{ id: "reading", label: "Reading" }], weakest: null }, daysSinceFullMock: 1 });
  assert.equal(noReading.tasks[0].href, "/readingmock");
  assert.equal(plan.gap, null);
  const rest = buildExamPlan({ daysLeft: 1, targetBand: 7, estimate, weakestQuestionType: null, daysSinceFullMock: 1, savedWords: 3 });
  assert.deepEqual(rest.tasks.map((task) => task.id), ["rest-mistakes", "rest-words"]);
  assert.deepEqual(buildExamPlan({ daysLeft: -3, targetBand: 7, estimate }).tasks, []);
});
