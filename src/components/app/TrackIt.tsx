"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
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

export function TrackIt() {
  const { t, lang } = useLanguage();
  const supabase = createClient();

  const [logs, setLogs] = useState<HormoneLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [hormone, setHormone] = useState<string>("estradiol");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(DEFAULT_UNITS.estradiol);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data } = await supabase
      .from("hormone_logs")
      .select("*")
      .order("measured_on", { ascending: false })
      .limit(50);
    setLogs((data as HormoneLog[]) ?? []);
    setLoading(false);
  }

  function pickHormone(h: string) {
    setHormone(h);
    setUnit(DEFAULT_UNITS[h] ?? "");
    setInterpretation(null);
  }

  async function interpret() {
    if (!value) return;
    setInterpreting(true);
    setInterpretation(null);
    const res = await fetch("/api/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hormone: t.track.hormones[hormone as keyof typeof t.track.hormones],
        value,
        unit,
        lang,
      }),
    });
    const data = await res.json();
    setInterpreting(false);
    if (data.interpretation) setInterpretation(data.interpretation);
  }

  async function save() {
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
        unit,
        measured_on: date,
        notes: notes || null,
        interpretation,
      });
      setValue("");
      setNotes("");
      setInterpretation(null);
      await load();
    }
    setSaving(false);
  }

  return (
    <div>
      <PageHeader title={t.track.title} subtitle={t.track.subtitle} />

      <Card className="space-y-4">
        <p className="font-display text-lg text-plum-700">{t.track.addReading}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t.track.hormone}</Label>
            <Select value={hormone} onChange={(e) => pickHormone(e.target.value)}>
              {HORMONE_KEYS.map((h) => (
                <option key={h} value={h}>
                  {t.track.hormones[h]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t.track.date}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label>{t.track.value}</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setInterpretation(null);
              }}
              placeholder="0"
            />
          </div>
          <div>
            <Label>{t.track.unit}</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>{t.track.notesLabel}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[64px]"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="soft"
            onClick={interpret}
            disabled={interpreting || !value}
          >
            {interpreting && <Spinner />}
            {interpreting ? t.track.interpreting : t.track.interpret}
          </Button>
          <Button onClick={save} disabled={saving || !value}>
            {saving && <Spinner />}
            {t.common.save}
          </Button>
        </div>

        {interpretation && (
          <div className="rounded-xl bg-plum-50 p-4">
            <p className="text-sm font-semibold text-plum-700">
              {t.track.interpretationTitle}
            </p>
            <p className="mt-1 text-sm text-muted">{interpretation}</p>
            <p className="mt-3 text-xs text-faint">{t.common.notMedicalAdvice}</p>
          </div>
        )}
      </Card>

      {/* History */}
      <h2 className="mb-3 mt-8 font-display text-lg text-plum-700">
        {t.track.history}
      </h2>
      {loading ? (
        <div className="flex justify-center py-8 text-muted">
          <Spinner />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-faint">{t.track.empty}</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="flex items-baseline justify-between p-4">
              <div>
                <span className="font-semibold text-plum-700">
                  {t.track.hormones[
                    log.hormone as keyof typeof t.track.hormones
                  ] ?? log.hormone}
                </span>
                <span className="ml-2 text-faint">
                  {new Date(log.measured_on).toLocaleDateString(lang, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <span className="font-display text-xl text-berry-600">
                {log.value}
                <span className="ml-1 text-xs text-faint">{log.unit}</span>
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
