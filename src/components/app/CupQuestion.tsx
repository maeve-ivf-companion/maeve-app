"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { Button, Card, Input } from "@/components/ui";

// Home page widget (PDF page 3): "What will fill your cup today? -> input
// answer goes to support page."
export function CupQuestion() {
  const { t } = useLanguage();
  const supabase = createClient();
  const [answer, setAnswer] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!answer.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("cup_entries").insert({ user_id: user.id, answer: answer.trim() });
      setSaved(true);
      setAnswer("");
    }
    setSaving(false);
  }

  return (
    <Card className="space-y-3">
      <p className="font-display text-lg text-plum-700">{t.dashboard.cupTitle}</p>
      {saved ? (
        <div className="rounded-xl bg-plum-50 p-4">
          <p className="text-sm text-muted">{t.dashboard.cupSaved}</p>
          <Link href="/app/partner" className="mt-2 inline-block text-sm font-medium text-berry-500">
            {t.dashboard.cupSeeSupport} →
          </Link>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t.dashboard.cupPlaceholder}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <Button onClick={save} disabled={saving || !answer.trim()}>
            {t.common.send}
          </Button>
        </div>
      )}
    </Card>
  );
}
