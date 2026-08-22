// @ts-nocheck

"use client";

/**
 * components/proposals/ProposalEditorClient.tsx
 *
 * Client-side proposal editor. Receives the proposal from the server component
 * and manages edit state, autosave, sharing, and regeneration.
 *
 * Editor redesign: navy/gold design system, collapsible block rows, scoring
 * moved from sidebar to a full-width top card, project-type/stage picker
 * moved from sidebar to a compact bar above the block list, up/down
 * reordering added. All existing handlers (save, share, regenerate, rewrite,
 * add-stage, VAT) are unchanged — this is a layout/visual rebuild, not a
 * logic rebuild. "Delete" is shown but disabled: no delete API route exists
 * yet and cascading deletion (ai_generations, etc.) isn't built, so it's not
 * wired to a real destructive call against live data.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Proposal, ProposalContent, ProposalBlock, BrandSettings, ScopeLibraryRow, FeeResourcingTemplateRow, RateCard, TextBlock, PricingBlock, PricingLineItem } from "@/types/database";
import { RIBA_STAGES } from "@/lib/riba";
import { resolveStage } from "@/lib/stageResolver";
import { PROJECT_TYPES, PROPOSAL_TYPE_LABELS } from "@/lib/validation";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";
import { ProposalScorePanel } from "@/components/proposals/ProposalScorePanel";

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: "DRAFT", bg: "var(--tv-panel-accent)", color: "var(--tv-text-dim)" },
  shared: { label: "SHARED", bg: "rgba(61,185,201,.15)", color: "#3DB9C9" },
  viewed: { label: "VIEWED", bg: "rgba(220,170,51,.15)", color: "var(--tv-gold)" },
  accepted: { label: "ACCEPTED", bg: "rgba(95,208,138,.15)", color: "var(--tv-success)" },
  declined: { label: "DECLINED", bg: "rgba(242,99,92,.15)", color: "#F2635C" },
  expired: { label: "EXPIRED", bg: "var(--tv-panel-accent)", color: "var(--tv-text-faint)" },
};

const CURRENCY_SYMBOLS: Record<string, string> = { GBP: "£", USD: "$", EUR: "€" };

const TYPE_META: Record<string, { label: string; gold: boolean; icon: React.ReactNode }> = {
  hero: {
    label: "Hero",
    gold: true,
    icon: <path d="M4 22V4a1 1 0 0 1 1-1h13l-3 5 3 5H5" />,
  },
  text: {
    label: "Text section",
    gold: false,
    icon: <path d="M4 6h16M4 12h16M4 18h10" />,
  },
  bullets: {
    label: "Bullet list",
    gold: false,
    icon: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  },
  scope_table: {
    label: "Scope of work",
    gold: false,
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 10v10" />
      </>
    ),
  },
  timeline: {
    label: "Timeline",
    gold: false,
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M3 12h6M15 12h6" />
      </>
    ),
  },
  pricing: {
    label: "Fees",
    gold: true,
    icon: <path d="M16 5H11a3.5 3.5 0 0 0-3.5 3.5V19h9M7 13h7" />,
  },
  terms: {
    label: "Terms",
    gold: false,
    icon: <path d="M12 3l8 3v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V6z" />,
  },
  cta: {
    label: "Call to action",
    gold: true,
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12h6M13 9l3 3-3 3" />
      </>
    ),
  },
  divider: {
    label: "Divider",
    gold: false,
    icon: <path d="M4 12h16" />,
  },
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function pricingMeta(block: Extract<ProposalBlock, { type: "pricing" }>): string {
  const sym = CURRENCY_SYMBOLS[block.currency] ?? block.currency;
  const subtotal = block.lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vatEnabled = !!block.vatEnabled;
  const vatRate = typeof block.vatRate === "number" ? block.vatRate : 20;
  const total = vatEnabled ? subtotal * (1 + vatRate / 100) : subtotal;
  return `${sym}${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function blockMeta(block: ProposalBlock): string {
  switch (block.type) {
    case "hero":
      return "Title + subtitle";
    case "text":
    case "terms":
      return `${wordCount(block.body || "")} words`;
    case "bullets":
      return `${block.items.length} items`;
    case "scope_table": {
      const weeksKnown = block.rows.filter((r) => typeof r.weeks === "number");
      const totalWeeks = weeksKnown.reduce((s, r) => s + (r.weeks ?? 0), 0);
      return weeksKnown.length > 0
        ? `${block.rows.length} rows · ${totalWeeks} weeks`
        : `${block.rows.length} rows`;
    }
    case "timeline":
      return `${block.milestones.length} milestones`;
    case "pricing":
      return pricingMeta(block);
    case "cta":
      return "Closing button";
    default:
      return "";
  }
}

interface Props {
  proposal: Proposal;
  brand: BrandSettings | null;
  scopeLibrary: ScopeLibraryRow[];
  feeTemplates: FeeResourcingTemplateRow[];
  rates: RateCard[];
}

export function ProposalEditorClient({ proposal, brand, scopeLibrary, feeTemplates, rates }: Props) {
  const router = useRouter();
  const [content, setContent] = useState<ProposalContent>(proposal.content);
  const [title, setTitle] = useState(proposal.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rewritingBlock, setRewritingBlock] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [status, setStatus] = useState(proposal.status);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedStage, setSelectedStage] = useState("");
  const [stageAddWarning, setStageAddWarning] = useState<string | null>(null);
  const [projectType, setProjectType] = useState(proposal.project_type ?? "");
  const [scoringEnabled, setScoringEnabled] = useState(true);

  // Which blocks are expanded. Keyed by array index — kept in sync with
  // content.blocks on reorder/remove so open state travels with the
  // content rather than the position. Pricing blocks default open.
  const [openBlocks, setOpenBlocks] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    proposal.content.blocks.forEach((b, i) => {
      if (b.type === "pricing") initial[i] = true;
    });
    return initial;
  });

  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Autosave: debounce 2s after last change
  useEffect(() => {
    if (!isDirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSave();
    }, 2000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, title, isDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  const markDirty = useCallback(() => setIsDirty(true), []);

  const toggleBlock = useCallback((idx: number) => {
    setOpenBlocks((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const jumpToBlock = useCallback((idx: number) => {
    setOpenBlocks((prev) => ({ ...prev, [idx]: true }));
    requestAnimationFrame(() => {
      sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleSetProjectType = useCallback((value: string) => {
    setProjectType(value);
    markDirty();
  }, [markDirty]);

  const handleAddStage = useCallback((ribaStage: number) => {
    const resolved = resolveStage(ribaStage, projectType, scopeLibrary, feeTemplates, rates);

    setContent((prev) => {
      const blocks = [...prev.blocks];

      const scopeBlock: TextBlock = {
        type: "text",
        heading: resolved.stageName,
        body: resolved.scopeText,
      };

      const pricingIdx = blocks.findIndex((b) => b.type === "pricing");

      if (resolved.lineItems.length > 0) {
        if (pricingIdx === -1) {
          const newPricingBlock: PricingBlock = {
            type: "pricing",
            currency: "GBP",
            lineItems: resolved.lineItems,
            showTotals: true,
          };
          blocks.push(scopeBlock, newPricingBlock);
        } else {
          blocks.splice(pricingIdx, 0, scopeBlock);
          const existingPricing = blocks[pricingIdx + 1] as PricingBlock;
          blocks[pricingIdx + 1] = {
            ...existingPricing,
            lineItems: [...existingPricing.lineItems, ...resolved.lineItems],
          };
        }
      } else {
        blocks.push(scopeBlock);
      }

      return {
        ...prev,
        blocks,
        stagesAdded: [...(prev.stagesAdded ?? []), ribaStage],
      };
    });

    markDirty();

    setStageAddWarning(
      !resolved.hasFeeTemplate
        ? `Added ${resolved.stageName}, but no fee resourcing template exists yet for this stage and project type — only scope was added. Add hours in Fee Templates, then add fee lines here manually.`
        : resolved.skippedGrades.length > 0
        ? `Added ${resolved.stageName}, but no current rate on file for: ${resolved.skippedGrades.join(", ")}. Add these to your Rate Card, then edit the fee lines manually.`
        : null
    );
  }, [projectType, scopeLibrary, feeTemplates, rates, markDirty]);

  const updateBlock = useCallback(
    (idx: number, updates: Record<string, unknown>) => {
      setContent((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b, i) =>
          i === idx ? ({ ...b, ...updates } as ProposalBlock) : b
        ),
      }));
      markDirty();
    },
    [markDirty]
  );

  const removeBlock = useCallback((idx: number) => {
    setContent((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== idx),
    }));
    setOpenBlocks((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        if (i < idx) next[i] = v;
        else if (i > idx) next[i - 1] = v;
      });
      return next;
    });
    markDirty();
  }, [markDirty]);

  const moveBlock = useCallback((idx: number, direction: -1 | 1) => {
    setContent((prev) => {
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.blocks.length) return prev;
      const blocks = [...prev.blocks];
      [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
      return { ...prev, blocks };
    });
    setOpenBlocks((prev) => {
      const next = { ...prev };
      const a = prev[idx];
      const b = prev[idx + direction];
      next[idx] = b;
      next[idx + direction] = a;
      return next;
    });
    markDirty();
  }, [markDirty]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || proposal.title,
          content,
          project_type: projectType || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Save failed");
      } else {
        setIsDirty(false);
      }
    } catch {
      setSaveError("Save failed — check your connection");
    } finally {
      setIsSaving(false);
    }
  }, [proposal.id, title, content, projectType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = useCallback(async () => {
    if (isDirty) await handleSave();
    setIsSharing(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setShareUrl(data.share_url);
        setStatus("shared");
        await navigator.clipboard.writeText(data.share_url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      }
    } catch {
      // Share failed
    } finally {
      setIsSharing(false);
    }
  }, [proposal.id, isDirty, handleSave]);

  const handleCopyLink = useCallback(async () => {
    const url = shareUrl ?? `${window.location.origin}/p/${proposal.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  }, [shareUrl, proposal.share_token]);

  const handleRegenerate = useCallback(async () => {
    if (!confirm("Regenerate the entire proposal? Your current edits will be replaced.")) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone_preference: "balanced" }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setContent(data.content as ProposalContent);
        setIsDirty(false);
        router.refresh();
      }
    } catch {
      // Regenerate failed
    } finally {
      setIsRegenerating(false);
    }
  }, [proposal.id, router]);

  const handleRewrite = useCallback(async (blockIndex: number, coachingNote: string | null) => {
    setRewritingBlock(blockIndex);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block_index: blockIndex, coaching_note: coachingNote }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setContent(data.content as ProposalContent);
        setIsDirty(false);
      }
    } catch {
      // rewrite failed silently — proposal unchanged
    } finally {
      setRewritingBlock(null);
    }
  }, [proposal.id]);

  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
  const primaryColor = brand?.primary_color ?? "var(--tv-gold)";
  const shareLink = shareUrl ?? `torvionyx.com/p/${proposal.share_token}`;

  const btnGhost: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 11px",
    borderRadius: 10,
    color: "var(--tv-text-dim)",
    fontSize: 12.5,
    whiteSpace: "nowrap",
    cursor: "pointer",
    background: "none",
    border: "none",
  };

  return (
    <div style={{ margin: "-1.75rem -2rem 0", color: "var(--tv-text)" }}>
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "var(--tv-bg-topbar)",
          borderBottom: "1px solid var(--tv-border-soft)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 32px 14px", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <Link
              href="/dashboard"
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: 10,
                border: "1px solid var(--tv-border)", color: "var(--tv-text-dim)", fontSize: 12.5,
                whiteSpace: "nowrap", textDecoration: "none", flexShrink: 0,
              }}
            >
              ← Proposals
            </Link>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                  maxLength={300}
                  style={{
                    margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 600,
                    letterSpacing: "-.01em", color: "var(--tv-text)", background: "transparent", border: "none",
                    outline: "none", minWidth: 0, maxWidth: 460,
                  }}
                />
                <span style={{
                  flexShrink: 0, fontFamily: "monospace", fontSize: 9.5, letterSpacing: ".1em", fontWeight: 700,
                  padding: "3px 9px", borderRadius: 999, background: badge.bg, color: badge.color,
                }}>
                  {badge.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, fontFamily: "monospace", fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--tv-text-faint)" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--tv-success)", boxShadow: "0 0 0 3px rgba(95,208,138,.16)" }} />
                {isSaving ? "Saving…" : isDirty ? "Unsaved changes" : "All changes saved"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px 8px 13px", borderRadius: 10, border: "1px solid var(--tv-border)", background: "var(--tv-panel-accent)" }}>
              <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--tv-text-dim)" }}>{shareLink}</span>
              <button
                onClick={handleCopyLink}
                style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--tv-gold)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", background: "none", border: "none", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {copySuccess ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={isSharing ? undefined : handleShare}
              disabled={isSharing}
              style={{
                borderRadius: 10, padding: "9px 18px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                fontSize: 13.5, border: "none", cursor: isSharing ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg,#F2C84E,#DCAA33)", color: "#0A1322", opacity: isSharing ? 0.6 : 1,
              }}
            >
              {isSharing ? "Sending…" : "Send to client"}
            </button>
          </div>
        </div>

        {/* Action row */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 16px", display: "flex", alignItems: "center", gap: 4, borderTop: "1px solid var(--tv-border-soft)", paddingTop: 14, flexWrap: "wrap" }}>
          {!scoringEnabled && (
            <button onClick={() => setScoringEnabled(true)} style={{ ...btnGhost, color: "var(--tv-gold)" }}>
              Turn on scoring
            </button>
          )}
          <a href={`/p/${proposal.share_token}`} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, textDecoration: "none" }}>
            Preview live link
          </a>
          <a href={`/p/${proposal.share_token}`} target="_blank" rel="noopener noreferrer" title="Opens the live link — use your browser's Print → Save as PDF" style={{ ...btnGhost, textDecoration: "none" }}>
            Download PDF
          </a>
          <button onClick={handleRegenerate} disabled={isRegenerating} style={{ ...btnGhost, opacity: isRegenerating ? 0.5 : 1 }}>
            {isRegenerating ? "Regenerating…" : "Regenerate all"}
          </button>
          <div style={{ width: 1, height: 20, background: "var(--tv-border-soft)", margin: "0 6px" }} />
          <button
            disabled
            title="Not available yet — deletion isn't fully wired up on the backend"
            style={{ ...btnGhost, color: "var(--tv-text-faint)", cursor: "not-allowed", opacity: 0.5 }}
          >
            Delete
          </button>
        </div>

        {saveError && (
          <div style={{ background: "rgba(242,99,92,.1)", padding: "8px 32px", fontSize: 12, color: "#F2635C", textAlign: "center" }}>{saveError}</div>
        )}
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 80px" }}>
        <main style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>

          {scoringEnabled && (
            <ProposalScorePanel
              proposalId={proposal.id}
              onRewrite={(blockIndex, coachingNote) => handleRewrite(blockIndex, coachingNote ?? null)}
              rewritingBlock={rewritingBlock}
              onHide={() => setScoringEnabled(false)}
            />
          )}

          {proposal.brief && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", border: "1px solid var(--tv-border-soft)", borderRadius: 14, background: "var(--tv-panel-accent)", marginBottom: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--tv-text-faint)", paddingTop: 2, whiteSpace: "nowrap" }}>
                Original brief
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--tv-text-dim)" }}>{proposal.brief}</p>
            </div>
          )}

          {/* Project type & add-stage bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid var(--tv-border-soft)", borderRadius: 14, background: "var(--tv-panel-accent)", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--tv-text-faint)", whiteSpace: "nowrap" }}>
              Project type
            </span>
            <select
              value={projectType}
              onChange={(e) => handleSetProjectType(e.target.value)}
              className="tv-select"
              style={{
                fontSize: 13, borderRadius: 8, border: "1px solid var(--tv-border)", background: "var(--tv-bg-panel)",
                color: "var(--tv-text)", padding: "6px 10px", outline: "none",
              }}
            >
              <option value="">Not set…</option>
              {PROJECT_TYPES.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>

            {projectType !== "" && (
              <>
                <div style={{ width: 1, height: 18, background: "var(--tv-border-soft)" }} />
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="tv-select"
                  style={{
                    fontSize: 13, borderRadius: 8, border: "1px solid var(--tv-border)", background: "var(--tv-bg-panel)",
                    color: "var(--tv-text)", padding: "6px 10px", outline: "none", minWidth: 200,
                  }}
                >
                  <option value="">Select a stage…</option>
                  {RIBA_STAGES.map((s) => {
                    const alreadyAdded = (content.stagesAdded ?? []).includes(s.stage);
                    return (
                      <option key={s.stage} value={s.stage} disabled={alreadyAdded}>
                        Stage {s.stage} — {s.name}{alreadyAdded ? " (added)" : ""}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStage !== "") {
                      handleAddStage(Number(selectedStage));
                      setSelectedStage("");
                    }
                  }}
                  disabled={selectedStage === ""}
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12.5, fontWeight: 600, color: "var(--tv-gold)",
                    background: "none", border: "none", cursor: selectedStage === "" ? "not-allowed" : "pointer",
                    opacity: selectedStage === "" ? 0.4 : 1, padding: "6px 4px",
                  }}
                >
                  + Add stage
                </button>
              </>
            )}
            {stageAddWarning && (
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--tv-warning)", width: "100%" }}>{stageAddWarning}</p>
            )}
          </div>

          {/* Blocks */}
          {content.blocks.map((block, idx) => (
            <BlockRow
              key={idx}
              ref={(el) => { sectionRefs.current[idx] = el; }}
              block={block}
              idx={idx}
              total={content.blocks.length}
              isOpen={!!openBlocks[idx]}
              onToggle={() => toggleBlock(idx)}
              onMove={(dir) => moveBlock(idx, dir)}
              primaryColor={primaryColor}
              brand={brand}
              onUpdate={(updates) => updateBlock(idx, updates)}
              onRemove={() => removeBlock(idx)}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible block row shell
// ---------------------------------------------------------------------------

interface BlockRowProps {
  block: ProposalBlock;
  idx: number;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  primaryColor: string;
  brand: BrandSettings | null;
  onUpdate: (updates: Record<string, unknown>) => void;
  onRemove: () => void;
}

const BlockRow = ({ block, idx, total, isOpen, onToggle, onMove, primaryColor, brand, onUpdate, onRemove, ref }: BlockRowProps & { ref?: (el: HTMLDivElement | null) => void }) => {
  const meta = TYPE_META[block.type] ?? TYPE_META.divider;
  const title = "heading" in block && block.heading ? block.heading : "title" in block && block.title ? block.title : meta.label;
  const isPricing = block.type === "pricing";

  return (
    <div
      ref={ref}
      style={{
        border: isPricing ? "1.5px solid rgba(220,170,51,.3)" : "1px solid var(--tv-border)",
        borderRadius: 16,
        background: "var(--tv-bg-panel)",
        boxShadow: "var(--tv-shadow)",
        overflow: "hidden",
        scrollMarginTop: 190,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "44px 34px minmax(0,1fr) auto 20px", alignItems: "center", gap: 14, padding: "14px 18px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onMove(-1); }}
            disabled={idx === 0}
            style={{ background: "none", border: "none", padding: 0, color: idx === 0 ? "var(--tv-border)" : "var(--tv-text-faint)", cursor: idx === 0 ? "not-allowed" : "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMove(1); }}
            disabled={idx === total - 1}
            style={{ background: "none", border: "none", padding: 0, color: idx === total - 1 ? "var(--tv-border)" : "var(--tv-text-faint)", cursor: idx === total - 1 ? "not-allowed" : "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>

        <div
          onClick={onToggle}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, cursor: "pointer",
            background: meta.gold ? "rgba(220,170,51,.13)" : "var(--tv-panel-accent)",
            color: meta.gold ? "var(--tv-gold)" : "var(--tv-text-dim)",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">{meta.icon}</svg>
        </div>

        <div onClick={onToggle} style={{ minWidth: 0, cursor: "pointer" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: meta.gold ? "var(--tv-gold)" : "var(--tv-text-faint)", marginBottom: 3 }}>
            {meta.label}
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: "var(--tv-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </div>
        </div>

        <div onClick={onToggle} style={{ fontFamily: block.type === "pricing" ? "'Space Grotesk', sans-serif" : "monospace", fontSize: block.type === "pricing" ? 16 : 10.5, fontWeight: block.type === "pricing" ? 600 : 400, color: "var(--tv-text-faint)", whiteSpace: "nowrap", cursor: "pointer" }}>
          {blockMeta(block)}
        </div>

        <svg
          onClick={onToggle}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ color: "var(--tv-text-faint)", cursor: "pointer", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isOpen && (
        <div style={{ padding: "0 18px 20px" }}>
          <BlockFields block={block} primaryColor={primaryColor} brand={brand} onUpdate={onUpdate} onRemove={onRemove} />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Per-type editable fields — unchanged editing logic from before, restyled
// ---------------------------------------------------------------------------

const fieldInput: React.CSSProperties = {
  width: "100%", fontSize: 14, color: "var(--tv-text)", background: "var(--tv-panel-accent)",
  border: "1px solid var(--tv-border)", borderRadius: 10, padding: "10px 12px", outline: "none", boxSizing: "border-box",
};

const fieldTextarea: React.CSSProperties = { ...fieldInput, resize: "vertical", lineHeight: 1.55 };

function RemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      title="Remove block"
      style={{ marginTop: 12, background: "none", border: "none", color: "var(--tv-text-faint)", fontSize: 11.5, cursor: "pointer", padding: 0 }}
    >
      Remove this block
    </button>
  );
}

function BlockFields({ block, primaryColor, brand, onUpdate, onRemove }: {
  block: ProposalBlock;
  primaryColor: string;
  brand: BrandSettings | null;
  onUpdate: (updates: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  switch (block.type) {
    case "hero":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="text" value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Proposal title" style={fieldInput} />
          <input type="text" value={block.subtitle ?? ""} onChange={(e) => onUpdate({ subtitle: e.target.value })} placeholder="Subtitle" style={fieldInput} />
          <RemoveButton onRemove={onRemove} />
        </div>
      );

    case "text":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="text" value={block.heading} onChange={(e) => onUpdate({ heading: e.target.value })} placeholder="Section heading" style={fieldInput} />
          <textarea value={block.body} onChange={(e) => onUpdate({ body: e.target.value })} rows={7} placeholder="Section content…" style={fieldTextarea} />
          <RemoveButton onRemove={onRemove} />
        </div>
      );

    case "bullets":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="text" value={block.heading} onChange={(e) => onUpdate({ heading: e.target.value })} placeholder="Section heading" style={fieldInput} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {block.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, flexShrink: 0, background: primaryColor }} />
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...block.items];
                    newItems[i] = e.target.value;
                    onUpdate({ items: newItems });
                  }}
                  style={{ ...fieldInput, flex: 1 }}
                />
                <button
                  onClick={() => onUpdate({ items: block.items.filter((_, j) => j !== i) })}
                  style={{ background: "none", border: "none", color: "var(--tv-text-faint)", cursor: "pointer", flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button onClick={() => onUpdate({ items: [...block.items, ""] })} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--tv-gold)", fontSize: 12, cursor: "pointer", padding: 0 }}>
              + Add item
            </button>
          </div>
          <RemoveButton onRemove={onRemove} />
        </div>
      );

    case "scope_table":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {block.heading !== undefined && (
            <input type="text" value={block.heading ?? ""} onChange={(e) => onUpdate({ heading: e.target.value })} placeholder="Section heading (optional)" style={fieldInput} />
          )}
          {block.rows.map((row, i) => (
            <ScopeRow
              key={i}
              row={row}
              onChange={(updates) => {
                const rows = [...block.rows];
                rows[i] = { ...rows[i], ...updates };
                onUpdate({ rows });
              }}
              onRemove={() => onUpdate({ rows: block.rows.filter((_, j) => j !== i) })}
            />
          ))}
          <button onClick={() => onUpdate({ rows: [...block.rows, { item: "", detail: "" }] })} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--tv-gold)", fontSize: 12, cursor: "pointer", padding: 0 }}>
            + Add stage
          </button>
          <RemoveButton onRemove={onRemove} />
        </div>
      );

    case "timeline":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {block.milestones.map((m, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1fr) 130px 22px", gap: 10, alignItems: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--tv-gold)", textAlign: "center" }}>{String(i + 1).padStart(2, "0")}</div>
              <input
                value={m.label}
                onChange={(e) => {
                  const milestones = [...block.milestones];
                  milestones[i] = { ...milestones[i], label: e.target.value };
                  onUpdate({ milestones });
                }}
                placeholder="Milestone"
                style={fieldInput}
              />
              <input
                value={m.when}
                onChange={(e) => {
                  const milestones = [...block.milestones];
                  milestones[i] = { ...milestones[i], when: e.target.value };
                  onUpdate({ milestones });
                }}
                placeholder="When"
                style={fieldInput}
              />
              <button onClick={() => onUpdate({ milestones: block.milestones.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: "var(--tv-text-faint)", cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => onUpdate({ milestones: [...block.milestones, { label: "", when: "" }] })} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--tv-gold)", fontSize: 12, cursor: "pointer", padding: 0 }}>
            + Add milestone
          </button>
          <RemoveButton onRemove={onRemove} />
        </div>
      );

    case "pricing":
      return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 70px 120px 22px", gap: 10, padding: "0 0 8px", fontFamily: "monospace", fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--tv-text-faint)" }}>
            <div>Line item</div><div>Qty</div><div>Amount</div><div />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {block.lineItems.map((item, i) => {
              const sym = CURRENCY_SYMBOLS[block.currency] ?? block.currency;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 70px 120px 22px", gap: 10, alignItems: "center" }}>
                  <input
                    value={item.name}
                    onChange={(e) => {
                      const li = [...block.lineItems];
                      li[i] = { ...li[i], name: e.target.value };
                      onUpdate({ lineItems: li });
                    }}
                    placeholder="Item name"
                    style={fieldInput}
                  />
                  <input
                    type="number"
                    value={item.qty}
                    min={0}
                    onChange={(e) => {
                      const li = [...block.lineItems];
                      li[i] = { ...li[i], qty: parseFloat(e.target.value) || 0 };
                      onUpdate({ lineItems: li });
                    }}
                    style={fieldInput}
                  />
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--tv-text-faint)", fontSize: 13 }}>{sym}</span>
                    <input
                      type="number"
                      value={item.unitPrice}
                      min={0}
                      onChange={(e) => {
                        const li = [...block.lineItems];
                        li[i] = { ...li[i], unitPrice: parseFloat(e.target.value) || 0 };
                        onUpdate({ lineItems: li });
                      }}
                      style={{ ...fieldInput, paddingLeft: 22 }}
                    />
                  </div>
                  <button onClick={() => onUpdate({ lineItems: block.lineItems.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: "var(--tv-text-faint)", cursor: "pointer" }}>✕</button>
                </div>
              );
            })}
            <button onClick={() => onUpdate({ lineItems: [...block.lineItems, { name: "", qty: 1, unitPrice: 0 }] })} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--tv-gold)", fontSize: 12, cursor: "pointer", padding: 0 }}>
              + Add line item
            </button>
          </div>
          <VatControls block={block} onUpdate={onUpdate} brand={brand} />
          <RemoveButton onRemove={onRemove} />
        </div>
      );

    case "cta":
      return (
        <div>
          <input type="text" value={block.label} onChange={(e) => onUpdate({ label: e.target.value })} placeholder="Button label" style={fieldInput} />
          <RemoveButton onRemove={onRemove} />
        </div>
      );

    case "terms":
      return (
        <div>
          <textarea value={block.body} onChange={(e) => onUpdate({ body: e.target.value })} rows={7} placeholder="Terms and conditions…" style={fieldTextarea} />
          <RemoveButton onRemove={onRemove} />
        </div>
      );

    default:
      return (
        <div>
          <div style={{ fontSize: 12, color: "var(--tv-text-faint)" }}>Block type: {(block as ProposalBlock).type}</div>
          <RemoveButton onRemove={onRemove} />
        </div>
      );
  }
}

