"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { Card } from "@/components/ui";
import type { Mood } from "@/lib/supabase/types";

// Home page widget (PDF page 3): "Quick mood check, how are we feeling,
// answers from here to the [Mee] support page. Have only 3 emojis. Patient
// can decide not to send."
const MOODS: { mood: Mood; emoji: string }[] = [
  { mood: 1, emoji: "😊" },
  { mood: 2, emoji: "😐" },
  { mood: 3, emoji: "😔" },
];

export function QuickMoodCheck() {
  const { t } = useLanguage();
  const supabase = createClient();
  const [share, setShare] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState<Mood | null>(null);

  async function pick(mood: Mood) {
    setSaving(mood);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("mood_checkins").insert({
        user_id: user.id,
        mood,
        shared_with_partner: share,
      });
      setSaved(true);
    }
    setSaving(null);
  }

  const label = (mood: Mood) =>
    mood === 1 ? t.dashboard.moodGood : mood === 2 ? t.dashboard.moodNeutral : t.dashboard.moodHard;

  return (
    <Card className="space-y-3">
      <p className="font-display text-lg text-white">{t.dashboard.moodCheckTitle}</p>
      <p className="text-sm text-muted">{t.dashboard.moodCheckPrompt}</p>
      <div className="flex justify-between gap-2">
        {MOODS.map(({ mood, emoji }) => (
          <button
            key={mood}
            onClick={() => pick(mood)}
            disabled={saving !== null}
            title={label(mood)}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-line py-3 text-2xl transition hover:border-berry-400 hover:bg-blush-50 disabled:opacity-60"
          >
            {emoji}
          </button>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={share}
          onChange={(e) => setShare(e.target.checked)}
          className="h-4 w-4 accent-berry-500"
        />
        {t.dashboard.moodShareToggle}
      </label>
      {saved && <p className="text-sm text-grow-500">{t.dashboard.moodSaved}</p>}
    </Card>
  );
}
