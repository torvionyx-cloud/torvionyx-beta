// @ts-nocheck

"use client";

import { useState } from "react";
import type { FeeResourcingTemplateRow, RateCard } from "@/types/database";
import type { RibaStage } from "@/lib/riba";
import { PROJECT_TYPES } from "@/lib/validation";
import { FeeTemplateCell } from "@/components/knowledge/FeeTemplateCell";

interface Props {
  stage: RibaStage;
  linesByType: Map<string, FeeResourcingTemplateRow[]>;
  emptyLines: FeeResourcingTemplateRow[];
  rates: RateCard[];
  defaultOpen: boolean;
  onSaved: (row: FeeResourcingTemplateRow) => void;
  onDeleted: (riba_stage: number, project_type: string, grade: string) => void;
}

export function FeeTemplateStageRow({ stage, linesByType, emptyLines, rates, defaultOpen, onSaved, onDeleted }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const filledCount = [...linesByType.values()].filter(lines => lines.length > 0).length;

  return (
    <div style={{
      background: "var(--tv-bg-panel)",
      border: "1px solid var(--tv-border)",
      borderRadius: 14,
      boxShadow: "var(--tv-shadow)",
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="hover:bg-white/5 transition-colors duration-150"
        style={headerStyle}
      >
        <span style={stageBadgeStyle}>{stage.stage}</span>
        <span style={stageNameStyle}>{stage.name}</span>
        <span style={filledCountStyle}>
          {filledCount}/{PROJECT_TYPES.length} filled
        </span>
        <span style={{
          ...caretStyle,
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}>
          {caretIcon}
        </span>
      </button>

      {/* Same grid markup at every viewport width — it wraps on its own via
          auto-fill, so there's no separate mobile layout to keep in sync. */}
      {isOpen && (
        <div style={gridStyle}>
          {PROJECT_TYPES.map(project_type => (
            <FeeTemplateCell
              key={project_type}
              lines={linesByType.get(project_type) ?? emptyLines}
              rates={rates}
              riba_stage={stage.stage}
              project_type={project_type}
              onSaved={onSaved}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const headerStyle = {
  display: "flex", alignItems: "center", gap: 14,
  width: "100%", padding: "16px 20px",
  background: "none", border: "none", cursor: "pointer", textAlign: "left",
} as const;

const stageBadgeStyle = {
  display: "grid", placeItems: "center", flexShrink: 0,
  width: 30, height: 30, borderRadius: 8,
  border: "1px solid var(--tv-border)", background: "var(--tv-panel-accent)",
  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 13,
  color: "var(--tv-gold)",
} as const;

const stageNameStyle = {
  flex: 1,
  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15,
  color: "var(--tv-text)",
} as const;

const filledCountStyle = {
  flexShrink: 0,
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5,
  color: "var(--tv-text-faint)",
} as const;

const caretStyle = {
  display: "grid", placeItems: "center", flexShrink: 0,
  color: "var(--tv-text-faint)",
  transition: "transform .15s",
} as const;

const gridStyle = {
  display: "grid", gap: 16,
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  padding: "4px 20px 20px",
  borderTop: "1px solid var(--tv-border-soft)",
} as const;

const caretIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
