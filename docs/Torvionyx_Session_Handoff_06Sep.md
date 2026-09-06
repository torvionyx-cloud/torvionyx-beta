# Torvionyx — Session Handoff
**Date:** Sunday, 6 September 2026

---

## Where things stand right now

Working through three architect-feedback fixes to the pricing and timeline blocks, one commit per step, build-verified between each (build verification done by the user directly in their own terminal — this sandbox has a standing note that `npm run build`/`tsc` here hang intermittently and can falsely report success, so builds are never run from inside a session on this project).

- **Step 1 — collapsible quantity column (pricing block):** shipped, commit `be76fa9`.
- **Step 2 — milestone overlap warning (timeline block):** shipped, commit `4a7242c`.
- **Step 3 — real DD/MM/YYYY dates on the timeline:** in progress.
- **Step 4 — verify + deploy:** not started.

Full spec for all three steps lives in the originating task prompt (three fixes from an architect user: hide the pricing qty column when fees are lump sums, warn on overlapping timeline milestones, derive real dates from a project start date).

---

## Known follow-up — not fixed today, don't forget it

**Regenerating a single timeline block via AI drops any hand-set `startWeek`/`endWeek`.**

Step 2 added optional `startWeek`/`endWeek` fields to each timeline milestone (weeks from project start), used for overlap detection and, once Step 3 lands, for deriving real dates. The AI's tool schema (`proposalTool` in `src/lib/prompt.ts`) doesn't include these fields — it never has for the free-text `when` field's structure either. When a user hits "rewrite this block" on a timeline block (`src/app/api/proposals/[id]/rewrite/route.ts`), the AI returns a brand-new milestones array authored from scratch, and any `startWeek`/`endWeek` the user had set are gone.

This is **the same existing behavior** that already drops a user's hand-edited milestone label text on that path — it's not a new regression, and the user has explicitly said to leave it as-is for this ship. But unlike a label, `startWeek`/`endWeek` now feed overlap warnings and (from Step 3) visible dates, so silently losing them is more consequential than losing prose. Worth fixing properly at some point — likely by having the rewrite route carry forward `startWeek`/`endWeek` by matching milestone label text between old and new arrays where they line up, similar to how `vatEnabled`/`vatRate`/`showQuantity` are carried forward verbatim for pricing-block rewrites (those are block-level scalars, so carrying them forward is unambiguous; per-milestone fields on a re-authored array are not).

Not blocking, not touched this session past this note.

---

## Next up
Finish Step 3, then Step 4 (push all three commits, `vercel --prod`, exercise all three changes on one real proposal via the public link + PDF, report back).
