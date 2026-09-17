import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaude, isAnthropicConfigured, SAFETY } from "@/lib/anthropic";
import { deriveStages } from "@/lib/stages";
import type { ChatMessage, Profile, ScheduleEvent } from "@/lib/supabase/types";

// Ask Maeve chat box (PDF page 6): a persistent conversation, distinct from
// Learn's single-question what-if box. SAFETY is used verbatim, never
// weakened, per AGENTS.md rule 4 — CHAT_SYSTEM only ever adds to it, so the
// non-diagnosis / redirect-urgent-things-to-the-clinic guardrail stays
// word-for-word intact.
const CHAT_SYSTEM = `${SAFETY} You are a warm, knowledgeable wellness companion for this specific person, not a generic FAQ bot and not a substitute for their clinical team. You'll be given a short summary of where they are in their cycle, what's logged, and what's coming up, use it so your answers feel like they're actually about their situation. Engage genuinely with everyday questions (nutrition, mood, what to expect, how a medication generally works), don't reflexively deflect to "call your clinic" for things that don't need it, save that redirect for anything genuinely urgent, medically risky, or that requires a clinical decision only their care team can make.`;

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
    const context = await buildPatientContext(supabase, user.id);
    reply =
      (await askClaude({
        system: CHAT_SYSTEM,
        maxTokens: 500,
        prompt: `${context}\n\nHere is the conversation so far between this patient and you (Maeve):\n${transcript}\n\nRespond to the patient's latest message with warmth and practical support in 2-5 sentences. Write in ${language}.`,
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

// Pulls together what Maeve already knows about this patient — cycle day,
// current stage, what's next on their schedule, recent mood — so the reply
// is grounded in their actual data instead of generic public facts.
async function buildPatientContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string> {
  const [{ data: prof }, { data: events }, { data: moods }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("schedule_events").select("*").eq("user_id", userId),
    supabase
      .from("mood_checkins")
      .select("mood, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  const profile = prof as Profile | null;
  const allEvents = (events as ScheduleEvent[]) ?? [];
  const stages = deriveStages(profile, allEvents);
  const currentStage = stages.find((s) => s.status === "current")?.key ?? null;

  const cycleDay = profile?.cycle_start_date
    ? Math.max(
        1,
        Math.floor((Date.now() - new Date(profile.cycle_start_date).getTime()) / 86400000) + 1
      )
    : null;

  const next = allEvents
    .filter((e) => new Date(e.scheduled_at).getTime() >= Date.now())
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];

  const lines = [
    cycleDay ? `Cycle day: ${cycleDay}` : "No cycle start date logged yet.",
    currentStage ? `Current stage: ${currentStage}` : null,
    next
      ? `Next scheduled item: ${next.title} (${next.type}) on ${new Date(next.scheduled_at).toLocaleDateString()}`
      : "Nothing upcoming on their schedule right now.",
    moods && moods.length > 0
      ? `Recent mood check-ins (1=good, 2=neutral, 3=hard): ${moods.map((m) => m.mood).join(", ")}`
      : null,
  ].filter(Boolean);

  return `Patient context (use naturally, don't just list it back):\n${lines.join("\n")}`;
}

function fallbackReply(lang: string) {
  return lang === "fr"
    ? "Je suis là pour vous écouter. Pour toute question médicale précise, votre clinique reste la meilleure ressource."
    : "I'm here with you. For anything specifically medical, your clinic is always the best resource to call.";
}
