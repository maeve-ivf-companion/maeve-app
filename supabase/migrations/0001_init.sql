-- Maeve by Maman — initial schema
-- Principles: minimum viable data, explicit per-action consent, RLS on
-- everything, partner sees insights (nudges) not raw data by default.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Short, human-shareable invite code (e.g. "MAEVE-7K2QX").
-- Uses the built-in gen_random_uuid() (pg_catalog) rather than pgcrypto's
-- gen_random_bytes(), which lives in the `extensions` schema and isn't on the
-- search_path of the security-definer signup trigger.
create or replace function public.gen_invite_code()
returns text
language sql
volatile
as $$
  select 'MAEVE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'patient' check (role in ('patient', 'partner')),
  display_name text,
  language text not null default 'en' check (language in ('en', 'fr')),
  cycle_start_date date,
  invite_code text unique default public.gen_invite_code(),
  paired_with uuid references public.profiles (id) on delete set null,
  partner_sharing_level text not null default 'insights'
    check (partner_sharing_level in ('insights', 'mood', 'schedule', 'full')),
  consent_core boolean not null default false,
  consent_journey boolean not null default false,
  consent_health boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Read your own profile, or your partner's. Note: we check `paired_with =
-- auth.uid()` on the candidate row directly (not a subquery on profiles) to
-- avoid infinite RLS recursion.
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = auth.uid() or paired_with = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- portal_posts  (Vent / Cry / Laugh / Humour)
-- ---------------------------------------------------------------------------
create table if not exists public.portal_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  portal text not null check (portal in ('vent', 'cry', 'laugh', 'humour')),
  body text not null,
  mood smallint check (mood between 1 and 5),
  visibility text not null default 'private'
    check (visibility in ('private', 'community')),
  created_at timestamptz not null default now()
);

alter table public.portal_posts enable row level security;

create policy "posts_select_own_or_community"
  on public.portal_posts for select to authenticated
  using (user_id = auth.uid() or visibility = 'community');

create policy "posts_insert_own"
  on public.portal_posts for insert to authenticated
  with check (user_id = auth.uid());

create policy "posts_update_own"
  on public.portal_posts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "posts_delete_own"
  on public.portal_posts for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- hormone_logs  (sensitive — owner only)
-- ---------------------------------------------------------------------------
create table if not exists public.hormone_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  hormone text not null,
  value numeric not null,
  unit text not null default '',
  measured_on date not null default current_date,
  notes text,
  interpretation text,
  created_at timestamptz not null default now()
);

alter table public.hormone_logs enable row level security;

create policy "hormones_all_own"
  on public.hormone_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- schedule_events
-- ---------------------------------------------------------------------------
create table if not exists public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'other'
    check (type in ('injection', 'appointment', 'trigger', 'bloodwork', 'transfer', 'other')),
  title text not null,
  scheduled_at timestamptz not null,
  notes text,
  reminder boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.schedule_events enable row level security;

-- Owner full access; a paired partner may read if sharing level allows.
create policy "schedule_select"
  on public.schedule_events for select to authenticated
  using (
    user_id = auth.uid()
    or user_id in (
      select id from public.profiles
      where paired_with = auth.uid()
        and partner_sharing_level in ('schedule', 'full')
    )
  );

create policy "schedule_write_own"
  on public.schedule_events for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- nudges  (the partner emotional brief — one way, patient -> partner)
-- ---------------------------------------------------------------------------
create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  partner_id uuid references public.profiles (id) on delete cascade,
  body text not null,
  context text,
  status text not null default 'sent' check (status in ('sent', 'seen')),
  created_at timestamptz not null default now()
);

alter table public.nudges enable row level security;

create policy "nudges_select_involved"
  on public.nudges for select to authenticated
  using (patient_id = auth.uid() or partner_id = auth.uid());

create policy "nudges_insert_patient"
  on public.nudges for insert to authenticated
  with check (patient_id = auth.uid());

create policy "nudges_update_involved"
  on public.nudges for update to authenticated
  using (patient_id = auth.uid() or partner_id = auth.uid())
  with check (patient_id = auth.uid() or partner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- whatif_queries  (AI Q&A history, owner only)
-- ---------------------------------------------------------------------------
create table if not exists public.whatif_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question text not null,
  answer text,
  created_at timestamptz not null default now()
);

alter table public.whatif_queries enable row level security;

create policy "whatif_all_own"
  on public.whatif_queries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- consents  (audit trail — meaningful consent per action)
-- ---------------------------------------------------------------------------
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  scope text not null,
  granted boolean not null,
  granted_at timestamptz not null default now()
);

alter table public.consents enable row level security;

create policy "consents_all_own"
  on public.consents for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- learn_videos  (how-to library — public read, bilingual)
-- ---------------------------------------------------------------------------
create table if not exists public.learn_videos (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('injections', 'medications', 'procedures', 'emotional')),
  title_en text not null,
  title_fr text not null,
  description_en text,
  description_fr text,
  url text not null,
  duration_min int,
  sort_order int not null default 0
);

alter table public.learn_videos enable row level security;

create policy "videos_public_read"
  on public.learn_videos for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- pairing helper: connect a partner to a patient by invite code
-- ---------------------------------------------------------------------------
create or replace function public.connect_with_code(code text)
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  patient public.profiles;
  me uuid := auth.uid();
begin
  select * into patient from public.profiles
    where invite_code = code and id <> me;

  if patient.id is null then
    raise exception 'Invalid invite code';
  end if;

  -- Link both directions.
  update public.profiles set paired_with = patient.id, role = 'partner', updated_at = now()
    where id = me;
  update public.profiles set paired_with = me, updated_at = now()
    where id = patient.id;

  return patient;
end;
$$;

grant execute on function public.connect_with_code(text) to authenticated;
