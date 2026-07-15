import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaude, isAnthropicConfigured, SAFETY } from "@/lib/anthropic";

const moodWords: Record<number, string> = {
  1: "having a really hard, heavy day",
  2: "low and worn down",
  3: "okay but tender",
  4: "steady, doing alright",
  5: "actually feeling hopeful",
};

// Curated fallbacks if Claude isn't connected yet — keeps the demo alive.
const fallback: Record<string, Record<number, string>> = {
  en: {
    1: "Tonight is hard. Don't try to fix it. Just stay close, and maybe bring her favourite snack.",
    2: "She's running low today. A long hug and zero problem-solving is exactly right.",
    3: "She's tender today. Check in softly, then let her lead.",
    4: "She's steady today. A small kind gesture will land well.",
    5: "She's feeling hopeful today. Celebrate it with her, gently.",
  },
  fr: {
    1: "La soirée est difficile. N'essaie pas de régler les choses. Reste près d'elle, et apporte peut-être sa collation préférée.",
    2: "Elle est à plat aujourd'hui. Une longue étreinte et aucune solution à proposer, c'est exactement ça.",
    3: "Elle est sensible aujourd'hui. Prends de ses nouvelles doucement, puis laisse-la mener.",
    4: "Elle va bien aujourd'hui. Un petit geste tendre sera apprécié.",
    5: "Elle se sent pleine d'espoir aujourd'hui. Célèbre-le avec elle, en douceur.",
  },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { mood = 2, note = "", lang = "en" } = await request.json();
  const moodKey = Math.min(5, Math.max(1, Number(mood) || 2));

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, paired_with")
    .eq("id", user.id)
    .single();

  let body: string;
  if (isAnthropicConfigured) {
    const language = lang === "fr" ? "French" : "English";
    body = await askClaude({
      system: SAFETY,
      maxTokens: 160,
      prompt: `Write a 1-2 sentence note to the PARTNER of someone going through IVF who is ${moodWords[moodKey]}.${note ? ` Her own words: "${note}".` : ""} Tell the partner how to show up tonight. Do NOT share her data or numbers. The vibe is "don't fix it, just be here". Warm, specific, never clinical. Write it in ${language}. Return only the note, no quotes.`,
    }).catch(() => fallback[lang === "fr" ? "fr" : "en"][moodKey]);
  } else {
    body = fallback[lang === "fr" ? "fr" : "en"][moodKey];
  }

  const { data: inserted } = await supabase
    .from("nudges")
    .insert({
      patient_id: user.id,
      partner_id: profile?.paired_with ?? null,
      body,
      context: note || `mood:${moodKey}`,
    })
    .select()
    .single();

  return NextResponse.json({ nudge: inserted, body });
}
