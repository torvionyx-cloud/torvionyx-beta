// @ts-nocheck

"use client";

/**
 * components/proposals/ProposalScorePanel.tsx
 *
 * The drafting coach panel. Sits at the top of the proposal editor sidebar.
 * Calls POST /api/proposals/[id]/score and renders an honest strength score
 * with a per-dimension breakdown.
 *
 * Design (grounded in the Hooked framework):
 * - Endowed progress: a real draft opens part-way up the scale, never 0.
 * - Variable reward: the score + per-dimension status give a clear,
 *   improvable target ("strong proposals score 85+").
 * - The score is CALIBRATED and HONEST — it is not flattery.
 *
 * The "Rewrite" buttons are wired to an optional onRewrite(blockIndex)
 * prop but stay hidden until that prop is provided (i.e. once the rewrite
 * endpoint is built). Until then the panel is purely diagnostic.
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
}

const STRONG_TARGET = 85;

const STATUS_STYLES: Record<DimensionStatus, { dot: string; text: string; label: string }> = {
  strong: { dot: "bg-green-500", text: "text-green-600", label: "Strong" },
  okay: { dot: "bg-amber-500", text: "text-amber-600", label: "Okay" },
  weak: { dot: "bg-red-500", text: "text-red-600", label: "Needs work" },
};

function scoreColor(score: number): string {
  if (score >= 80) return "#16a34a"; // green-600
  if (score >= 60) return "#d97706"; // amber-600
  return "#dc2626"; // red-600
}

export function ProposalScorePanel({ proposalId, onRewrite, rewritingBlock }: Props) {
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

  const cardClass =
    "rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-4";

  // ---- Initial state: no score yet --------------------------------------
  if (!hasScored && !score) {
    return (
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-[#F3F4F6]">
            Proposal strength
          </h3>
        </div>
        <p className="text-xs text-neutral-500 dark:text-gray-400 leading-relaxed mb-3">
          Get an honest score across the things that win work — and specific
          fixes to make this proposal stronger before you send it.
        </p>
        <button
          onClick={runScore}
          disabled={isScoring}
          className="w-full rounded-lg bg-neutral-900 dark:bg-[#0891B2] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition"
        >
          {isScoring ? "Scoring…" : "Score this proposal"}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // ---- Scored state ------------------------------------------------------
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-[#F3F4F6]">
          Proposal strength
        </h3>
        <button
          onClick={runScore}
          disabled={isScoring}
          title="Re-score after making edits"
          className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-gray-200 disabled:opacity-50 transition"
        >
          {isScoring ? "Scoring…" : "↺ Re-score"}
        </button>
      </div>

      {score && (
        <>
          {/* Overall score + bar */}
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="text-3xl font-bold leading-none"
              style={{ color: scoreColor(score.overall_score) }}
            >
              {score.overall_score}
            </span>
            <span className="text-xs text-neutral-400 dark:text-gray-500">
              / 100 · strong proposals score {STRONG_TARGET}+
            </span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100 dark:bg-[#111827] overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${score.overall_score}%`,
                backgroundColor: scoreColor(score.overall_score),
              }}
            />
          </div>

          {/* Headline */}
          <p className="text-xs text-neutral-600 dark:text-gray-300 leading-relaxed mb-4">
            {score.headline}
          </p>

          {/* Dimensions */}
          <ul className="space-y-2.5">
            {score.dimensions.map((dim) => {
              const styles = STATUS_STYLES[dim.status];
              const canRewrite =
                !!onRewrite && dim.status !== "strong" && dim.block_index !== null;
              const isRewriting = rewritingBlock === dim.block_index;
              return (
                <li key={dim.key}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${styles.dot}`} />
                    <span className="flex-1 text-xs text-neutral-700 dark:text-gray-200">
                      {dim.label}
                    </span>
                    <span className={`text-xs font-medium shrink-0 ${styles.text}`}>
                      {styles.label}
                    </span>
                  </div>
                  {dim.status !== "strong" && dim.coaching_note && (
                    <div className="ml-4 mt-1">
                      <p className="text-xs text-neutral-500 dark:text-gray-400 leading-relaxed">
                        {dim.coaching_note}
                      </p>
                      {canRewrite && (
                        <button
                          onClick={() => onRewrite!(dim.block_index!, dim.coaching_note ?? null)}
                          disabled={isRewriting}
                          className="mt-1 text-xs font-medium text-neutral-700 dark:text-[#0891B2] hover:underline disabled:opacity-50"
                        >
                          {isRewriting ? "Rewriting…" : "Rewrite this section ↗"}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}