// @ts-nocheck

"use client";

/**
 * components/proposals/ProposalScorePanel.tsx
 *
 * The drafting coach panel. Restyled (editor redesign) as a full-width
 * card at the top of the editor instead of a sidebar card — same data,
 * same API call, same rewrite wiring. Calls POST /api/proposals/[id]/score.
 *
 * Design (grounded in the Hooked framework):
 * - Endowed progress: a real draft opens part-way up the scale, never 0.
 * - Variable reward: the score + per-dimension status give a clear,
 *   improvable target ("strong proposals score 85+").
 * - The score is CALIBRATED and HONEST — it is not flattery.
 *
 * Per-dimension progress bars use dim.score (already returned by the API,
 * previously unused — only dim.status drove the old dot/label). No
 * fabricated "scored at" timestamp or edit-freshness tracking is shown;
 * the API doesn't return either, so none is invented here.
 */

import { useState, useCallback } from "react";

type DimensionStatus = "strong" | "okay" | "weak";

interface DimensionScore {
  key: string;
  label: string;
  score: number;
  status: DimensionStatus;
  block_index: number | null;
  coaching_note: string | null;
}

interface ProposalScore {
  overall_score: number;
  headline: string;
  dimensions: DimensionScore[];
}

interface Props {
  proposalId: string;
  /**
   * Optional. When provided, weak/okay dimensions that point at a block
   * show a "Rewrite" button that calls this with the target block index.
   * Leave undefined until the rewrite endpoint exists.
   */
  onRewrite?: (blockIndex: number, coachingNote: string | null) => void;
  /** Whether a rewrite is currently in flight for a given block. */
  rewritingBlock?: number | null;
  /** Called when the person clicks "Turn off scoring". Parent hides this panel. */
  onHide?: () => void;
}

const STRONG_TARGET = 85;

function scoreColor(score: number): string {
  if (score >= 80) return "var(--tv-success)";
  if (score >= 60) return "var(--tv-warning)";
  return "#F2635C";
}

export function ProposalScorePanel({ proposalId, onRewrite, rewritingBlock, onHide }: Props) {
  const [score, setScore] = useState<ProposalScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasScored, setHasScored] = useState(false);

  const runScore = useCallback(async () => {
    setIsScoring(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/score`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't score this proposal.");
      } else {
        setScore(data.score as ProposalScore);
        setHasScored(true);
      }
    } catch {
      setError("Couldn't score this proposal — check your connection.");
    } finally {
      setIsScoring(false);
    }
  }, [proposalId]);

  const cardStyle: React.CSSProperties = {
    border: "1px solid var(--tv-border)",
    borderRadius: 16,
    background: "var(--tv-bg-panel)",
    boxShadow: "var(--tv-shadow)",
    padding: "18px 20px",
    marginBottom: 4,
  };

  const eyebrow: React.CSSProperties = {
    fontFamily: "monospace",
    fontSize: 9.5,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: "var(--tv-text-faint)",
  };

  // ---- Initial state: no score yet --------------------------------------
  if (!hasScored && !score) {
    return (
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={eyebrow}>Proposal strength</div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--tv-text-dim)", maxWidth: "60ch", lineHeight: 1.5 }}>
              Get an honest score across the things that win work — and specific fixes to make this proposal
              stronger before you send it.
            </p>
          </div>
          <button
            onClick={runScore}
            disabled={isScoring}
            style={{
              flexShrink: 0,
              borderRadius: 10,
              padding: "11px 20px",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 13.5,
              border: "none",
              cursor: isScoring ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg,#F2C84E,#DCAA33)",
              color: "#0A1322",
              opacity: isScoring ? 0.6 : 1,
            }}
          >
            {isScoring ? "Scoring…" : "Score this proposal"}
          </button>
        </div>
        {error && <p style={{ marginTop: 10, fontSize: 12.5, color: "#F2635C" }}>{error}</p>}
      </div>
    );
  }

  // ---- Scored state ------------------------------------------------------
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 38, fontWeight: 600, letterSpacing: "-.02em", color: "var(--tv-text)", lineHeight: 1 }}>
            {score?.overall_score}%
          </div>
          <div>
            <div style={eyebrow}>Proposal strength</div>
            <div style={{ fontSize: 12.5, color: "var(--tv-text-dim)", marginTop: 3 }}>
              {score?.headline} · strong proposals score {STRONG_TARGET}+
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <button
            onClick={runScore}
            disabled={isScoring}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
              borderRadius: 10,
              border: "1.5px solid var(--tv-border)",
              background: "var(--tv-panel-accent)",
              color: "var(--tv-text)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: isScoring ? "not-allowed" : "pointer",
              opacity: isScoring ? 0.6 : 1,
            }}
          >
            {isScoring ? "Scoring…" : "↺ Rescore changes"}
          </button>
          {onHide && (
            <button
              onClick={onHide}
              style={{ padding: "9px 12px", borderRadius: 10, color: "var(--tv-text-faint)", fontSize: 12.5, cursor: "pointer", background: "none", border: "none" }}
            >
              Turn off scoring
            </button>
          )}
        </div>
      </div>

      {score && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "14px 18px",
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid var(--tv-border-soft)",
          }}
        >
          {score.dimensions.map((dim) => {
            const canRewrite = !!onRewrite && dim.status !== "strong" && dim.block_index !== null;
            const isRewriting = rewritingBlock === dim.block_index;
            const color = scoreColor(dim.score);
            return (
              <div key={dim.key} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--tv-text-faint)" }}>
                    {dim.label}
                  </span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color }}>
                    {dim.score}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "var(--tv-panel-accent)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${dim.score}%`, background: color, borderRadius: 999, transition: "width .4s" }} />
                </div>
                {dim.coaching_note && (
                  <p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, color: "var(--tv-text-faint)" }}>
                    {dim.coaching_note}
                  </p>
                )}
                {canRewrite && (
                  <button
                    onClick={() => onRewrite!(dim.block_index!, dim.coaching_note ?? null)}
                    disabled={isRewriting}
                    style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontSize: 11, fontWeight: 600, color: "var(--tv-gold)", cursor: isRewriting ? "not-allowed" : "pointer" }}
                  >
                    {isRewriting ? "Rewriting…" : "Rewrite this section ↗"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p style={{ marginTop: 12, fontSize: 12.5, color: "#F2635C" }}>{error}</p>}
    </div>
  );
}
