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
import type { Proposal, ProposalContent, ProposalBlock, BrandSettings } from "@/types/database";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";

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
}

export function ProposalEditorClient({ proposal, brand }: Props) {
  const router = useRouter();
  const [content, setContent] = useState<ProposalContent>(proposal.content);
  const [title, setTitle] = useState(proposal.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [status, setStatus] = useState(proposal.status);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        body: JSON.stringify({ title: title.trim() || proposal.title, content }),
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
  }, [proposal.id, title, content]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = useCallback(async () => {
    // Save first if dirty
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

  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.draft;
  const primaryColor = brand?.primary_color ?? "#111111";

  return (
    <div className="-mt-10 -mx-6">
      {/* Editor toolbar — sticks below the dashboard header on scroll */}
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
              onUpdate={(updates) => updateBlock(idx, updates)}
              onRemove={() => removeBlock(idx)}
            />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
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
  onUpdate: (updates: Record<string, unknown>) => void;
  onRemove: () => void;
}

function EditableBlock({ block, idx, primaryColor, onUpdate, onRemove }: EditableBlockProps) {
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
            className="w-full text-2xl font-bold text-neutral-900 border-0 p-0 focus:outline-none focus:ring-0 bg-transparent mb-2"
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
            className="w-full text-lg font-semibold text-neutral-900 border-0 p-0 focus:outline-none focus:ring-0 bg-transparent mb-3"
          />
          <textarea
            value={block.body}
            onChange={(e) => onUpdate({ body: e.target.value })}
            rows={6}
            placeholder="Section content…"
            className="w-full text-sm text-neutral-700 border border-neutral-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 resize-y transition"
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
            className="w-full text-lg font-semibold text-neutral-900 border-0 p-0 focus:outline-none focus:ring-0 bg-transparent mb-3"
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
                  className="flex-1 text-sm text-neutral-700 border-0 p-0 focus:outline-none focus:ring-0 bg-transparent"
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
                      className="w-full text-sm text-neutral-900 border border-neutral-200 rounded pl-6 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400"
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
          <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center">
            <span className="text-sm text-neutral-500">Total</span>
            <span className="text-lg font-semibold text-neutral-900">
              {CURRENCY_SYMBOLS[block.currency] ?? block.currency}
              {block.lineItems
                .reduce((s, i) => s + i.qty * i.unitPrice, 0)
                .toLocaleString()}
            </span>
          </div>
          {block.vatNote && (
            <p className="text-xs text-neutral-400 mt-1">{block.vatNote}</p>
          )}
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
            className="w-full text-base font-medium text-neutral-900 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
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
            className="w-full text-sm text-neutral-600 border border-neutral-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 resize-y transition"
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
