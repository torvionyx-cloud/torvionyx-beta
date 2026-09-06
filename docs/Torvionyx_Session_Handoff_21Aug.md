# Torvionyx — Session Handoff
**Date:** Friday, 21 August 2026

---

## Where things stand right now

**Phase A of the proposal-creation rework is done.** `git status` should show clean on a fresh `torvionyx-v2` checkout, `HEAD` at `34548b5`. Phase B (new intake form) and Phase C (rewire generation) are not started — see "Next up."

---

## Important corrections to the 20 Aug handoff — read this before doing anything else

The 20 Aug handoff (carried into this session) contained a plan that turned out to be wrong once checked against the real repo. Both corrections below matter for any future work — don't let a stale version of either creep back in.

1. **`proposal_type` was never renamed to `fee_basis`, and shouldn't be.** The original plan said "rename `proposal_type` to `fee_basis` at the database level." Checking the actual code first: `proposal_type` is referenced in **15 files**, not a small number — it's `NOT NULL`, has no CHECK constraint, holds 5 legacy values (`service_proposal`, `project_quote`, `retainer_proposal`, `consultancy_proposal`, `photography_proposal`), and **actively drives the AI generation pipeline** via `SECTION_GUIDES[input.proposal_type]` and `PROPOSAL_TYPE_LABELS` in `lib/prompt.ts` — this is the mechanism behind "zero RIBA stages selected → full AI-generation fallback." It's also rendered directly on the dashboard and analytics pages (`p.proposal_type.replace(/_/g," ")`). Renaming or clearing it would have broken working features. **Decision: `proposal_type` is untouched.** `fee_basis` was added as a brand new, separate, nullable column instead (`hourly` / `lump_sum`, CHECK-constrained, additive only).

2. **The repo uses a `src/` layout** — `src/app`, `src/lib`, `src/components` — not top-level `app/`, `lib/` as earlier handoff notes assumed. Any grep/find commands need `src/` prefixed or they'll silently fail with "No such file or directory."

---

## What shipped today

### 1. Live schema verified directly against Supabase (not assumed from notes)
Queried `kjgrijqrbiikguovshtc` directly rather than trusting the handoff's description. Findings:
- `proposal_type`: `NOT NULL`, default `'service_proposal'`, no CHECK constraint, 56 rows split across the 5 legacy values above.
- `project_type` (added by migration `0009`): nullable, CHECK-constrained to 6 RIBA project types — but **all 56 proposal rows currently have this NULL**, unbackfilled since 0009 landed.
- `scope_library`: **0 rows** (empty). `fee_resourcing_templates`: **1 row** (`Residential Extension`, Stage 0). Worth knowing before judging "Add a stage" against more than one combination — there's barely any real data to resolve against yet.
- Discovered migration `0009` was applied directly to the live project and **never saved as a file** in `supabase/migrations/` — a real gap between production and version control.

### 2. Shared stage resolver extracted — commit `b9458c5`
`handleAddStage` inside `src/components/proposals/ProposalEditorClient.tsx` (added in `8b9e58a`, confirmed via `git show`) mixed two things: resolving a stage into scope text + priced line items, and applying that to the editor's block state. Pulled the pure resolution logic out into `src/lib/stageResolver.ts`:
- `resolveStage(ribaStage, projectType, scopeLibrary, feeTemplates, rates)` — same behavior as the original inline code, unchanged, just relocated.
- `stageHasData(...)` — a new helper, not yet called from anywhere, added ahead of need for Phase B's stage multi-select (which needs to show live whether real data exists per stage/project type).

`ProposalEditorClient.tsx` now calls `resolveStage()` instead of duplicating the logic. Verified with a clean `npm run build` before committing.

### 3. `fee_basis` type + schema — commit `c0bea2c`
- `src/types/database.ts`: `fee_basis: string | null` added to the `Proposal` interface, documented as distinct from `proposal_type`.
- `src/lib/validation.ts`: new `FEE_BASIS = ["hourly", "lump_sum"] as const`, added to `updateProposalSchema` as `.optional().nullable()` — mirrors `project_type`'s existing pattern exactly.
- Verified with a clean build before committing.

