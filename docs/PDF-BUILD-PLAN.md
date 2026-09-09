# Building Maeve from Maeve_Layout.pdf

This tracks turning the wireframe/notes in `Maeve_Layout.pdf` (7 pages of
handwritten screen sketches, provided by Latchmi, stored in the
Maeve-Handoff Drive folder) into real features on top of the existing MVP.
Written per the standing rule in `AGENTS.md`: explore, plan, implement,
verify with `npm run build`, one slice at a time rather than all at once.

## Color palette

**Already matches.** The PDF's reference palette (`maeve_website.html`'s
`--plum` / `--rose` tokens: deep plum `#2B1B3D`/`#3D2459`, berry/magenta
`#C2185B`, blush `#FCE4EC`/`#FFF0F5`) is exactly what `src/app/globals.css`
already defines as the Tailwind theme (`--color-plum-*`, `--color-berry-*`,
`--color-blush-*`), and it's wired through every core component (buttons,
cards, nav, headings). No change was needed here.

Left alone on purpose: `ScheduleIt.tsx` / `ScheduleWidget.tsx`'s per-event-type
accent colors (blue for appointments, orange for triggers, etc.) and the
Portal accent colors (`lib/portals.ts`) are semantic color-coding, not brand
color — recoloring them all to plum/berry would remove the ability to tell
event types and portals apart at a glance. Flag to Latchmi if this reading is
wrong.

## Phase 1 — done in this pass

- Added `retrieval` as a real `schedule_events` type (migration
  `0004_add_retrieval_event_type.sql`, not yet applied to the live Supabase
  project — run it after 0001-0003), so "Egg Retrieval" has a real date
  instead of being guessed from a title.
- New **Journey & Self-Care** page (`/app/journey`, `Journey.tsx`): the IVF
  timeline (Consultation → Cycle Start → Baseline Scan → Stimulation →
  Monitoring → Trigger Shot → Egg Retrieval → Transfer → Two-Week Wait),
  derived from `profiles.cycle_start_date` and `schedule_events`; a How-To
  Videos section reusing `learn_videos`; three static self-care tip cards
  (meditation, yoga, nutrition).
- Linked contextually per the PDF's arrows, not added to the fixed bottom
  nav: a "Your journey" card on the Home dashboard, and a "See your journey
  and self-care tips" link at the bottom of Track It (the PDF calls this
  page "Monitoring Page").
- Known simplification, documented in code: `monitoring`'s status mirrors
  `stimulation`'s status rather than getting independent date logic, since
  the schema has no separate "monitoring phase" concept and monitoring
  literally happens throughout stimulation. Revisit if the timeline needs to
  show monitoring as its own phase later.

## Phase 2 — sign-up questionnaire (PDF page 2)

The current sign-up is deliberately minimal (email/password + onboarding
role/consent). The PDF wants a much longer intake: username, treatment
procedure, notification preference, age, weight, cycle number, prescribed
medications (each triggering a 30-minutes-before reminder plus an AI
explanation of that hormone), a "what makes you happy" 10-item pick-list (for
partner suggestions), clinic postal code, procedure duration, and a
protocol/calendar step where Maeve auto-populates retrieval and follow-on
events from a standard protocol, then lets the user confirm or edit.

This needs real schema, not just UI: new columns on `profiles` (age, weight,
postal code, procedure type, cycle number) and a `medications` table (per-user
prescribed medication + dose + schedule, feeding both the reminder system and
`schedule_events`). The "what makes you happy" list also wants a small
reference table plus a `profile_id -> chosen items` join, since it's meant to
surface to the partner. Recommend building this as its own migration
(`0005_intake_and_medications.sql`) and a multi-step onboarding flow extension
rather than one big form.

## Phase 3 — Home page widgets (PDF page 3)

Net-new, not yet started:

- **Hormone Target snapshot**: a small gauge (current level → target zone)
  on Home, tapping through to Track It / the hormone trend view. Needs a
  concept of "target zone" per hormone, which doesn't exist yet (today
  `hormone_logs` just stores raw values). Simplest version: a static
  reference range per hormone, not personalized; flag that a personalized
  target needs clinical input Maeve can't invent.
- **Quick mood check** (event-triggered, e.g. "how are you feeling after
  your 8am Gonal-F?"), with an explicit patient-controlled toggle to send
  that answer to the partner. Needs a new `mood_checkins` table (distinct
  from `portal_posts.mood`, which is journal-entry mood, not a
  point-in-time check-in), and a `nudges`-style one-way share path.
- **"What will fill your cup today?"** — a short daily prompt whose answer
  is meant to route to the Support page. Simplest model: a `cup_entries`
  table (or fold into `mood_checkins` as an optional free-text field).
- **"Bitch about it!" community teaser** on Home, showing the latest
  community post and linking to Portals/Community. Straightforward once
  Phase 4 below exists.

## Phase 4 — Community redesign (PDF page 6)

The PDF's Community page is topic-based (Currently Stimulating, Egg
Retrieval, Pregnancy, Two-Week Wait, Loss & Recovery, Questions), with the
first topic shown aligned to the user's current journey stage (Phase 1's
`deriveStages` logic is the natural source for that), threaded replies, and a
mandatory anonymity/no-personal-info disclaimer.

This is a bigger product decision than a UI reskin: the current schema is
`portal_posts` (Vent/Laugh/Cry, private-or-community, no topics, no threading,
no replies). Recommend deciding explicitly whether Community becomes a
separate `community_topics` + `community_posts` + `community_replies` set of
tables alongside the emotional Portals (kept as-is), rather than merging the
two concepts. Needs a product call from Latchmi before building, since it
changes what "Portals" means in the app.

## Phase 5 — Ask Maeve AI chat box (PDF page 6)

The PDF calls for a dedicated chat interface, distinct from Learn's
single-question "what-if" box. This is the most natural new AI surface:
reuse `src/lib/anthropic.ts`'s `SAFETY`-prompted `askClaude`, add a
`chat_messages` table (user_id, role, body, created_at) so a conversation
persists, and a new route (`/app/chat` or folded into a redesigned Learn
page). Same non-diagnostic framing rules apply as the existing three AI
routes; run anything here past `medical-content-reviewer` before shipping.

## Phase 6 — Support / Partner page (PDF page 7)

Extends the existing `PartnerHub.tsx` / `nudges` system with: an
event-triggered "Feeling Ping" (ties into Phase 3's `mood_checkins`), a
historical mood trend chart, a "predicted hard times" callout (derived from
stimulation day + past mood data, not a clinical prediction — needs careful,
explicitly-hedged copy per `medical-content-reviewer`'s rules), a "Mee (AI
built-in partner)" mode as an alternative to a human partner, and a concrete
Minimal/Maximal sharing-level UI (the schema's `partner_sharing_level`
already has the right shape: `insights` / `mood` / `schedule` / `full` map
reasonably to the PDF's Minimal/Maximal, but the picker UI doesn't exist yet).

## Suggested order

Phase 1 (done) → Phase 3 (Home widgets, since Phase 6's mood ping and Phase
4's community teaser both depend on `mood_checkins` and a community feed
existing) → Phase 6 (Support/Partner) → Phase 4 (Community, pending
Latchmi's product decision on topics vs. portals) → Phase 5 (Ask Maeve chat)
→ Phase 2 (sign-up questionnaire, since it's the most schema-heavy and best
done once the shape of medications/reminders is proven out by Phase 3/6).
