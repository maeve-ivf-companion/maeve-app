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
  /** Single-point date for stages that have (or could have) exactly one:
   * consultation, cycleStart, baselineScan, trigger, retrieval, transfer. */
  date?: string | null;
  /** Span for stages that cover more than one day: stimulation, monitoring,
   * twoWeekWait. Derived from other stages' dates, so it's read-only. */
  range?: { start: string | null; end: string | null };
  /** The schedule_events row backing this stage's date, when one exists.
   * Only set for baselineScan/trigger/retrieval/transfer. */
  eventId?: string | null;
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

// `cycle_start_date` and `consultation_date` are date-only columns
// ("YYYY-MM-DD"). Passing that straight to `new Date(...)` parses it as UTC
// midnight, which lands on the previous day in any timezone behind UTC,
// throwing off every stage-status and day-count comparison below. Build the
// Date from local components instead.
function toLocalDate(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(y, m - 1, d);
}

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
  const cycleStart = profile?.cycle_start_date ? toLocalDate(profile.cycle_start_date) : null;

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

  const transferEnd = transfer
    ? new Date(new Date(transfer.scheduled_at).getTime() + 14 * DAY_MS).toISOString()
    : null;

  const stages: Record<StageKey, Stage> = {
    consultation: {
      key: "consultation",
      status: cycleStart ? "complete" : "upcoming",
      date: profile?.consultation_date ?? null,
    },
    cycleStart: {
      key: "cycleStart",
      status: !cycleStart ? "upcoming" : dateStatus(cycleStart) === "upcoming" ? "upcoming" : "complete",
      date: profile?.cycle_start_date ?? null,
    },
    baselineScan: {
      key: "baselineScan",
      status: baseline ? dateStatus(new Date(baseline.scheduled_at)) : "upcoming",
      date: baseline?.scheduled_at ?? null,
      eventId: baseline?.id ?? null,
    },
    stimulation: {
      key: "stimulation",
      status: stimulationStatus,
      detail: stimulationDetail,
      range: { start: cycleStart?.toISOString() ?? null, end: trigger?.scheduled_at ?? null },
    },
    monitoring: {
      key: "monitoring",
      status: stimulationStatus,
      range: { start: cycleStart?.toISOString() ?? null, end: trigger?.scheduled_at ?? null },
    },
    trigger: {
      key: "trigger",
      status: trigger ? dateStatus(new Date(trigger.scheduled_at)) : "upcoming",
      date: trigger?.scheduled_at ?? null,
      eventId: trigger?.id ?? null,
    },
    retrieval: {
      key: "retrieval",
      status: retrieval ? dateStatus(new Date(retrieval.scheduled_at)) : "upcoming",
      date: retrieval?.scheduled_at ?? null,
      eventId: retrieval?.id ?? null,
    },
    transfer: {
      key: "transfer",
      status: transfer ? dateStatus(new Date(transfer.scheduled_at)) : "upcoming",
      date: transfer?.scheduled_at ?? null,
      eventId: transfer?.id ?? null,
    },
    twoWeekWait: {
      key: "twoWeekWait",
      status: twoWeekWaitStatus,
      range: { start: transfer?.scheduled_at ?? null, end: transferEnd },
    },
  };

  return STAGE_ORDER.map((k) => stages[k]);
}
