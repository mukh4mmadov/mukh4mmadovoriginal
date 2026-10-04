import readingTestsModule from "@/data/readingTests_new";

export const MOCK_STORAGE_KEY = "ielts-reading-full-mock-v1";

function prepareFortyQuestionSet(tests) {
  const questionCount = (test) => test.passages[0].questionGroups
    .flatMap((group) => group.questions).length;
  const sortByLength = (a, b) => (a.passages[0].wordCount || 0) - (b.passages[0].wordCount || 0)
    || a.slug.localeCompare(b.slug);
  const thirteenQuestionTests = tests.filter((test) => questionCount(test) === 13).sort(sortByLength);
  const fourteenQuestionTests = tests.filter((test) => questionCount(test) === 14).sort(sortByLength);

  // A mock needs a unique 14-question middle passage. Pair it with unused
  // 13-question passages, choosing shorter passages first and longer ones last.
  const count = Math.min(fourteenQuestionTests.length, Math.floor(thirteenQuestionTests.length / 2));
  const variants = [];
  for (let index = 0; index < count; index += 1) {
    const passages = [
      thirteenQuestionTests[index].passages[0],
      fourteenQuestionTests[index].passages[0],
      thirteenQuestionTests[thirteenQuestionTests.length - 1 - index].passages[0],
    ];
    const id = passages.map((passage) => passage.slug).join("|");
    variants.push({ id, passages });
  }
  return variants;
}

export function findFullMockVariants(tests = readingTestsModule.readingTests, limit = 10) {
  return prepareFortyQuestionSet(tests).slice(0, Math.max(0, limit));
}

const QUESTIONS_ADDED_FOR_UNIQUE_MOCKS = new Set([
  "caral-q14",
  "microplastics-q54-extra",
  "ai-ethics-q28",
  "ocean-acidification-q41",
]);

export function findFullMockVariant(variantId, variants = findFullMockVariants(), variantVersion = 1) {
  const currentVariant = variants.find((variant) => variant.id === variantId);
  if (currentVariant && variantVersion >= 2) return currentVariant;

  // Older saved drafts store the three passage slugs in their variant ID.
  // Rebuild that 40-question set without the four questions added later.
  const passageSlugs = String(variantId || "").split("|");
  if (passageSlugs.length !== 3 || passageSlugs.some((slug) => !slug)) return null;
  const passages = passageSlugs.map((slug) => {
    const passage = readingTestsModule.readingTests.find((test) => test.slug === slug)?.passages[0];
    if (!passage) return null;
    return {
      ...passage,
      questionGroups: passage.questionGroups.map((group) => ({
        ...group,
        questions: group.questions.filter((question) => !QUESTIONS_ADDED_FOR_UNIQUE_MOCKS.has(question.id)),
      })),
    };
  });
  if (passages.some((passage) => !passage)) return null;
  const totalQuestions = passages.reduce((total, passage) =>
    total + passage.questionGroups.flatMap((group) => group.questions).length, 0);
  return totalQuestions === 40 ? { id: variantId, passages, legacy: true } : null;
}

export function chooseFullMockVariant(variants, previousResults = []) {
  if (!variants.length) return null;
  const recent = previousResults.slice(-Math.min(variants.length, 10));
  const recentIds = new Set(recent.map((result) => result.variantId).filter(Boolean));
  const unseen = variants.filter((variant) => !recentIds.has(variant.id));
  const pool = unseen.length ? unseen : variants;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function hasUsedFullMockVariant(variant, previousResults = []) {
  if (!variant) return false;
  const titles = variant.passages.map((passage) => passage.title);
  return previousResults.some((result) => {
    if (result.variantId === variant.id) return true;
    const previousTitles = result.passageTitles || [...new Map(
      (result.answers || []).map((answer) => [answer.passageNumber, answer.passageTitle]),
    ).entries()].sort(([a], [b]) => a - b).map(([, title]) => title);
    return previousTitles.length === titles.length && previousTitles.every((title, index) => title === titles[index]);
  });
}

export function findFullMockPassages(tests = readingTestsModule.readingTests) {
  return findFullMockVariants(tests, 1)[0]?.passages ?? null;
}

export { getMockBand } from "./mock-scoring.mjs";

