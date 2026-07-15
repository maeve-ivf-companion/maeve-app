# Maeve by Maman: Claude Code project context

@AGENTS.md

## Orientation

You are working on **Maeve by Maman**, a bilingual (EN/FR) IVF companion web app.
Next.js 16 + Supabase + Anthropic Claude, deployed on Vercel.

**If you are picking this project up for the first time, read
[HANDOFF.md](HANDOFF.md) before doing anything else.** It is the canonical reference: architecture,
database schema and RLS, the bilingual system, the Next.js 16 gotchas, two
already-fixed database bugs worth understanding, the roadmap, and the product
reasoning behind the design. [SETUP.md](SETUP.md) covers getting it running on
fresh GitHub / Supabase / Vercel accounts.

## The rules that actually matter here

1. **This is Next.js 16, not the Next.js in your training data.** Middleware is
   `src/proxy.ts`, not `middleware.ts`. `cookies()`, `headers()`, and route
   `params` are async. Read `node_modules/next/dist/docs/` before writing
   framework code. See `AGENTS.md`.

2. **Strings are bilingual, always.** `src/lib/i18n/en.ts` is the source of truth
   and defines the `Dictionary` type. `fr.ts` must mirror its exact shape.
   Add a key to `en.ts`, then add the same key to `fr.ts`. **The build fails if
   they diverge**, which is deliberate. Never ship an English-only string.

3. **No em dashes in user-facing copy.** Anywhere. Use a comma, a period, or a
   rewrite.

4. **Never weaken the `SAFETY` prompt in `src/lib/anthropic.ts`.** This app talks
   to people mid-IVF. Claude must never diagnose, prescribe, or give a specific
   medical instruction, and must redirect anything urgent to the clinic. All AI
   output is framed as information, not medical advice.

5. **RLS is the security boundary, not the app code.** The Supabase anon key is
   public by design. Every table in `supabase/migrations/0001_init.sql` has Row
   Level Security, and those policies are the only thing standing between a user
   and someone else's fertility data. Changing a policy is safety-critical work.
   Two specific traps, both already fixed and explained in HANDOFF.md section 11:
   an RLS policy must not subquery its own table (infinite recursion), and a
   security-definer function must not call anything off its pinned `search_path`.

6. **`hormone_logs` is owner-only, at every sharing level.** The partner sees
   insights, never raw data. That is the product's central privacy promise. Do
   not add a partner read path to it without an explicit product decision.

7. **Secrets never enter the repo.** `.env.local` is gitignored. `ANTHROPIC_API_KEY`
   has no `NEXT_PUBLIC_` prefix on purpose and is only read server-side in the
   three `api/` routes. The Supabase `service_role` key is not used anywhere and
   must not be introduced.

## Working on it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build / typecheck, run before every commit
```

The app runs with no env vars set: it shows a "connect Supabase" state and the AI
routes return curated fallbacks instead of erroring. So a broken-looking local app
is usually a missing `.env.local`, not a bug.

Deploy is automatic: push to `main` and Vercel redeploys. Changing an environment
variable in Vercel requires a new deploy to take effect.
