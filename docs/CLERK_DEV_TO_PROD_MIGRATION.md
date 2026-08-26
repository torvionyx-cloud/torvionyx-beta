# Clerk Dev → Prod Instance Migration Runbook

**Created:** 26 August 2026
**Status:** Blocked on custom domain purchase
**Estimated execution time:** 30–45 minutes once domain is ready
**Risk level:** Medium — existing beta users must re-register

---

## Why this matters

Torvionyx runs on a Clerk Development instance. Production instances give proper session security, branded auth URLs on your domain, and production-grade Clerk API limits.

---

## Current state (audited 26 Aug 2026)

### Env vars the app uses (3 Clerk secrets)

| Variable | Where used | Dev indicator |
|---|---|---|
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | ClerkProvider (frontend) | Starts with pk_test_ |
| CLERK_SECRET_KEY | lib/email.ts, server-side SDK | Starts with sk_test_ |
| CLERK_WEBHOOK_SIGNING_SECRET | api/webhooks/clerk/route.ts | Tied to dev webhook |

### Dev-instance fingerprints in codebase

1. next.config.js CSP — allowlists *.clerk.accounts.dev
2. src/components/TermlyScript.tsx — allowlists *.clerk.accounts.dev
3. .env.example — placeholders use sk_test_ / pk_test_
4. Vercel env vars — currently dev-instance keys

---

## Pre-migration checklist (do before domain purchase)

- [ ] Verify Vercel env var scoping (which environments each key is set for)
- [ ] Export dev-instance user list (emails + metadata) from Clerk Dashboard
- [ ] Document current webhook endpoint URL, subscribed events, and signing secret

---

## Migration steps (once domain is purchased)

### Step 1 — Create Clerk Production instance
1. clerk.com/dashboard → Add application → Production
2. Add custom domain, complete DNS verification

### Step 2 — Configure Production instance
1. Mirror dev auth settings (same sign-in methods, OAuth providers)
2. Create webhook: https://YOUR_DOMAIN/api/webhooks/clerk (same events)
3. Copy new signing secret

### Step 3 — Update Vercel env vars (Production scope only)
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY → pk_live_... (Production only)
- CLERK_SECRET_KEY → sk_live_... (Production only)
- CLERK_WEBHOOK_SIGNING_SECRET → new secret (Production only)
- Keep dev keys for Preview/Development environments

### Step 4 — CSP: no code change needed
*.clerk.accounts.dev and *.clerk.com are both already in CSP. Leave both so preview deploys still work.

### Step 5 — Update .env.example prefixes to sk_live_ / pk_live_

### Step 6 — Deploy and verify
1. npm run build
2. vercel --prod --cwd ~/Desktop/torvionyx-v2
3. Test: sign up → sign out → sign in → create proposal → share proposal → check logs

### Step 7 — Notify beta users
They must re-register (Clerk doesn't migrate users between instances). Their Supabase data is unaffected — update workspaces.clerk_user_id to their new Production Clerk ID to re-link.

---

## Rollback
Revert the three Vercel env vars to sk_test_ / pk_test_ / dev webhook values → redeploy. Dev instance is still active.

---

## Post-migration
- [ ] Confirm webhook events flowing (new sign-ups creating workspaces)
- [ ] After all users re-registered, optionally deactivate Dev instance
- [ ] Re-run full security audit pass