### 4. `fee_basis` column applied to live Supabase — verified independently
Applied via the Supabase MCP connection directly:
```sql
ALTER TABLE proposals ADD COLUMN fee_basis text;
ALTER TABLE proposals ADD CONSTRAINT proposals_fee_basis_check
  CHECK (fee_basis IS NULL OR fee_basis = ANY (ARRAY['hourly'::text, 'lump_sum'::text]));
```
Confirmed afterward via a fresh `list_tables` call (not just trusting the tool's `"success": true`) — `fee_basis` present as described, `proposal_type` completely unchanged, row count on `proposals` unchanged at 56.

### 5. Migration files backfilled — commit `34548b5`
Wrote `supabase/migrations/0009_add_proposal_project_type.sql` and `0010_add_proposal_fee_basis.sql`, matching the existing header/comment style (see `0008_add_fee_resourcing_templates.sql` for the convention). Exact constraint names (`proposals_project_type_check`, `proposals_fee_basis_check`) were pulled from `pg_constraint` on the live DB rather than guessed, so the files describe reality exactly.

**Both files describe schema that's already live** — don't run them again through `apply_migration` or `db push`; they'd error on `ADD COLUMN`/`ADD CONSTRAINT` against columns that already exist. They exist purely so a fresh checkout or `supabase db reset` produces the same schema as production.

---

## Established workflow patterns (carry these into the new chat)

Everything from the 19–20 Aug handoffs still holds — Terminal app, `cd ~/Desktop/torvionyx-v2`, stop the dev server before building, verify every claimed edit independently. This session extended that habit one step further:

- **Verify tool-call success independently, not just the tool's own report.** A migration `apply_migration` call returning `"success": true`, or a patch script printing `"Patched successfully"`, gets the same skepticism as Claude Code's "Done" summaries did in earlier sessions — confirmed via a follow-up read (`list_tables`, `grep`) before treating it as real.
- **Verify plans from prior handoffs against the actual code before executing them**, not just against the handoff's own description of the code. The `proposal_type`/`fee_basis` correction above only surfaced because the live schema and the actual file contents were checked directly — the handoff's plan sounded reasonable and was still wrong.
- **`src/` layout** — see correction #2 above.
- **The editor route is `src/app/dashboard/[proposal_id]/edit/page.tsx`**, directly under `dashboard/`, not under a `proposals/` subfolder.
- Python-based find/replace patch scripts (via `assert text.count(old) == 1` before replacing) worked well this session for larger, more error-prone edits — safer than pasting full file rewrites, and the assert fails loudly instead of silently corrupting a file.
- Command formatting preference (standing): copy-paste-able terminal commands go together in one block. Steps/numbered instructions are reserved for non-command actions.
- `zsh` gotchas from 19–20 Aug still apply — bracket paths need quoting, unclosed quotes leave a `dquote>` prompt (Ctrl+C to escape).
- **Not yet cleaned up, flagged again:** `package-lock.json` and a duplicate `package-lock 2.json` both sit in the repo root, plus a stray `next.config.js.` (trailing dot). Harmless but worth a 10-second cleanup at some point — this has now been flagged in two consecutive sessions.

---

## Project context (for a fresh chat with no prior memory)

- **Product:** Torvionyx, a fee-proposal platform for UK RIBA-registered architecture practices (2–15 staff)
- **Five core launch deliverables:** ✅ Rate Card · ✅ Projects · ✅ Scope Library · ✅ Fee Templates · ✅ Fee engine wired into the proposal editor · 🔲 client-facing live shareable link — the one deliverable still not started
- **Stack:** Next.js 14.2.35, `src/` layout, Clerk auth, Supabase (Postgres, project `kjgrijqrbiikguovshtc`, eu-west-1), Vercel hosting, Anthropic API
- **Repo:** `torvionyx-cloud/torvionyx-beta` on GitHub, working folder `~/Desktop/torvionyx-v2`
- **Migrations so far:** `0001` → `0004` → `0005_add_rate_card` → `0006_add_projects` → `0007_add_scope_library` → `0008_add_fee_resourcing_templates` → `0009_add_proposal_project_type` → `0010_add_proposal_fee_basis` (`0002`/`0003` don't exist in the repo — not investigated this session, may be historical/squashed, not urgent)
- **Live data is sparse right now:** `scope_library` empty, `fee_resourcing_templates` has 1 row, `rate_card` has 1 row, `projects` has 1 row, all 56 `proposals` have `project_type` and `fee_basis` both NULL. Worth populating more before Phase B testing means anything.
- **Not touched this session, still open:** the compliance/security remediation plan (Phase 0 — robots.txt/indexing, ICO registration, Clerk bot protection, Anthropic spend cap, Certificate Transparency audit — plus the broader Phase 1–3 plan). Worth returning to given live beta users are on a Clerk Development instance.

---

## Next up

**Phase B — the new intake form**, per the decisions already made in the 20 Aug handoff (unchanged, still the plan):

1. Creation flow becomes: client details → project type → RIBA stage multi-select (each stage showing live via `stageHasData()` whether real scope/fee data actually exists for it) → brief goes from required to optional context → a **fee basis** choice of `hourly` or `lump_sum`.
2. `hourly` reuses today's itemized behavior as-is; `lump_sum` collapses the same resolved numbers into one line per stage instead.
3. AI's role shrinks to writing the narrative wrapper around real content — not inventing scope or pricing when stages are selected. **Zero stages selected preserves exactly today's full-AI-generation behavior as a fallback** — this is the `proposal_type` / `SECTION_GUIDES` path confirmed untouched this session, so nothing is forced or broken.

**Phase C** — rewire `service.ts` and `lib/prompt.ts` to call `resolveStage()` from `lib/stageResolver.ts` on the server side, using real data before calling Claude, instead of the AI inventing pricing from scratch.

Not yet started — this is the right place to pick back up.
