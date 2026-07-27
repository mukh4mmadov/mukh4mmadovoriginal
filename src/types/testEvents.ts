export type TestEvent =
  | { type: "opened"; timestamp: number }
  | { type: "highlighted"; text: string; timestamp: number }
  | { type: "highlight_removed"; text: string; timestamp: number }
  | { type: "answered"; questionId: string; questionNumber: number; answer: string; timestamp: number }
  | { type: "answer_changed"; questionId: string; questionNumber: number; oldAnswer: string; newAnswer: string; timestamp: number }
  | { type: "question_skipped"; questionId: string; questionNumber: number; timestamp: number }
  | { type: "question_returned"; questionId: string; questionNumber: number; timestamp: number }
  | { type: "submitted"; timestamp: number };
