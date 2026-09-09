<!-- BEGIN:nextjs-agent-rules -->
# Always work per Anthropic's Claude Code best practices

Before starting any nontrivial change: explore the relevant code first, write
or update a short plan for anything touching more than one file, implement,
then verify with `npm run build` (and a manual check of the actual page where
practical) before calling the work done. This is Anthropic's own documented
workflow (docs.claude.com → Claude Code → Best practices), and it applies to
every session on this repo, not just this one. If in doubt about a Claude
Code mechanic (subagents, hooks, skills, permissions), check that
documentation rather than guessing from general training data, the same way
section "This is NOT the Next.js you know" below asks you to check the
bundled Next.js 16 docs rather than assume.

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
