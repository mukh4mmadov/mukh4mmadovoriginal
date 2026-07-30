import { AIProvider, AIProviderConfig } from './types';
import { AIMessage, AIConversationContext, AIPersonality } from '@/types/aiCoach';
import { buildSystemPrompt } from '../prompts';
import { assertResponseOk, chatCompletionDelta, consumeSSEStream } from './stream';

export class OpenRouterProvider implements AIProvider {
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
    
    const response = await fetch(`${this.config.baseUrl || 'https://openrouter.ai/api/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'IELTS Reading Coach',
      },
      body: JSON.stringify({
        model: this.config.model || 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        stream: !!onChunk,
        temperature: 0.7,
      }),
    });

    await assertResponseOk(response, 'OpenRouter');

    if (onChunk) {
      return consumeSSEStream(response, chatCompletionDelta, onChunk);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}
