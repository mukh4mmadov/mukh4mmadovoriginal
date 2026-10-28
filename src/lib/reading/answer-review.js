const REVIEW_QUEUE_KEY = "ielts-reading-review-queue-v1";

function storageKey(userId) {
  return `${REVIEW_QUEUE_KEY}:${userId || "guest"}`;
}

function reviewedStorageKey(userId) {
  return `${REVIEW_QUEUE_KEY}:reviewed:${userId || "guest"}`;
}

export function isAnswerCorrect(question, givenAnswer) {
  if (givenAnswer === undefined || givenAnswer === null || givenAnswer === "") {
    return false;
  }

  if (
    question.type === "true-false-not-given" ||
    question.type === "yes-no-not-given" ||
    question.type === "matching-headings" ||
    question.type === "multiple-choice"
  ) {
    return givenAnswer === question.answer;
  }

  if (question.type === "sentence-completion") {
    const acceptedAnswers = Array.isArray(question.answer)
      ? question.answer
      : [question.answer];
    const normalize = (value) => String(value).trim().toLowerCase().replace(/\s+/g, " ");
    return acceptedAnswers.some((answer) => normalize(answer) === normalize(givenAnswer));
  }

  return false;
}

// The word list ("List of words A–I") a summary question's letters refer to.
export function findWordBank(passage, question) {
  return passage?.questionGroups?.find((group) => group.questions?.some((item) => item.id === question.id))?.wordBank || null;
}

export function formatAnswer(question, answer, passage) {
  if (answer === undefined || answer === null || answer === "") return "Skipped";
  const wordBank = question.type === "sentence-completion" ? findWordBank(passage, question) : null;
  if (wordBank) {
    return [answer].flat().map((value) => {
      const word = wordBank.find((item) => item.id === String(value).trim().toUpperCase());
      return word ? `${word.id}. ${word.text}` : String(value);
    }).join(" / ");
  }
  if (Array.isArray(answer)) return answer.join(" / ");

  if (question.type === "multiple-choice") {
    const option = question.options?.find((item) => item.key === answer);
    return option ? `${option.key}. ${option.text}` : String(answer);
  }

  if (question.type === "matching-headings") {
    const heading = passage.headingBank?.find((item) => item.id === answer);
    return heading ? `${answer}. ${heading.text}` : String(answer);
  }

  return String(answer);
}

export function getReviewQueue(userId) {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(storageKey(userId));
    const queue = stored ? JSON.parse(stored) : [];
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}

function saveReviewQueue(queue, userId) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

export function addMissedQuestionsToReviewQueue(passage, answers, userId) {
  const currentQueue = getReviewQueue(userId);
  const byId = new Map(currentQueue.map((item) => [item.id, item]));
  const timestamp = new Date().toISOString();
  const questions = passage.questionGroups.flatMap((group) => group.questions);

  questions.forEach((question, index) => {
    const answer = answers[question.id];
    if (answer && isAnswerCorrect(question, answer)) return;

    const id = `${passage.slug}:${question.id}`;
    const existing = byId.get(id);
    byId.set(id, {
      id,
      passageSlug: passage.slug,
      passageTitle: passage.title,
      questionId: question.id,
      questionNumber: index + 1,
      questionType: question.type,
      questionText:
        question.type === "matching-headings" && passage.headingBank?.length > 0
          ? question.paragraphLabel
          : question.prompt,
      sentenceBefore: question.type === "sentence-completion" ? question.before : null,
      sentenceAfter: question.type === "sentence-completion" ? question.after : null,
      selectedAnswer: formatAnswer(question, answer, passage),
      correctAnswer: formatAnswer(question, question.answer, passage),
      explanation: question.explanation || "",
      evidence: question.evidence || "",
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp,
      attempts: (existing?.attempts || 0) + 1,
    });
  });

  const nextQueue = [...byId.values()].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt),
  );
  return saveReviewQueue(nextQueue, userId) ? nextQueue : null;
}

export function removeReviewQueueItem(itemId, userId) {
  const nextQueue = getReviewQueue(userId).filter((item) => item.id !== itemId);
  if (!saveReviewQueue(nextQueue, userId)) return null;
  unmarkQuestionReviewed(itemId, userId);
  return nextQueue;
}

export function clearReviewQueue(userId) {
  if (!saveReviewQueue([], userId)) return false;
  try {
    window.localStorage.removeItem(reviewedStorageKey(userId));
  } catch {
    return false;
  }
  return true;
}

export function markQuestionReviewed(itemId, userId) {
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(reviewedStorageKey(userId));
    const reviewedIds = stored ? JSON.parse(stored) : [];
    const nextIds = new Set(Array.isArray(reviewedIds) ? reviewedIds : []);
    nextIds.add(itemId);
    window.localStorage.setItem(reviewedStorageKey(userId), JSON.stringify([...nextIds]));
    return true;
  } catch {
    return false;
  }
}

export function isQuestionReviewed(itemId, userId) {
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(reviewedStorageKey(userId));
    const reviewedIds = stored ? JSON.parse(stored) : [];
    return Array.isArray(reviewedIds) && reviewedIds.includes(itemId);
  } catch {
    return false;
  }
}

export function unmarkQuestionReviewed(itemId, userId) {
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(reviewedStorageKey(userId));
    const reviewedIds = stored ? JSON.parse(stored) : [];
    const nextIds = Array.isArray(reviewedIds)
      ? reviewedIds.filter((reviewedId) => reviewedId !== itemId)
      : [];
    window.localStorage.setItem(reviewedStorageKey(userId), JSON.stringify(nextIds));
    return true;
  } catch {
    return false;
  }
}

export function getReviewedQuestionCount(userId) {
  if (typeof window === "undefined") return 0;

  try {
    const stored = window.localStorage.getItem(reviewedStorageKey(userId));
    const reviewedIds = stored ? JSON.parse(stored) : [];
    return Array.isArray(reviewedIds) ? new Set(reviewedIds).size : 0;
  } catch {
    return 0;
  }
}

export function getReviewedQuestionIds(userId) {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(reviewedStorageKey(userId));
    const reviewedIds = stored ? JSON.parse(stored) : [];
    return Array.isArray(reviewedIds) ? reviewedIds : [];
  } catch {
    return [];
  }
}

// Replaces this browser's queue and reviewed marks, e.g. after merging with the account copy.
export function replaceReviewQueue(queue, reviewedIds, userId) {
  if (!saveReviewQueue(queue, userId)) return false;
  try {
    window.localStorage.setItem(reviewedStorageKey(userId), JSON.stringify(reviewedIds));
    return true;
  } catch {
    return false;
  }
}
