/**
 * Shared HTTP/SSE plumbing for the AI providers.
 */

/** Throw a provider-labelled error for a non-2xx response. */
export async function assertResponseOk(response: Response, providerName: string): Promise<void> {
  if (response.ok) return;
  const error = await response.text();
  throw new Error(`${providerName} API error: ${response.status} - ${error}`);
}

/**
 * Read an SSE stream, accumulating the deltas returned by `extractDelta`
 * and forwarding each one to `onChunk`.
 */
export async function consumeSSEStream(
  response: Response,
  extractDelta: (event: unknown) => string | undefined,
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
    const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data: '));

    for (const line of lines) {
      const data = line.replace('data: ', '').trim();
      if (data === '[DONE]') continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }

      const delta = extractDelta(parsed);
      if (delta) {
        fullContent += delta;
        onChunk(delta);
      }
    }
  }

  return fullContent;
}

interface ChatCompletionChunk {
  choices?: Array<{ delta?: { content?: string } }>;
}

/** Delta extractor for the OpenAI-compatible chat completion stream format. */
export function chatCompletionDelta(event: unknown): string | undefined {
  return (event as ChatCompletionChunk).choices?.[0]?.delta?.content;
}
