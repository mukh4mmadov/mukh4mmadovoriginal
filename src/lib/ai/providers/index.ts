import { AIProvider, AIProviderConfig } from './types';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { ClaudeProvider } from './claude';
import { OpenRouterProvider } from './openrouter';

export class AIProviderFactory {
  static create(provider: 'openai' | 'gemini' | 'claude' | 'openrouter', config: AIProviderConfig): AIProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      case 'claude':
        return new ClaudeProvider(config);
      case 'openrouter':
        return new OpenRouterProvider(config);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

export * from './types';
export * from './openai';
export * from './gemini';
export * from './claude';
export * from './openrouter';
