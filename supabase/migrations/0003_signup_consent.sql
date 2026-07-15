-- Signup consent: terms acceptance (required) and Maman marketing opt-in
-- (optional, and unchecked by default).
--
-- Why this goes through the signup trigger rather than a client insert:
-- when Supabase "Confirm email" is ON, supabase.auth.signUp() returns no
-- session. The user is not authenticated yet, so auth.uid() is null and any
-- client-side insert into `consents` is refused by RLS. Instead the client
-- passes consent in signUp's options.data, which Supabase stores on
-- auth.users.raw_user_meta_data, and this security-definer trigger reads it at
-- user-creation time. That captures consent at the exact moment it was given,
-- even for users who never come back to confirm their email.

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_opt_in_at timestamptz;

comment on column public.profiles.terms_accepted_at is
  'When the user accepted the Terms of Service and Privacy Policy at signup. Null means never accepted.';
comment on column public.profiles.marketing_opt_in is
  'Express consent to Maman Biomedical commercial messages (CASL). Defaults false; only ever true by explicit tick.';

-- Recreate the signup trigger to also record consent.
-- Note: uses the built-in gen_random_uuid() elsewhere, never pgcrypto's
-- gen_random_bytes(), which is not on this function's pinned search_path.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  terms_ok boolean := coalesce((meta->>'terms_accepted')::boolean, false);
  marketing_ok boolean := coalesce((meta->>'marketing_opt_in')::boolean, false);
begin
  insert into public.profiles (
    id,
    display_name,
    terms_accepted_at,
    marketing_opt_in,
    marketing_opt_in_at
  )
  values (
    new.id,
    coalesce(meta->>'display_name', null),
    case when terms_ok then now() else null end,
    marketing_ok,
    case when marketing_ok then now() else null end
  )
  on conflict (id) do nothing;

  -- Audit trail. Record the marketing answer either way: under CASL, evidence
  -- that someone declined is as useful as evidence that they agreed.
  if terms_ok then
    insert into public.consents (user_id, scope, granted)
    values (new.id, 'terms', true);
  end if;

  insert into public.consents (user_id, scope, granted)
  values (new.id, 'marketing', marketing_ok);

  return new;
end;
$$;
