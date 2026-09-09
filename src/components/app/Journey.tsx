"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, Spinner } from "@/components/ui";
import { fmt } from "@/lib/i18n/format";
import type { LearnVideo, Profile, ScheduleEvent } from "@/lib/supabase/types";

type StageKey =
  | "consultation"
  | "cycleStart"
  | "baselineScan"
  | "stimulation"
  | "monitoring"
  | "trigger"
  | "retrieval"
  | "transfer"
  | "twoWeekWait";

type StageStatus = "complete" | "current" | "upcoming";

type Stage = {
  key: StageKey;
  status: StageStatus;
  detail?: { day: number; total?: number };
};

const STAGE_ORDER: StageKey[] = [
  "consultation",
  "cycleStart",
  "baselineScan",
  "stimulation",
  "monitoring",
  "trigger",
  "retrieval",
  "transfer",
  "twoWeekWait",
];

const DAY_MS = 86400000;
const daysBetween = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / DAY_MS);
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/**
 * Derives the IVF Journey timeline from what the schema actually tracks
 * today: `profiles.cycle_start_date` plus `schedule_events`. There is no
 * explicit "current stage" or "consultation" event yet, so a few stages are
 * inferred rather than stored:
 *
 * - `consultation` has no event of its own; it's shown complete once a cycle
 *   has been started, since that can't happen before a consultation.
 * - `monitoring` deliberately mirrors `stimulation`'s status rather than
 *   getting its own date logic. Monitoring appointments happen throughout
 *   stimulation in reality; the schema has no separate "monitoring phase"
 *   concept, and the layout mock shows them as sequential rows, so this is a
 *   known simplification, not a hidden assumption. See docs/PDF-BUILD-PLAN.md.
 * - Everything else (`baselineScan`, `trigger`, `retrieval`, `transfer`) is
 *   read directly off the matching `schedule_events` row when one exists.
 */
function deriveStages(profile: Profile | null, events: ScheduleEvent[]): Stage[] {
  const now = new Date();
  const cycleStart = profile?.cycle_start_date ? new Date(profile.cycle_start_date) : null;

  const sorted = [...events].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );
  const afterCycleStart = (e: ScheduleEvent) =>
    !cycleStart || new Date(e.scheduled_at) >= cycleStart;

  const baseline = sorted.find(
    (e) =>
      e.type === "appointment" &&
      afterCycleStart(e) &&
      (!cycleStart || daysBetween(cycleStart, new Date(e.scheduled_at)) <= 6)
  );
  const trigger = sorted.find((e) => e.type === "trigger" && afterCycleStart(e));
  const retrieval = sorted.find((e) => e.type === "retrieval" && afterCycleStart(e));
  const transfer = sorted.find((e) => e.type === "transfer" && afterCycleStart(e));

  const dateStatus = (d: Date | null): StageStatus => {
    if (!d) return "upcoming";
    if (isSameDay(d, now)) return "current";
    return d < now ? "complete" : "upcoming";
  };

  const stimulationStatus: StageStatus = !cycleStart
    ? "upcoming"
    : now < cycleStart
      ? "upcoming"
      : trigger && now >= new Date(trigger.scheduled_at)
        ? "complete"
        : "current";

  let stimulationDetail: { day: number; total?: number } | undefined;
  if (stimulationStatus === "current" && cycleStart) {
    const day = daysBetween(cycleStart, now) + 1;
    const total = trigger
      ? Math.max(day, daysBetween(cycleStart, new Date(trigger.scheduled_at)))
      : undefined;
    stimulationDetail = { day, total };
  }

  const twoWeekWaitStatus: StageStatus = (() => {
    if (!transfer) return "upcoming";
    const start = new Date(transfer.scheduled_at);
    if (now < start) return "upcoming";
    const end = new Date(start.getTime() + 14 * DAY_MS);
    return now >= end ? "complete" : "current";
  })();

  const stages: Record<StageKey, Stage> = {
    consultation: {
      key: "consultation",
      status: cycleStart ? "complete" : "upcoming",
    },
    cycleStart: {
      key: "cycleStart",
      status: !cycleStart ? "upcoming" : dateStatus(cycleStart) === "upcoming" ? "upcoming" : "complete",
    },
    baselineScan: {
      key: "baselineScan",
      status: baseline ? dateStatus(new Date(baseline.scheduled_at)) : "upcoming",
    },
    stimulation: { key: "stimulation", status: stimulationStatus, detail: stimulationDetail },
    monitoring: { key: "monitoring", status: stimulationStatus },
    trigger: {
      key: "trigger",
      status: trigger ? dateStatus(new Date(trigger.scheduled_at)) : "upcoming",
    },
    retrieval: {
      key: "retrieval",
      status: retrieval ? dateStatus(new Date(retrieval.scheduled_at)) : "upcoming",
    },
    transfer: {
      key: "transfer",
      status: transfer ? dateStatus(new Date(transfer.scheduled_at)) : "upcoming",
    },
    twoWeekWait: { key: "twoWeekWait", status: twoWeekWaitStatus },
  };

  return STAGE_ORDER.map((k) => stages[k]);
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
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-berry-500 bg-blush-100">
        <span className="h-2 w-2 rounded-full bg-berry-500" />
      </span>
    );
  return <span className="h-6 w-6 shrink-0 rounded-full border-2 border-line bg-white" />;
}

