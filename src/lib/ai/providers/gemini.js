import { buildSystemPrompt } from '../prompts';

export class GeminiProvider {
  constructor(config) {
    this.config = config;
  }

  async sendMessage(
    messages,
    context,
    personality,
    onChunk
  ) {
    // Server code can supply its own system prompt (e.g. Writing feedback);
    // it comes from provider config, never from the request body.
    const systemPrompt = this.config.systemPrompt || buildSystemPrompt(personality, context);
    
    const contents = messages.reduce((history, message) => {
      const role = message.role === 'assistant' ? 'model' : 'user';
      const previous = history[history.length - 1];

      if (previous?.role === role) {
        previous.parts[0].text += `\n\n${message.content}`;
      } else {
        history.push({ role, parts: [{ text: message.content }] });
      }

      return history;
    }, []);

    const models = [
      this.config.model || 'gemini-3.8-flash',
      ...(this.config.fallbackModels || []),
    ];

    // Newer Gemini models think before answering, which can take longer
    // than a page will wait. Ask for light thinking; if a model rejects the
    // setting, the same model is asked again without it.
    const thinkingLevel = this.config.thinkingLevel ?? process.env.GOOGLE_THINKING_LEVEL ?? 'low';
    let useThinking = Boolean(thinkingLevel) && thinkingLevel !== 'off';

    for (let index = 0; index < models.length; index += 1) {
      const model = models[index];
      const response = await fetch(`${this.config.baseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: this.config.temperature ?? 0.7,
            ...(this.config.responseMimeType ? { responseMimeType: this.config.responseMimeType } : {}),
            ...(useThinking ? { thinkingConfig: { thinkingLevel } } : {}),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 400 && useThinking && /thinking/i.test(error)) {
          useThinking = false;
          index -= 1;
          continue;
        }
        if (response.status === 503 && index < models.length - 1) continue;
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('');

      if (!content) {
        throw new Error(data.promptFeedback?.blockReason || 'Gemini returned an empty response');
      }

      return content;
    }

    throw new Error('Gemini models are temporarily unavailable. Please try again.');
  }
}
