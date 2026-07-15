"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { Card, Spinner } from "@/components/ui";
import type { Nudge } from "@/lib/supabase/types";

// The partner's read-only emotional brief. One way: patient -> partner.
export function PartnerBrief({ role }: { role: "partner" | "patient" }) {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [loading, setLoading] = useState(true);
  const [paired, setPaired] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("paired_with")
        .eq("id", user.id)
        .single();
      setPaired(Boolean(prof?.paired_with));

      const { data } = await supabase
        .from("nudges")
        .select("*")
        .eq("partner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const latest = (data?.[0] as Nudge) ?? null;
      setNudge(latest);
      if (latest && latest.status === "sent") {
        await supabase
          .from("nudges")
          .update({ status: "seen" })
          .eq("id", latest.id);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-10 text-muted">
        <Spinner />
      </div>
    );

  if (paired === false && role === "partner") {
    return (
      <Card className="text-muted">{t.partner.partnerWaiting}</Card>
    );
  }

  return (
    <Card className="bg-brand-gradient border-0 text-white">
      <p className="text-sm uppercase tracking-wide text-white/60">
        {t.partner.briefToday}
      </p>
      {nudge ? (
        <>
          <p className="mt-3 font-display text-2xl leading-snug">
            “{nudge.body}”
          </p>
          <p className="mt-4 text-xs text-white/50">
            {new Date(nudge.created_at).toLocaleString(lang, {
              weekday: "long",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </>
      ) : (
        <p className="mt-3 text-white/80">{t.partner.partnerBriefEmpty}</p>
      )}
    </Card>
  );
}
