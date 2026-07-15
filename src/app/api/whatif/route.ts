import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaude, isAnthropicConfigured, SAFETY } from "@/lib/anthropic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { question, lang = "en" } = await request.json();
  if (!question?.trim())
    return NextResponse.json({ error: "missing question" }, { status: 400 });

  let answer: string;
  if (isAnthropicConfigured) {
    const language = lang === "fr" ? "French" : "English";
    answer =
      (await askClaude({
        system: SAFETY,
        maxTokens: 420,
        prompt: `An IVF patient asks: "${question}". Answer with calm, practical reassurance in 2-4 sentences. Give general guidance only. If the situation could be time-sensitive or medically important (a missed/wrong dose, bleeding, severe pain, OHSS symptoms), clearly tell them to call their fertility clinic now. Never invent specific dosing instructions. Write in ${language}.`,
      }).catch(() => "")) || fallbackAnswer(lang);
  } else {
    answer = fallbackAnswer(lang);
  }

  const { data: inserted } = await supabase
    .from("whatif_queries")
    .insert({ user_id: user.id, question, answer })
    .select()
    .single();

  return NextResponse.json({ answer, query: inserted });
}

function fallbackAnswer(lang: string) {
  return lang === "fr"
    ? "Respire. La plupart des imprévus en FIV ne compromettent pas un cycle. Pour toute question sur une dose, un timing ou un symptôme, votre clinique est la meilleure source et veut que vous appeliez. Si quelque chose semble urgent (douleur intense, saignement, dose manquée près du déclencheur), contactez-les maintenant."
    : "Take a breath. Most IVF surprises don't derail a cycle. For anything about a dose, timing, or symptom, your clinic is the best source and they want you to call. If something feels urgent (severe pain, bleeding, a missed dose near your trigger), reach out to them now.";
}
