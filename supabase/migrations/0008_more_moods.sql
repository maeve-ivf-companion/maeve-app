-- Widens the quick mood check from three faces to five: adds angry (4) and
-- anxious (5). 1 to 3 keep their meaning, so existing rows are untouched.
alter table public.mood_checkins
  drop constraint if exists mood_checkins_mood_check;
alter table public.mood_checkins
  add constraint mood_checkins_mood_check check (mood in (1, 2, 3, 4, 5));
