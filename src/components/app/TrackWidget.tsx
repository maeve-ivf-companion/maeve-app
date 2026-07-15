"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { Button, Card, Input, Select, Spinner } from "@/components/ui";
import type { HormoneLog } from "@/lib/supabase/types";

const HORMONE_KEYS = [
  "estradiol",
  "lh",
  "fsh",
  "progesterone",
  "hcg",
  "amh",
] as const;

const DEFAULT_UNITS: Record<string, string> = {
  estradiol: "pg/mL",
  lh: "mIU/mL",
  fsh: "mIU/mL",
  progesterone: "ng/mL",
  hcg: "mIU/mL",
  amh: "ng/mL",
};

export function TrackWidget() {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [recent, setRecent] = useState<HormoneLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [hormone, setHormone] = useState<string>("estradiol");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data } = await supabase
      .from("hormone_logs")
      .select("*")
      .order("measured_on", { ascending: false })
      .limit(3);
    setRecent((data as HormoneLog[]) ?? []);
    setLoading(false);
  }

  async function log() {
    if (!value) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("hormone_logs").insert({
        user_id: user.id,
        hormone,
        value: Number(value),
        unit: DEFAULT_UNITS[hormone] ?? "",
        measured_on: new Date().toISOString().slice(0, 10),
      });
      setValue("");
      await load();
    }
    setSaving(false);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-plum-700">
          {t.dashboard.trackWidget}
        </h2>
        <Link
          href="/app/track"
          className="text-sm font-medium text-berry-500 hover:text-berry-600"
        >
          {t.dashboard.viewAll}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Select value={hormone} onChange={(e) => setHormone(e.target.value)}>
          {HORMONE_KEYS.map((h) => (
            <option key={h} value={h}>
              {t.track.hormones[h]}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.track.value}
          className="sm:w-28"
        />
        <Button onClick={log} disabled={saving || !value}>
          {saving && <Spinner />}
          {t.dashboard.logReading}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
          {t.dashboard.recentReadings}
        </p>
        {loading ? (
          <div className="flex justify-center py-3 text-muted">
            <Spinner />
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-faint">{t.dashboard.noReadings}</p>
        ) : (
          <ul className="space-y-1.5">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-plum-700">
                  {t.track.hormones[r.hormone as keyof typeof t.track.hormones] ??
                    r.hormone}
                  <span className="ml-2 text-faint">
                    {new Date(r.measured_on).toLocaleDateString(lang, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
                <span className="shrink-0 font-display text-berry-600">
                  {r.value}
                  <span className="ml-1 text-xs text-faint">{r.unit}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
