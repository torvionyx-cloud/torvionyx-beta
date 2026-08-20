# Torvionyx — Session Handoff
**Date:** Wednesday, 19 August 2026 (long session, morning through evening)

---

## Where things stand right now — unresolved

**Dev server compile times are unreliable** — last known state was mid-diagnosis of a severe slowdown (720.5s / 12-minute compile on `/dashboard/knowledge`, accompanied by hundreds of `[webpack.cache.PackFileCacheStrategy] ... Error: ETIMEDOUT` lines — webpack's on-disk build cache failing to read/write almost every file). Not yet conclusively diagnosed or re-tested with a clean cache. See "Known issue" below for the exact steps to run before writing any new code.

**Nothing else is pending.** Working tree should be clean — everything built today was committed and pushed. `git status` should show clean on a fresh `torvionyx-v2` checkout.

---

## What shipped today — confirmed working, built, pushed, deployed

### 1. JWT expiry bug — root-caused and fixed (commit `974c451`)

**Root cause:** `src/app/dashboard/knowledge/page.tsx` used `createServerClient()`, which passes Clerk's session token to Supabase via an `accessToken()` callback on every query. On a slow request (compile-bound dev server), the token minted at the start of the request could expire before the Supabase query actually ran — Clerk's `getToken()` without a `template` argument just echoes the request-time token, it doesn't mint a fresh one. Confirmed via instrumentation: `PGRST303 / JWT expired`.

**Fix:** switched to `createAdminClient()` (service-role key) + the existing `getWorkspaceId(userId)` + manual `.eq("workspace_id", ...)` filtering — the same pattern every API route (`rate-card`, `projects`, `scope-library`) already uses. Removes the JWT dependency from this page entirely.

**Verified:** after the fix, cold-start loads return `200`, not `500` — the "Something went wrong" / refresh-needed cycle is gone. Confirmed across multiple fresh `npm run dev` restarts, including through a very slow compile.

**Caution for next session:** this fix took **three attempts** to actually persist to disk — Claude Code reported success twice while the file still showed the old `createServerClient()` code underneath. Only confirmed real via `grep`/`cat` run independently in the user's own Terminal, cross-checked against Claude Code's own raw-pasted file output. Keep doing this double-check on every edit until compile times are back to normal — see "Established workflow patterns" below.

Timing instrumentation (three `console.log` lines: `auth()`, `getWorkspaceId()`, Supabase query durations) is still in `page.tsx`. Cheap and harmless — leave it in for now.

### 2. Scope Library tab (commits `3e7429e`, `41c1071`) — third of five core deliverables

- Migration `0007_add_scope_library.sql`: `scope_library` table, workspace-scoped RLS matching the `rate_card`/`projects` convention (`current_setting('app.clerk_user_id', TRUE)`, **not** `auth.jwt()`)
- API route `/api/scope-library` (GET/POST/DELETE, Zod validation, reuses `PROJECT_TYPES` enum)
- UI: `ScopeLibraryAccordion` → `ScopeStageRow` → `ScopeCell` — accordion by RIBA stage (0–7), six project-type columns per stage, inline textarea edit, save-on-blur with a no-op guard for unchanged values
- New shared module `lib/riba.ts`: `RIBA_STAGES` (stage number + standard RIBA Plan of Work 2020 name) — reused by everything RIBA-stage-shaped since
- IBM Plex Mono added to the Google Fonts `<link>` in `layout.tsx` for stage-number labels
- **Manually verified in browser:** save, refresh-persists, tab-switch-doesn't-lose-data, clear-reverts-to-placeholder

### 3. Fee Templates tab (commit `745786f`) — reusable resourcing layer feeding the fee engine

- Migration `0008_add_fee_resourcing_templates.sql`: `fee_resourcing_templates` table — one row per (workspace, riba_stage, project_type, grade), holding an `hours` value. Multiple grade-rows can share one (stage, project_type) "cell". `grade` is free text (not an enum) — matches whatever the founder's own `rate_card.grade` values are, which can change.
- New shared module `lib/rateCard.ts`: `getCurrentRate(grade, rates, asOf?)` — single source of truth for "which `rate_card` row is currently in effect for this grade" (filters out future-dated rows, picks the latest `effective_from` on/before `asOf`). **Reuse this in the fee engine build — don't reimplement.**
- API route `/api/fee-resourcing-templates` (GET/POST/DELETE) — POST upserts one line keyed on `(workspace_id, riba_stage, project_type, grade)`
- UI: `FeeTemplatesAccordion` → `FeeTemplateStageRow` → `FeeTemplateCell`. Each cell holds a *list* of grade+hours lines (unlike Scope Library's single value), shows a live per-line subtotal, a cell-total footer, and flags any line whose grade doesn't currently resolve to a rate as "no rate on file" — **excluded from the subtotal, not silently counted as £0**.
- Grade input: dropdown of distinct grades already in `rate_card`, with a "type a new grade" fallback that warns explicitly if the typed grade won't resolve to a rate yet.
- **Manually verified end-to-end:** added a "Director, 10 hours" line, confirmed displayed subtotal = `10 × Director's current rate` from the Rate Card tab, refreshed (persisted), deleted (removed cleanly, subtotal updated), switched tabs repeatedly (no data loss).

---

## Known issue — NOT resolved, needs attention before resuming feature work

Dev server compile times are wildly inconsistent across today's session: `Ready` in anywhere from 26.7s to 188s, and one case of the `/dashboard/knowledge` route alone taking **720.5 seconds** to compile, flooded with:

```
[webpack.cache.PackFileCacheStrategy] Restoring failed for ... from pack: Error: ETIMEDOUT: connection timed out, read
```

This is webpack's on-disk build cache failing to read/write almost every file it touches — not a real network issue despite the wording. Very likely disk space or memory pressure (the same resource-constraint theme that also caused a `bus error` on `git commit` and a plain `ETIMEDOUT` on `fs.readFileSync` during a build earlier in the session), but **not conclusively diagnosed**.

**Not a functional bug** — every slow load still eventually returned `200` and rendered correctly, and `npm run build` (production) stayed in the 30–60s range throughout, even on the same slow episodes. This is purely a dev-server annoyance so far.

**Before writing any new code next session:**
1. `df -h /` — check free disk space
2. Activity Monitor → Memory tab → check Memory Pressure colour and Swap Used
3. If either looks constrained, address that first
4. `rm -rf .next && npm run dev` — confirm `Ready` comes back under ~30s and the first route compile is under ~30s
5. If still bad with headroom on both fronts, next lever is disabling webpack's persistent filesystem cache in `next.config.js` — a real trade-off (slower every-time compiles vs. reliability), flag it rather than just applying it

---

## Established workflow patterns (carry these into the new chat)

- Terminal used throughout: **macOS Terminal app** (not VS Code's terminal, not Claude Code's own execution)
- Working folder: `cd ~/Desktop/torvionyx-v2` — always confirm with `pwd` first
- Start Claude Code with `claude` from within that folder
- **Stop the dev server before running `npm run build`** — running both at once appears to compete for CPU/RAM on this 8GB Mac and has caused at least one very slow build
- After every change: `npm run build` (user's own terminal) → if clean → `git add .` → `git commit -m "..."` → `git push`
- **Verify every file Claude Code claims to have written or shown you, twice.** Once via Claude Code pasting the actual raw file contents in a code block (push back explicitly — "paste the literal text, not a description" — if it just says "that's the full file" without showing it). Once independently via the user's own `cat`/`grep` in Terminal. Today had three separate instances of Claude Code reporting a change as applied when it hadn't actually persisted to disk.
- `git status` showing "nothing to commit, working tree clean" right after an edit was supposedly applied is a **red flag, not reassurance** — it means the working file is byte-identical to what's already committed, which is wrong if a new edit just happened.
- For any new Knowledge-tab-style feature (matrix/accordion by RIBA stage), reuse `lib/riba.ts` (`RIBA_STAGES`) and `lib/validation.ts` (`PROJECT_TYPES`) — don't redefine either.
- New Supabase tables: mirror the established RLS/workspace-scoping convention exactly — `workspace_id` FK, `current_setting('app.clerk_user_id', TRUE)` policy, `updated_at` trigger, workspace index. Now used by `rate_card`, `projects`, `scope_library`, `fee_resourcing_templates`.
- Production deploy: `vercel --prod --cwd ~/Desktop/torvionyx-v2`
- Verify every page by actually clicking through it in the browser after a clean build — compiling ≠ working
- Diagnose before fixing: check the database directly (Supabase MCP) or add real logging before assuming a cause

---

## Project context (for a fresh chat with no prior memory)

- **Product:** Torvionyx, a fee-proposal platform for UK RIBA-registered architecture practices (2–15 staff)
- **Five core launch deliverables:** ✅ Rate Card · ✅ Projects · ✅ Scope Library · ✅ Fee Templates (resourcing/rate layer, done today) · 🔲 wiring the fee engine into the proposal editor + client-facing live link — these two remain
- **Stack:** Next.js 14.2.35, Clerk auth (Development instance), Supabase (Postgres, project `kjgrijqrbiikguovshtc`, eu-west-1), Vercel hosting, Anthropic API
- **Design system:** navy `#0C1A2E` sidebar, gold `#DCAA33`→`#F2C84E` gradient accents, Space Grotesk headings, Inter body, IBM Plex Mono labels — tokens in `globals.css` as `--tv-*` variables
- **Repo:** `torvionyx-cloud/torvionyx-beta` on GitHub, working folder `~/Desktop/torvionyx-v2`
- **Migrations so far:** `0005_add_rate_card.sql` → `0006_add_projects.sql` → `0007_add_scope_library.sql` → `0008_add_fee_resourcing_templates.sql`

---

## Next up

1. **Confirm dev server compile times are healthy** (see "Known issue" above) before touching any feature code.
2. **Fee engine, Part B — wire `fee_resourcing_templates` into the proposal editor** (`/dashboard/[proposal_id]/edit`). This needs its own discovery pass first — the current structure of that page hasn't been inspected yet, and it's a different kind of build (editing an existing page vs. adding a new Knowledge tab). Also needs designing:
   - How a resourcing template auto-loads when a stage is added to a proposal
   - How the founder adjusts hours per-proposal without mutating the underlying template
   - The lump-sum-vs-itemized fee display toggle (already decided: founder's choice, per proposal)
3. **Client-facing live shareable link** — the fifth core deliverable, not yet started.
4. Stale `auth.jwt()` reference in `lib/supabase.ts` — flagged several sessions ago as dead/leftover code, still not cleaned up, low priority.
