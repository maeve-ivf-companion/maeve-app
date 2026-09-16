"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, Input, Modal, Select, Spinner } from "@/components/ui";
import { EVENT_TYPE_ACCENT, EVENT_TYPE_ICON } from "@/lib/eventTypes";
import { HORMONE_FACTS, HORMONE_KEYS, HORMONE_REFERENCE, type HormoneKey } from "@/lib/hormones";
import { HormoneTrendChart } from "@/components/app/HormoneTrendChart";
import type { HormoneLog, ScheduleEvent } from "@/lib/supabase/types";

const DEFAULT_UNITS: Record<HormoneKey, string> = {
  estradiol: "pg/mL",
  lh: "mIU/mL",
  fsh: "mIU/mL",
  progesterone: "ng/mL",
  hcg: "mIU/mL",
  amh: "ng/mL",
};

export function Monitoring() {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [logs, setLogs] = useState<HormoneLog[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [recent, setRecent] = useState<HormoneLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Set<HormoneKey>>(new Set());
  const [selectedDay, setSelectedDay] = useState<{ day: number; events: ScheduleEvent[] } | null>(null);

  // Track-a-hormone (moved here from Home)
  const [hormone, setHormone] = useState<HormoneKey>("estradiol");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  // Scan-a-reading (camera / photo)
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAll() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const [{ data: logRows }, { data: eventRows }, { data: recentRows }] =
      await Promise.all([
        supabase
          .from("hormone_logs")
          .select("*")
          .eq("hormone", "estradiol")
          .order("measured_on", { ascending: true })
          .limit(12),
        supabase
          .from("schedule_events")
          .select("*")
          .gte("scheduled_at", monthStart.toISOString())
          .lt("scheduled_at", monthEnd.toISOString()),
        supabase
          .from("hormone_logs")
          .select("*")
          .order("measured_on", { ascending: false })
          .limit(3),
      ]);
    setLogs((logRows as HormoneLog[]) ?? []);
    setEvents((eventRows as ScheduleEvent[]) ?? []);
    setRecent((recentRows as HormoneLog[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleFlip(key: HormoneKey) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function logReading() {
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
        unit: unit || DEFAULT_UNITS[hormone],
        measured_on: new Date().toISOString().slice(0, 10),
      });
      setValue("");
      setUnit("");
      await loadAll();
    }
    setSaving(false);
  }

  async function onScanFile(file: File) {
    setScanning(true);
    setScanError(null);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const [, base64] = dataUrl.split(",");
      const res = await fetch("/api/scan-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type || "image/jpeg",
        }),
      });
      const data = await res.json();
      if (data.hormone && data.value != null) {
        setHormone(data.hormone as HormoneKey);
        setValue(String(data.value));
        setUnit(data.unit || DEFAULT_UNITS[data.hormone as HormoneKey]);
      } else {
        setScanError(t.monitoring.scanNotFound);
      }
    } catch {
      setScanError(t.monitoring.scanFailed);
    }
    setScanning(false);
  }

  const calendarDays = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0
    ).getDate();
    const leadingBlanks = monthStart.getDay();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const byDay = new Map<number, ScheduleEvent[]>();
    events.forEach((e) => {
      const d = new Date(e.scheduled_at);
      if (d.getMonth() !== monthStart.getMonth()) return;
      const day = d.getDate();
      byDay.set(day, [...(byDay.get(day) ?? []), e]);
    });

    return {
      leadingBlanks,
      cells: Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
        return {
          day,
          isPast: date.getTime() < now.getTime(),
          events: byDay.get(day) ?? [],
        };
      }),
    };
  }, [events]);

  return (
    <div>
      <PageHeader title={t.monitoring.title} subtitle={t.monitoring.subtitle} />

      {/* Hormonal reading & trend */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg text-white">{t.monitoring.trendTitle}</p>
          <Link href="/app/track" className="text-sm font-medium text-berry-500 hover:text-berry-600">
            {t.monitoring.addReading}
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8 text-muted">
            <Spinner />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-faint">{t.track.empty}</p>
        ) : (
          <HormoneTrendChart
            logs={logs}
            low={HORMONE_REFERENCE.estradiol.low}
            high={HORMONE_REFERENCE.estradiol.high}
            unit={logs[0]?.unit || HORMONE_REFERENCE.estradiol.unit}
          />
        )}
        <p className="text-xs text-faint">{t.monitoring.addReadingHint}</p>
      </Card>

      {/* Treatment calendar */}
      <h2 className="mb-3 mt-8 font-display text-lg text-white">{t.monitoring.calendarTitle}</h2>
      <Card>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-faint">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <span key={d}>
              {new Date(2024, 0, d + 7).toLocaleDateString(lang, { weekday: "short" })}
            </span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: calendarDays.leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {calendarDays.cells.map(({ day, isPast, events: dayEvents }) => (
            <button
              key={day}
              onClick={() => dayEvents.length > 0 && setSelectedDay({ day, events: dayEvents })}
              disabled={dayEvents.length === 0}
              className={`flex min-h-[44px] flex-col items-center gap-1 rounded-lg border py-1 transition ${
                dayEvents.length > 0
                  ? "border-line/60 hover:border-berry-400 hover:bg-white/5"
                  : "border-line/60"
              }`}
            >
              <span className="text-xs text-muted">{day}</span>
              <div className="flex flex-wrap justify-center gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] leading-none"
                    style={{
                      backgroundColor: `${EVENT_TYPE_ACCENT[e.type]}33`,
                      opacity: isPast ? 1 : 0.6,
                    }}
                  >
                    {EVENT_TYPE_ICON[e.type]}
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[9px] text-faint">+{dayEvents.length - 3}</span>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-plum-700" />
            {t.monitoring.calendarPastTaken}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-plum-700 opacity-55" />
            {t.monitoring.calendarFuture}
          </span>
        </div>
      </Card>

      <Modal
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `${t.monitoring.calendarTitle} · ${selectedDay.day}` : ""}
      >
        {selectedDay?.events.length === 0 ? (
          <p className="text-sm text-faint">{t.monitoring.calendarDayEmpty}</p>
        ) : (
          <div className="space-y-2">
            {selectedDay?.events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: `${EVENT_TYPE_ACCENT[e.type]}33` }}
                >
                  {EVENT_TYPE_ICON[e.type]}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{e.title}</p>
                  <p className="text-xs text-faint">
                    {t.schedule.types[e.type]} ·{" "}
                    {new Date(e.scheduled_at).toLocaleTimeString(lang, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Track a hormone (moved here from Home) + scan-a-reading */}
      <h2 className="mb-3 mt-8 font-display text-lg text-white">{t.dashboard.trackWidget}</h2>
      <Card className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <Select
            value={hormone}
            onChange={(e) => setHormone(e.target.value as HormoneKey)}
          >
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
          />
          <Button onClick={logReading} disabled={saving || !value}>
            {saving && <Spinner />}
            {t.dashboard.logReading}
          </Button>
        </div>

        <div className="border-t border-line pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onScanFile(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
          >
            {scanning ? <Spinner /> : "📷"}
            {scanning ? t.monitoring.scanning : t.monitoring.scanButton}
          </Button>
          <p className="mt-2 text-xs text-faint">{t.monitoring.scanHint}</p>
          {scanError && <p className="mt-2 text-sm text-berry-400">{scanError}</p>}
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
                <li key={r.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-white">
                    {t.track.hormones[r.hormone as keyof typeof t.track.hormones] ?? r.hormone}
                    <span className="ml-2 text-faint">
                      {new Date(r.measured_on).toLocaleDateString(lang, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-berry-400">
                    {r.value}
                    <span className="ml-1 text-xs text-faint">{r.unit}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Hormone flashcards — a real card-flip animation, not just a content swap */}
      <h2 className="mb-1 mt-8 font-display text-lg text-white">{t.monitoring.flashcardsTitle}</h2>
      <p className="mb-3 text-sm text-muted">{t.monitoring.flashcardsHint}</p>
      <div className="grid gap-3">
        {HORMONE_KEYS.map((key) => {
          const isFlipped = flipped.has(key);
          return (
            <button
              key={key}
              onClick={() => toggleFlip(key)}
              className="text-left"
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative min-h-[120px] w-full transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <Card
                  className="absolute inset-0 flex h-full flex-col justify-center transition hover:border-berry-400 hover:shadow-md"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <p className="font-display text-xl text-white">{t.track.hormones[key]}</p>
                </Card>
                <Card
                  className="absolute inset-0 flex h-full flex-col justify-center"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <p className="text-sm text-muted">
                    {lang === "fr" ? HORMONE_FACTS[key].fr : HORMONE_FACTS[key].en}
                  </p>
                  <p className="mt-2 text-xs text-faint">{t.monitoring.flashcardsFactNote}</p>
                </Card>
              </div>
            </button>
          );
        })}
      </div>

      {/* Link to Journey how-to videos */}
      <Link href="/app/journey">
        <Card className="mt-6 flex items-center justify-between gap-3 transition hover:border-berry-400">
          <div>
            <p className="font-medium text-white">{t.monitoring.howToBlurb}</p>
            <p className="text-sm text-muted">{t.monitoring.howToLink}</p>
          </div>
          <span className="shrink-0 text-berry-500">→</span>
        </Card>
      </Link>
    </div>
  );
}
