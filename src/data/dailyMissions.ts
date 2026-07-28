export interface Mission {
  id: string;
  text: string;
}

export const missionSets: Mission[][] = [
  [
    { id: "1", text: "Complete one Reading test" },
    { id: "2", text: "Learn 15 new words" },
    { id: "3", text: "Review yesterday's mistakes" }
  ],
  [
    { id: "1", text: "Read for 30 minutes" },
    { id: "2", text: "Practice 10 True/False questions" },
    { id: "3", text: "Learn 5 academic words" }
  ],
  [
    { id: "1", text: "Complete two Reading passages" },
    { id: "2", text: "Review all incorrect answers" },
    { id: "3", text: "Write down 10 new vocabulary words" }
  ],
  [
    { id: "1", text: "Practice matching headings" },
    { id: "2", text: "Learn 20 new words" },
    { id: "3", text: "Time yourself on one full test" }
  ],
  [
    { id: "1", text: "Complete one test under timed conditions" },
    { id: "2", text: "Analyze your weak question types" },
    { id: "3", text: "Review 5 difficult passages" }
  ],
  [
    { id: "1", text: "Read one academic article" },
    { id: "2", text: "Practice summary completion" },
    { id: "3", text: "Learn 10 synonyms for common words" }
  ],
  [
    { id: "1", text: "Complete three Reading tests" },
    { id: "2", text: "Focus on your weakest section" },
    { id: "3", text: "Create a vocabulary list" }
  ],
  [
    { id: "1", text: "Practice skimming and scanning" },
    { id: "2", text: "Learn 15 academic words" },
    { id: "3", text: "Review one week's worth of mistakes" }
  ],
  [
    { id: "1", text: "Complete one test with no time limit" },
    { id: "2", text: "Practice multiple choice questions" },
    { id: "3", text: "Read the explanations for all answers" }
  ],
  [
    { id: "1", text: "Set a new personal best time" },
    { id: "2", text: "Master one question type" },
    { id: "3", text: "Teach someone else a reading strategy" }
  ]
];
