<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all
differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## The Next.js 16 changes that bite hardest in this repo

- **Middleware is now Proxy.** This project's lives at `src/proxy.ts` and exports
  a `proxy()` function. It refreshes the Supabase session and guards `/app` and
  `/onboarding`. Do not create `middleware.ts`. It will not run.
- **`cookies()`, `headers()`, and route `params` are async.** Await them.
- Turbopack is the default bundler.

## Project rules

Full context is in [HANDOFF.md](HANDOFF.md). The short version:

- **Bilingual or it does not ship.** Add every user-facing string to
  `src/lib/i18n/en.ts` (the source of truth, defines the `Dictionary` type) and
  then the same key to `fr.ts`. TypeScript enforces parity, so the build fails if
  they diverge.
- **No em dashes in user-facing copy.**
- **Do not weaken the `SAFETY` prompt** in `src/lib/anthropic.ts`. Claude must
  never diagnose or prescribe, and must redirect urgent issues to the clinic.
- **RLS is the security boundary.** The Supabase anon key is public. The policies
  in `supabase/migrations/0001_init.sql` are what actually protect user data.
  Treat changes to them as safety-critical.
- **`hormone_logs` is owner-only.** Partners see insights, never raw data.
- **Secrets never enter the repo.** `.env.local` is gitignored. `ANTHROPIC_API_KEY`
  is server-side only, with no `NEXT_PUBLIC_` prefix.
- **Run `npm run build` before committing.** It typechecks, which is what catches
  a missing French string.
