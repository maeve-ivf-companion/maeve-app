-- Phase 2-6 of docs/PDF-BUILD-PLAN.md: intake fields, medications, mood
-- check-ins, "fill your cup" entries, community topics/threads, the Ask
-- Maeve chat log, and partner notes. Every new table follows the existing
-- convention in 0001_init.sql: RLS enabled, owner-scoped by default.

-- ---------------------------------------------------------------------------
-- 1. Expanded sign-up intake fields (PDF page 2)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists age smallint,
  add column if not exists weight_kg numeric,
  add column if not exists postal_code text,
  add column if not exists procedure_type text,
  add column if not exists cycle_number smallint,
  add column if not exists procedure_duration_weeks smallint,
  add column if not exists notif_opt_in boolean not null default true,
  add column if not exists happy_thing text,
  add column if not exists connection_mode text not null default 'partner'
    check (connection_mode in ('partner', 'mee'));

-- 1b. "Mark done" on a schedule event, so completing a medication dose can
--     trigger the Feeling Ping (Support page, PDF page 7): "This will pop up
--     right after patient records med complete."
alter table public.schedule_events
  add column if not exists completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Prescribed medications (drives the 30-minutes-before reminder and the
--    hormone-explanation flashcards on the Monitoring page)
-- ---------------------------------------------------------------------------
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  hormone text not null,
  name text not null,
  dose text,
  times text[] not null default '{}',
  reminder_minutes_before smallint not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.medications enable row level security;

create policy "medications_all_own"
  on public.medications for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Quick mood check / Feeling Ping (Home + Support pages)
-- ---------------------------------------------------------------------------
create table if not exists public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mood smallint not null check (mood in (1, 2, 3)), -- 1 good, 2 neutral, 3 hard
  trigger_event_id uuid references public.schedule_events (id) on delete set null,
  shared_with_partner boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.mood_checkins enable row level security;

create policy "mood_checkins_all_own"
  on public.mood_checkins for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- A paired partner may read mood history only when the patient opted in on
-- that entry AND their sharing level is "mood" or above (mirrors the pattern
-- already used for schedule_events below, in 0001_init.sql).
create policy "mood_checkins_partner_read"
  on public.mood_checkins for select to authenticated
  using (
    shared_with_partner = true
    and exists (
      select 1 from public.profiles p
      where p.id = mood_checkins.user_id
        and p.paired_with = auth.uid()
        and p.partner_sharing_level in ('mood', 'schedule', 'full')
    )
  );

-- ---------------------------------------------------------------------------
-- 4. "What will fill your cup today?" (Home -> Support)
-- ---------------------------------------------------------------------------
create table if not exists public.cup_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  answer text not null,
  created_at timestamptz not null default now()
);

alter table public.cup_entries enable row level security;

create policy "cup_entries_all_own"
  on public.cup_entries for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Community: topic-based, anonymous, threaded (PDF page 6)
--    Topic keys are a fixed set enforced in code (see lib/community.ts),
--    the same pattern portal_posts already uses for its "portal" column.
-- ---------------------------------------------------------------------------
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic text not null check (
    topic in (
      'currently_stimulating', 'egg_retrieval', 'pregnancy',
      'two_week_wait', 'success_stories', 'loss_recovery', 'questions'
    )
  ),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.community_posts enable row level security;

create policy "community_posts_select_all"
  on public.community_posts for select to authenticated
  using (true);

create policy "community_posts_insert_own"
  on public.community_posts for insert to authenticated
  with check (user_id = auth.uid());

create policy "community_posts_delete_own"
  on public.community_posts for delete to authenticated
  using (user_id = auth.uid());

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.community_replies enable row level security;

create policy "community_replies_select_all"
  on public.community_replies for select to authenticated
  using (true);

create policy "community_replies_insert_own"
  on public.community_replies for insert to authenticated
  with check (user_id = auth.uid());

create policy "community_replies_delete_own"
  on public.community_replies for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Ask Maeve AI chat box (PDF page 6)
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "chat_messages_all_own"
  on public.chat_messages for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. Partner notes ("Alex wants you to know...", PDF page 7)
--    Deliberately separate from `nudges` (AI-generated patient -> partner
--    briefs): this is a short freeform note either person writes the other.
-- ---------------------------------------------------------------------------
create table if not exists public.partner_notes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.partner_notes enable row level security;

create policy "partner_notes_select_involved"
  on public.partner_notes for select to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy "partner_notes_insert_own"
  on public.partner_notes for insert to authenticated
  with check (from_user_id = auth.uid());
