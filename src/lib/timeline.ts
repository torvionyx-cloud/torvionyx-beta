/**
 * lib/timeline.ts
 *
 * Pure date-arithmetic for deriving milestone dates from a timeline block's
 * optional startDate plus a milestone's optional startWeek/endWeek. Never
 * stores anything — called at render time by both the editor and the public
 * renderer (which is also the PDF, since PDF export is just window.print()
 * on the public page), so changing the start date reflows every date.
 *
 * date-fns isn't a dependency of this project, and the one operation this
 * needs — add N whole days, format as UK DD/MM/YYYY — is done entirely in
 * UTC calendar fields via the native Date object, which the platform's
 * calendar math handles correctly across month/year boundaries. That sidesteps
 * local-timezone drift between server render (public link) and browser
 * render (editor) without adding a dependency for a single small calculation.
 */

interface IsoDateParts {
  y: number;
  m: number; // 1-12
  d: number;
}

function parseIsoDate(iso: string): IsoDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/**
 * Adds `weeks` (fractional values round to the nearest whole day) to an ISO
 * "YYYY-MM-DD" date and formats the result as UK DD/MM/YYYY. Returns null if
 * startDate is missing/malformed or weeks isn't a finite number.
 */
function addWeeksUk(startDate: string, weeks: number): string | null {
  if (!Number.isFinite(weeks)) return null;
  const parsed = parseIsoDate(startDate);
  if (!parsed) return null;

  const days = Math.round(weeks * 7);
  const resultMs = Date.UTC(parsed.y, parsed.m - 1, parsed.d) + days * 86_400_000;
  const result = new Date(resultMs);

  const dd = String(result.getUTCDate()).padStart(2, "0");
  const mm = String(result.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = result.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Derives the display date(s) for one milestone. Returns:
 * - null if startDate is unset/malformed, or the milestone has neither
 *   startWeek nor endWeek (nothing to derive from — every milestone saved
 *   before those fields existed falls here).
 * - a single "DD/MM/YYYY" if only one of startWeek/endWeek is set, or both
 *   resolve to the same day.
 * - a "DD/MM/YYYY – DD/MM/YYYY" range if both are set and differ.
 */
export function formatMilestoneDateRange(
  startDate: string | undefined,
  milestone: { startWeek?: number; endWeek?: number }
): string | null {
  if (!startDate) return null;

  const hasStart = typeof milestone.startWeek === "number";
  const hasEnd = typeof milestone.endWeek === "number";
  if (!hasStart && !hasEnd) return null;

  const startLabel = hasStart ? addWeeksUk(startDate, milestone.startWeek as number) : null;
  const endLabel = hasEnd ? addWeeksUk(startDate, milestone.endWeek as number) : null;

  if (startLabel && endLabel) {
    return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
  }
  return startLabel ?? endLabel ?? null;
}
