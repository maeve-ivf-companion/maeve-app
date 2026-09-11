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
  | "retrieval"
  | "other";
export type VideoCategory =
  | "injections"
  | "medications"
  | "procedures"
  | "emotional";
export type ProcedureType = "ivf" | "iui" | "egg_freezing" | "fet" | "other";
export type CommunityTopic =
  | "currently_stimulating"
  | "egg_retrieval"
  | "pregnancy"
  | "two_week_wait"
  | "success_stories"
  | "loss_recovery"
  | "questions";
export type Mood = 1 | 2 | 3; // 1 good, 2 neutral, 3 hard
export type ConnectionMode = "partner" | "mee";
export type SharedItemKey =
  | "medTimes"
  | "fridgeReminder"
  | "cycleDay"
  | "hormoneTrends"
  | "moodToday";

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
  /** Set by the signup trigger from signUp metadata. Null means never accepted. */
  terms_accepted_at: string | null;
  /** CASL express consent to Maman commercial messages. Only ever true by explicit tick. */
  marketing_opt_in: boolean;
  marketing_opt_in_at: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
  // Sign-up intake (PDF page 2), all optional: profile rows created before
  // this migration, and partner-role rows, simply leave these null.
  age: number | null;
  weight_kg: number | null;
  postal_code: string | null;
  procedure_type: ProcedureType | null;
  cycle_number: number | null;
  procedure_duration_weeks: number | null;
  notif_opt_in: boolean;
  happy_thing: string | null;
  connection_mode: ConnectionMode;
  shared_items: SharedItemKey[];
};

export type Medication = {
  id: string;
  user_id: string;
  hormone: string;
  name: string;
  dose: string | null;
  times: string[];
  reminder_minutes_before: number;
  active: boolean;
  created_at: string;
};

export type MoodCheckin = {
  id: string;
  user_id: string;
  mood: Mood;
  trigger_event_id: string | null;
  shared_with_partner: boolean;
  created_at: string;
};

export type CupEntry = {
  id: string;
  user_id: string;
  answer: string;
  created_at: string;
};

export type CommunityPost = {
  id: string;
  user_id: string;
  topic: CommunityTopic;
  body: string;
  created_at: string;
};

export type CommunityReply = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  body: string;
  created_at: string;
};

export type PartnerNote = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  created_at: string;
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
  completed_at: string | null;
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
