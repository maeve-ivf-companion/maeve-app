-- Consultation is the one Journey stage with no schedule_events row of its
-- own (see deriveStages in src/lib/stages.ts), so it has never had a date
-- to show or edit. Rather than fabricate one, this adds a real, optional
-- column the patient can fill in herself from the Journey page; it stays
-- null (and the stage shows "Add a date") until she sets it.
--
-- happy_things replaces happy_thing (singular): the onboarding "What makes
-- you happy?" step is now multi-select, so this needs to hold more than one
-- value. Nothing else in the app reads happy_thing yet, so it's dropped
-- rather than kept alongside a column nothing uses.

alter table public.profiles
  add column if not exists consultation_date date;

alter table public.profiles
  add column if not exists happy_things text[] not null default '{}';

alter table public.profiles
  drop column if exists happy_thing;