function ScopeRow({ row, onChange, onRemove }: {
  row: { item: string; detail: string; weeks?: number };
  onChange: (updates: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid var(--tv-border)", borderRadius: 12, background: "var(--tv-panel-accent)", overflow: "hidden" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto 22px", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--tv-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {row.item || "Untitled stage"}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 10.5, color: "var(--tv-text-faint)" }}>{typeof row.weeks === "number" ? `${row.weeks} weeks` : ""}</div>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ background: "none", border: "none", color: "var(--tv-text-faint)", cursor: "pointer" }}>✕</button>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--tv-text-faint)", transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 110px", gap: 10, alignItems: "start" }}>
          <input value={row.item} onChange={(e) => onChange({ item: e.target.value })} placeholder="Deliverable / stage name" style={fieldInput} />
          <input type="number" value={row.weeks ?? ""} onChange={(e) => onChange({ weeks: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="Weeks" style={fieldInput} />
          <textarea
            value={row.detail}
            onChange={(e) => onChange({ detail: e.target.value })}
            rows={3}
            placeholder="Description"
            style={{ ...fieldTextarea, gridColumn: "1 / -1" }}
          />
        </div>
      )}
    </div>
  );
}

const VAT_RATE_PRESETS = [
  { rate: 20, label: "20% STANDARD" },
  { rate: 0, label: "0% ZERO-RATED" },
];

