import type { Profile, ScheduleEvent } from "@/lib/supabase/types";

// Pure stage-deriving logic, deliberately kept out of Journey.tsx (a "use
// client" component): api/chat/route.ts needs to call this from the server
// to ground Ask Maeve's replies in the patient's actual stage, and a
// function exported from a client module can't be invoked server-side.

export type StageKey =
  | "consultation"
  | "cycleStart"
  | "baselineScan"
  | "stimulation"
  | "monitoring"
  | "trigger"
  | "retrieval"
  | "transfer"
  | "twoWeekWait";

export type StageStatus = "complete" | "current" | "upcoming";

export type Stage = {
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
export function deriveStages(profile: Profile | null, events: ScheduleEvent[]): Stage[] {
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
