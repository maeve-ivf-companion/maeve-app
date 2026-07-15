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

export function ScheduleIt() {
  const { t, lang } = useLanguage();
  const supabase = createClient();

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("injection");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data } = await supabase
      .from("schedule_events")
      .select("*")
      .order("scheduled_at", { ascending: true });
    setEvents((data as ScheduleEvent[]) ?? []);
    setLoading(false);
  }

  async function save() {
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
        notes: notes || null,
        reminder,
      });
      setTitle("");
      setWhen("");
      setNotes("");
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(id: string) {
    await supabase.from("schedule_events").delete().eq("id", id);
    await load();
  }

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.scheduled_at).getTime() >= now);
  const past = events
    .filter((e) => new Date(e.scheduled_at).getTime() < now)
    .reverse();

  const fmtWhen = (d: string) =>
    new Date(d).toLocaleString(lang, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div>
      <PageHeader
        title={t.schedule.title}
        subtitle={t.schedule.subtitle}
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {t.schedule.addEvent}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>{t.schedule.eventTitle}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label>{t.schedule.type}</Label>
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
            </div>
            <div>
              <Label>{t.schedule.when}</Label>
              <Input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>{t.schedule.notesLabel}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[64px]"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={reminder}
              onChange={(e) => setReminder(e.target.checked)}
              className="h-4 w-4 accent-berry-500"
            />
            {t.schedule.reminder}
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={save} disabled={saving || !title.trim() || !when}>
              {saving && <Spinner />}
              {t.common.save}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12 text-muted">
          <Spinner />
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-faint">{t.schedule.empty}</p>
      ) : (
        <div className="space-y-8">
          <Section
            title={t.schedule.upcoming}
            events={upcoming}
            fmtWhen={fmtWhen}
            typeLabel={(ty) => t.schedule.types[ty]}
            onRemove={remove}
          />
          {past.length > 0 && (
            <Section
              title={t.schedule.past}
              events={past}
              fmtWhen={fmtWhen}
              typeLabel={(ty) => t.schedule.types[ty]}
              onRemove={remove}
              muted
            />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  events,
  fmtWhen,
  typeLabel,
  onRemove,
  muted,
}: {
  title: string;
  events: ScheduleEvent[];
  fmtWhen: (d: string) => string;
  typeLabel: (t: EventType) => string;
  onRemove: (id: string) => void;
  muted?: boolean;
}) {
  if (events.length === 0) return null;
  return (
    <section className={muted ? "opacity-70" : ""}>
      <h2 className="mb-3 font-display text-lg text-plum-700">{title}</h2>
      <div className="space-y-2">
        {events.map((e) => (
          <Card key={e.id} className="flex items-center gap-3 p-4">
            <span
              className="h-10 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: typeAccent[e.type] }}
            />
            <div className="flex-1">
              <p className="font-medium text-plum-700">{e.title}</p>
              <p className="text-sm text-faint">
                {typeLabel(e.type)} · {fmtWhen(e.scheduled_at)}
              </p>
            </div>
            <button
              onClick={() => onRemove(e.id)}
              className="text-faint hover:text-berry-500"
              aria-label="delete"
            >
              ×
            </button>
          </Card>
        ))}
      </div>
    </section>
  );
}
