# Maeve by Maman

The IVF companion that finally gets it. A bilingual (EN/FR) digital-health MVP
built for the couples journey through IVF.

Next.js 16 (App Router) + Supabase + Anthropic Claude, deployed on Vercel.

---

## Start here

This folder is a complete, self-contained handoff. Everything you need is in it.
Read in this order:

| Doc | What it is |
| --- | --- |
| **[PROJECT-DETAILS.md](PROJECT-DETAILS.md)** | Where everything lives: the repo, the Supabase project, account ownership, and setup status. |
| **[SETUP.md](SETUP.md)** | Step by step: get it running locally, then on GitHub + Supabase + Vercel. **Start here.** |
| **[HANDOFF.md](HANDOFF.md)** | The canonical reference. Architecture, database, features, gotchas, roadmap, product context. |
| **[AGENTS.md](AGENTS.md)** | Rules for editing this code. Read before writing any Next.js. |
| **[CLAUDE.md](CLAUDE.md)** | Entry point for a Claude Code session picking this project up. |

## Quickstart

```bash
npm install
cp .env.example .env.local   # fill in your own keys, see SETUP.md
npm run dev                  # http://localhost:3000
npm run build                # production build / typecheck
```

The app runs **without any environment variables set**. It shows a friendly
"connect Supabase" state and the AI features fall back to curated content, so you
can get it on screen before wiring up any accounts.

## What's in the MVP

- **Couples journey** (the differentiator): invite-code pairing, a one-way
  partner "emotional brief" written by Claude, patient-controlled sharing levels.
- **The Portals**: Vent / Laugh / Cry, private or community posts.
- **Track It**: hormone logging with plain-language interpretation from Claude.
- **Schedule It**: injections, monitoring, trigger windows, bloodwork, transfers.
- **Learn**: how-to video library + Claude-powered "what-if" answers.
- **Account**: profile, email and password changes, data export, data deletion.
- **Consent-first onboarding**: minimum viable data, with an audit trail.
- **Bilingual**: full English/French toggle, persisted per visitor.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind v4 + Fraunces (display) / Inter (body) |
| Auth + DB | Supabase (email/password + magic link, Postgres, RLS) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Hosting | Vercel |

## Database

SQL lives in `supabase/migrations/`:

- `0001_init.sql`: tables, RLS policies, the `connect_with_code` pairing
  function, and the new-user profile trigger.
- `0002_seed_videos.sql`: seed how-to library (swap the URLs for Maman's own
  clinician-reviewed videos before launch).

Apply both to a fresh Supabase project, then set the env vars. Full walkthrough
in [SETUP.md](SETUP.md).

## Important notes about this handoff folder

- **No secrets are included.** `.env.local` was deliberately left out. You will
  create your own keys in [SETUP.md](SETUP.md).
- **No git history is included.** This is a clean starting point. Run `git init`
  and push to your own repo, per [SETUP.md](SETUP.md).
- **No `node_modules`.** Run `npm install` to restore them. `package-lock.json`
  is included, so you will get the exact same dependency versions we built with.
- **The how-to video URLs are placeholders** pending Maman's own
  clinician-reviewed content. See [HANDOFF.md](HANDOFF.md).
- **AI output is framed as information, never medical advice.** The safety
  guardrail lives in `src/lib/anthropic.ts`. Please do not weaken it.
