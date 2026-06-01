# Pitchwright — Phase 1 Setup Guide

This guide walks Claude Code (or a human developer) through getting Phase 1 running end-to-end. Follow in order. Do not skip the RLS verification step.

---

## Step 1 — Install dependencies

```bash
npm install
```

---

## Step 2 — Set up Clerk

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and create a new application.
2. Enable **Email + password** sign-in (and Google OAuth if desired).
3. Copy your API keys from **API Keys** in the dashboard.
4. Add to `.env.local`:
   ```
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

---

## Step 3 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy your project URL and keys from **Settings → API**.
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
4. Run the database migration:
   - Open the Supabase **SQL editor**
   - Paste the contents of `supabase/migrations/0001_initial_schema.sql`
   - Run it
5. **Verify RLS is enabled** on all tables:
   - Go to **Authentication → Policies** in the Supabase dashboard
   - Confirm `workspaces`, `brand_settings`, `proposals`, `acceptance_records`, `proposal_events`, `ai_generations` all show RLS as enabled

---

## Step 4 — Set up Supabase Storage

1. In Supabase, go to **Storage → Create bucket**.
2. Name it `brand-assets`.
3. Set it to **Public** (logos need to be publicly accessible for the live link).
4. Add an upload policy so only authenticated users can write:
   ```sql
   CREATE POLICY "authenticated_upload" ON storage.objects
     FOR INSERT TO authenticated
     WITH CHECK (bucket_id = 'brand-assets');
   ```

---

## Step 5 — Set up Upstash Redis (rate limiting)

1. Go to [console.upstash.com](https://console.upstash.com) and create a Redis database.
2. Choose the region closest to your Vercel deployment.
3. Copy the REST URL and token.
4. Add to `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

---

## Step 6 — Add Anthropic key

```
ANTHROPIC_API_KEY=sk-ant-...
```

> **Phase 1 note:** The generate endpoint currently returns a stub — no tokens will be used until Phase 2 replaces the stub with real generation logic.

---

## Step 7 — Set remaining env vars

```
PROPOSAL_TOKEN_SECRET=<run: openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_...          # Can be left blank for Phase 1
RESEND_FROM_EMAIL=...           # Can be left blank for Phase 1
```

---

## Step 8 — Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`. You should be redirected to `/sign-in`.

---

## Step 9 — Test the golden path (Phase 1 scope)

1. **Sign up** as a new user → should land on `/dashboard`.
2. **Check Supabase** → a `workspaces` row and `brand_settings` row should exist for your user.
3. **Sign in as a second test user** (use a different email / incognito).
4. **Verify RLS** — confirm the second user cannot see the first user's workspace or proposals:
   ```sql
   -- Run in Supabase SQL editor as the anon role (or check via API)
   -- You should get 0 rows for user B when querying user A's workspace ID
   SELECT * FROM workspaces; -- Should only return the current user's workspace
   SELECT * FROM proposals;  -- Should only return the current user's proposals
   ```
5. **POST to /api/generate** with a valid body — should return a proposal with `_stub: true`.
6. **Check security headers** — open DevTools → Network → any request → confirm:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Strict-Transport-Security` present
   - `Content-Security-Policy` present

---

## Phase 1 complete when

- [ ] New user can sign up and lands on the dashboard
- [ ] Workspace + brand settings created automatically
- [ ] Second test user cannot access first user's data (RLS confirmed)
- [ ] `/api/generate` returns stub proposal (rate limit enforced)
- [ ] Security headers present on all responses
- [ ] No secrets in client bundle (check Network tab — no `ANTHROPIC_API_KEY`, no `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] `.env.local` is in `.gitignore` and not committed

---

## Next: Phase 2 — Generation Core

Replace the stub in `src/app/api/generate/route.ts` with real Claude generation:
1. Build the generation prompt with brand context + brief
2. Call Claude requesting JSON output matching the block schema
3. Validate + repair the response
4. Persist and return

See `CLAUDE.md` and the PRD §7 for the full spec.
