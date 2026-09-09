import type { EventType } from "@/lib/supabase/types";

// Shared with ScheduleWidget.tsx, ScheduleIt.tsx, and Monitoring.tsx so the
// same event type always renders in the same color everywhere in the app.
export const EVENT_TYPES: EventType[] = [
  "injection",
  "appointment",
  "trigger",
  "bloodwork",
  "retrieval",
  "transfer",
  "other",
];

export const EVENT_TYPE_ACCENT: Record<EventType, string> = {
  injection: "#c2185b",
  appointment: "#5a6db5",
  trigger: "#e8923a",
  bloodwork: "#7a4b9e",
  retrieval: "#2f8f7a",
  transfer: "#4caf50",
  other: "#9090aa",
};
