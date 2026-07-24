const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const variance = (values) => {
  if (!values.length) return 0;
  const mean = average(values);
  return average(values.map((value) => (value - mean) ** 2));
};

const standardDeviation = (values) => Math.sqrt(variance(values));

function isCorrect(question, given) {
  if (!given) return false;
  if (question.type === "true-false-not-given")
    return given === question.answer;
  if (question.type === "yes-no-not-given") return given === question.answer;
  if (question.type === "matching-headings") return given === question.answer;
  if (question.type === "multiple-choice") return given === question.answer;
  if (question.type === "sentence-completion") {
    return question.answer.some((answer) => {
      const normalizedGiven = given.trim().toLowerCase().replace(/\s+/g, " ");
      const normalizedAnswer = answer.trim().toLowerCase().replace(/\s+/g, " ");
      return normalizedGiven === normalizedAnswer;
    });
  }
  return false;
}

function getStars(score) {
  const rounded = Math.round(clamp(score, 0, 1) * 5);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

function formatMinutes(seconds) {
  if (!seconds) return "0 min";
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min`;
}

export function buildReadingAnalytics({
  passage,
  answers = {},
  timeSpent = 0,
  questionDwellTimes = {},
  answerChangeCounts = {},
  pauseCount = 0,
  interactionLog = [],
}) {
  const questions = passage.questionGroups.flatMap((group) => group.questions);
  const correctCount = questions.filter((question) =>
    isCorrect(question, answers[question.id]),
  ).length;
  const incorrectCount = questions.filter(
    (question) =>
      answers[question.id] && !isCorrect(question, answers[question.id]),
  ).length;
  const skippedCount = questions.filter(
    (question) => !answers[question.id],
  ).length;
  const accuracy = questions.length ? correctCount / questions.length : 0;
  const wordCount = passage.wordCount ?? 0;
  const readingSpeed =
    wordCount && timeSpent
      ? Math.round((wordCount / Math.max(1, timeSpent)) * 60)
      : 0;

  const dwellValues = Object.values(questionDwellTimes).filter(
    (value) => Number(value) > 0,
  );
  const averageDwell = average(dwellValues);
  const dwellSpread = standardDeviation(dwellValues);
  const consistencyScore = clamp(100 - dwellSpread * 5, 0, 100);

  const targetTime = 20 * 60;
  const timePressurePenalty =
    Math.max(0, (timeSpent - targetTime) / targetTime) * 45;
  const pausePenalty = pauseCount * 4;
  const dwellPenalty = Math.max(0, (averageDwell - 45) / 45) * 20;
  const timeManagementScore = clamp(
    100 - timePressurePenalty - pausePenalty - dwellPenalty,
    0,
    100,
  );

  const answerChangePenalty =
    Object.values(answerChangeCounts).reduce((sum, count) => sum + count, 0) *
    5;
  const confidenceScore = clamp(
    100 - answerChangePenalty - skippedCount * 3,
    0,
    100,
  );

  const vocabularyQuestions = questions.filter((question) =>
    ["sentence-completion", "matching-headings"].includes(question.type),
  );
  const vocabularyAccuracy = vocabularyQuestions.length
    ? vocabularyQuestions.filter((question) =>
        isCorrect(question, answers[question.id]),
      ).length / vocabularyQuestions.length
    : accuracy;
  const vocabularyStrength = clamp(vocabularyAccuracy * 100, 0, 100);

  const typeAnalysis = questions.reduce((accumulator, question) => {
    const existing = accumulator.get(question.type) || {
      type: question.type,
      correct: 0,
      total: 0,
    };
    existing.total += 1;
    if (isCorrect(question, answers[question.id])) existing.correct += 1;
    accumulator.set(question.type, existing);
    return accumulator;
  }, new Map());

  const typeSummary = Array.from(typeAnalysis.values())
    .map((entry) => ({
      type: entry.type,
      correct: entry.correct,
      total: entry.total,
      accuracy: entry.total ? entry.correct / entry.total : 0,
      stars: getStars(entry.total ? entry.correct / entry.total : 0),
      label: entry.type
        .split("-")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" "),
    }))
    .sort((left, right) => right.accuracy - left.accuracy);

  const weakestType = typeSummary.reduce((weakest, current) => {
    if (!weakest) return current;
    return current.accuracy < weakest.accuracy ? current : weakest;
  }, null);

  const strongestType = typeSummary.reduce((strongest, current) => {
    if (!strongest) return current;
    return current.accuracy > strongest.accuracy ? current : strongest;
  }, null);

  const strengths = typeSummary
    .filter((entry) => entry.accuracy >= 0.75)
    .slice(0, 3);
  const weaknesses = typeSummary
    .filter((entry) => entry.accuracy < 0.6)
    .slice(0, 3);

  const replayInsights = [];
  const firstFive = questions.slice(0, 5);
  const firstFiveAccuracy = firstFive.length
    ? firstFive.filter((question) => isCorrect(question, answers[question.id]))
        .length / firstFive.length
    : 0;
  const firstFiveDwell = firstFive.length
    ? average(firstFive.map((question) => questionDwellTimes[question.id] || 0))
    : 0;

  if (firstFiveAccuracy >= 0.6 && firstFiveDwell <= 45) {
    replayInsights.push(
      "You answered the opening questions quickly and accurately.",
    );
  }

  const slowestQuestion = questions.reduce((slowest, question) => {
    const current = questionDwellTimes[question.id] || 0;
    if (!slowest)
      return { id: question.id, dwell: current, number: question.number };
    return current > slowest.dwell
      ? { id: question.id, dwell: current, number: question.number }
      : slowest;
  }, null);

  if (slowestQuestion && slowestQuestion.dwell >= 75) {
    replayInsights.push(
      `You spent the most time on Question ${slowestQuestion.number}.`,
    );
  }

  if (weakestType && weakestType.accuracy < 0.6) {
    replayInsights.push(
      `Most of your incorrect answers came from ${weakestType.label}.`,
    );
  }

  if (Object.values(answerChangeCounts).some((count) => count > 1)) {
    replayInsights.push(
      "You changed your answer more than once on several questions.",
    );
  }

  const laterQuestions = questions.slice(Math.floor(questions.length / 2));
  const earlierQuestions = questions.slice(0, Math.floor(questions.length / 2));
  const laterAverageDwell = average(
    laterQuestions.map((question) => questionDwellTimes[question.id] || 0),
  );
  const earlierAverageDwell = average(
    earlierQuestions.map((question) => questionDwellTimes[question.id] || 0),
  );
  if (laterAverageDwell > earlierAverageDwell * 1.25) {
    replayInsights.push(
      "Your reading pace slowed noticeably in the second half of the test.",
    );
  }

  if (interactionLog.some((entry) => entry.type === "pause")) {
    replayInsights.push(
      "You paused the timer at least once, which can indicate careful reassessment.",
    );
  }

  const recommendations = [];
  if (weakestType && weakestType.accuracy < 0.6) {
    recommendations.push(
      `Practice ${weakestType.label} with timed drills until your accuracy rises above 70%.`,
    );
  }
  if (timeManagementScore < 75) {
    recommendations.push(
      "Use a two-pass strategy: answer the easier questions first and leave the harder ones for a second review.",
    );
  }
  if (vocabularyStrength < 70) {
    recommendations.push(
      "Review paraphrase and synonym patterns in the passage before selecting your final answer.",
    );
  }
  if (accuracy < 0.7) {
    recommendations.push(
      "Go back over the evidence in each paragraph before locking in your answer.",
    );
  }

  const band = Math.min(8.5, Math.max(4.5, 4.5 + accuracy * 3.5));
  const potentialBand = Math.min(
    8.5,
    band +
      (timeManagementScore >= 75 ? 0.5 : 0.25) +
      (accuracy >= 0.8 ? 0.0 : 0.25),
  );
  const mainObstacle =
    timeManagementScore < 75
      ? "Time Management"
      : weakestType?.label || "Accuracy";

  const studyPlan = [];
  if (weakestType && weakestType.type === "matching-headings") {
    studyPlan.push("2 matching headings passages");
  } else if (weakestType && weakestType.type === "sentence-completion") {
    studyPlan.push("2 sentence completion drills");
  } else {
    studyPlan.push("1 timed passage review");
  }

  if (weakestType && weakestType.type !== "true-false-not-given") {
    studyPlan.push("1 TFNG passage");
  }
  studyPlan.push("Vocabulary review");

  return {
    readingSpeed,
    accuracy,
    accuracyPercent: Math.round(accuracy * 100),
    timeManagementScore,
    consistencyScore,
    confidenceScore,
    vocabularyStrength,
    questionTypeAnalysis: typeSummary,
    strengths,
    weaknesses,
    replayInsights,
    recommendations,
    scorePrediction: {
      currentBand: Number(band.toFixed(1)),
      potentialBand: Number(potentialBand.toFixed(1)),
      mainObstacle,
    },
    studyPlan: {
      steps: studyPlan,
      estimatedTime: Math.max(
        25,
        20 +
          Math.round((100 - timeManagementScore) / 10) +
          Math.round((100 - vocabularyStrength) / 20),
      ),
    },
    summary: {
      correctCount,
      incorrectCount,
      skippedCount,
      averageDwell: Math.round(averageDwell),
      timeSpent: formatMinutes(timeSpent),
      wordCount,
    },
  };
}
