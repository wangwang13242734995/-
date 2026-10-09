/**
 * InternLM (书生·端砚) API Client
 * OpenAI-compatible chat completions API
 * Docs: https://internlm.intern-ai.org.cn/api/document
 */

const INTERNLM_BASE_URL = "https://chat.intern-ai.org.cn/api/v1";
const INTERNLM_MODEL = "intern-latest";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface InternLMResponse {
  choices: { message: { content: string } }[];
  usage?: { total_tokens: number };
}

/**
 * Call InternLM chat completions API
 */
export async function callInternLM(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const token = process.env.INTERNLM_TOKEN;
  if (!token) {
    throw new Error("INTERNLM_TOKEN not configured");
  }

  const res = await fetch(`${INTERNLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: INTERNLM_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`InternLM API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as InternLMResponse;
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Check if InternLM is available (token configured)
 */
export function isInternLMAvailable(): boolean {
  return !!process.env.INTERNLM_TOKEN;
}
