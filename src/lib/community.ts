import type { CommunityTopic } from "@/lib/supabase/types";
import type { StageKey } from "@/components/app/Journey";
import type { Dictionary } from "@/lib/i18n/en";

// Fixed topic set enforced by the DB check constraint in
// 0005_pdf_full_buildout.sql, mirroring how lib/portals.ts already keys off
// a fixed "portal" column. Emoji stand in for the PDF's icon tiles.
export const COMMUNITY_TOPICS: { key: CommunityTopic; emoji: string }[] = [
  { key: "currently_stimulating", emoji: "💉" },
  { key: "egg_retrieval", emoji: "🥚" },
  { key: "pregnancy", emoji: "🤰" },
  { key: "two_week_wait", emoji: "📅" },
  { key: "success_stories", emoji: "💖" },
  { key: "loss_recovery", emoji: "🫂" },
  { key: "questions", emoji: "❓" },
];

export function topicLabel(t: Dictionary, key: CommunityTopic) {
  return t.community.topics[key];
}

// Maps a Journey stage to the community topic the PDF says should be shown
// first ("the first topic will be aligned with the patient's current
// journey"). Stages with no obvious topic (consultation, baseline scan)
// fall back to "questions".
const STAGE_TOPIC: Record<StageKey, CommunityTopic> = {
  consultation: "questions",
  cycleStart: "currently_stimulating",
  baselineScan: "currently_stimulating",
  stimulation: "currently_stimulating",
  monitoring: "currently_stimulating",
  trigger: "egg_retrieval",
  retrieval: "egg_retrieval",
  transfer: "two_week_wait",
  twoWeekWait: "two_week_wait",
};

export function topicForStage(stage: StageKey | null): CommunityTopic {
  return stage ? STAGE_TOPIC[stage] : "questions";
}
