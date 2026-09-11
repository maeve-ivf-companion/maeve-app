-- Lets a patient customize exactly which items are shared with their
-- partner, instead of only choosing between the two Minimal/Maximal
-- presets. The presets still set a sensible default, but this column holds
-- the actual per-item selection so someone can, for example, keep the
-- Minimal preset but also opt into mood sharing, or drop one item from
-- Maximal. Values are item keys defined in the app (PartnerHub.tsx), not
-- validated here since the set may grow; RLS on profiles already covers
-- who can read/write this column (owner, or the paired partner for reads).

alter table public.profiles
  add column if not exists shared_items text[] not null default '{}';
