"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, Input, Label, Modal, Spinner } from "@/components/ui";
import { fmt } from "@/lib/i18n/format";
import { deriveStages, type Stage, type StageKey, type StageStatus } from "@/lib/stages";
import type { EventType, LearnVideo, Profile, ScheduleEvent } from "@/lib/supabase/types";

// Stages backed by a schedule_events row, and which event type each one
// creates when the patient adds a date that doesn't exist yet.
const EVENT_TYPE_FOR_STAGE: Partial<Record<StageKey, EventType>> = {
  baselineScan: "appointment",
  trigger: "trigger",
  retrieval: "retrieval",
  transfer: "transfer",
};
// Stages backed directly by a profiles column instead of an event.
const PROFILE_FIELD_FOR_STAGE: Partial<Record<StageKey, "consultation_date" | "cycle_start_date">> = {
  consultation: "consultation_date",
  cycleStart: "cycle_start_date",
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// A plain "YYYY-MM-DD" (date-only columns like cycle_start_date and
// consultation_date) must not go through `new Date(iso)` directly: that
// parses as UTC midnight, which renders as the day before in any timezone
// behind UTC. Build the Date from local components instead.
function toLocalDate(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

function StatusDot({ status }: { status: StageStatus }) {
  if (status === "complete")
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plum-700 text-xs text-white">
        ✓
      </span>
    );
  if (status === "current")
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-berry-500 bg-berry-500">
        <span className="h-2 w-2 rounded-full bg-blush-100" />
      </span>
    );
  return <span className="h-6 w-6 shrink-0 rounded-full border-2 border-line bg-transparent" />;
}

