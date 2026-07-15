# Maeve setup guide

How to take this folder and get Maeve running: first on your own machine, then on
your own GitHub, Supabase, and Vercel accounts.

This is a **fresh setup**. Nothing is carried over from the original build
accounts. The repo, the database, and the keys are all new and owned by Maeve.

Budget about an hour end to end. You need: Node.js 20 or newer, a GitHub
account, a Supabase account, a Vercel account, and an Anthropic account.

> **The GitHub org and the Supabase project already exist.** Their coordinates
> are in [PROJECT-DETAILS.md](PROJECT-DETAILS.md), which also tracks which of the
> steps below are already done. Steps 2 and 4 are partly complete: skip creating
> what exists and pick up from the migrations and the push.

> **The one ordering trap:** Supabase's auth config needs your live Vercel URL,
> but Vercel does not exist until you have pushed to GitHub. So you cannot finish
> Supabase in one pass. Expect to touch it twice: once now for the schema, and
> again at step 5 for the URLs. Everything below is ordered to make that the only
> backtrack.

---

## Step 1: Run it locally (10 minutes)

Open a terminal in this folder.

```bash
npm install
npm run dev
```

Open http://localhost:3000. You should see the Maeve landing page.

The app deliberately runs with no keys configured. Sign-up will show a
"connect Supabase" state, and the AI features return curated fallback content
instead of erroring. This is expected. It means you can confirm the code works
before you have any accounts set up.

Also run this once to confirm a clean production build:

```bash
npm run build
```

If both of those work, the code is healthy and the rest is account wiring.

---

## Step 2: Create your Supabase project (20 minutes)

Supabase is the database and the login system.

> Already done: the project exists (`vnkoijsaqerxnwvcvjrq`). Skip to step 3 of
> this section and run the migrations.

1. Go to https://supabase.com and create a project. Any region close to your
   users is fine. Save the database password it gives you into a password
   manager. The app never uses it, but you cannot see it again after this screen.
2. Wait for the project to finish provisioning (a couple of minutes).
3. In the left sidebar go to **SQL Editor**, click **New query**.
4. Open `supabase/migrations/0001_init.sql` from this folder, copy the whole
   file, paste it into the editor, click **Run**. This creates every table, all
   the Row Level Security policies, the signup trigger, and the pairing function.
5. New query again. Open `supabase/migrations/0002_seed_videos.sql`, paste, and
   **Run**. This fills the Learn library with 8 starter videos.
6. New query again. Open `supabase/migrations/0003_signup_consent.sql`, paste,
   and **Run**. This adds the signup consent columns and updates the signup
   trigger to record them. **Run this before anyone signs up**, or the consent
   captured on the signup form is silently discarded.
7. Go to **Settings, API**. Copy two values, you will need them in step 3:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon / public key** (a long string starting `eyJ...`)

> The **anon key is safe to put in client code and env vars.** It only grants what
> Row Level Security allows. The **service_role key is not used anywhere in this
> app** and must never go in client code, a repo, or a shared doc. It bypasses
> RLS entirely.

### Configure auth URLs

Still in Supabase, go to **Authentication, URL Configuration**:

- **Site URL**: `http://localhost:3000` for now. Change it to your Vercel URL
  after step 5.
- **Redirect URLs**: add `http://localhost:3000/**`, and after step 5 add
  `https://your-app.vercel.app/**` too.

Magic links and email confirmation will not work until this matches your real
URL. This is the single most common thing to forget.

### Optional: smoother demo sign-ups

**Authentication, Providers, Email** has a "Confirm email" toggle. It is ON by
default, which means new users must click a link in their inbox before they can
log in. For investor demos and quick testing, turning it OFF is much smoother.
The app handles both, so this is purely your call.

---

## Step 3: Get an Anthropic API key (5 minutes)

Claude powers three things: the partner emotional brief, the plain-language
hormone interpretation, and the Learn "what-if" answers.

1. Go to https://console.anthropic.com and sign in.
2. Go to **API Keys**, click **Create Key**, copy it. It starts with `sk-ant-`.
3. You will need to add billing credit for it to work.

You are creating your own key here on purpose. The key from the original build is
not included in this handoff and will not work for you.

