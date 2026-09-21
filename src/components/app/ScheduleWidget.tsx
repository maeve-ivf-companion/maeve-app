"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { fmt } from "@/lib/i18n/format";
import { Button, Card, Input, Select, Spinner } from "@/components/ui";
import { EVENT_TYPES as TYPES, EVENT_TYPE_ACCENT as typeAccent } from "@/lib/eventTypes";
import { MOOD_OPTIONS as PING_MOODS } from "@/lib/moods";
import type { EventType, Mood, ScheduleEvent } from "@/lib/supabase/types";


export function ScheduleWidget() {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [pingFor, setPingFor] = useState<ScheduleEvent | null>(null);

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

  async function markDone(e: ScheduleEvent) {
    await supabase
      .from("schedule_events")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", e.id);
    setEvents((prev) => prev.filter((ev) => ev.id !== e.id));
    setPingFor(e); // Feeling Ping (PDF page 7): pops up right after a med is marked complete.
  }

  async function sendPing(mood: Mood) {
    if (!pingFor) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("mood_checkins").insert({
        user_id: user.id,
        mood,
        trigger_event_id: pingFor.id,
        shared_with_partner: true,
      });
    }
    setPingFor(null);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-white">
          {t.dashboard.scheduleWidget}
        </h2>
        <Link
          href="/app/schedule"
          className="text-sm font-medium text-berry-500 hover:text-berry-600"
        >
          {t.dashboard.viewAll}
        </Link>
      </div>

      {pingFor && (
        <div className="rounded-xl bg-berry-500/25 p-3">
          <p className="mb-2 text-sm font-medium text-white">
            {fmt(t.partner.feelingPingPrompt, { title: pingFor.title })}
          </p>
          <div className="flex justify-between gap-2">
            {PING_MOODS.map(({ mood, emoji }) => (
              <button
                key={mood}
                onClick={() => sendPing(mood)}
                className="flex flex-1 items-center justify-center rounded-xl bg-white/5 py-2 text-xl transition hover:bg-white/10"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

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
                <p className="truncate font-medium text-white">{e.title}</p>
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
              {e.type === "injection" && (
                <Button size="sm" variant="soft" onClick={() => markDone(e)}>
                  {t.common.done}
                </Button>
              )}
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
          <div className="grid grid-cols-1 gap-3">
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
