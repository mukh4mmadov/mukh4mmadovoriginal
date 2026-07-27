import { AIProviderConfig, AIStreamResponse, AIMessage, AIConversationContext, AIPersonality } from '@/types/aiCoach';

export interface AIProvider {
  sendMessage(
    messages: AIMessage[],
    context: AIConversationContext,
    personality: AIPersonality,
    onChunk?: (chunk: string) => void
  ): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
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
    const systemPrompt = this.getSystemPrompt(personality, context);
    
    const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com'}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        stream: !!onChunk,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI provider error: ${response.statusText}`);
    }

    if (onChunk) {
      return this.handleStreamResponse(response, onChunk);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
          const content = parsed.choices[0]?.delta?.content;
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    return fullContent;
  }

  private getSystemPrompt(personality: AIPersonality, context: AIConversationContext): string {
    const basePrompt = `You are an IELTS Reading Coach helping students improve their reading skills. 

Current passage context:
- Title: ${context.passage.title}
- Paragraphs: ${context.passage.paragraphs.map((p, i) => `${p.label || `Paragraph ${i + 1}`}: ${p.text.substring(0, 100)}...`).join('\n')}

${context.question ? `
Current question:
- Type: ${context.question.type}
- Question: ${context.question.prompt}${context.question.before ? `\n- Before: ${context.question.before}` : ''}${context.question.after ? `\n- After: ${context.question.after}` : ''}
- User's answer: ${context.question.userAnswer || 'Not answered'}
- Correct answer: ${Array.isArray(context.question.correctAnswer) ? context.question.correctAnswer.join(', ') : context.question.correctAnswer}
- Explanation: ${context.question.explanation || 'Not provided'}
- Evidence: ${context.question.evidence || 'Not provided'}
` : ''}

IMPORTANT RULES:
1. Always base your answers on the provided passage context. Never hallucinate or make up information.
2. If you don't have enough context to answer, say so clearly.
3. Be concise and practical. Focus on actionable advice.
4. When explaining why an answer is wrong, reference specific evidence from the passage.
5. Help students understand the reasoning, not just give the answer.
6. If asked for a hint, give a subtle clue that guides them without revealing the answer directly.
7. Remember previous questions in this conversation to provide contextual help.
`;

    const personalityPrompts = {
      friendly: `${basePrompt}

PERSONALITY: Friendly Teacher 😊
- Be patient, encouraging, and supportive
- Celebrate small wins and progress
- Use warm, positive language
- Frame mistakes as learning opportunities
- End with motivational encouragement
- Example: "Great question! Let's look at this together. The key here is..."`,

      strict: `${basePrompt}

PERSONALITY: Strict Examiner 📋
- Be professional, direct, and formal
- Focus on accuracy and precision
- Use clear, objective language
- Point out errors matter-of-factly
- Emphasize IELTS exam standards
- Example: "Your answer is incorrect. The evidence is in paragraph 3, line 12..."`,

      savage: `${basePrompt}

PERSONALITY: Savage Coach 😈
- Be funny, sarcastic, and brutally honest
- Roast bad habits, NEVER the person personally
- Use energetic, dramatic language
- Call out lazy thinking or rushing
- Always end with genuinely useful advice
- Examples of good roasts:
  * "That answer looks like it was chosen by closing your eyes and clicking randomly."
  * "Congratulations. You just donated another free mark to Cambridge."
  * "You're reading like you're racing Formula 1. Slow down and find the evidence."
- NEVER use personal insults like "stupid", "useless", "no brain", etc.`
    };

    return personalityPrompts[personality];
  }
}

export class AIProviderFactory {
  static create(provider: 'openai' | 'gemini' | 'claude' | 'openrouter', config: AIProviderConfig): AIProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'gemini':
        // TODO: Implement Gemini provider
        throw new Error('Gemini provider not yet implemented');
      case 'claude':
        // TODO: Implement Claude provider
        throw new Error('Claude provider not yet implemented');
      case 'openrouter':
        // TODO: Implement OpenRouter provider
        throw new Error('OpenRouter provider not yet implemented');
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
