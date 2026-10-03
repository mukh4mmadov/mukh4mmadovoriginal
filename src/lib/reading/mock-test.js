import readingTestsModule from "@/data/readingTests_new";

export const MOCK_STORAGE_KEY = "ielts-reading-full-mock-v1";

export function findFullMockPassages(tests = readingTestsModule.readingTests) {
  const byDifficulty = Object.fromEntries(["easy", "medium", "hard"].map((level) => [
    level,
    tests.filter((test) => test.difficulty === level),
  ]));
  for (const first of byDifficulty.easy) {
    for (const second of byDifficulty.medium) {
      for (const third of byDifficulty.hard) {
        const passages = [first, second, third].map((test) => test.passages[0]);
        const count = passages.reduce((sum, passage) => sum + passage.questionGroups.flatMap((group) => group.questions).length, 0);
        if (count === 40) return passages;
        if (count > 40) {
          let excess = count - 40;
          const trimmed = passages.map((passage, index) => {
            const groups = passage.questionGroups.map((group) => ({ ...group, questions: [...group.questions] }));
            if (index === 2 && excess > 0) {
              for (let groupIndex = groups.length - 1; groupIndex >= 0 && excess > 0; groupIndex -= 1) {
                const removeCount = Math.min(excess, groups[groupIndex].questions.length - 1);
                if (removeCount > 0) groups[groupIndex].questions = groups[groupIndex].questions.slice(0, groups[groupIndex].questions.length - removeCount);
                excess -= removeCount;
              }
            }
            return { ...passage, questionGroups: groups };
          });
          if (excess === 0) return trimmed;
        }
      }
    }
  }
  return null;
}

export function getMockBand(rawScore) {
  const rows = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
  return rows.find(([minimum]) => rawScore >= minimum)?.[1] ?? 0;
}

