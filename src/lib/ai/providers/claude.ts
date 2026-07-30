import { AIProvider, AIProviderConfig } from './types';
import { AIMessage, AIConversationContext, AIPersonality } from '@/types/aiCoach';
import { buildSystemPrompt } from '../prompts';
import { assertResponseOk, consumeSSEStream } from './stream';

interface ClaudeStreamEvent {
  type?: string;
  delta?: { text?: string };
}

function claudeDelta(event: unknown): string | undefined {
  const { type, delta } = event as ClaudeStreamEvent;
  return type === 'content_block_delta' ? delta?.text : undefined;
}

export class ClaudeProvider implements AIProvider {
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
    
    const response = await fetch(`${this.config.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: !!onChunk,
      }),
    });

    await assertResponseOk(response, 'Claude');

    if (onChunk) {
      return consumeSSEStream(response, claudeDelta, onChunk);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }
}
