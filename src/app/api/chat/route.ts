import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaude, isAnthropicConfigured, SAFETY } from "@/lib/anthropic";
import type { ChatMessage } from "@/lib/supabase/types";

// Ask Maeve chat box (PDF page 6): a persistent conversation, distinct from
// Learn's single-question what-if box. Same SAFETY guardrail, never
// weakened, per AGENTS.md rule 4.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { message, lang = "en" } = await request.json();
  if (!message?.trim())
    return NextResponse.json({ error: "missing message" }, { status: 400 });

  await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "user",
    body: message,
  });

  const { data: historyRows } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const history = ((historyRows as ChatMessage[]) ?? []).reverse();

  let reply: string;
  if (isAnthropicConfigured) {
    const language = lang === "fr" ? "French" : "English";
    const transcript = history
      .map((m) => `${m.role === "user" ? "Patient" : "Maeve"}: ${m.body}`)
      .join("\n");
    reply =
      (await askClaude({
        system: SAFETY,
        maxTokens: 500,
        prompt: `Here is the conversation so far between an IVF patient and you (Maeve):\n${transcript}\n\nRespond to the patient's latest message with warmth and practical support in 2-5 sentences. Write in ${language}.`,
      }).catch(() => "")) || fallbackReply(lang);
  } else {
    reply = fallbackReply(lang);
  }

  const { data: inserted } = await supabase
    .from("chat_messages")
    .insert({ user_id: user.id, role: "assistant", body: reply })
    .select()
    .single();

  return NextResponse.json({ reply, message: inserted });
}

function fallbackReply(lang: string) {
  return lang === "fr"
    ? "Je suis là pour vous écouter. Pour toute question médicale précise, votre clinique reste la meilleure ressource."
    : "I'm here with you. For anything specifically medical, your clinic is always the best resource to call.";
}
