import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaude, isAnthropicConfigured, SAFETY } from "@/lib/anthropic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { hormone, value, unit = "", lang = "en" } = await request.json();
  if (!hormone || value === undefined)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });

  if (!isAnthropicConfigured) {
    const text =
      lang === "fr"
        ? `Votre ${hormone} est à ${value} ${unit}. Ce chiffre prend tout son sens dans le contexte de votre protocole et de la phase de votre cycle. Votre clinique le suit pour ajuster vos doses au bon moment. Notez-le et apportez vos questions à votre prochain rendez-vous de suivi.`
        : `Your ${hormone} is ${value} ${unit}. This number means the most in the context of your protocol and where you are in your cycle. Your clinic watches it to fine-tune your dosing and timing. Log it, and bring any questions to your next monitoring appointment.`;
    return NextResponse.json({ interpretation: text, simulated: true });
  }

  const language = lang === "fr" ? "French" : "English";
  const interpretation = await askClaude({
    system: SAFETY,
    maxTokens: 320,
    prompt: `Someone in an IVF cycle logged a hormone reading: ${hormone} = ${value} ${unit}. In 2-4 warm, plain-language sentences, explain what this hormone does in IVF and what a value like this generally relates to, WITHOUT diagnosing or saying it is good/bad/normal/abnormal for them specifically. Remind them their clinic interprets it in context. Write in ${language}.`,
  }).catch(() => null);

  if (!interpretation)
    return NextResponse.json(
      { error: "interpretation_failed" },
      { status: 502 }
    );

  return NextResponse.json({ interpretation });
}
