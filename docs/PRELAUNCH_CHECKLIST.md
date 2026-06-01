# Pitchwright — Pre-Launch Checklist

Run through every item before switching Vercel to production traffic.

---

## 1. Environment variables

- [ ] All vars from `.env.example` set in Vercel dashboard (Settings → Environment Variables)
- [ ] `PROPOSAL_TOKEN_SECRET` is a cryptographically random 32+ char string (never reused from dev)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` has **no** `NEXT_PUBLIC_` prefix — confirmed server-side only
- [ ] `ANTHROPIC_API_KEY` has **no** `NEXT_PUBLIC_` prefix — confirmed server-side only
- [ ] `RESEND_API_KEY` set and `RESEND_FROM_EMAIL` is a verified Resend sender address
- [ ] `NEXT_PUBLIC_APP_URL` set to your production domain (e.g. `https://app.pitchwright.io`)
- [ ] `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are production keys (not test)

---

## 2. Database (Supabase)

- [ ] Migration `0001_initial_schema.sql` applied to the production Supabase project
- [ ] RLS is **enabled** on all tables (check: Authentication → Policies in Supabase dashboard)
  - `workspaces` — workspace_owner_only
  - `brand_settings` — brand_workspace_owner
  - `proposals` — proposals_workspace_owner + proposals_public_read_by_token
  - `acceptance_records` — acceptance_workspace_owner_read
  - `proposal_events` — events_workspace_owner_read
  - `ai_generations` — ai_gen_workspace_owner
- [ ] Tested with a **second user account** — confirmed no cross-workspace data leak
- [ ] Supabase Storage bucket `brand-assets` exists with public read + authenticated write

---

## 3. Authentication (Clerk)

- [ ] Production Clerk app configured (not test environment)
- [ ] Redirect URLs set: sign-in `/sign-in`, after sign-in `/dashboard`
- [ ] Email verification enabled for new signups
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`

---

## 4. AI generation

- [ ] Rate limits are live — test from two different IPs to confirm throttling works
  - Generation endpoint: strictest (checked in `src/lib/rate-limit.ts`)
  - Public accept endpoint: IP-based rate limiting active
- [ ] Claude model in `src/lib/anthropic.ts` is the intended model
- [ ] AI generation logs appear in the `ai_generations` table after a test generation

---

## 5. Email (Resend)

- [ ] `RESEND_FROM_EMAIL` domain is verified in Resend dashboard (SPF, DKIM, DMARC records set)
- [ ] Send a test acceptance: confirm the notification email arrives in the owner's inbox
- [ ] Email renders correctly in Gmail, Apple Mail, and Outlook (or use Litmus/Email on Acid)
- [ ] "From" name reads sensibly (not just a bare email address)

---

## 6. Golden path end-to-end test

Walk through the full flow on production:

- [ ] **Sign up** — new account created, workspace + brand settings bootstrapped
- [ ] **Brand setup** — `/dashboard/brand` saves successfully, `brand_settings` row updated
- [ ] **New proposal** — `/dashboard/new` generates a proposal via Claude, redirects to editor
- [ ] **Editor** — title editable, blocks editable, autosave fires, manual save works
- [ ] **Share** — "Share" button generates link, copies to clipboard, status flips to `shared`
- [ ] **Live link** — `/p/[token]` renders correctly with brand colours + font
- [ ] **PDF export** — "Save as PDF" button triggers browser print dialog
- [ ] **Accept** — client fills name + email, acceptance is recorded, status flips to `accepted`
- [ ] **Notification** — owner receives acceptance email within 30 seconds
- [ ] **Dashboard** — accepted proposal shows green dot + "Accepted" status

---

## 7. Security spot-checks

- [ ] Open DevTools → Network: confirm no API keys appear in any client-side response
- [ ] `GET /api/proposals` as an unauthenticated request returns 401
- [ ] Try accessing `/dashboard` without signing in — confirm redirect to `/sign-in`
- [ ] Access `/p/[token]` for another user's proposal (if you have two test accounts) — confirm 404
- [ ] Paste an oversized brief (>4000 chars) into the generation form — confirm 422 error

---

## 8. Performance

- [ ] Lighthouse score on `/p/[token]` ≥ 85 (Performance)
- [ ] LCP on the live link < 2.5s on a simulated 4G connection
- [ ] No layout shift (CLS < 0.1) after font load on the live link

---

## 9. Legal / compliance

- [ ] Privacy policy live and linked in the footer
- [ ] Terms of service live and linked
- [ ] Accept form disclosure text reads: "By confirming, you acknowledge this is a lightweight acceptance record, not a regulated e-signature." (already in `AcceptSection.tsx`)
- [ ] Cookie notice if using analytics beyond Pitchwright's own (not applicable for Phase 1)

---

## 10. Activation instrumentation

The north-star metric is **% of signups who share ≥1 proposal**. Confirm these are tracked:

- [ ] `proposal_events` row with `event_type = 'shared'` is inserted on first share
- [ ] `proposals.shared_at` is set on first share
- [ ] `proposals.accepted_at` is set on acceptance
- [ ] `acceptance_records` row inserted with `signer_name` and `signer_email` on accept

---

## 11. Rollback plan

- [ ] Know how to roll back: `vercel rollback` to the previous deployment
- [ ] Supabase schema changes are additive-only (no column drops/renames in this migration)
- [ ] Feature flag strategy documented if you need to disable generation (currently: env var `ANTHROPIC_API_KEY` can be blanked to disable generation gracefully)

---

*Last updated: Phase 3 completion*
