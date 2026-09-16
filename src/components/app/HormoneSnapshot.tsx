"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { fmt } from "@/lib/i18n/format";
import { Card, Spinner } from "@/components/ui";
import { HORMONE_REFERENCE, hormoneStatus, type HormoneKey } from "@/lib/hormones";
import type { HormoneLog } from "@/lib/supabase/types";

// Home page widget (PDF page 3): "Quick hormone target snapshot from where
// the patient is now to their target level." Clicking it opens Monitoring.
export function HormoneSnapshot() {
  const { t } = useLanguage();
  const supabase = createClient();
  const [latest, setLatest] = useState<HormoneLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("hormone_logs")
        .select("*")
        .eq("hormone", "estradiol")
        .order("measured_on", { ascending: false })
        .limit(1);
      setLatest((data?.[0] as HormoneLog) ?? null);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ref = HORMONE_REFERENCE.estradiol;
  const pct = latest
    ? Math.max(4, Math.min(100, Math.round((latest.value / ref.high) * 100)))
    : 0;
  const status = latest ? hormoneStatus("estradiol" as HormoneKey, latest.value) : null;
  const unit = latest?.unit || ref.unit;
  const goalMessage = latest
    ? latest.value < ref.low
      ? fmt(t.dashboard.hormoneSnapshotBelow, {
          n: Math.round(ref.low - latest.value),
          unit,
        })
      : latest.value > ref.high
        ? fmt(t.dashboard.hormoneSnapshotAbove, {
            n: Math.round(latest.value - ref.high),
            unit,
          })
        : t.dashboard.hormoneSnapshotOnTarget
    : "";

  return (
    <Link href="/app/monitoring">
      <Card className="transition hover:border-berry-400 hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg text-white">
            {t.dashboard.hormoneSnapshotTitle}
          </p>
          <span className="text-berry-500">→</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-4 text-muted">
            <Spinner />
          </div>
        ) : !latest ? (
          <p className="mt-2 text-sm text-faint">{t.dashboard.hormoneSnapshotEmpty}</p>
        ) : (
          <div className="mt-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted">
                  {t.track.hormones.estradiol} · {latest.value} {unit}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status === "onTrack" ? "bg-grow-500" : "bg-berry-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  status === "onTrack"
                    ? "bg-grow-300/30 text-grow-500"
                    : "bg-blush-100 text-berry-600"
                }`}
              >
                {status === "onTrack"
                  ? t.dashboard.hormoneSnapshotOnTrack
                  : t.dashboard.hormoneSnapshotWatch}
              </span>
            </div>
            <p className="mt-2 text-xs text-faint">{goalMessage}</p>
          </div>
        )}
      </Card>
    </Link>
  );
}
