import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaudeWithImage, isAnthropicConfigured, SAFETY } from "@/lib/anthropic";

const HORMONE_KEYS = ["estradiol", "lh", "fsh", "progesterone", "hcg", "amh"] as const;

// Reads a photo of a lab report (Monitoring page's "scan a reading" camera
// option) and extracts a hormone name + value for the user to review before
// saving. This only extracts what is printed on the page; it never
// interprets or diagnoses, per the SAFETY guardrail.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!isAnthropicConfigured) {
    return NextResponse.json({ error: "scan_not_configured" }, { status: 503 });
  }

  const { imageBase64, mediaType } = await request.json();
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: "missing_image" }, { status: 400 });
  }

  const raw = await askClaudeWithImage({
    system: `${SAFETY} You are only doing optical data extraction here, not interpretation. Extract, never diagnose or comment on the value.`,
    imageBase64,
    mediaType,
    maxTokens: 200,
    prompt: `This is a photo of an IVF/fertility lab report or monitoring printout. Find the single most prominent hormone reading on it. Respond with ONLY a compact JSON object, no other text: {"hormone": one of ${JSON.stringify(
      HORMONE_KEYS
    )}, "value": number, "unit": string} — or {"hormone": null} if you cannot confidently find one.`,
  }).catch(() => null);

  if (!raw) {
    return NextResponse.json({ error: "scan_failed" }, { status: 502 });
  }

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);
    if (!parsed.hormone || !HORMONE_KEYS.includes(parsed.hormone)) {
      return NextResponse.json({ hormone: null });
    }
    return NextResponse.json({
      hormone: parsed.hormone,
      value: typeof parsed.value === "number" ? parsed.value : null,
      unit: typeof parsed.unit === "string" ? parsed.unit : "",
    });
  } catch {
    return NextResponse.json({ hormone: null });
  }
}
