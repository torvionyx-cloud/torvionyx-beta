# Pitchwright — Claude Code Context

## What this is
Pitchwright is a Next.js (App Router) web app that lets solo operators and freelancers turn a rough brief into a beautiful, AI-generated, send-ready proposal in under two minutes. The core wedge: the AI does the writing end-to-end, not just the templating.

## Stack
- **Framework:** Next.js 14+ (App Router) on Vercel
- **Auth:** Clerk (mandatory — no custom auth under any circumstances)
- **Database:** Supabase (Postgres) with Row-Level Security
- **AI:** Anthropic Claude via `@anthropic-ai/sdk` — server-side only, never client-side
- **Styling:** Tailwind CSS
- **Email:** Resend
- **PDF:** Puppeteer or `@react-pdf/renderer` (server-side only)

## Absolute security rules (from project security standards)
1. **No API keys in client-side code.** All secrets live in server env vars. All LLM and DB service-role calls go through Next.js server routes or edge functions — never from the browser.
2. **Clerk auth only.** Never build custom auth, handle passwords, or manage sessions manually.
3. **RLS on every table.** Database-level Row-Level Security in Supabase is the authoritative access control layer. Application checks are a second layer, not the primary one.
4. **Every user query scoped to their workspace.** A user must never be able to read or infer another user's data.
5. **Rate limit every endpoint.** The AI generation endpoint gets the strictest limits — it's the most expensive and the primary abuse target.
6. **Generic errors to the client.** Full detail logged server-side. Never leak stack traces, schema, or valid-vs-invalid account info.
7. **Input validation at the edge.** Sanitise all inputs before they touch the DB or AI layer. Reject oversized payloads.

## Project structure
```
src/
  app/
    (auth)/          # Clerk-managed sign-in / sign-up pages
    dashboard/       # Authenticated app shell
    p/[token]/       # Public proposal live-link (no auth required)
    api/
      generate/      # POST — AI proposal generation (strictest rate limit)
      proposals/     # CRUD for proposals
      brand/         # Brand settings CRUD
      analytics/     # Proposal event tracking
  components/
    ui/              # Shared UI primitives
    layout/          # Shell, nav, sidebar
    proposals/       # Proposal editor, renderer, blocks
  lib/
    supabase.ts      # Supabase client factory (server + browser)
    anthropic.ts     # Anthropic client (server-side only)
    rate-limit.ts    # Upstash / in-memory rate limiter helpers
    validation.ts    # Zod schemas for all inputs
  hooks/             # Client-side hooks
  types/             # Shared TypeScript types
supabase/
  migrations/        # SQL migration files
```

## Golden path (must work flawlessly)
Sign up → brand setup → paste brief → Generate → editor → Share → client views live link → Accept → founder gets notification

## North-star activation metric
% of signups who **share** ≥1 proposal. Instrument this from day one.

## Current phase
**Phase 1 — Foundation.** Next.js app, Clerk auth, Supabase schema + RLS, security middleware, env hygiene. The generation route and editor come in Phase 2.

## What NOT to build yet
- Payments / Stripe (v2)
- CRM integrations (v2)
- Team collaboration / roles (v2)
- Custom domains (v2)
- The public renderer polish (Phase 3)
