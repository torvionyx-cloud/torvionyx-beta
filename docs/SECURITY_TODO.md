# Torvionyx — Security To-Do

**Last reviewed:** 22 August 2026
**Reviewed by:** Defensive assessment pass (RLS + policies + headers + npm audit)

> **Overall posture: sound.** The items below are hardening and hygiene, **not active fires.** The serious things that *would* have been a problem — RLS disabled, open `USING(true)` policies, missing security headers — were checked and are **not** the case. Nothing here is an emergency; all of it is worth doing on a rested session rather than at the end of a long one.

---

## ✅ Verified good (no action needed)

- **RLS enabled on all 12 public tables** — `acceptance_records`, `ai_generations`, `brand_settings`, `fee_resourcing_templates`, `follow_up_logs`, `projects`, `proposal_events`, `proposals`, `rate_card`, `scope_library`, `voice_profiles`, `workspaces`.
- **Every policy is genuinely workspace-scoped** — no open/permissive policies. Each traces ownership back to `workspaces.clerk_user_id = <current user>`.
- **Write policies mirror read policies** (`with_check` present) — no cross-tenant inserts/updates, not just reads.
- **Security headers are excellent** (in `next.config.js`): full CSP with scoped allowlist, `frame-ancestors 'none'` + `X-Frame-Options: DENY`, HSTS, `X-Content-Type-Options: nosniff`, locked `Permissions-Policy`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. Better than most production apps.

---

## 🔧 Open items — priority order

### 1. Normalise the RLS identity mechanism  *(HIGHEST — do first, on a fresh session)*
There are **two different identity mechanisms** across the RLS policies where there should be one:

- **Reads verified JWT (good):** `proposals`, `workspaces`, `ai_generations`, `brand_settings`, `acceptance_records`, `proposal_events` — use `current_clerk_id()`, which is `SELECT auth.jwt()->>'sub'` (cryptographically-signed token, can't be forged).
- **Reads a manually-set session variable (fragile):** `scope_library`, `fee_resourcing_templates`, `rate_card`, `projects`, `voice_profiles`, `follow_up_logs` — use `current_setting('app.clerk_user_id', true)`, which only works if the app remembers to `SET` it per connection. If unset, returns NULL → fails closed (safe but broken); wrong value → wrong workspace.

**Why it matters:** latent inconsistency, not an active exploit (the app currently uses the service-role key which bypasses RLS entirely, so these policies are a backstop, not the live enforcement path). But two isolation mechanisms = two things that can drift. Normalise all six to `current_clerk_id()`.

**Caution:** this is a **write to production RLS policies.** Done wrong, it can lock real beta users out of their own data. **Test against a SECOND user account before touching production.** Do it via a migration file, verify with a follow-up `list_tables`/`pg_policies` read.

### 2. `npm audit fix` — Clerk authorization-bypass patch  *(plain, never `--force`)*
- Advisory: **GHSA-w24r-5266-9c3c** — authorization bypass when combining organization/billing/reverification checks.
- The **only** audit finding directly relevant to the app's own auth behaviour (rest are dev-tooling DoS/ReDoS).
- Run plain `npm audit fix` (stays within current major versions), then **rebuild + test the full login → logout → proposal-load flow** locally before deploying.

### 3. ⚠️ Do NOT run `npm audit fix --force`  *(warning, not a task)*
- It wants to install **`next@16`** — two major versions up from `14.2.35`. That's a large breaking change on a live app; a separate, planned, carefully-tested upgrade, **not** a quick fix.
- Most remaining audit items (`glob`, `minimatch`, `brace-expansion`, `js-yaml`, `@typescript-eslint`, `js-beautify`) are **dev-only build tooling** — real but low urgency, not shipped to users.

### 4. Rate-limit coverage on Claude-calling routes
- `generate` is confirmed rate-limited (`checkWorkspaceGenerationRateLimit`).
- **Unverified:** `score`, `rewrite`, `regenerate` — each calls Claude and costs money per hit. An unlimited one is a direct **financial-drain / abuse vector.**
- Audit each; add per-workspace limits where missing. Return `429` + `Retry-After`.

### 5. `/p/[token]` public route audit
- The **one unauthenticated, public-facing surface** (serves full proposals: client names, pricing, terms).
- Confirm `share_token` is **high-entropy** (long random UUID, not sequential/guessable).
- Confirm the route doesn't **leak valid-but-expired vs never-existed** (enumeration signal) — both should return the same generic "not found / expired".

### 6. Clerk Dev → Prod instance migration
- Live beta users are currently on a **Clerk Development instance** (weaker session/JWT guarantees than Production).
- **Blocked on:** custom domain purchase (costs money).
- **Free to do now:** document the exact migration steps + audit which Clerk keys in Vercel are dev vs prod and confirm they're Production-environment-scoped, so the migration is a ~30-min job the moment the domain lands.

---

## Notes
- `createAdminClient()` (service-role key) **bypasses RLS by design** — fine for server components that have already checked auth via Clerk, but it means today's live enforcement is the app-level `.eq("workspace_id", workspaceId)` filters, with RLS as the database backstop. Keep both; don't let either rot.
- Re-run this whole pass after any major dependency or auth-provider change.