export function Journey() {
  const { t, lang } = useLanguage();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [videos, setVideos] = useState<LearnVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner />
      </div>
    );

  const stages = deriveStages(profile, events);

  return (
    <div>
      <PageHeader title={t.journey.title} subtitle={t.journey.subtitle} />

      {/* Timeline */}
      <Card>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg text-plum-700">
            {t.journey.timelineTitle}
          </h2>
          {profile?.cycle_start_date && (
            <p className="text-xs text-faint">
              {fmt(t.journey.startedOn, {
                date: new Date(profile.cycle_start_date).toLocaleDateString(lang, {
                  month: "long",
                  day: "numeric",
                }),
              })}
            </p>
          )}
        </div>

        {!profile?.cycle_start_date ? (
          <p className="text-sm text-faint">{t.journey.noCycle}</p>
        ) : (
          <ol className="space-y-0">
            {stages.map((stage, i) => (
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
                    stage.status === "current" ? "bg-blush-100" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`font-medium ${
                        stage.status === "upcoming" ? "text-faint" : "text-plum-700"
                      }`}
                    >
                      {t.journey.stages[stage.key]}
                    </p>
                    {stage.status !== "upcoming" && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          stage.status === "current"
                            ? "bg-berry-500 text-white"
                            : "bg-plum-50 text-plum-700"
                        }`}
                      >
                        {stage.status === "current"
                          ? t.journey.statusCurrent
                          : t.journey.statusComplete}
                      </span>
                    )}
                  </div>
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
            ))}
          </ol>
        )}
      </Card>

      {/* How-to videos */}
      {videos.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-display text-lg text-plum-700">
            {t.journey.howToTitle}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {videos.map((v) => (
              <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer">
                <Card className="flex h-full items-start gap-3 transition hover:border-berry-400 hover:shadow-md">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-100 text-berry-500">
                    ▶
                  </span>
                  <div>
                    <p className="font-medium text-plum-700">
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
      <h2 className="mb-3 mt-8 font-display text-lg text-plum-700">
        {t.journey.selfCareTitle}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex flex-col gap-1">
          <span className="text-2xl">🧘</span>
          <p className="font-medium text-plum-700">
            {t.journey.selfCare.meditationTitle}
          </p>
          <p className="text-sm text-muted">{t.journey.selfCare.meditationBody}</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-2xl">🤸</span>
          <p className="font-medium text-plum-700">{t.journey.selfCare.yogaTitle}</p>
          <p className="text-sm text-muted">{t.journey.selfCare.yogaBody}</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-2xl">🥗</span>
          <p className="font-medium text-plum-700">
            {t.journey.selfCare.nutritionTitle}
          </p>
          <p className="text-sm text-muted">{t.journey.selfCare.nutritionBody}</p>
        </Card>
      </div>
    </div>
  );
}
