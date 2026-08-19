// @ts-nocheck

/**
 * lib/rateCard.ts
 *
 * Shared "current rate" lookup for rate_card. A grade can have multiple
 * rows with different effective_from dates (rates change over time), so
 * "the rate for Director" is never a plain lookup by grade alone — it's
 * the row with the latest effective_from that isn't in the future.
 *
 * Single source of truth for that rule so it isn't reimplemented wherever
 * a £ figure needs to come out of an hours value — currently the Fee
 * Templates cell subtotal (FeeTemplateCell.tsx), and later the proposal
 * editor's fee engine (Phase 2+), which will need the exact same "current
 * as of when" semantics.
 */

import type { RateCard } from "@/types/database";

/**
 * Returns the RateCard row that was in effect for `grade` as of `asOf`
 * (defaults to today), or null if no row for that grade has an
 * effective_from on or before that date.
 *
 * Comparison is done on the YYYY-MM-DD string form (effective_from is
 * already stored that way, and lexicographic order matches date order for
 * that format) — avoids re-parsing every row into a Date just to compare.
 */
export function getCurrentRate(
  grade: string,
  rates: RateCard[],
  asOf: Date = new Date()
): RateCard | null {
  const asOfIso = asOf.toISOString().slice(0, 10);

  let current: RateCard | null = null;
  for (const rate of rates) {
    if (rate.grade !== grade) continue;
    if (rate.effective_from > asOfIso) continue; // not yet in effect
    if (!current || rate.effective_from > current.effective_from) {
      current = rate;
    }
  }
  return current;
}
