"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { Card, Spinner } from "@/components/ui";
import type { ScheduleEvent } from "@/lib/supabase/types";

// Home page widget (PDF page 3): "Today's checklist: suggest water intake,
// medication times, next appointment, current schedule for today, all
// required medication + appointments."
export function TodaysChecklist() {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [today, setToday] = useState<ScheduleEvent[]>([]);
  const [next, setNext] = useState<ScheduleEvent | null>(null);
  const [drankWater, setDrankWater] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 86400000);
      const [{ data: todayRows }, { data: nextRows }] = await Promise.all([
        supabase
          .from("schedule_events")
          .select("*")
          .gte("scheduled_at", start.toISOString())
          .lt("scheduled_at", end.toISOString())
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("schedule_events")
          .select("*")
          .gte("scheduled_at", end.toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1),
      ]);
      setToday((todayRows as ScheduleEvent[]) ?? []);
      setNext((nextRows?.[0] as ScheduleEvent) ?? null);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="space-y-3">
      <p className="font-display text-lg text-white">{t.dashboard.checklistTitle}</p>
      {loading ? (
        <div className="flex justify-center py-4 text-muted">
          <Spinner />
        </div>
      ) : (
        <ul className="space-y-2">
          <li className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={drankWater}
              onChange={(e) => setDrankWater(e.target.checked)}
              className="h-5 w-5 accent-berry-500"
            />
            <span className={drankWater ? "text-faint line-through" : "text-white"}>
              {t.dashboard.checklistWater}
            </span>
          </li>
          {today.length === 0 ? (
            <li className="text-sm text-faint">{t.dashboard.checklistEmpty}</li>
          ) : (
            today.map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-berry-500" />
                <span className="min-w-0 flex-1 truncate text-white">{e.title}</span>
                <span className="shrink-0 text-xs text-faint">
                  {new Date(e.scheduled_at).toLocaleTimeString(lang, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))
          )}
          {next && (
            <li className="mt-2 border-t border-line pt-2 text-sm text-muted">
              {t.dashboard.checklistNextAppt}:{" "}
              <span className="font-medium text-white">{next.title}</span>{" "}
              {new Date(next.scheduled_at).toLocaleDateString(lang, {
                month: "short",
                day: "numeric",
              })}
            </li>
          )}
        </ul>
      )}
    </Card>
  );
}
