// Shared types for Reading and Listening practice modules

export type ReadingQuestionType =
  | "true-false-not-given"
  | "yes-no-not-given"
  | "matching-headings"
  | "sentence-completion"
  | "multiple-choice";

export interface BaseQuestion {
  id: string;
  number: number;
  prompt: string;
  explanation?: string;
  evidence?: string;
}

export interface TFNGQuestion extends BaseQuestion {
  type: "true-false-not-given";
  answer: "TRUE" | "FALSE" | "NOT GIVEN";
}

export interface YNNGQuestion extends BaseQuestion {
  type: "yes-no-not-given";
  answer: "YES" | "NO" | "NOT GIVEN";
}

export interface MatchingHeadingsQuestion extends BaseQuestion {
  type: "matching-headings";
  paragraphLabel: string; // e.g. "Paragraph A"
  answer: string; // heading id
}

export interface SentenceCompletionQuestion extends Omit<BaseQuestion, "prompt"> {
  type: "sentence-completion";
  prompt?: string;
  before: string;
  after: string;
  maxWords: number;
  answer: string[]; // accepted answers (case-insensitive)
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice";
  options: { key: string; text: string }[];
  answer: string; // option key
}

export type ReadingQuestion =
  | TFNGQuestion
  | YNNGQuestion
  | MatchingHeadingsQuestion
  | SentenceCompletionQuestion
  | MultipleChoiceQuestion;

export interface HeadingOption {
  id: string;
  text: string;
}

export interface ReadingPassage {
  slug: string;
  title: string;
  subtitle?: string;
  wordCount?: number;
  paragraphs: { label: string; text: string }[];
  headingBank?: HeadingOption[];
  questionGroups: {
    instructions: string;
    questions: ReadingQuestion[];
  }[];
}

export interface ReadingTest {
  slug: string;
  title: string;
  subtitle: string;
  passages: ReadingPassage[];
  difficulty?: "easy" | "medium" | "hard";
}

export interface ListeningQuestion {
  id: string;
  number: number;
  prompt: string;
  type: "gap-fill" | "multiple-choice";
  options?: { key: string; text: string }[];
  answer: string[];
  maxWords?: number;
}

export interface ListeningSection {
  sectionNumber: 1 | 2 | 3 | 4;
  title: string;
  context: string;
  script: string; // spoken via TTS
  questions: ListeningQuestion[];
}

export interface ListeningTest {
  slug: string;
  title: string;
  subtitle: string;
  sections: ListeningSection[];
}
