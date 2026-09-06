# Torvionyx — Session Handoff
**Date:** Thursday, 20 August 2026 (long session, morning through evening)

---

## Where things stand right now

**Nothing broken, nothing unresolved.** Every thread opened today — dev server, hydration bug, fee engine Phase A + B — was root-caused, fixed, tested, and shipped. `git status` should show clean on a fresh `torvionyx-v2` checkout, `HEAD` at `8b9e58a`. The next real piece of work (proposal creation rework) is scoped but genuinely not started — see "Next up."

---

## What shipped today — confirmed working, built, pushed, deployed

### 1. Dev server compile-time issue — root-caused and resolved

Yesterday's handoff left this diagnosed as "likely disk or memory pressure, not conclusively confirmed." It's confirmed now: disk space was down to ~9GB free (out of ~113GB), which is genuinely tight for webpack's on-disk cache. Freed up to ~22GB via macOS's own Storage management. Boot time (`Ready in Xs`) dropped from 445.9s → 162.2s → a steady 2.6–2.9s across multiple clean-cache rebuilds since. First cold compile of `/dashboard/knowledge` after a `rm -rf .next` still takes a while (hundreds of seconds — that's expected, webpack has nothing cached), but the *second* load is consistently fast (300–600ms), confirming the persistent cache itself is healthy again post-cleanup. No code changes involved — purely an environment fix.

### 2. Hydration error on `/dashboard/knowledge` — root-caused and fixed (commit `5a177f5`)

**Symptom:** intermittent "Hydration failed" error on load, tree diff showing a `<Portal>` mismatch a few levels inside a generic `<HOC>` wrapper.

**Investigation, in order:** the Fee Templates grade dropdown was the first, reasonable-looking suspect — ruled out, since it's a plain native `<select>` gated behind post-mount `isAdding` state, so it can't even be in the DOM at hydration time. A full-`src` grep for portal-related libraries (Radix, Headless UI, react-select, toast libraries, bare `Portal`) came back completely empty, ruling out all four Knowledge tab panels at once — the search just hadn't included Clerk. `dashboard/layout.tsx` was the actual source: `<UserButton>` sits inside a `lg:hidden` wrapper, meaning it's CSS-hidden at desktop width but still fully mounted and hydrating — Clerk's `UserButton` needs its own client JS to resolve user data the server already knew, and that gap is exactly this class of bug.

**Fix:** wrapped in Clerk's own `<ClerkLoading>` / `<ClerkLoaded>` control components — the officially documented pattern for this exact SSR boundary, not a workaround.

**Verified:** A/B test (commented UserButton out, error disappeared; confirmed the real fix independently too), clean production build, `git diff` pulled directly from the file (not trusted from Claude Code's own summary — see "Established patterns" below), 4–5 clean desktop reloads, and a functional check at mobile width (button visible, dropdown opens, sign-out works).

### 3. Fee engine — Phase A: data plumbing (commit `e19f433`)

`edit/page.tsx` switched from `createServerClient()` to `createAdminClient()` — same JWT-timing fix already applied to the Knowledge page, now applied here too since more async queries were being added to this exact file. Now fetches `scope_library`, `fee_resourcing_templates`, and `rate_card` alongside the proposal itself, all filtered by `workspace_id`. `ProposalEditorClient` accepts the three new props. No visible UI change in this phase — pure plumbing, verified safe specifically *because* nothing user-facing changed.

### 4. Fee engine — Phase B: "Add a stage" — built, tested end-to-end, shipped (commit `8b9e58a`)

The actual feature. In the proposal editor sidebar: pick a RIBA stage, and it pulls the matching Scope Library text and Fee Template lines for that proposal's project type, resolves each grade against the *current* Rate Card via `getCurrentRate()`, and adds a new `text` block (scope) plus itemized `pricing` line items — one per grade — into the proposal. Grades with no current rate are skipped and flagged in a warning, not silently added at £0. Already-added stages disable themselves in the picker. Editing an added line's hours or rate afterward works for free, through the same generic block-editing mechanism every other line item already uses — no special code needed for that part.

Two real bugs caught and fixed *before* shipping, not after:
- `proposal.proposal_type` (an unrelated old enum — document format: service/quote/retainer/etc.) was being used to match against Scope Library and Fee Templates instead of a real project-type field, which didn't exist yet. Every "Add a stage" click would have silently found nothing, ever, without erroring.
- `pricingBlockSchema` requires at least one line item. A stage with zero resolvable fee lines would have created an invalid empty pricing block that fails validation on every autosave afterward — fixed to only touch the pricing block when there's actually something to add, falling back to scope-only plus a clear warning otherwise.

### 5. New `project_type` column, fully wired (part of commit `8b9e58a`)

Migration `0009_add_proposal_project_type` applied directly to the live Supabase project (`kjgrijqrbiikguovshtc`) — nullable `text` column on `proposals`, `CHECK` constraint matching `PROJECT_TYPES`, same pattern as the existing `proposals.template` constraint. **Distinct from the pre-existing `proposal_type` column** — same name, one letter apart, completely different meaning (RIBA project category vs. document format) — this confusion is exactly what caused the bug above, and it's the reason `proposal_type` is getting renamed to `fee_basis` in the next phase of work, not left as-is.

The editor's "Add a stage" card now prompts once for project type if it's unset, before revealing the stage picker — set via the same autosave path as everything else, no special save mechanism.

**A genuine anomaly, investigated, confirmed benign:** `/dashboard/knowledge`'s production bundle dropped from ~23.5kB to ~10.5kB after these edits, and it survived a clean `rm -rf .next` rebuild — ruling out stale cache. None of the three edited files are part of Knowledge's route. Checked with an actual functional pass (`npm run start`, all four Knowledge tabs clicked through, one real edit+save+refresh) — everything works. Most likely explanation: webpack's automatic chunk-splitting reorganizing itself now that `validation.ts` is imported by two route trees instead of one. Not chased further since function is confirmed intact, but worth knowing this happened in case route sizes look unusual again later.

---

## Established workflow patterns (carry these into the new chat)

Everything from the 19 Aug handoff still holds — Terminal app, `cd ~/Desktop/torvionyx-v2`, stop the dev server before building, verify every Claude-Code-claimed edit independently. A few sharper/new lessons from today specifically:

- **Claude Code's own diff and "Done" summaries were repeatedly unreliable today** — large multi-file pastes came through visibly garbled (mid-word line breaks) more than once, and at least once its own "Done, matches exactly what was requested" summary directly contradicted what its own diff actually showed a few lines above it. The fix that worked every time: never trust the paste itself — pull the real file content independently afterward via a fresh `grep`/`sed`/`cat`, run in its own command, not read off Claude Code's rendering.
- **`clear` before re-pasting terminal output.** Scrollback confusion caused the exact same stale output to get pasted back twice in one case — run `clear` before the command that actually matters, so there's nothing old on screen to grab by mistake.
- **Break large Claude Code instructions into smaller, surgical find/replace chunks** rather than one giant multi-file block — easier to verify each piece independently, and lower risk that garbling silently corrupts something in the middle.
- **Commit grouping:** split genuinely unrelated changes into separate commits (a doc file shouldn't ride along with a bug fix), but don't fragment one cohesive feature across several commits just because it was built over several turns — the whole "Add a stage" feature landed as one commit, correctly.
- **zsh-specific gotchas:** square brackets in paths (`[proposal_id]`) need quoting or `git add` silently fails with `zsh: no matches found` and no further explanation; an unclosed quote in a pasted multi-line command leaves the terminal stuck at a `dquote>` prompt — Ctrl+C to escape, don't try to keep typing into it.
- **Command formatting preference (explicit, standing):** copy-paste-able terminal commands go together in one block. Steps/numbered instructions are reserved for things that aren't commands — clicks, key presses, browser actions.
- **`proposal_type` vs. `project_type`:** two different columns, one letter apart, completely different meanings. Worth double-checking which one is meant every time either comes up, especially now that `proposal_type` is about to be renamed to `fee_basis` — don't let a third confusingly-similar name creep back in.

---

## Project context (for a fresh chat with no prior memory)

- **Product:** Torvionyx, a fee-proposal platform for UK RIBA-registered architecture practices (2–15 staff)
- **Five core launch deliverables:** ✅ Rate Card · ✅ Projects · ✅ Scope Library · ✅ Fee Templates · ✅ Fee engine wired into the proposal editor (Phase A + B, shipped today) · 🔲 client-facing live shareable link — the one deliverable still not started
- **Stack:** Next.js 14.2.35, Clerk auth, Supabase (Postgres, project `kjgrijqrbiikguovshtc`, eu-west-1), Vercel hosting, Anthropic API
- **Design system:** navy `#0C1A2E` sidebar, gold `#DCAA33`→`#F2C84E` gradient accents, Space Grotesk headings, Inter body, IBM Plex Mono labels — tokens in `globals.css` as `--tv-*` variables
- **Repo:** `torvionyx-cloud/torvionyx-beta` on GitHub, working folder `~/Desktop/torvionyx-v2`
- **Migrations so far:** `0005_add_rate_card` → `0006_add_projects` → `0007_add_scope_library` → `0008_add_fee_resourcing_templates` → `0009_add_proposal_project_type`
- **Not touched today, still open:** the compliance/security remediation plan from earlier sessions (Phase 0 items — robots.txt/indexing, ICO registration, Clerk bot protection, Anthropic spend cap, Certificate Transparency audit — plus the broader Phase 1–3 plan). Today was entirely feature-work; that thread hasn't moved and is worth returning to.

---

## Next up

**Rework proposal creation (`/dashboard/new`) around RIBA stages** — the single biggest piece of scoped-but-unbuilt work, and genuinely comparable in size to the fee engine build itself, not a quick follow-on. Discovered mid-session: the current creation flow (`app/dashboard/new/page.tsx` → `api/proposals/generate/route.ts` → `service.ts` → `lib/prompt.ts`) still reflects Torvionyx's pre-pivot generic-freelancer positioning — the AI system prompt literally opens with *"You are a world-class proposal writer for freelancers and consultants,"* and pricing is currently invented from scratch by the AI every time, with zero connection to Rate Card, Scope Library, or Fee Templates.

Decisions already made, ready to build against:
1. Creation flow becomes: client details → project type → RIBA stage multi-select (each stage showing live whether real scope/fee data actually exists for it) → brief goes from required to optional context → a **fee basis** choice of `hourly` or `lump_sum`.
2. `proposal_type` gets renamed to `fee_basis` at the database level, not just relabeled in the UI — new values `hourly` / `lump_sum`. Percentage-of-construction-value was considered and deliberately deferred — it's genuinely different math with no construction-value field to hang it off yet, not a variation on what's already built.
3. The resolution logic already built and tested in `handleAddStage` (stage + project type → resolved scope + fee lines) needs to come out of the editor and into a shared, framework-agnostic function both the client editor and the server-side generation path call — one source of truth, not two copies that quietly drift.
4. `hourly` reuses today's itemized behavior as-is; `lump_sum` collapses the same resolved numbers into one line per stage instead — the other half of a design decision made back in Phase A, finally with somewhere to live.
5. AI's role shrinks to writing the narrative wrapper (hero, framing, timeline, terms) around real content — not inventing scope or pricing when stages are selected. Zero stages selected preserves exactly today's full-AI-generation behavior as a fallback, so nothing is forced.

Phased the same way the fee engine was: **Phase A** — migration + type/schema updates + the shared resolver extraction, no visible change yet. **Phase B** — the new intake form. **Phase C** — rewire `service.ts` and `lib/prompt.ts` to use real data before calling Claude. Not yet started — this is the right place to pick back up.