export function Journey() {
  const { t, lang } = useLanguage();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [videos, setVideos] = useState<LearnVideo[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing a profile-column date (consultation, cycle start)
  const [editingField, setEditingField] = useState<StageKey | null>(null);
  const [editFieldDate, setEditFieldDate] = useState("");
  const [editFieldSaving, setEditFieldSaving] = useState(false);

  // Editing (or adding) the schedule_events row behind a stage (baseline
  // scan, trigger, retrieval, transfer)
  const [editingEvent, setEditingEvent] = useState<Stage | null>(null);
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventWhen, setEditEventWhen] = useState("");
  const [editEventSaving, setEditEventSaving] = useState(false);
  const [editEventDeleting, setEditEventDeleting] = useState(false);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const [{ data: prof }, { data: ev }, { data: vids }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("schedule_events").select("*").eq("user_id", user.id),
      supabase
        .from("learn_videos")
        .select("*")
        .in("category", ["injections", "medications"])
        .order("sort_order", { ascending: true })
        .limit(4),
    ]);
    setProfile((prof as Profile) ?? null);
    setEvents((ev as ScheduleEvent[]) ?? []);
    setVideos((vids as LearnVideo[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openFieldEdit(stage: Stage) {
    setEditingField(stage.key);
    setEditFieldDate(stage.date ? stage.date.slice(0, 10) : "");
  }

  async function saveFieldEdit() {
    if (!editingField || !editFieldDate) return;
    const column = PROFILE_FIELD_FOR_STAGE[editingField];
    if (!column) return;
    setEditFieldSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ [column]: editFieldDate }).eq("id", user.id);
      await load();
    }
    setEditFieldSaving(false);
    setEditingField(null);
  }

  function openEventEdit(stage: Stage) {
    setEditingEvent(stage);
    setEditEventTitle(t.journey.stages[stage.key]);
    setEditEventWhen(stage.date ? toLocalInput(stage.date) : "");
  }

  async function saveEventEdit() {
    if (!editingEvent || !editEventTitle.trim() || !editEventWhen) return;
    const eventType = EVENT_TYPE_FOR_STAGE[editingEvent.key];
    if (!eventType) return;
    setEditEventSaving(true);
    const scheduledAt = new Date(editEventWhen).toISOString();
    if (editingEvent.eventId) {
      await supabase
        .from("schedule_events")
        .update({ title: editEventTitle.trim(), scheduled_at: scheduledAt })
        .eq("id", editingEvent.eventId);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("schedule_events").insert({
          user_id: user.id,
          type: eventType,
          title: editEventTitle.trim(),
          scheduled_at: scheduledAt,
        });
      }
    }
    await load();
    setEditEventSaving(false);
    setEditingEvent(null);
  }

  async function deleteEventEdit() {
    if (!editingEvent?.eventId) return;
    setEditEventDeleting(true);
    await supabase.from("schedule_events").delete().eq("id", editingEvent.eventId);
    await load();
    setEditEventDeleting(false);
    setEditingEvent(null);
  }

  if (loading)
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner />
      </div>
    );

  const stages = deriveStages(profile, events);

  const fmtShort = (iso: string) =>
    toLocalDate(iso).toLocaleDateString(lang, { month: "short", day: "numeric" });
  const fmtRange = (range: { start: string | null; end: string | null }) => {
    if (!range.start) return null;
    if (!range.end) return `${fmtShort(range.start)} – ${t.journey.rangeOngoing}`;
    return `${fmtShort(range.start)} – ${fmtShort(range.end)}`;
  };

  return (
    <div>
      <PageHeader title={t.journey.title} subtitle={t.journey.subtitle} />

      {/* Timeline */}
      <Card>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg text-white">
            {t.journey.timelineTitle}
          </h2>
          <div className="flex items-center gap-3">
            {profile?.cycle_start_date && (
              <p className="text-xs text-faint">
                {fmt(t.journey.startedOn, {
                  date: toLocalDate(profile.cycle_start_date).toLocaleDateString(lang, {
                    month: "long",
                    day: "numeric",
                  }),
                })}
              </p>
            )}
            <Link
              href="/app/schedule"
              className="shrink-0 text-xs font-medium text-berry-500 hover:text-berry-600"
            >
              {t.journey.editCalendar}
            </Link>
          </div>
        </div>

        {!profile?.cycle_start_date ? (
          <p className="text-sm text-faint">{t.journey.noCycle}</p>
        ) : (
          <ol className="space-y-0">
            {stages.map((stage, i) => {
              const isEventStage = stage.key in EVENT_TYPE_FOR_STAGE;
              const isFieldStage = stage.key in PROFILE_FIELD_FOR_STAGE;
              const onClickDate = isEventStage
                ? () => openEventEdit(stage)
                : isFieldStage
                  ? () => openFieldEdit(stage)
                  : undefined;

              return (
                <li key={stage.key} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < stages.length - 1 && (
                    <span
                      className={`absolute left-3 top-6 h-full w-px ${
                        stage.status === "complete" ? "bg-plum-700" : "bg-line"
                      }`}
                    />
                  )}
                  <StatusDot status={stage.status} />
                  <div
                    className={`min-w-0 flex-1 rounded-xl px-3 py-2 ${
                      stage.status === "current" ? "bg-berry-500/25" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`font-medium ${
                          stage.status === "upcoming" ? "text-faint" : "text-white"
                        }`}
                      >
                        {t.journey.stages[stage.key]}
                      </p>
                      {stage.status !== "upcoming" && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            stage.status === "current"
                              ? "bg-blush-100 text-berry-600"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          {stage.status === "current"
                            ? t.journey.statusCurrent
                            : t.journey.statusComplete}
                        </span>
                      )}
                    </div>

                    {onClickDate && (
                      <button
                        type="button"
                        onClick={onClickDate}
                        className="mt-0.5 text-sm text-berry-500 underline-offset-2 hover:underline"
                      >
                        {stage.date ? fmtShort(stage.date) : t.journey.addDate}
                      </button>
                    )}
                    {stage.range && fmtRange(stage.range) && (
                      <p className="mt-0.5 text-sm text-muted">{fmtRange(stage.range)}</p>
                    )}

                    {stage.detail && stage.status === "current" && (
                      <p className="text-sm text-muted">
                        {stage.detail.total
                          ? fmt(t.journey.dayOfStageTotal, {
                              n: stage.detail.day,
                              total: stage.detail.total,
                            })
                          : fmt(t.journey.dayOfStage, { n: stage.detail.day })}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Modal
        open={editingField !== null}
        onClose={() => setEditingField(null)}
        title={editingField ? t.journey.stages[editingField] : ""}
      >
        <div className="space-y-4">
          <div>
            <Label>{t.track.date}</Label>
            <Input
              type="date"
              value={editFieldDate}
              onChange={(e) => setEditFieldDate(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={saveFieldEdit}
            disabled={editFieldSaving || !editFieldDate}
          >
            {editFieldSaving && <Spinner />}
            {t.common.save}
          </Button>
        </div>
      </Modal>

      <Modal
        open={editingEvent !== null}
        onClose={() => setEditingEvent(null)}
        title={editingEvent ? t.journey.stages[editingEvent.key] : ""}
      >
        <div className="space-y-4">
          <div>
            <Label>{t.schedule.eventTitle}</Label>
            <Input value={editEventTitle} onChange={(e) => setEditEventTitle(e.target.value)} />
          </div>
          <div>
            <Label>{t.schedule.when}</Label>
            <Input
              type="datetime-local"
              value={editEventWhen}
              onChange={(e) => setEditEventWhen(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {editingEvent?.eventId && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={deleteEventEdit}
                disabled={editEventDeleting || editEventSaving}
              >
                {editEventDeleting && <Spinner />}
                {t.common.delete}
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={saveEventEdit}
              disabled={editEventSaving || editEventDeleting || !editEventTitle.trim() || !editEventWhen}
            >
              {editEventSaving && <Spinner />}
              {t.common.save}
            </Button>
          </div>
        </div>
      </Modal>

      {/* How-to videos */}
      {videos.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-display text-lg text-white">
            {t.journey.howToTitle}
          </h2>
          <div className="grid gap-3">
            {videos.map((v) => (
              <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer">
                <Card className="flex h-full items-start gap-3 transition hover:border-berry-400 hover:shadow-md">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-100 text-berry-500">
                    ▶
                  </span>
                  <div>
                    <p className="font-medium text-white">
                      {lang === "fr" ? v.title_fr : v.title_en}
                    </p>
                    {v.duration_min && (
                      <p className="mt-1 text-xs text-faint">
                        {v.duration_min} min · {t.learn.watch}
                      </p>
                    )}
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </>
      )}

      {/* Self-care */}
      <h2 className="mb-3 mt-8 font-display text-lg text-white">
        {t.journey.selfCareTitle}
      </h2>
      <div className="grid gap-3">
        <Card className="flex flex-col gap-1">
          <span className="text-2xl">🧘</span>
          <p className="font-medium text-white">
            {t.journey.selfCare.meditationTitle}
          </p>
          <p className="text-sm text-muted">{t.journey.selfCare.meditationBody}</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-2xl">🤸</span>
          <p className="font-medium text-white">{t.journey.selfCare.yogaTitle}</p>
          <p className="text-sm text-muted">{t.journey.selfCare.yogaBody}</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-2xl">🥗</span>
          <p className="font-medium text-white">
            {t.journey.selfCare.nutritionTitle}
          </p>
          <p className="text-sm text-muted">{t.journey.selfCare.nutritionBody}</p>
        </Card>
      </div>

      <Link href="/app/learn">
        <Card className="mt-6 flex items-center justify-between gap-3 transition hover:border-berry-400">
          <p className="font-medium text-white">{t.journey.learnLink}</p>
          <span className="shrink-0 text-berry-500">→</span>
        </Card>
      </Link>
    </div>
  );
}
