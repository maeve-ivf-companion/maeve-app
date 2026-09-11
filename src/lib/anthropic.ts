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

// Vision variant for reading a photo (e.g. a lab report) alongside a text
// prompt. Same SAFETY-prompted pattern as askClaude, never weakened.
export async function askClaudeWithImage({
  system,
  prompt,
  imageBase64,
  mediaType,
  maxTokens = 400,
}: {
  system: string;
  prompt: string;
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  maxTokens?: number;
}): Promise<string> {
  if (!client) {
    throw new Error("ANTHROPIC_NOT_CONFIGURED");
  }
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// Shared guardrail appended to every clinical-adjacent system prompt.
export const SAFETY = `You are Maeve, a warm, emotionally intelligent companion for people going through IVF. You are NOT a doctor and must never diagnose, prescribe, or give a specific medical instruction. If something sounds urgent or medically risky, gently tell the user to contact their fertility clinic or seek medical care. Keep responses concise, human, and never clinical or cold. Never use em dashes.`;