function VatControls({
  block,
  brand,
  onUpdate,
}: {
  block: Extract<ProposalBlock, { type: "pricing" }>;
  brand: BrandSettings | null;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const sym = CURRENCY_SYMBOLS[block.currency] ?? block.currency;
  const subtotal = block.lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vatEnabled = !!block.vatEnabled;
  const vatRate = typeof block.vatRate === "number" ? block.vatRate : 20;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;
  const isPreset = VAT_RATE_PRESETS.some((p) => p.rate === vatRate);

  const pillStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "monospace", fontSize: 10.5, letterSpacing: ".08em", padding: "8px 12px", borderRadius: 10, cursor: "pointer",
    border: active ? "1.5px solid rgba(220,170,51,.5)" : "1px solid var(--tv-border)",
    background: active ? "rgba(220,170,51,.12)" : "transparent",
    color: active ? "var(--tv-gold)" : "var(--tv-text-faint)",
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 26, marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--tv-border-soft)", alignItems: "start" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
          <span style={{ fontSize: 13.5, color: "var(--tv-text)" }}>Charge VAT</span>
          <button
            type="button"
            onClick={() => onUpdate({ vatEnabled: !vatEnabled, vatRate: block.vatRate ?? 20 })}
            style={{ width: 42, height: 24, borderRadius: 999, display: "inline-flex", alignItems: "center", border: "none", cursor: "pointer", background: vatEnabled ? "var(--tv-gold)" : "rgba(120,120,130,.3)", flexShrink: 0 }}
          >
            <span style={{ width: 18, height: 18, borderRadius: 999, background: "#fff", transition: "transform .15s", transform: vatEnabled ? "translateX(20px)" : "translateX(3px)" }} />
          </button>
        </div>

        {vatEnabled && (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {VAT_RATE_PRESETS.map((p) => (
              <div key={p.rate} onClick={() => onUpdate({ vatRate: p.rate })} style={pillStyle(vatRate === p.rate)}>
                {p.label}
              </div>
            ))}
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={!isPreset ? vatRate : ""}
              onChange={(e) => onUpdate({ vatRate: parseFloat(e.target.value) || 0 })}
              placeholder="CUSTOM %"
              style={{ width: 100, fontFamily: "monospace", fontSize: 10.5, color: "var(--tv-text)", border: "1px solid var(--tv-border)", background: "var(--tv-panel-accent)", borderRadius: 10, padding: "8px 10px", outline: "none" }}
            />
          </div>
        )}

        {vatEnabled && !brand?.vat_number && (
          <p style={{ marginTop: 10, fontSize: 11.5, color: "var(--tv-warning)" }}>
            Add your VAT number in <Link href="/dashboard/brand" style={{ color: "var(--tv-gold)" }}>Branding</Link> to display it on this proposal.
          </p>
        )}
        {!vatEnabled && block.vatNote && (
          <p style={{ fontSize: 11.5, color: "var(--tv-text-faint)", marginTop: 10 }}>{block.vatNote}</p>
        )}
      </div>

      <div style={{ border: "1px solid var(--tv-border)", borderRadius: 14, padding: "14px 16px", background: "var(--tv-panel-accent)", display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--tv-text-dim)" }}>
          <span>Subtotal</span><span>{sym}{subtotal.toLocaleString()}</span>
        </div>
        {vatEnabled && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--tv-text-dim)" }}>
            <span>VAT ({vatRate}%)</span><span>{sym}{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div style={{ height: 1, background: "var(--tv-border-soft)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--tv-text-faint)" }}>Total</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 600, color: "var(--tv-text)", letterSpacing: "-.02em" }}>
            {sym}{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
