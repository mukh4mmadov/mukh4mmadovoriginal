// Exam countdown and today's focus, built from the learner's exam date,
// target band and what their results say is weakest.

const DAY = 24 * 60 * 60 * 1000;

// Whole days from today to the exam date (both "YYYY-MM-DD", local days).
export function daysUntil(examDate, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate || "") || !/^\d{4}-\d{2}-\d{2}$/.test(today || "")) return null;
  return Math.round((Date.parse(`${examDate}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / DAY);
}

export function examPhase(daysLeft) {
  if (daysLeft == null) return null;
  if (daysLeft < 0) return { id: "passed", label: "Exam date passed", advice: "Set your next exam date to get a new plan." };
  if (daysLeft <= 2) return { id: "rest", label: "Rest and review", advice: "No new tests now. Look over your mistakes and words, sleep well and arrive early." };
  if (daysLeft <= 14) return { id: "sprint", label: "Final sprint", advice: "Practise under exam conditions and fix your weakest areas." };
  if (daysLeft <= 42) return { id: "exam-practice", label: "Exam practice", advice: "Take a full mock every week and drill the question types you miss most." };
  return { id: "build", label: "Build your skills", advice: "Practise a little every day; each skill counts the same." };
}

const SKILL_TASKS = {
  reading: { id: "skill-reading", title: "Practise a Reading passage", href: "/reading" },
  listening: { id: "skill-listening", title: "Take a Listening test", href: "/listening" },
  writing: { id: "skill-writing", title: "Write a Task 2 essay for feedback", href: "/writing" },
};
// A skill without a band yet needs the test that gives one.
const FIRST_BAND_TASKS = {
  reading: { id: "skill-reading", title: "Take the Reading mock to get a band", href: "/readingmock" },
  listening: { id: "skill-listening", title: "Take a Listening test", href: "/listening" },
  writing: { id: "skill-writing", title: "Take a full Writing test", href: "/writing/test" },
};
const typeLabel = (type) => String(type).replace(/-/g, " ");

/**
 * input: { daysLeft, targetBand, estimate: { overall, weakest, missing },
 *          weakestQuestionType: { type, accuracy } | null,
 *          daysSinceFullMock: number | null, savedWords: number }
 */
export function buildExamPlan({ daysLeft, targetBand, estimate, weakestQuestionType, daysSinceFullMock, savedWords = 0 }) {
  const phase = examPhase(daysLeft);
  const overall = estimate?.overall ?? null;
  const gap = overall != null && targetBand != null ? Math.round((Number(targetBand) - overall) * 2) / 2 : null;
  const tasks = [];
  if (!phase || phase.id === "passed") return { phase, gap, tasks };

  if (phase.id === "rest") {
    tasks.push({ id: "rest-mistakes", title: "Look over your saved mistakes", why: "Remind yourself of traps without tiring yourself.", href: "/review" });
    if (savedWords > 0) tasks.push({ id: "rest-words", title: "Read through your saved words", why: `${savedWords} words in your notebook.`, href: "/vocabulary" });
    return { phase, gap, tasks };
  }

  // Full mocks get more frequent as the exam gets closer.
  const mockEvery = phase.id === "sprint" ? 3 : phase.id === "exam-practice" ? 7 : 21;
  if (daysSinceFullMock == null || daysSinceFullMock >= mockEvery) {
    tasks.push({
      id: "full-mock",
      title: "Take a full mock test",
      why: daysSinceFullMock == null ? "See your band in all three parts." : `Your last full mock was ${daysSinceFullMock} days ago.`,
      href: "/full-mock",
    });
  }

  // A skill with no result yet comes first, then the weakest one.
  const missing = estimate?.missing?.[0];
  const focusSkill = missing?.id || estimate?.weakest?.id || "reading";
  const skillTask = (missing ? FIRST_BAND_TASKS : SKILL_TASKS)[focusSkill] || SKILL_TASKS.reading;
  tasks.push({
    ...skillTask,
    why: missing
      ? `You have no ${missing.label} result yet.`
      : estimate?.weakest
        ? `${estimate.weakest.label} is your lowest band (${Number(estimate.weakest.result.band).toFixed(1)}).`
        : "Daily practice keeps your skills sharp.",
  });

  if (weakestQuestionType) {
    tasks.push({
      id: "drill",
      title: `Drill 10 ${typeLabel(weakestQuestionType.type)} questions`,
      why: `Your accuracy on this type is ${Math.round(weakestQuestionType.accuracy * 100)}%.`,
      href: `/reading/practice/${weakestQuestionType.type}`,
    });
  }

  tasks.push(savedWords > 0
    ? { id: "words", title: "Review your saved words", why: `${savedWords} words in your notebook.`, href: "/vocabulary" }
    : { id: "words", title: "Save 3 new words while reading", why: "A wider vocabulary lifts every skill.", href: "/reading" });

  return { phase, gap, tasks: tasks.slice(0, 4) };
}