> Without this key the app still runs. Every AI route falls back to curated
> content rather than erroring. So you can skip this step and come back to it.

### Wire the keys up locally

Copy `.env.example` to a new file called `.env.local`, and fill in the four
values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

There is also an optional fifth variable, `ANTHROPIC_MODEL`, which overrides the
Claude model. Leave it unset unless you have a reason; it defaults to
`claude-sonnet-4-6`.

Restart `npm run dev`. Now sign up for a real account and click through
onboarding. If that works, your database is wired correctly.

`.env.local` is gitignored. It will never be committed. Keep it that way.

---

## Step 4: Push to your own GitHub repo (10 minutes)

This folder has no git history, so you are starting clean.

> Already done: the org and the empty repo exist at
> https://github.com/maeve-ivf-companion/maeve-app.git

1. Create a new **empty private repo** on GitHub. Do not add a README or a
   .gitignore, this folder already has both.
2. In a terminal in this folder:

```bash
git init
git add .
git commit -m "Maeve MVP: initial import from DigitalFlow handoff"
git branch -M main
git remote add origin https://github.com/maeve-ivf-companion/maeve-app.git
git push -u origin main
```

Then confirm on GitHub that **`.env.local` is not in the repo**. It should be
excluded automatically by `.gitignore`. If you somehow see it, remove it and
rotate every key in it immediately.

---

## Step 5: Deploy to Vercel (15 minutes)

1. Go to https://vercel.com, **Add New, Project**, and import the GitHub repo
   from step 4.
2. Vercel detects Next.js automatically. Do not change the build settings.
3. Before you click Deploy, expand **Environment Variables** and add all four:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `ANTHROPIC_API_KEY` | your Anthropic key |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel URL, for example `https://maeve.vercel.app` |

   For `NEXT_PUBLIC_SITE_URL` you can guess the Vercel URL now and correct it
   after the first deploy.

4. Click **Deploy**.
5. Once it is live, go back to **Supabase, Authentication, URL Configuration**
   and update **Site URL** to your Vercel URL, and add
   `https://your-app.vercel.app/**` to Redirect URLs.
6. If you changed `NEXT_PUBLIC_SITE_URL` after deploying, redeploy in Vercel.
   Environment variable changes only take effect on a new deploy.

From now on, every push to `main` redeploys automatically.

---

## Step 6: Verify it works (10 minutes)

Run through this on the live site:

- [ ] Landing page loads and the EN/FR toggle switches the whole page.
- [ ] Sign up with a real email address as the **patient**.
- [ ] Onboarding completes (role, name, language, consent).
- [ ] The home dashboard loads with the Schedule and Track widgets.
- [ ] Log a hormone reading. You get a plain-language interpretation back. If it
      reads generic, your `ANTHROPIC_API_KEY` is not set correctly.
- [ ] Add a schedule event and see it in the upcoming list.
- [ ] Post to a Portal.
- [ ] Go to **Partner** and copy your invite code.
- [ ] In a private window, sign up a **second account as the partner** and enter
      the invite code.
- [ ] As the patient, pick a mood and send a brief. Confirm it lands on the
      partner's screen.

That last one, the two-person moment, is the thing worth demoing. No competitor
has it.

If sign-up fails with "Database error saving new user", or onboarding fails with
"something went wrong", see the fixed-bugs section in
[HANDOFF.md](HANDOFF.md). Both were hit during the original launch and are
already patched in `0001_init.sql`, but it is worth knowing why they happened.

---

## Step 7: Before real users (not optional)

This is an MVP built to prove demand, not a launched medical product. Before you
put real patients on it:

- [ ] **Privacy policy and terms of service.** Not written yet.
- [ ] **A PIPEDA / HIPAA review of the data layer.** You are handling fertility
      and hormone data, which is about as sensitive as consumer health data gets.
- [ ] **Replace the placeholder video URLs** in the `learn_videos` table with
      Maman's own clinician-reviewed content. Fertility how-to content pointing
      at random third-party videos is a credibility and liability problem.
- [ ] **A security review of the RLS policies** by someone other than the person
      who wrote them.

---

## Where to go next

[HANDOFF.md](HANDOFF.md) is the full reference: how the code is organised, how
the database and RLS work, how the bilingual system works, the Next.js 16
gotchas, and the roadmap.
