// @ts-nocheck

"use client";

import { useState } from "react";
import type { ScopeLibraryRow } from "@/types/database";
import type { RibaStage } from "@/lib/riba";
import { PROJECT_TYPES } from "@/lib/validation";
import { ScopeCell } from "@/components/knowledge/ScopeCell";

interface Props {
  stage: RibaStage;
  cellsByType: Map<string, ScopeLibraryRow>;
  defaultOpen: boolean;
  onSaved: (row: ScopeLibraryRow) => void;
  onCleared: (riba_stage: number, project_type: string) => void;
}

export function ScopeStageRow({ stage, cellsByType, defaultOpen, onSaved, onCleared }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const filledCount = [...cellsByType.values()].filter(row => row.scope_text.trim() !== "").length;

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
            <ScopeCell
              key={project_type}
              row={cellsByType.get(project_type)}
              riba_stage={stage.stage}
              project_type={project_type}
              onSaved={onSaved}
              onCleared={onCleared}
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
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  padding: "4px 20px 20px",
  borderTop: "1px solid var(--tv-border-soft)",
} as const;

const caretIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
