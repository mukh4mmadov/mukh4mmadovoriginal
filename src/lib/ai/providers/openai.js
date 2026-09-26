import { buildSystemPrompt } from '../prompts';

export class OpenAIProvider {
  constructor(config) {
    this.config = config;
  }

  async sendMessage(
    messages,
    context,
    personality,
    onChunk
  ) {
    const systemPrompt = buildSystemPrompt(personality, context);
    
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    if (onChunk) {
      return this.handleStreamResponse(response, onChunk);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async handleStreamResponse(
    response,
    onChunk
  ) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';
    let pending = '';

    const processLine = (line) => {
      if (!line.startsWith('data: ')) return;

      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') return;

      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }

      if (parsed.error) {
        throw new Error(parsed.error.message || 'OpenAI stream failed');
      }

      const content = parsed.choices?.[0]?.delta?.content;
      if (content) {
        fullContent += content;
        onChunk(content);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      pending += decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() || '';

      for (const line of lines) {
        processLine(line.trimEnd());
      }
    }

    pending += decoder.decode();
    if (pending) processLine(pending.trimEnd());

    if (!fullContent.trim()) {
      throw new Error('OpenAI returned an empty response');
    }

    return fullContent;
  }
}
