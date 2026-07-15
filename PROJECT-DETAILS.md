# Maeve: live project details

Where everything lives. Set up July 15, 2026, in the client's own accounts.

**No secrets in this file.** Keys and passwords live in a password manager, in
Vercel's environment variables, and in the Supabase dashboard. See
"Secrets and where they actually live" at the bottom.

---

## Accounts

| Thing | Where |
| --- | --- |
| **GitHub org** | `maeve-ivf-companion` |
| **GitHub repo** | https://github.com/maeve-ivf-companion/maeve-app.git (branch `main`) |
| **Supabase project name** | `maeve-ivf-companion's Project` |
| **Supabase project ID / ref** | `vnkoijsaqerxnwvcvjrq` |
| **Supabase dashboard** | https://supabase.com/dashboard/project/vnkoijsaqerxnwvcvjrq |
| **Supabase URL** | `https://vnkoijsaqerxnwvcvjrq.supabase.co` |
| **Vercel project** | not created yet, see [SETUP.md](SETUP.md) step 5 |
| **Live URL** | not deployed yet |

## How the logins chain together

Read this before you change any account ownership. It matters more than it looks.

```
Google account  ->  GitHub (maeve-ivf-companion)  ->  Supabase (sign in with GitHub)
```

Supabase is signed into **via GitHub**, and GitHub was signed up **via Google**.
So the Google account at the root of that chain controls everything downstream.
Whoever owns that Google account effectively owns the infrastructure.

If Maeve is going to outlive any one person's personal Google account, move that
root to an account the company owns (for example a
`founders@` or `dev@` address on the company domain) **before** real users exist.
Doing it later means migrating a GitHub org and a Supabase org, which is
genuinely painful. Doing it now is a fifteen minute job.

Also worth adding a second owner to the GitHub org and the Supabase project, so
the project is not one forgotten password away from being unreachable.

## Setup status

- [x] GitHub org and empty repo created
- [x] Supabase project created
- [x] Automatic RLS enabled on new tables (belt and braces; the migrations in
      `supabase/migrations/` also enable RLS explicitly on every table, so this
      changes nothing about the app, it just means anything added later via the
      dashboard table editor is protected by default. Good setting to leave on.)
- [ ] Migrations run (`0001_init.sql`, then `0002_seed_videos.sql`)
- [ ] Anthropic API key created
- [ ] Code pushed to the repo
- [ ] Vercel project created and env vars set
- [ ] Supabase auth URLs pointed at the live Vercel URL
- [ ] End-to-end verification, including two-device partner pairing

The remaining steps, in order, are in [SETUP.md](SETUP.md).

## Secrets and where they actually live

Nothing below is written in this folder, on purpose.

| Secret | Where it lives | Notes |
| --- | --- | --- |
| **Supabase anon key** | Supabase dashboard, Settings, API | Public by design. Safe in Vercel env vars and in the browser. RLS is what protects the data, not this key. |
| **Supabase service_role key** | Supabase dashboard, Settings, API | **Not used by this app.** Bypasses RLS entirely. Never put it in the repo, in client code, or in a doc. |
| **Supabase database password** | Password manager | **Not used by this app.** Only needed for direct Postgres connections. Resettable any time in Settings, Database without breaking anything. |
| **Anthropic API key** | Anthropic Console, plus Vercel env vars | Server-side only. Rotate freely; the app picks up the new value on the next deploy. |

The four environment variables the app actually reads are documented in
[HANDOFF.md](HANDOFF.md) section 3.
