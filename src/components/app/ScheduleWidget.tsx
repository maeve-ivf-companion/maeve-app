"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { Button, Card, Input, Select, Spinner } from "@/components/ui";
import type { EventType, ScheduleEvent } from "@/lib/supabase/types";

const TYPES: EventType[] = [
  "injection",
  "appointment",
  "trigger",
  "bloodwork",
  "transfer",
  "other",
];

const typeAccent: Record<EventType, string> = {
  injection: "#c2185b",
  appointment: "#5a6db5",
  trigger: "#e8923a",
  bloodwork: "#7a4b9e",
  transfer: "#4caf50",
  other: "#9090aa",
};

export function ScheduleWidget() {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("appointment");
  const [when, setWhen] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data } = await supabase
      .from("schedule_events")
      .select("*")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(4);
    setEvents((data as ScheduleEvent[]) ?? []);
    setLoading(false);
  }

  async function add() {
    if (!title.trim() || !when) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("schedule_events").insert({
        user_id: user.id,
        title: title.trim(),
        type,
        scheduled_at: new Date(when).toISOString(),
      });
      setTitle("");
      setWhen("");
      setOpen(false);
      await load();
    }
    setSaving(false);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-plum-700">
          {t.dashboard.scheduleWidget}
        </h2>
        <Link
          href="/app/schedule"
          className="text-sm font-medium text-berry-500 hover:text-berry-600"
        >
          {t.dashboard.viewAll}
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-4 text-muted">
          <Spinner />
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-faint">{t.dashboard.nothingUpcoming}</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-3">
              <span
                className="h-8 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: typeAccent[e.type] }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-plum-700">{e.title}</p>
                <p className="truncate text-xs text-faint">
                  {t.schedule.types[e.type]} ·{" "}
                  {new Date(e.scheduled_at).toLocaleString(lang, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="space-y-3 rounded-xl bg-cream/70 p-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.schedule.eventTitle}
            autoFocus
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
            >
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {t.schedule.types[ty]}
                </option>
              ))}
            </Select>
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              size="sm"
              onClick={add}
              disabled={saving || !title.trim() || !when}
            >
              {saving && <Spinner />}
              {t.common.add}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="soft" className="w-full" onClick={() => setOpen(true)}>
          + {t.dashboard.quickAdd}
        </Button>
      )}
    </Card>
  );
}
