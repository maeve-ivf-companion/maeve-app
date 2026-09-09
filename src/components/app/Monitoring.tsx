"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, Spinner } from "@/components/ui";
import { EVENT_TYPE_ACCENT } from "@/lib/eventTypes";
import { HORMONE_FACTS, HORMONE_KEYS, type HormoneKey } from "@/lib/hormones";
import type { HormoneLog, ScheduleEvent } from "@/lib/supabase/types";

export function Monitoring() {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [logs, setLogs] = useState<HormoneLog[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Set<HormoneKey>>(new Set());

  useEffect(() => {
    (async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const [{ data: logRows }, { data: eventRows }] = await Promise.all([
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
      ]);
      setLogs((logRows as HormoneLog[]) ?? []);
      setEvents((eventRows as ScheduleEvent[]) ?? []);
      setLoading(false);
    })();
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

  const maxVal = Math.max(1, ...logs.map((l) => l.value));

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
          <div className="flex h-32 items-end gap-2">
            {logs.map((l) => (
              <div key={l.id} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-brand-gradient"
                  style={{ height: `${Math.max(6, (l.value / maxVal) * 100)}%` }}
                  title={`${l.value} ${l.unit}`}
                />
                <span className="text-[10px] text-faint">
                  {new Date(l.measured_on).toLocaleDateString(lang, { day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
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
            <div
              key={day}
              className="flex min-h-[44px] flex-col items-center gap-1 rounded-lg border border-line/60 py-1"
            >
              <span className="text-xs text-muted">{day}</span>
              <div className="flex flex-wrap justify-center gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: EVENT_TYPE_ACCENT[e.type],
                      opacity: isPast ? 1 : 0.55,
                    }}
                  />
                ))}
              </div>
            </div>
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

      {/* Hormone flashcards */}
      <h2 className="mb-1 mt-8 font-display text-lg text-white">{t.monitoring.flashcardsTitle}</h2>
      <p className="mb-3 text-sm text-muted">{t.monitoring.flashcardsHint}</p>
      <div className="grid gap-3">
        {HORMONE_KEYS.map((key) => {
          const isFlipped = flipped.has(key);
          return (
            <button key={key} onClick={() => toggleFlip(key)} className="text-left">
              <Card className="flex h-full min-h-[120px] flex-col justify-center transition hover:border-berry-400 hover:shadow-md">
                {!isFlipped ? (
                  <p className="font-display text-xl text-white">{t.track.hormones[key]}</p>
                ) : (
                  <div>
                    <p className="text-sm text-muted">
                      {lang === "fr" ? HORMONE_FACTS[key].fr : HORMONE_FACTS[key].en}
                    </p>
                    <p className="mt-2 text-xs text-faint">{t.monitoring.flashcardsFactNote}</p>
                  </div>
                )}
              </Card>
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
