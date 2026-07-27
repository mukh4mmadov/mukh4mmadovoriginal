import { AIProvider, AIProviderConfig } from './types';
import { AIMessage, AIConversationContext, AIPersonality } from '@/types/aiCoach';
import { buildSystemPrompt } from '../prompts';

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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    if (onChunk) {
      return this.handleStreamResponse(response, onChunk);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  private async handleStreamResponse(
    response: Response,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

      for (const line of lines) {
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullContent += parsed.delta.text;
            onChunk(parsed.delta.text);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    return fullContent;
  }
}
