// @ts-nocheck

"use client";

/**
 * components/proposals/ProposalEditorClient.tsx
 *
 * Client-side proposal editor. Receives the proposal from the server component
 * and manages edit state, autosave, sharing, and regeneration.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Proposal, ProposalContent, ProposalBlock, BrandSettings, ScopeLibraryRow, FeeResourcingTemplateRow, RateCard, TextBlock, PricingBlock, PricingLineItem } from "@/types/database";
import { RIBA_STAGES } from "@/lib/riba";
import { getCurrentRate } from "@/lib/rateCard";
import { PROJECT_TYPES } from "@/lib/validation";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";
import { ProposalScorePanel } from "@/components/proposals/ProposalScorePanel";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-neutral-100 text-neutral-600" },
  shared: { label: "Shared", className: "bg-blue-100 text-blue-700" },
  viewed: { label: "Viewed", className: "bg-purple-100 text-purple-700" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-700" },
  declined: { label: "Declined", className: "bg-red-100 text-red-700" },
  expired: { label: "Expired", className: "bg-neutral-100 text-neutral-400" },
};

const CURRENCY_SYMBOLS: Record<string, string> = { GBP: "£", USD: "$", EUR: "€" };

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

  const handleSetProjectType = useCallback((value: string) => {
    setProjectType(value);
    markDirty();
  }, [markDirty]);

  const handleAddStage = useCallback((ribaStage: number) => {
    const scopeRow = scopeLibrary.find(
      (r) => r.riba_stage === ribaStage && r.project_type === projectType
    );

    const feeLines = feeTemplates.filter(
      (r) => r.riba_stage === ribaStage && r.project_type === projectType
    );

    const stageInfo = RIBA_STAGES.find((s) => s.stage === ribaStage);
    const stageName = stageInfo ? `Stage ${stageInfo.stage} — ${stageInfo.name}` : `Stage ${ribaStage}`;

    const newLineItems: PricingLineItem[] = [];
    const skippedGrades: string[] = [];

    for (const line of feeLines) {
      const rate = getCurrentRate(line.grade, rates);
      if (rate) {
        newLineItems.push({
          name: `${line.grade} — ${stageName}`,
          qty: line.hours,
          unitPrice: rate.hourly_rate,
        });
      } else {
        skippedGrades.push(line.grade);
      }
    }

    setContent((prev) => {
      const blocks = [...prev.blocks];

      const scopeBlock: TextBlock = {
        type: "text",
        heading: stageName,
        body: scopeRow?.scope_text ?? "Scope details for this stage haven't been added to your Scope Library yet.",
      };

      const pricingIdx = blocks.findIndex((b) => b.type === "pricing");

      if (newLineItems.length > 0) {
        if (pricingIdx === -1) {
          const newPricingBlock: PricingBlock = {
            type: "pricing",
            currency: "GBP",
            lineItems: newLineItems,
            showTotals: true,
          };
          blocks.push(scopeBlock, newPricingBlock);
        } else {
          blocks.splice(pricingIdx, 0, scopeBlock);
          const existingPricing = blocks[pricingIdx + 1] as PricingBlock;
          blocks[pricingIdx + 1] = {
            ...existingPricing,
            lineItems: [...existingPricing.lineItems, ...newLineItems],
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
      feeLines.length === 0
        ? `Added ${stageName}, but no fee resourcing template exists yet for this stage and project type — only scope was added. Add hours in Fee Templates, then add fee lines here manually.`
        : skippedGrades.length > 0
        ? `Added ${stageName}, but no current rate on file for: ${skippedGrades.join(", ")}. Add these to your Rate Card, then edit the fee lines manually.`
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

  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.draft;
  const primaryColor = brand?.primary_color ?? "#111111";

  return (
    <div className="-mt-10 -mx-6">
      {/* Editor toolbar */}
      <div className="sticky top-0 z-30 border-b border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937]">
        <div className="px-6 py-3 flex items-center gap-3">
          <TorvionyxLogo size={18} className="shrink-0 opacity-70" />
          <Link
            href="/dashboard"
            className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
          >
            ← Proposals
          </Link>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
              maxLength={300}
              className="w-full text-sm font-medium text-neutral-900 bg-transparent border-0 focus:outline-none focus:ring-0 truncate"
            />
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          <span className="text-xs text-neutral-400 shrink-0">
            {isSaving ? "Saving…" : isDirty ? "Unsaved" : "Saved"}
          </span>
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-400 disabled:opacity-40 transition"
          >
            Save
          </button>
          <button
            onClick={isSharing ? undefined : (shareUrl ? handleCopyLink : handleShare)}
            disabled={isSharing}
            className="shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60 transition"
            style={{ backgroundColor: primaryColor }}
          >
            {isSharing
              ? "Sharing…"
              : copySuccess
              ? "Copied!"
              : shareUrl || status !== "draft"
              ? "Copy link"
              : "Share"}
          </button>
        </div>
        {saveError && (
          <div className="bg-red-50 px-4 py-2 text-xs text-red-600 text-center">{saveError}</div>
        )}
        {copySuccess && (
          <div className="bg-green-50 px-4 py-2 text-xs text-green-700 text-center">
            Link copied to clipboard — send it to your client!
          </div>
        )}
      </div>

      {/* Main editor area */}
      <div className="px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Blocks */}
        <div className="space-y-4">
          {content.blocks.map((block, idx) => (
            <EditableBlock
              key={idx}
              block={block}
              idx={idx}
              primaryColor={primaryColor}
              brand={brand}
              onUpdate={(updates) => updateBlock(idx, updates)}
              onRemove={() => removeBlock(idx)}
            />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <ProposalScorePanel
            proposalId={proposal.id}
            onRewrite={(blockIndex, coachingNote) => handleRewrite(blockIndex, coachingNote ?? null)}
            rewritingBlock={rewritingBlock}
          />
          <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-4 space-y-3">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-[#F3F4F6]">Add a stage</h3>
            {projectType === "" ? (
              <>
                <p className="text-xs text-neutral-500">
                  First, what type of project is this? This decides which Scope Library text and Fee Templates get pulled in.
                </p>
                <select
                  value={projectType}
                  onChange={(e) => handleSetProjectType(e.target.value)}
                  className="w-full text-sm border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] text-neutral-900 dark:text-[#F3F4F6] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  <option value="">Select a project type…</option>
                  {PROJECT_TYPES.map((pt) => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <p className="text-xs text-neutral-500">
                  Pulls scope wording and itemized fees from your Knowledge tab for this project type.
                </p>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full text-sm border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] text-neutral-900 dark:text-[#F3F4F6] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400"
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
                  className="w-full rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  + Add stage
                </button>
                {stageAddWarning && (
                  <p className="text-xs text-amber-600">{stageAddWarning}</p>
                )}
              </>
            )}
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-4 space-y-3">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-[#F3F4F6]">Proposal details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Client</dt>
                <dd className="text-neutral-900 font-medium truncate ml-2">{proposal.client_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Type</dt>
                <dd className="text-neutral-900 capitalize">{proposal.proposal_type.replace(/_/g, " ")}</dd>
              </div>
              {proposal.client_email && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Email</dt>
                  <dd className="text-neutral-600 text-xs truncate ml-2">{proposal.client_email}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-4 space-y-2">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-[#F3F4F6]">Actions</h3>
            <a
              href={`/p/${proposal.share_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors py-1"
            >
              <span>↗</span> Preview live link
            </a>
            <a
              href={`/p/${proposal.share_token}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Opens the live link — use your browser's Print → Save as PDF"
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors py-1"
            >
              <span>↓</span> Download PDF
            </a>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-40 transition-colors py-1"
            >
              <span>↺</span> {isRegenerating ? "Regenerating…" : "Regenerate all"}
            </button>
          </div>

          <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-4">
            <h3 className="text-sm font-medium text-neutral-900 mb-2">Original brief</h3>
            <p className="text-xs text-neutral-500 leading-relaxed line-clamp-6">{proposal.brief}</p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 opacity-[0.18]">
            <TorvionyxLogo size={16} />
            <span className="text-xs font-semibold text-neutral-500 dark:text-gray-400 tracking-tight">Torvionyx</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editable block components
// ---------------------------------------------------------------------------

interface EditableBlockProps {
  block: ProposalBlock;
  idx: number;
  primaryColor: string;
  brand: BrandSettings | null;
  onUpdate: (updates: Record<string, unknown>) => void;
  onRemove: () => void;
}

function EditableBlock({ block, idx, primaryColor, brand, onUpdate, onRemove }: EditableBlockProps) {
  const baseClass = "group relative rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-5";

  const BlockControls = () => (
    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={onRemove}
        title="Remove block"
        className="rounded p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 transition text-xs"
      >
        ✕
      </button>
    </div>
  );

  switch (block.type) {
    case "hero":
      return (
        <div className={baseClass}>
          <BlockControls />
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-gray-500 mb-3">Hero</div>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Proposal title"
            className="w-full text-2xl font-bold text-neutral-900 dark:text-[#F3F4F6] border-0 p-0 focus:outline-none focus:ring-0 bg-transparent mb-2"
          />
          <input
            type="text"
            value={block.subtitle ?? ""}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            placeholder="Subtitle"
            className="w-full text-lg text-neutral-500 border-0 p-0 focus:outline-none focus:ring-0 bg-transparent"
          />
        </div>
      );

    case "text":
      return (
        <div className={baseClass}>
          <BlockControls />
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-gray-500 mb-3">Text section</div>
          <input
            type="text"
            value={block.heading}
            onChange={(e) => onUpdate({ heading: e.target.value })}
            placeholder="Section heading"
            className="w-full text-lg font-semibold text-neutral-900 dark:text-[#F3F4F6] border-0 p-0 focus:outline-none focus:ring-0 bg-transparent mb-3"
          />
          <textarea
            value={block.body}
            onChange={(e) => onUpdate({ body: e.target.value })}
            rows={6}
            placeholder="Section content…"
            className="w-full text-sm text-neutral-700 dark:text-[#F3F4F6] bg-white dark:bg-[#111827] border border-neutral-200 dark:border-[#374151] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 resize-y transition"
          />
        </div>
      );

    case "bullets":
      return (
        <div className={baseClass}>
          <BlockControls />
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-gray-500 mb-3">Bullet list</div>
          <input
            type="text"
            value={block.heading}
            onChange={(e) => onUpdate({ heading: e.target.value })}
            placeholder="Section heading"
            className="w-full text-lg font-semibold text-neutral-900 dark:text-[#F3F4F6] border-0 p-0 focus:outline-none focus:ring-0 bg-transparent mb-3"
          />
          <div className="space-y-2">
            {block.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: primaryColor }}
                />
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...block.items];
                    newItems[i] = e.target.value;
                    onUpdate({ items: newItems });
                  }}
                  className="flex-1 text-sm text-neutral-700 dark:text-[#F3F4F6] border-0 p-0 focus:outline-none focus:ring-0 bg-transparent"
                />
                <button
                  onClick={() => {
                    const newItems = block.items.filter((_, j) => j !== i);
                    onUpdate({ items: newItems });
                  }}
                  className="text-neutral-200 hover:text-red-400 transition text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => onUpdate({ items: [...block.items, ""] })}
              className="mt-1 text-xs text-neutral-400 hover:text-neutral-600 transition"
            >
              + Add item
            </button>
          </div>
        </div>
      );

    case "scope_table":
      return (
        <div className={baseClass}>
          <BlockControls />
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-gray-500 mb-3">Scope of work</div>
          {block.heading !== undefined && (
            <input
              type="text"
              value={block.heading ?? ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Section heading (optional)"
              className="w-full text-lg font-semibold text-neutral-900 border-0 p-0 focus:outline-none focus:ring-0 bg-transparent mb-3"
            />
          )}
          <div className="space-y-2">
            {block.rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_60px] gap-2 items-start">
                <input
                  value={row.item}
                  onChange={(e) => {
                    const rows = [...block.rows];
                    rows[i] = { ...rows[i], item: e.target.value };
                    onUpdate({ rows });
                  }}
                  placeholder="Deliverable"
                  className="text-sm text-neutral-900 border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-[#0891B2] text-neutral-900 dark:text-[#F3F4F6]"
                />
                <input
                  value={row.detail}
                  onChange={(e) => {
                    const rows = [...block.rows];
                    rows[i] = { ...rows[i], detail: e.target.value };
                    onUpdate({ rows });
                  }}
                  placeholder="Description"
                  className="text-sm text-neutral-600 border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-[#0891B2] text-neutral-900 dark:text-[#F3F4F6]"
                />
                <input
                  type="number"
                  value={row.weeks ?? ""}
                  onChange={(e) => {
                    const rows = [...block.rows];
                    rows[i] = { ...rows[i], weeks: e.target.value ? parseInt(e.target.value) : undefined };
                    onUpdate({ rows });
                  }}
                  placeholder="wks"
                  className="text-sm text-neutral-500 border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-[#0891B2] text-neutral-900 dark:text-[#F3F4F6]"
                />
              </div>
            ))}
            <button
              onClick={() => onUpdate({ rows: [...block.rows, { item: "", detail: "" }] })}
              className="mt-1 text-xs text-neutral-400 hover:text-neutral-600 transition"
            >
              + Add row
            </button>
          </div>
        </div>
      );

    case "timeline":
      return (
        <div className={baseClass}>
          <BlockControls />
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-gray-500 mb-3">Timeline</div>
          <div className="space-y-2">
            {block.milestones.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div
                  className="h-5 w-5 rounded-full text-white text-xs flex items-center justify-center shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {i + 1}
                </div>
                <input
                  value={m.label}
                  onChange={(e) => {
                    const milestones = [...block.milestones];
                    milestones[i] = { ...milestones[i], label: e.target.value };
                    onUpdate({ milestones });
                  }}
                  placeholder="Milestone"
                  className="flex-1 text-sm text-neutral-900 border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-[#0891B2] text-neutral-900 dark:text-[#F3F4F6]"
                />
                <input
                  value={m.when}
                  onChange={(e) => {
                    const milestones = [...block.milestones];
                    milestones[i] = { ...milestones[i], when: e.target.value };
                    onUpdate({ milestones });
                  }}
                  placeholder="When"
                  className="w-28 text-sm text-neutral-500 border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-[#0891B2] text-neutral-900 dark:text-[#F3F4F6]"
                />
              </div>
            ))}
            <button
              onClick={() => onUpdate({ milestones: [...block.milestones, { label: "", when: "" }] })}
              className="mt-1 text-xs text-neutral-400 hover:text-neutral-600 transition"
            >
              + Add milestone
            </button>
          </div>
        </div>
      );

    case "pricing":
      return (
        <div className={baseClass}>
          <BlockControls />
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-gray-500 mb-3">Pricing</div>
          <div className="space-y-2">
            {block.lineItems.map((item, i) => {
              const sym = CURRENCY_SYMBOLS[block.currency] ?? block.currency;
              return (
                <div key={i} className="grid grid-cols-[2fr_60px_100px_auto] gap-2 items-center">
                  <input
                    value={item.name}
                    onChange={(e) => {
                      const li = [...block.lineItems];
                      li[i] = { ...li[i], name: e.target.value };
                      onUpdate({ lineItems: li });
                    }}
                    placeholder="Item name"
                    className="text-sm text-neutral-900 border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-[#0891B2] text-neutral-900 dark:text-[#F3F4F6]"
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
                    className="text-sm text-neutral-600 border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-[#0891B2] text-neutral-900 dark:text-[#F3F4F6]"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">{sym}</span>
                    <input
                      type="number"
                      value={item.unitPrice}
                      min={0}
                      onChange={(e) => {
                        const li = [...block.lineItems];
                        li[i] = { ...li[i], unitPrice: parseFloat(e.target.value) || 0 };
                        onUpdate({ lineItems: li });
                      }}
                      className="w-full text-sm text-neutral-900 dark:text-[#F3F4F6] bg-white dark:bg-[#111827] border border-neutral-200 dark:border-[#374151] rounded pl-6 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const li = block.lineItems.filter((_, j) => j !== i);
                      onUpdate({ lineItems: li });
                    }}
                    className="text-neutral-200 hover:text-red-400 transition text-xs"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            <button
              onClick={() =>
                onUpdate({ lineItems: [...block.lineItems, { name: "", qty: 1, unitPrice: 0 }] })
              }
              className="mt-1 text-xs text-neutral-400 hover:text-neutral-600 transition"
            >
              + Add line item
            </button>
          </div>
          <VatControls block={block} onUpdate={onUpdate} brand={brand} />
        </div>
      );

    case "cta":
      return (
        <div className={baseClass}>
          <BlockControls />
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-gray-500 mb-3">CTA</div>
          <input
            type="text"
            value={block.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Button label"
            className="w-full text-base font-medium text-neutral-900 dark:text-[#F3F4F6] bg-white dark:bg-[#111827] border border-neutral-200 dark:border-[#374151] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
      );

    case "terms":
      return (
        <div className={baseClass}>
          <BlockControls />
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-gray-500 mb-3">Terms</div>
          <textarea
            value={block.body}
            onChange={(e) => onUpdate({ body: e.target.value })}
            rows={5}
            placeholder="Terms and conditions…"
            className="w-full text-sm text-neutral-600 dark:text-[#F3F4F6] bg-white dark:bg-[#111827] border border-neutral-200 dark:border-[#374151] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 resize-y transition"
          />
        </div>
      );

    default:
      return (
        <div className={baseClass}>
          <BlockControls />
          <div className="text-xs text-neutral-400">Block type: {(block as ProposalBlock).type}</div>
        </div>
      );
  }
}

const VAT_RATE_PRESETS = [
  { rate: 20, label: "20% Standard" },
  { rate: 0, label: "0% Zero-rated" },
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

  return (
    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-[#374151]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">Charge VAT</span>
        <button
          type="button"
          onClick={() => onUpdate({ vatEnabled: !vatEnabled, vatRate: block.vatRate ?? 20 })}
          className="w-11 h-6 rounded-full inline-flex items-center shrink-0 transition-colors"
          style={{ background: vatEnabled ? "#DCAA33" : "rgba(120,120,130,.3)" }}
        >
          <span
            className="w-4 h-4 rounded-full bg-white transition-transform"
            style={{ transform: vatEnabled ? "translateX(24px)" : "translateX(4px)" }}
          />
        </button>
      </div>

      {vatEnabled && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {VAT_RATE_PRESETS.map((p) => (
            <button
              key={p.rate}
              type="button"
              onClick={() => onUpdate({ vatRate: p.rate })}
              className={`text-xs px-2.5 py-1.5 rounded-md border transition ${
                vatRate === p.rate
                  ? "border-neutral-900 dark:border-[#0891B2] text-neutral-900 dark:text-[#F3F4F6] font-medium"
                  : "border-neutral-200 dark:border-[#374151] text-neutral-500"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={!isPreset ? vatRate : ""}
              onChange={(e) => onUpdate({ vatRate: parseFloat(e.target.value) || 0 })}
              placeholder="Custom %"
              className="w-24 text-xs text-neutral-900 dark:text-[#F3F4F6] border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>
        </div>
      )}

      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-sm text-neutral-500">
          <span>Subtotal</span>
          <span>{sym}{subtotal.toLocaleString()}</span>
        </div>
        {vatEnabled && (
          <div className="flex justify-between text-sm text-neutral-500">
            <span>VAT ({vatRate}%)</span>
            <span>{sym}{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1.5">
          <span className="text-sm text-neutral-500">Total</span>
          <span className="text-lg font-semibold text-neutral-900 dark:text-[#F3F4F6]">
            {sym}{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {vatEnabled && !brand?.vat_number && (
        <p className="mt-2 text-xs text-amber-600">
          Add your VAT number in <Link href="/dashboard/brand" className="underline">Branding</Link> to display it on this proposal.
        </p>
      )}

      {!vatEnabled && block.vatNote && (
        <p className="text-xs text-neutral-400 mt-2">{block.vatNote}</p>
      )}
    </div>
  );
}