-- Add "retrieval" (egg retrieval) as its own schedule_events type.
--
-- Added for the Journey & Self-Care timeline (see Maeve Layout.pdf page 5),
-- which needs to distinguish "egg retrieval" from a generic monitoring
-- appointment or a "transfer". Before this migration, retrieval days had no
-- honest home in the schema and would have had to be title-matched against
-- 'other' or 'appointment' events, which is fragile. This gives the timeline
-- a real, queryable milestone instead.
--
-- Not yet applied to the live Supabase project as of this change. Run this
-- after 0001-0003, in the SQL Editor, same as the others.

alter table public.schedule_events drop constraint if exists schedule_events_type_check;

alter table public.schedule_events add constraint schedule_events_type_check
  check (type in ('injection', 'appointment', 'trigger', 'bloodwork', 'transfer', 'retrieval', 'other'));
