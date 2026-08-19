// @ts-nocheck

"use client";

import { useCallback, useMemo, useState } from "react";
import type { FeeResourcingTemplateRow, RateCard } from "@/types/database";
import { getCurrentRate } from "@/lib/rateCard";

interface Props {
  lines: FeeResourcingTemplateRow[];
  rates: RateCard[];
  riba_stage: number;
  project_type: string;
  onSaved: (row: FeeResourcingTemplateRow) => void;
  onDeleted: (riba_stage: number, project_type: string, grade: string) => void;
}

const CUSTOM_OPTION = "__custom__";

export function FeeTemplateCell({ lines, rates, riba_stage, project_type, onSaved, onDeleted }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  // "" until a real grade is picked — distinct from CUSTOM_OPTION (the
  // dropdown's own "type a new grade" option), so an untouched <select>
  // never silently submits as a valid line.
  const [gradeChoice, setGradeChoice] = useState("");
  const [customGrade, setCustomGrade] = useState("");
  const [hoursDraft, setHoursDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingGrade, setDeletingGrade] = useState<string | null>(null);

  // Distinct grades already on this workspace's rate card — the dropdown's
  // primary options. Sourced from the `rates` prop KnowledgeTabs already
  // holds, no separate fetch.
  const knownGrades = useMemo(
    () => Array.from(new Set(rates.map(r => r.grade))).sort((a, b) => a.localeCompare(b)),
    [rates]
  );

  const isCustom = gradeChoice === CUSTOM_OPTION;
  const effectiveGrade = (isCustom ? customGrade : gradeChoice).trim();

  // Free-text path warning: a newly-typed grade has no rate_card row to
  // resolve against until the founder also adds it there — this is the
  // "don't let that be a silent trap" case. Only suppressed if what they
  // typed happens to already match an existing grade exactly (rate lookup
  // is an exact grade match), in which case it resolves immediately and
  // the warning would just be noise.
  const customGradeUnresolved = isCustom && effectiveGrade !== "" && !knownGrades.includes(effectiveGrade);

  // Per-line subtotals, and the cell total from whichever lines resolve to
  // a current rate. "Current" = getCurrentRate's latest-effective_from-not-
  // in-the-future rule (lib/rateCard.ts) — never just "any row for that
  // grade".
  const resolvedLines = useMemo(() => {
    return lines.map(line => {
      const rate = getCurrentRate(line.grade, rates);
      return {
        line,
        rate,
        subtotal: rate ? rate.hourly_rate * line.hours : null,
      };
    });
  }, [lines, rates]);

  const cellTotal = resolvedLines.reduce((sum, l) => sum + (l.subtotal ?? 0), 0);
  const unresolvedCount = resolvedLines.filter(l => l.subtotal === null).length;

  const startAdd = useCallback(() => {
    setIsAdding(true);
    setGradeChoice(knownGrades.length > 0 ? "" : CUSTOM_OPTION);
    setCustomGrade("");
    setHoursDraft("");
    setError(null);
  }, [knownGrades]);

  const cancelAdd = useCallback(() => {
    setIsAdding(false);
    setError(null);
  }, []);

  const commitAdd = useCallback(async () => {
    const grade = effectiveGrade;
    const hours = parseFloat(hoursDraft);

    if (!grade) { setError("Choose or enter a grade"); return; }
    if (isNaN(hours) || hours < 0) { setError("Enter a valid number of hours"); return; }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/fee-resourcing-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riba_stage, project_type, grade, hours }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save line");
        setSaving(false);
        return;
      }
      onSaved(data.line);
      setIsAdding(false);
    } catch {
      setError("Connection error — please try again");
    } finally {
      setSaving(false);
    }
  }, [effectiveGrade, hoursDraft, riba_stage, project_type, onSaved]);

  const handleDelete = useCallback(async (grade: string) => {
    setDeletingGrade(grade);
    setError(null);
    try {
      const res = await fetch(
        `/api/fee-resourcing-templates?riba_stage=${riba_stage}&project_type=${encodeURIComponent(project_type)}&grade=${encodeURIComponent(grade)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to remove line");
        return;
      }
      onDeleted(riba_stage, project_type, grade);
    } catch {
      setError("Connection error — please try again");
    } finally {
      setDeletingGrade(null);
    }
  }, [riba_stage, project_type, onDeleted]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); commitAdd(); }
    if (e.key === "Escape") { e.preventDefault(); cancelAdd(); }
  }, [commitAdd, cancelAdd]);

  return (
    <div style={cellContainerStyle}>
      <div style={cellLabelStyle}>{project_type}</div>

      {lines.length > 0 && (
        <div style={lineListStyle}>
          {resolvedLines.map(({ line, subtotal }) => (
            <div key={line.grade} style={lineRowStyle}>
              <div style={lineTextStyle}>
                <span style={lineGradeStyle}>{line.grade}</span>
                <span style={lineHoursStyle}>{line.hours}h</span>
              </div>
              {subtotal !== null ? (
                <span style={lineSubtotalStyle}>£{subtotal.toFixed(2)}</span>
              ) : (
                <span style={lineNoRateStyle} title="No current rate on file for this grade">no rate on file</span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(line.grade)}
                disabled={deletingGrade === line.grade}
                aria-label={`Remove ${line.grade} line`}
                title="Remove"
                style={removeButtonStyle}
              >
                {xIcon}
              </button>
            </div>
          ))}
        </div>
      )}

      {lines.length > 0 && (
        <div style={totalRowStyle}>
          <span>Subtotal</span>
          <span style={totalValueStyle}>
            £{cellTotal.toFixed(2)}
            {unresolvedCount > 0 && (
              <span style={totalCaveatStyle}>
                {" "}({unresolvedCount} line{unresolvedCount > 1 ? "s" : ""} not counted)
              </span>
            )}
          </span>
        </div>
      )}

      {isAdding ? (
        <div style={addFormStyle} onKeyDown={handleKeyDown}>
          {knownGrades.length > 0 && !isCustom && (
            <select
              autoFocus
              value={gradeChoice}
              onChange={e => setGradeChoice(e.target.value)}
              style={selectStyle}
            >
              <option value="" disabled>Select a grade…</option>
              {knownGrades.map(g => <option key={g} value={g}>{g}</option>)}
              <option value={CUSTOM_OPTION}>Other (type a new grade)…</option>
            </select>
          )}

          {(isCustom || knownGrades.length === 0) && (
            <>
              <input
                autoFocus={knownGrades.length === 0}
                type="text"
                maxLength={100}
                placeholder="Grade name"
                value={customGrade}
                onChange={e => setCustomGrade(e.target.value)}
                style={inputStyle}
              />
              {knownGrades.length > 0 && (
                <button type="button" onClick={() => setGradeChoice("")} style={backToListLinkStyle}>
                  ← choose from Rate Card instead
                </button>
              )}
              {customGradeUnresolved && (
                <span style={warningStyle}>
                  ⚠ "{effectiveGrade}" isn't in your Rate Card yet — this line won't show a
                  subtotal until you add that grade there too.
                </span>
              )}
            </>
          )}

          <input
            type="number"
            min={0}
            step="0.5"
            placeholder="Hours"
            value={hoursDraft}
            onChange={e => setHoursDraft(e.target.value)}
            style={inputStyle}
          />

          {error && <span style={errorStyle}>{error}</span>}

          <div style={addFormActionsStyle}>
            <button type="button" onClick={commitAdd} disabled={saving} style={saveLineButtonStyle}>
              {saving ? "Saving…" : "Add line"}
            </button>
            <button type="button" onClick={cancelAdd} disabled={saving} style={cancelLineButtonStyle}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startAdd} style={addLineButtonStyle}>
          + Add resourcing line
        </button>
      )}
    </div>
  );
}

const xIcon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const cellContainerStyle = {
  display: "flex", flexDirection: "column", gap: 8,
  minWidth: 0,
} as const;

const cellLabelStyle = {
  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 12.5,
  color: "var(--tv-text-dim)",
} as const;

const lineListStyle = {
  display: "flex", flexDirection: "column", gap: 6,
} as const;

const lineRowStyle = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "7px 9px",
  background: "var(--tv-panel-accent)",
  border: "1px solid var(--tv-border)",
  borderRadius: 8,
} as const;

const lineTextStyle = {
  display: "flex", flexDirection: "column", flex: 1, minWidth: 0,
} as const;

const lineGradeStyle = {
  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 13,
  color: "var(--tv-text)",
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
} as const;

const lineHoursStyle = {
  fontFamily: "monospace", fontSize: 11.5, color: "var(--tv-text-faint)",
} as const;

const lineSubtotalStyle = {
  flexShrink: 0,
  fontFamily: "monospace", fontSize: 13, color: "var(--tv-text)",
} as const;

const lineNoRateStyle = {
  flexShrink: 0,
  fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 600,
  color: "#E0A94C",
} as const;

const removeButtonStyle = {
  display: "grid", placeItems: "center", flexShrink: 0,
  width: 20, height: 20, borderRadius: 6,
  border: "1px solid var(--tv-border)", background: "transparent",
  color: "var(--tv-text-faint)", cursor: "pointer",
} as const;

const totalRowStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "baseline",
  padding: "2px 2px 0",
  fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600,
  color: "var(--tv-text-dim)",
} as const;

const totalValueStyle = {
  fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "var(--tv-text)",
} as const;

const totalCaveatStyle = {
  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 10.5,
  color: "#E0A94C",
} as const;

const addLineButtonStyle = {
  textAlign: "left", cursor: "pointer",
  padding: "9px 12px",
  fontFamily: "Inter, sans-serif", fontSize: 12.5,
  color: "var(--tv-text-faint)",
  background: "transparent",
  border: "1px dashed var(--tv-border)",
  borderRadius: 10,
} as const;

const addFormStyle = {
  display: "flex", flexDirection: "column", gap: 8,
  padding: "10px 12px",
  background: "var(--tv-panel-accent)",
  border: "1.5px solid var(--tv-gold)",
  borderRadius: 10,
} as const;

const inputStyle = {
  width: "100%", padding: "7px 10px",
  fontFamily: "Inter, sans-serif", fontSize: 13,
  borderRadius: 8, border: "1px solid var(--tv-border)",
  background: "var(--tv-bg-panel)", color: "var(--tv-text)",
  outline: "none",
} as const;

const selectStyle = {
  ...inputStyle,
} as const;

const backToListLinkStyle = {
  alignSelf: "flex-start",
  background: "none", border: "none", padding: 0, cursor: "pointer",
  fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "var(--tv-text-faint)",
  textDecoration: "underline",
} as const;

const warningStyle = {
  fontSize: 11.5, lineHeight: 1.4, color: "#E0A94C",
} as const;

const errorStyle = {
  fontSize: 12, color: "#F2635C",
} as const;

const addFormActionsStyle = {
  display: "flex", gap: 8,
} as const;

const saveLineButtonStyle = {
  padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12.5,
  background: "linear-gradient(135deg, var(--tv-gold-bright), var(--tv-gold))",
  color: "#0A1322",
} as const;

const cancelLineButtonStyle = {
  padding: "7px 14px", borderRadius: 8,
  border: "1px solid var(--tv-border)", cursor: "pointer",
  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 12.5,
  background: "transparent", color: "var(--tv-text-faint)",
} as const;
