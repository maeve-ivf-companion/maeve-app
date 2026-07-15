# Maeve by Maman: build & handoff reference

> Everything a new developer, or a fresh Claude Code session, needs to pick up
> Maeve and keep building.
>
> Code current as of the final DigitalFlow build. Handoff prepared July 15, 2026.

For the "get it running on my own accounts" walkthrough, see [SETUP.md](SETUP.md).
This document is the reference behind it: what everything is and why it is
built that way.

---

## Table of contents

1. [What Maeve is](#1-what-maeve-is)
2. [Status at handoff](#2-status-at-handoff)
3. [Environment variables](#3-environment-variables)
4. [Tech stack](#4-tech-stack)
5. [Project structure](#5-project-structure)
6. [Features built](#6-features-built)
7. [Database schema & RLS](#7-database-schema--rls)
8. [AI integration (Claude)](#8-ai-integration-claude)
9. [Bilingual (EN/FR) system](#9-bilingual-enfr-system)
10. [Auth, onboarding & consent](#10-auth-onboarding--consent)
11. [Next.js 16 gotchas & fixed bugs](#11-nextjs-16-gotchas--fixed-bugs)
12. [Roadmap & outstanding work](#12-roadmap--outstanding-work)
13. [Product context: why it is built this way](#13-product-context-why-it-is-built-this-way)
14. [Build history](#14-build-history)

---

## 1. What Maeve is

**Maeve by Maman** is a bilingual (English/French) IVF companion web app. It is
not a period tracker. It is built ground-up for the IVF journey.

It was spun out of Maman Biomedical's hormone-tracking work as a standalone
digital health product, so it can raise easier funding than the Port medical
device.

- **Built by:** DigitalFlow Consulting (Irene, co-founder / fractional CRO) with
  Latchmi Raghunanan (Maman Biomedical, latchmi@mamanbiomedical.ca).
- **Starting ICP:** the couples journey through IVF.
- **The wedge**, from the white-space analysis: no fertility app owns the couples
  and emotional layer, and every major app is English-first. Maeve targets both.
- **Tagline:** "The IVF companion that finally gets it."

---

## 2. Status at handoff

The MVP is **complete and was running live in production** on the original
DigitalFlow accounts. Sign-up, onboarding, the full app, bilingual EN/FR, and
live Claude AI were all working and tested end to end, including the two-device
couples pairing flow.

**What is in this folder:** all source code, both database migrations, and these
docs. It is everything needed to reproduce the app exactly.

**What is deliberately not in this folder:**

- **`.env.local` and all secrets.** You create your own keys, per
  [SETUP.md](SETUP.md). No credential from the original build carries over.
- **Git history.** Clean starting point. `git init` and push to your own repo.
- **`node_modules`.** Run `npm install`. `package-lock.json` is included, so you
  get the exact dependency versions this was built and tested against.
- **The original production database.** No user data is carried over. You are
  starting with a fresh, empty Supabase project.

---

## 3. Environment variables

Four variables. In production they live in **Vercel, Settings, Environment
Variables**. Locally they live in `.env.local`, which is gitignored and must
never be committed.

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon / publishable key
ANTHROPIC_API_KEY=              # Claude API key (nudge, interpret, what-if)
NEXT_PUBLIC_SITE_URL=           # your public URL, for magic-link redirects
```

A fifth, `ANTHROPIC_MODEL`, is optional and overrides the Claude model. It
defaults to `claude-sonnet-4-6`. Leave it unset unless you have a reason.

**Anything prefixed `NEXT_PUBLIC_` is exposed to the browser.** That is correct
and intended for the Supabase URL and anon key. Never put a secret behind that
prefix. `ANTHROPIC_API_KEY` has no prefix precisely because it is a secret and is
only ever read server-side in the three API routes.

**Security notes:**

- The Supabase **anon key** is public by design. It only grants what Row Level
  Security allows, which is why the RLS policies in `0001_init.sql` are the real
  security boundary and deserve careful review before real users.
- The Supabase **service_role key** bypasses RLS entirely. It is **not used
  anywhere in this app** and should never be added to client code, the repo, or a
  shared doc.
- Rotate the Anthropic key any time. The app picks up the new value on the next
  deploy.

---

## 4. Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Fraunces (serif display) / Inter (body) |
| Auth + DB | Supabase (email/password + magic link, Postgres, Row Level Security) |
| AI | Anthropic Claude, model `claude-sonnet-4-6` |
| Hosting | Vercel (auto-deploy from GitHub `main`) |

**Brand palette:** plum `#2B1B3D` / `#3D2459`, berry `#C2185B`, blush `#FCE4EC` /
`#FFF0F5`, warm cream `#FAFAF9`. Defined as Tailwind theme tokens in
`src/app/globals.css`.

---

## 5. Project structure

```
src/
  app/
    page.tsx                  # public marketing landing
    layout.tsx                # root layout, fonts, LanguageProvider
    globals.css               # brand design tokens (Tailwind v4 @theme)
    login/ signup/            # auth pages
    onboarding/               # role + consent flow
    auth/callback/route.ts    # magic-link / email-confirm handler
    app/                      # the authenticated product (guarded)
      layout.tsx              # auth guard + AppShell
      page.tsx                # dashboard / home
      portals/ track/ schedule/ partner/ learn/ account/
    api/
      nudge/     route.ts     # Claude: partner emotional brief
      interpret/ route.ts     # Claude: hormone plain-language interpretation
      whatif/    route.ts     # Claude: what-if answers
  components/
    ui.tsx Logo.tsx LanguageToggle.tsx
    auth/ onboarding/ marketing/
    app/
      AppShell.tsx            # top bar + app-style bottom nav
      Dashboard.tsx           # home (Next Up + Schedule + Track widgets)
      ScheduleWidget.tsx TrackWidget.tsx
      AccountManager.tsx      # account settings page
      PartnerHub.tsx PartnerBrief.tsx
      PortalsGrid.tsx PortalRoom.tsx
      TrackIt.tsx ScheduleIt.tsx Learn.tsx PageHeader.tsx
      NotConnected.tsx        # friendly state when Supabase env is unset
  lib/
    i18n/                     # en.ts (source of truth), fr.ts, provider.tsx, format.ts
    supabase/                 # client.ts, server.ts, config.ts, types.ts
    anthropic.ts auth.ts portals.ts
  proxy.ts                    # session refresh + /app route guard (see section 11)
supabase/migrations/
  0001_init.sql               # tables + RLS + functions
  0002_seed_videos.sql        # how-to library seed data
```

---

## 6. Features built

- **App-style navigation.** A bottom nav bar on every screen size (left to right:
  Learn, Portals, Home, Partner, Account), with the Maeve logo beside the EN/FR
  toggle in the top bar. No desktop sidebar. It looks and behaves like a native
  app on phone and desktop. Code: `components/app/AppShell.tsx`.

- **Home screen.** Greeting and cycle day, a "Next Up" card, then a **Schedule
  widget** (quick-add appointments plus upcoming list) and a **Track widget**
  (quick hormone log plus recent readings), then partner status. Code:
  `Dashboard.tsx`, `ScheduleWidget.tsx`, `TrackWidget.tsx`.

- **Couples journey (the differentiator).** The patient generates an invite code.
  The partner creates their own account and connects via the `connect_with_code`
  database function. The patient picks a mood and an optional note, and Claude
  writes the partner a one-way emotional brief. The partner only ever sees the
  brief, never raw data. Sharing level is patient-controlled. Code:
  `PartnerHub.tsx`, `PartnerBrief.tsx`, `api/nudge`.

- **The Portals.** Three emotional rooms, stacked vertically: **Vent, Laugh,
  Cry**. Posts are private or community. Code: `PortalRoom.tsx`,
  `PortalsGrid.tsx`, `lib/portals.ts`.
  *Note: an earlier build had a fourth "Humour" room, since merged into Laugh.
  The `portal_posts.portal` column still permits the legacy `humour` value, but
  the app only writes three.*

- **Track It.** Hormone logging (estradiol, LH, FSH, progesterone, hCG, AMH) with
  Claude plain-language interpretation. Code: `TrackIt.tsx`, `api/interpret`.
  Reachable from the home Track widget's "View all".

- **Schedule It.** Injections, trigger shots, monitoring appointments, bloodwork,
  transfers, with an upcoming and past timeline. Code: `ScheduleIt.tsx`.
  Reachable from the home Schedule widget's "View all".

- **Learn.** Bilingual how-to video library plus Claude-powered what-if Q&A.
  Code: `Learn.tsx`, `api/whatif`.

- **Account.** Manage display name and language, change email, change password,
  privacy info, download-my-data export, delete-my-data, and sign out. Code:
  `AccountManager.tsx`.

- **Consent-first onboarding.** Role choice, name, language, and explicit consent
  (minimum viable data), with an audit trail written to the `consents` table.
  Code: `OnboardingFlow.tsx`.

- **Signup consent.** A required tick to accept the Terms and Privacy Policy
  (which link to real pages at `/terms` and `/privacy`), and a separate optional
  opt-in to Maman Biomedical marketing, unchecked by default per CASL. Both are
  recorded with a timestamp. Code: `AuthForm.tsx`, `0003_signup_consent.sql`, and
  see section 7 for why the trigger does the writing.

- **Legal pages.** Bilingual Terms and Privacy Policy at `/terms` and `/privacy`.
  Content lives in `src/lib/legal/en.ts` and `fr.ts`, rendered by
  `components/legal/LegalPage.tsx`. Currently **draft, pending legal review**.

- **Bilingual EN/FR.** Full toggle, persisted per visitor. See section 9.

---

## 7. Database schema & RLS

All SQL lives in `supabase/migrations/`. To build the database on a fresh
Supabase project, run them in the SQL Editor **in numbered order**:
`0001_init.sql`, then `0002_seed_videos.sql`, then `0003_signup_consent.sql`.
Order matters.

**Every table has Row Level Security enabled.** Since the anon key is public, RLS
is the actual security boundary. Treat these policies as the most
safety-critical code in the project.

| Table | What it holds | Access rule |
| --- | --- | --- |
| `profiles` | One row per auth user: role, display name, language, `invite_code`, `paired_with`, `partner_sharing_level`, consent flags, `terms_accepted_at`, `marketing_opt_in`, `onboarded`. Auto-created on signup by the `handle_new_user` trigger. | Read your own row or your partner's. Update only your own. |
| `portal_posts` | Vent / Laugh / Cry entries. | Read your own or anything marked `community`. Write, update, delete only your own. |
| `hormone_logs` | The most sensitive data in the app. | **Owner only.** Partners never see this, at any sharing level. |
| `schedule_events` | Injections, appointments, trigger windows, bloodwork, transfers. | Owner full access. A paired partner can read **only** if the patient's `partner_sharing_level` is `schedule` or `full`. |
| `nudges` | The partner emotional brief. One way, patient to partner. | Readable by either person involved. Only the patient can create one. |
| `whatif_queries` | AI Q&A history. | Owner only. |
| `consents` | Audit trail of meaningful consent per scope. | Owner only. |
| `learn_videos` | Bilingual how-to library. | Public read (anon and authenticated). |

**Key functions:**

- `connect_with_code(code)`: links a partner to a patient by invite code. Sets
  `paired_with` in both directions and marks the caller as `partner`. Security
  definer.
- `gen_invite_code()`: generates a human-shareable code like `MAEVE-7K2QX`.
- `handle_new_user()`: trigger on `auth.users` insert that creates the matching
  `profiles` row.

**Sharing levels** on `profiles.partner_sharing_level` are `insights` (default),
`mood`, `schedule`, and `full`. The design intent is that the partner sees
insights, not raw data, unless the patient explicitly opens things up. Note that
`hormone_logs` is owner-only regardless of level.

### Signup consent, and why it goes through the trigger

`0003_signup_consent.sql` records two things at signup: acceptance of the Terms
and Privacy Policy (required), and opt-in to Maman Biomedical marketing
(optional, unchecked by default).

**This deliberately does not use a client-side insert.** When Supabase "Confirm
email" is on, `supabase.auth.signUp()` returns **no session**. The user is not
authenticated yet, so `auth.uid()` is null and RLS refuses any insert into
`consents`. Instead the client passes consent in `signUp`'s `options.data`,
Supabase stores that on `auth.users.raw_user_meta_data`, and the security-definer
`handle_new_user` trigger reads it at user-creation time. That captures consent
at the moment it was given, even for someone who never confirms their email.

If you add another signup-time consent, extend the trigger. Do not be tempted to
write it from the client after signup: it will work in testing with email
confirmation off, and silently record nothing in production with it on.

**CASL note** (this is a Canadian company sending Canadian commercial email): the
marketing box must stay **unchecked by default**, since a pre-ticked box is not
valid express consent. The trigger records the answer either way, including a
decline, because evidence that someone said no is as useful as evidence they said
yes. Consent scopes written at signup are `terms` and `marketing`.

---

## 8. AI integration (Claude)

- Helper: `lib/anthropic.ts`. Model `claude-sonnet-4-6`, with a shared `SAFETY`
  system prompt: warm, never diagnoses, redirects anything medically urgent to
  the clinic.
- Three server routes call it: `api/nudge` (partner brief), `api/interpret`
  (hormone readings), `api/whatif` (Learn Q&A). All three are server-side only,
  so the API key never reaches the browser.
- **Graceful fallback:** if `ANTHROPIC_API_KEY` is missing, `askClaude` throws
  `ANTHROPIC_NOT_CONFIGURED` and each route catches it and returns curated
  content instead of erroring. The app fully runs without the key. This is also
  the tell if AI output suddenly looks generic in production: check the key.
- All AI output is framed as information, not medical advice.

**Please do not weaken the `SAFETY` prompt.** This app talks to people in a
medically fraught, emotionally raw moment. That guardrail is the difference
between a companion and a liability.

---

## 9. Bilingual (EN/FR) system

- `lib/i18n/en.ts` is the source of truth and defines the `Dictionary` type.
  `fr.ts` mirrors its exact shape. TypeScript enforces parity, so **the build
  fails if they diverge.** That is deliberate: it is impossible to ship a missing
  French string.
- `lib/i18n/provider.tsx` exposes `LanguageProvider`, `useLanguage()`, and
  `useT()`. The choice persists in a cookie and follows the browser default.
- **To add a string:** add the key to `en.ts`, then the same key to `fr.ts`.
  Placeholders like `{name}` are filled with `fmt()` from `lib/i18n/format.ts`.
- **Copy rule:** no em dashes anywhere in user-facing copy.

---

## 10. Auth, onboarding & consent

- Email/password plus magic link via Supabase. **No Google OAuth**, a deliberate
  standard to avoid data fragmentation across identity providers.
- Magic links and email confirmation require your production URL in **Supabase,
  Authentication, URL Configuration** (Site URL plus a redirect entry like
  `https://your-app.vercel.app/**`). This is the most commonly missed setup step.
- "Confirm email" defaults to ON. For frictionless demo sign-ups it can be turned
  off in **Supabase, Authentication, Providers, Email**. The app handles both.
- Sign out lives in the Account tab.
- Consent is captured at onboarding and written to `consents` as an audit trail.
  The design principle is **minimum viable data**: collect only what each value
  proposition actually needs, and ask fresh, meaningful consent for each new
  data-collecting action. If you add a feature that collects something new, add a
  consent scope for it.

---

## 11. Next.js 16 gotchas & fixed bugs

**Read this before writing any Next.js code.** Next.js 16 has breaking changes
from what most developers, and most AI models, have internalised. `AGENTS.md`
says the same thing, and bundled version-accurate docs live in
`node_modules/next/dist/docs/` after you run `npm install`.

- **Middleware is now `proxy.ts`** (renamed in Next 16). `src/proxy.ts` refreshes
  the Supabase session and guards `/app` and `/onboarding`. **Do not recreate
  `middleware.ts`.** It will not run.
- `cookies()`, `headers()`, and route `params` are **async**. Await them.
- The browser Supabase client falls back to harmless placeholders when env is
  unset, so builds never fail before keys are wired. See `lib/supabase/config.ts`.

### Two database bugs found and fixed during the original launch

Both are **already patched** in `0001_init.sql`, so a fresh setup will not hit
them. They are documented because both are subtle, both cost real debugging time,
and both are easy to reintroduce.

1. **Signup failed with "Database error saving new user".**
   Cause: `gen_invite_code()` used pgcrypto's `gen_random_bytes()`, which lives in
   the `extensions` schema and is not on the search path of the security-definer
   signup trigger.
   Fix: use the built-in `gen_random_uuid()` from `pg_catalog` instead.
   Lesson: security-definer functions have a pinned `search_path`. Anything they
   call must be reachable from it.

2. **Onboarding failed with "something went wrong".**
   Cause: the `profiles_select_own` RLS policy queried the `profiles` table inside
   its own policy, causing infinite recursion.
   Fix: check `id = auth.uid() or paired_with = auth.uid()` directly against the
   candidate row, with no subquery.
   Lesson: an RLS policy on a table must not subquery that same table.

---

## 12. Roadmap & outstanding work

### Before real users, not optional

- [ ] **Get the Terms and Privacy Policy reviewed by a lawyer.** Starter drafts
      now exist at `/terms` and `/privacy` (`src/lib/legal/en.ts` and `fr.ts`),
      written to describe what the app actually does so counsel has something
      concrete to red-line. **They carry a visible draft banner. Do not remove it
      until a lawyer has signed the text off.** Signup requires agreeing to
      these, so the quality of that text is now load-bearing.
- [ ] **PIPEDA / HIPAA review of the data layer.** This is fertility and hormone
      data.
- [ ] **Independent review of the RLS policies.** They are the whole security
      boundary, and they were written by the same person who wrote the app.
- [ ] **Swap the placeholder how-to video links** in `0002_seed_videos.sql` and
      the `learn_videos` table for Maman's own clinician-reviewed videos. This is
      both a credibility and a liability issue for fertility content.

### Product roadmap

- [ ] Optional: turn off Supabase "Confirm email" for frictionless demo sign-ups.
- [ ] Ongoing UX/UI polish as user feedback comes in.
- [ ] Partner notification delivery beyond in-app (email or SMS) if desired.
- [ ] V2: pair the Maman hardware sensor for continuous biometrics, per the
      investor deck's Floor 2.

### Done in the original build

Schema applied, both DB bugs fixed, Supabase auth URLs configured, Anthropic key
wired so live Claude was on, app-style bottom nav, Account page, home Schedule
and Track widgets, Portals merged to three and reordered (Vent, Laugh, Cry),
mobile overflow pass, full EN/FR parity, end-to-end sign-up verified in
production.

---

## 13. Product context: why it is built this way

- **Funding thesis.** As a pure digital-health product rather than a medical
  device, Maeve is investable by femtech VCs (Forum Ventures, Graphite) and
  crowdfundable in ways the Port device is not. The MVP exists to prove demand
  before spending on a heavy build.
- **Free vs paid**, from the deck: the free tier is the companion and emotional
  layer, which drives acquisition, word-of-mouth, and couple lock-in. Premium at
  roughly $12 to $15 a month is hormone tracking, AI, and protocol scheduling.
  **The free couples layer is the growth engine**, which is why it is the most
  polished part of the MVP.
- **Best demo flow for investors:** sign up as the patient, generate the invite
  code, open it on a second device as the partner, send a brief, and watch it
  land on the partner's screen. That two-person moment is the thing no competitor
  has. Build the demo around it.
- **Minimum viable data.** Collect only what each value proposition needs, and
  ask fresh meaningful consent for each new data-collecting action. The `consents`
  table is the audit trail. This is a product principle, not just a legal one: the
  ICP is people who are already being asked for far too much by their clinic.

---

## 14. Build history

The original repo history, most recent first. Useful for understanding how the
product arrived at its current shape.

```
049c188  Nav: app-style bottom nav (Learn|Portals|Home|Partner|Account) on all
         sizes, logo beside toggle, drop sidebar
4f3a4ef  Portals: order Vent, Laugh, Cry
fb878d3  Portals: merge Humour into Laugh, stack portals vertically
fa01179  Nav: move Account below the divider with Sign out (desktop); Account
         icon in mobile top bar
5bd82d4  App: Account tab, home Schedule+Track widgets, toggle top-right,
         slimmer nav, mobile overflow pass
b4eb387  Fix onboarding: non-recursive profiles select RLS policy
90e257c  Fix signup: gen_invite_code uses built-in gen_random_uuid (pgcrypto
         schema issue)
23f9d25  chore: redeploy to pick up ANTHROPIC_API_KEY
00d7616  Docs: link build & handoff doc from README
8750df3  Landing: widen horizontal padding and feature-row spacing
f79ac01  Landing: outlined secondary CTA with pressed state, 4 feature boxes in
         a row
80552e1  Build Maeve MVP: bilingual IVF companion (couples journey, portals,
         tracking, scheduling, Claude AI)
e9b3782  Initial commit from Create Next App
```

The code in this folder is the state as of `049c188`, with a clean working tree.
