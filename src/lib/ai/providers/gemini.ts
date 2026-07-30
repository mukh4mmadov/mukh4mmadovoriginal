import { AIProvider, AIProviderConfig } from './types';
import { AIMessage, AIConversationContext, AIPersonality } from '@/types/aiCoach';
import { buildSystemPrompt } from '../prompts';
import { assertResponseOk } from './stream';

export class GeminiProvider implements AIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async sendMessage(
    messages: AIMessage[],
    context: AIConversationContext,
    personality: AIPersonality,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = buildSystemPrompt(personality, context);
    
    const response = await fetch(`${this.config.baseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${this.config.model || 'gemini-pro'}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    await assertResponseOk(response, 'Gemini');

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }
}
