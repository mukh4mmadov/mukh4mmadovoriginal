import readingTestsModule from "@/data/readingTests_new";

export const MOCK_STORAGE_KEY = "ielts-reading-full-mock-v1";

function prepareFortyQuestionSet(tests) {
  const byDifficulty = Object.fromEntries(["easy", "medium", "hard"].map((level) => [
    level,
    tests.filter((test) => test.difficulty === level),
  ]));
  const variants = [];
  const seen = new Set();
  for (const first of byDifficulty.easy) {
    for (const second of byDifficulty.medium) {
      for (const third of byDifficulty.hard) {
        const passages = [first, second, third].map((test) => test.passages[0]);
        if (new Set(passages.map((passage) => passage.slug)).size !== 3) continue;
        const sectionCounts = passages.map((passage) => passage.questionGroups.flatMap((group) => group.questions).length);
        if (sectionCounts[0] !== 13 || sectionCounts[1] !== 14 || sectionCounts[2] !== 13) continue;
        const id = passages.map((passage) => passage.slug).join("|");
        if (seen.has(id)) continue;
        seen.add(id);
        variants.push({ id, passages });
      }
    }
  }
  return variants;
}

export function findFullMockVariants(tests = readingTestsModule.readingTests, limit = 10) {
  const combinations = prepareFortyQuestionSet(tests);
  if (combinations.length <= limit) return combinations;
  if (limit <= 1) return combinations.slice(0, 1);
  return Array.from({ length: limit }, (_, index) =>
    combinations[Math.round(index * (combinations.length - 1) / (limit - 1))],
  );
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

