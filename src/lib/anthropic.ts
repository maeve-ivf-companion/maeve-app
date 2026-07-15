import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
export const isAnthropicConfigured = apiKey.length > 0;

// Latest balanced model for warm, careful, low-latency generations.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const client = isAnthropicConfigured ? new Anthropic({ apiKey }) : null;

export async function askClaude({
  system,
  prompt,
  maxTokens = 600,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  if (!client) {
    throw new Error("ANTHROPIC_NOT_CONFIGURED");
  }
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// Shared guardrail appended to every clinical-adjacent system prompt.
export const SAFETY = `You are Maeve, a warm, emotionally intelligent companion for people going through IVF. You are NOT a doctor and must never diagnose, prescribe, or give a specific medical instruction. If something sounds urgent or medically risky, gently tell the user to contact their fertility clinic or seek medical care. Keep responses concise, human, and never clinical or cold. Never use em dashes.`;
