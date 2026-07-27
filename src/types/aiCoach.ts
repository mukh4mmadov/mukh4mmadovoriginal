export type AIPersonality = 'friendly' | 'strict' | 'savage';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIConversationContext {
  passage: {
    title: string;
    paragraphs: Array<{ label?: string; text: string }>;
  };
  question?: {
    id: string;
    type: string;
    prompt?: string;
    before?: string;
    after?: string;
    userAnswer?: string;
    correctAnswer: string | string[];
    explanation?: string;
    evidence?: string;
    paragraphLabel?: string;
  };
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AIStreamResponse {
  content: string;
  done: boolean;
}
