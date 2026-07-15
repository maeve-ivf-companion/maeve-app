// Hand-authored row types mirroring supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types` once the project is live if preferred.

export type Role = "patient" | "partner";
export type Lang = "en" | "fr";
export type SharingLevel = "insights" | "mood" | "schedule" | "full";
export type Portal = "vent" | "cry" | "laugh" | "humour";
export type Visibility = "private" | "community";
export type EventType =
  | "injection"
  | "appointment"
  | "trigger"
  | "bloodwork"
  | "transfer"
  | "other";
export type VideoCategory =
  | "injections"
  | "medications"
  | "procedures"
  | "emotional";

export type Profile = {
  id: string;
  role: Role;
  display_name: string | null;
  language: Lang;
  cycle_start_date: string | null;
  invite_code: string | null;
  paired_with: string | null;
  partner_sharing_level: SharingLevel;
  consent_core: boolean;
  consent_journey: boolean;
  consent_health: boolean;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type PortalPost = {
  id: string;
  user_id: string;
  portal: Portal;
  body: string;
  mood: number | null;
  visibility: Visibility;
  created_at: string;
};

export type HormoneLog = {
  id: string;
  user_id: string;
  hormone: string;
  value: number;
  unit: string;
  measured_on: string;
  notes: string | null;
  interpretation: string | null;
  created_at: string;
};

export type ScheduleEvent = {
  id: string;
  user_id: string;
  type: EventType;
  title: string;
  scheduled_at: string;
  notes: string | null;
  reminder: boolean;
  created_at: string;
};

export type Nudge = {
  id: string;
  patient_id: string;
  partner_id: string | null;
  body: string;
  context: string | null;
  status: "sent" | "seen";
  created_at: string;
};

export type WhatIfQuery = {
  id: string;
  user_id: string;
  question: string;
  answer: string | null;
  created_at: string;
};

export type LearnVideo = {
  id: string;
  category: VideoCategory;
  title_en: string;
  title_fr: string;
  description_en: string | null;
  description_fr: string | null;
  url: string;
  duration_min: number | null;
  sort_order: number;
};
