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
| **Vercel project** | created via the same Google login, auto-deploys from `main` |
| **Live URL** | https://maeve-app-two.vercel.app |
| **Supabase URL (env value)** | `https://vnkoijsaqerxnwvcvjrq.supabase.co` |

## How the logins chain together

Read this before you change any account ownership. It matters more than it looks.

```
                 -> GitHub (maeve-ivf-companion) -> Supabase (sign in with GitHub)
Google account  |
                 -> Vercel (sign in with Google)
```

All three services trace back to **one Google account**. Supabase is signed into
via GitHub, GitHub was signed up via Google, and Vercel was signed up via Google
directly. So the Google account at the root of that chain controls the entire
infrastructure. Whoever owns it owns Maeve's GitHub, database, and hosting.

That is a clean setup and easy to hand over as a single bundle, which is the
upside. The downside is that it is a single point of failure.

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
- [x] Migrations run: `0001_init.sql` then `0002_seed_videos.sql`, both succeeded.
      8 tables live with RLS, 8 seed videos.
- [x] `0003_signup_consent.sql` run, succeeded. Signup consent columns and the
      updated trigger are live.
- [x] Code pushed to `main`
- [ ] Vercel project created and env vars set
- [ ] Supabase auth URLs pointed at the live Vercel URL
- [ ] **Anthropic API key created** (see below, waiting on the client's account)
- [ ] End-to-end verification, including two-device partner pairing

The remaining steps, in order, are in [SETUP.md](SETUP.md).

### The Anthropic key is not blocking

The app is deliberately built to run without `ANTHROPIC_API_KEY`. Every AI route
catches the missing key and returns curated fallback content instead of erroring.
See [HANDOFF.md](HANDOFF.md) section 8.

So Maeve can be deployed and demoed **right now** with the other three variables
set. The three AI features (the partner emotional brief, the hormone
interpretation, and the Learn what-if answers) will return sensible canned
content rather than live Claude responses.

When the client's Anthropic key exists: paste it into Vercel's environment
variables and redeploy. Nothing in the code changes. **The tell that it worked:**
log a hormone reading and the interpretation reads specific to your number rather
than generic.

### Two GitHub accounts, worth knowing

The `maeve-ivf-companion` org is owned by a Google-linked GitHub account. The
DigitalFlow working account (`irsaliendraDF`) was added as a collaborator so it
could push. If a push ever 403s with "Permission denied to irsaliendraDF", that
is the collaborator access having lapsed, not a broken repo.

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
