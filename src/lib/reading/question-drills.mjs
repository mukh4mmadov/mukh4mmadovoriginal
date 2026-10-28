// Question-type drills: single questions from every passage, each shown with
// the paragraph that holds its answer.
import { locateEvidence } from "./evidence-locator.mjs";

export const DRILL_TYPES = [
  { type: "true-false-not-given", label: "True / False / Not Given", tip: "TRUE matches the passage, FALSE contradicts it, NOT GIVEN means the passage doesn't say." },
  { type: "yes-no-not-given", label: "Yes / No / Not Given", tip: "These ask about the writer's views or claims, not facts. Look for opinion words." },
  { type: "multiple-choice", label: "Multiple Choice", tip: "Find the part of the paragraph the question is about, then rule out options that only share words with it." },
  { type: "sentence-completion", label: "Sentence Completion", tip: "Copy words exactly from the paragraph and keep within the word limit." },
  { type: "matching-headings", label: "Matching Headings", tip: "Read for the main idea of the whole paragraph, not a single detail." },
];

export const getDrillType = (type) => DRILL_TYPES.find((entry) => entry.type === type) || null;

export function buildDrillPool(readingTests, type) {
  const pool = [];
  for (const test of readingTests || []) {
    for (const passage of test.passages || []) {
      for (const group of passage.questionGroups || []) {
        for (const question of group.questions || []) {
          if (question.type !== type) continue;
          // Without a heading list, "matching" asks which paragraph; a single paragraph would give it away.
          if (type === "matching-headings" && !passage.headingBank?.length) continue;
          // Summaries answered with a letter from a word list need that list, which a single question can't show.
          if (type === "sentence-completion" && [].concat(question.answer).every((answer) => /^[A-Z]$/.test(String(answer)))) continue;
          const location = locateEvidence(passage, question);
          if (!location) continue;
          pool.push({
            key: `${passage.slug}:${question.id}`,
            passage: { slug: passage.slug, title: passage.title, headingBank: passage.headingBank || null },
            paragraph: passage.paragraphs[location.paragraphIndex],
            location,
            question,
          });
        }
      }
    }
  }
  return pool;
}

// A shuffled round of up to `size` items; `random` is injectable for tests.
export function pickDrillRound(pool, size = 10, random = Math.random) {
  const copy = [...pool];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy.slice(0, size);
}
