# Maeve by Maman

The IVF companion that finally gets it. A bilingual (EN/FR) digital-health MVP
built for the couples journey through IVF.

Next.js 16 (App Router) + Supabase + Anthropic Claude, deployed on Vercel.

---

## Maeve is already live

This is not a project waiting to be set up. As of July 15, 2026 it is built,
deployed, and running:

- **Live app:** https://maeve-app-two.vercel.app
- **Repo:** https://github.com/maeve-ivf-companion/maeve-app (this folder is a
  snapshot of it; **the repo is the working copy**, and every push to `main`
  auto-deploys)
- **Database:** live, all migrations applied, sign-up and consent verified end to
  end

Use this zip as a backup and as something to read offline. For actual work, clone
the repo.

## Start here

Everything you need is in this folder. Read in this order:

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

- **No secrets are included.** `.env.local` was deliberately left out, and no key
  from the build travels in this zip. The live values are already set in Vercel's
  environment variables. See [PROJECT-DETAILS.md](PROJECT-DETAILS.md) for where
  each secret lives.
- **No git history and no `node_modules`.** Both live in the repo. Run
  `npm install` to restore dependencies; `package-lock.json` is included, so you
  get the exact versions this was built and tested against.
- **This snapshot can go stale.** The repo is the working copy. If this folder
  and GitHub ever disagree, GitHub is right.
- **Three things are done but not switched on**, all waiting on something only
  Maman can provide. None of them block the app:
  - **Live AI** needs an Anthropic API key. Until then the three AI features
    return prepared content instead of live Claude responses.
  - **Branded auth emails** are written and sitting in
    `supabase/email-templates/`, but Supabase will not apply them until custom
    SMTP is configured, which needs a domain Maeve owns.
  - **The Terms and Privacy Policy are drafts** pending legal review, and carry a
    visible draft banner saying so.
- **The how-to video URLs are placeholders** pending Maman's own
  clinician-reviewed content. See [HANDOFF.md](HANDOFF.md).
- **AI output is framed as information, never medical advice.** The safety
  guardrail lives in `src/lib/anthropic.ts`. Please do not weaken it.
