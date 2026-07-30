import { describe, expect, it } from "vitest";
import { buildReadingAnalytics } from "./readingAnalytics";

function makePassage(overrides = {}) {
  return {
    wordCount: 800,
    questionGroups: [
      {
        questions: [
          { id: "q1", number: 1, type: "true-false-not-given", answer: "TRUE" },
          { id: "q2", number: 2, type: "matching-headings", answer: "h1" },
          { id: "q3", number: 3, type: "multiple-choice", answer: "B" },
          {
            id: "q4",
            number: 4,
            type: "sentence-completion",
            answer: ["Great Barrier Reef"],
          },
          { id: "q5", number: 5, type: "yes-no-not-given", answer: "NO" },
        ],
      },
    ],
    ...overrides,
  };
}

describe("buildReadingAnalytics — scoring", () => {
  it("counts correct, incorrect and skipped answers", () => {
    const passage = makePassage();
    const result = buildReadingAnalytics({
      passage,
      answers: {
        q1: "TRUE", // correct
        q2: "h2", // incorrect
        q3: "B", // correct
        // q4 skipped
        q5: "YES", // incorrect
      },
    });

    expect(result.summary.correctCount).toBe(2);
    expect(result.summary.incorrectCount).toBe(2);
    expect(result.summary.skippedCount).toBe(1);
    expect(result.accuracy).toBeCloseTo(2 / 5, 5);
    expect(result.accuracyPercent).toBe(40);
  });

  it("treats sentence-completion answers case- and whitespace-insensitively", () => {
    const passage = makePassage();
    const result = buildReadingAnalytics({
      passage,
      answers: { q4: "  great   barrier   reef " },
    });
    expect(result.summary.correctCount).toBe(1);
  });

  it("gives a perfect score when every answer is correct", () => {
    const passage = makePassage();
    const result = buildReadingAnalytics({
      passage,
      answers: {
        q1: "TRUE",
        q2: "h1",
        q3: "B",
        q4: "Great Barrier Reef",
        q5: "NO",
      },
    });
    expect(result.accuracy).toBe(1);
    expect(result.summary.correctCount).toBe(5);
    expect(result.summary.skippedCount).toBe(0);
  });
});

describe("buildReadingAnalytics — reading speed & time", () => {
  it("computes words-per-minute reading speed", () => {
    const result = buildReadingAnalytics({
      passage: makePassage({ wordCount: 600 }),
      answers: {},
      timeSpent: 300, // 5 minutes
    });
    // 600 words / 300s * 60 = 120 wpm
    expect(result.readingSpeed).toBe(120);
  });

  it("returns 0 reading speed when time or word count is missing", () => {
    expect(
      buildReadingAnalytics({ passage: makePassage(), answers: {}, timeSpent: 0 })
        .readingSpeed,
    ).toBe(0);
    expect(
      buildReadingAnalytics({
        passage: makePassage({ wordCount: 0 }),
        answers: {},
        timeSpent: 300,
      }).readingSpeed,
    ).toBe(0);
  });

  it("formats time spent into a human-readable minutes string", () => {
    expect(
      buildReadingAnalytics({ passage: makePassage(), answers: {}, timeSpent: 0 })
        .summary.timeSpent,
    ).toBe("0 min");
    expect(
      buildReadingAnalytics({
        passage: makePassage(),
        answers: {},
        timeSpent: 150,
      }).summary.timeSpent,
    ).toBe("3 min");
  });
});

describe("buildReadingAnalytics — behavioural scores", () => {
  it("penalises confidence for answer changes and skips", () => {
    const result = buildReadingAnalytics({
      passage: makePassage(),
      answers: { q1: "TRUE" },
      answerChangeCounts: { q1: 2 },
    });
    // 100 - (2 changes * 5) - (4 skipped * 3) = 78
    expect(result.confidenceScore).toBe(78);
  });

  it("penalises time management when over the target time with pauses", () => {
    const onTime = buildReadingAnalytics({
      passage: makePassage(),
      answers: {},
      timeSpent: 600,
    });
    const overTime = buildReadingAnalytics({
      passage: makePassage(),
      answers: {},
      timeSpent: 20 * 60 + 600,
      pauseCount: 3,
    });
    expect(overTime.timeManagementScore).toBeLessThan(onTime.timeManagementScore);
    expect(overTime.timeManagementScore).toBeGreaterThanOrEqual(0);
  });

  it("clamps scores to the 0-100 range", () => {
    const result = buildReadingAnalytics({
      passage: makePassage(),
      answers: {},
      answerChangeCounts: { q1: 50 },
    });
    expect(result.confidenceScore).toBe(0);
  });
});

describe("buildReadingAnalytics — type analysis & prediction", () => {
  it("sorts question types by accuracy and identifies weaknesses", () => {
    const passage = {
      questionGroups: [
        {
          questions: [
            { id: "a1", number: 1, type: "multiple-choice", answer: "A" },
            { id: "a2", number: 2, type: "multiple-choice", answer: "A" },
            { id: "b1", number: 3, type: "matching-headings", answer: "h1" },
          ],
        },
      ],
    };
    const result = buildReadingAnalytics({
      passage,
      answers: { a1: "A", a2: "A", b1: "wrong" },
    });

    const mc = result.questionTypeAnalysis.find(
      (t) => t.type === "multiple-choice",
    );
    const mh = result.questionTypeAnalysis.find(
      (t) => t.type === "matching-headings",
    );
    expect(mc.accuracy).toBe(1);
    expect(mc.stars).toBe("★★★★★");
    expect(mh.accuracy).toBe(0);
    // Sorted highest-accuracy first.
    expect(result.questionTypeAnalysis[0].type).toBe("multiple-choice");
    // Matching Headings (0 accuracy) shows up as a weakness with a label.
    expect(result.weaknesses.some((w) => w.label === "Matching Headings")).toBe(
      true,
    );
  });

  it("produces a band prediction and study plan", () => {
    const result = buildReadingAnalytics({
      passage: makePassage(),
      answers: {
        q1: "TRUE",
        q2: "h1",
        q3: "B",
        q4: "Great Barrier Reef",
        q5: "NO",
      },
      timeSpent: 600,
    });
    // band = 4.5 + accuracy(1) * 3.5 = 8, capped at 8.5.
    expect(result.scorePrediction.currentBand).toBe(8);
    expect(result.scorePrediction.potentialBand).toBeGreaterThanOrEqual(
      result.scorePrediction.currentBand,
    );
    expect(Array.isArray(result.studyPlan.steps)).toBe(true);
    expect(result.studyPlan.steps.length).toBeGreaterThan(0);
    expect(result.studyPlan.estimatedTime).toBeGreaterThanOrEqual(25);
  });
});

describe("buildReadingAnalytics — replay insights", () => {
  it("flags a slow question when dwell time is high", () => {
    const result = buildReadingAnalytics({
      passage: makePassage(),
      answers: {},
      questionDwellTimes: { q3: 120 },
    });
    expect(
      result.replayInsights.some((i) => i.includes("Question 3")),
    ).toBe(true);
  });

  it("notes when the timer was paused", () => {
    const result = buildReadingAnalytics({
      passage: makePassage(),
      answers: {},
      interactionLog: [{ type: "pause" }],
    });
    expect(result.replayInsights.some((i) => i.includes("paused"))).toBe(true);
  });
});
