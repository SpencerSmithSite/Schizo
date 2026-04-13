import type { OllamaMessage, OllamaModel } from "../types/ollama";

export async function listModels(baseUrl: string): Promise<OllamaModel[]> {
  const res = await fetch(`${baseUrl}/api/tags`);
  if (!res.ok) throw new Error(`Ollama unreachable: ${res.status}`);
  const data = await res.json() as { models: Array<{ name: string; size: number; modified_at: string }> };
  return (data.models ?? []).map((m) => ({
    name: m.name,
    size: m.size,
    modifiedAt: m.modified_at,
  }));
}

export async function* streamChat(
  baseUrl: string,
  model: string,
  messages: OllamaMessage[],
): AsyncGenerator<string> {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    // Each line is a JSON object
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
        if (json.message?.content) {
          yield json.message.content;
        }
      } catch {
        // Ignore malformed lines
      }
    }
  }
}
