import { AIMessage, AIConversationContext, AIPersonality } from '@/types/aiCoach';

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AIProvider {
  sendMessage(
    messages: AIMessage[],
    context: AIConversationContext,
    personality: AIPersonality,
    onChunk?: (chunk: string) => void
  ): Promise<string>;
}
