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
      this.config.model || 'gemini-3.5-flash-lite',
      ...(this.config.fallbackModels || []),
    ];

    // Newer Gemini models think before answering, which can take longer
    // than a page will wait. Ask for light thinking; if a model rejects the
    // setting, the same model is asked again without it.
    const thinkingLevel = this.config.thinkingLevel ?? process.env.GOOGLE_THINKING_LEVEL ?? 'low';
    let useThinking = Boolean(thinkingLevel) && thinkingLevel !== 'off';
    // A model that has not answered in time is skipped for the next one, so a
    // slow model cannot use up the whole request.
    const timeoutMs = this.config.timeoutMs ?? (Number(process.env.GOOGLE_TIMEOUT_MS) || 45000);

    for (let index = 0; index < models.length; index += 1) {
      const model = models[index];
      const startedAt = Date.now();
      let response;
      try {
        response = await fetch(`${this.config.baseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`, {
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
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        if (error?.name !== 'TimeoutError') throw error;
        console.warn(`Gemini ${model} did not answer within ${timeoutMs} ms`);
        if (index < models.length - 1) continue;
        throw new Error(`Gemini API error: 503 - no answer within ${timeoutMs} ms`);
      }
      console.info(`Gemini ${model} answered with ${response.status} in ${Date.now() - startedAt} ms`);

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
