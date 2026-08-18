// @ts-nocheck

"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ScopeLibraryRow } from "@/types/database";
import { RIBA_STAGES } from "@/lib/riba";
import { ScopeStageRow } from "@/components/knowledge/ScopeStageRow";

interface Props {
  // Owned by KnowledgeTabs, not forked into local state here — same reason
  // as ProjectsGrid/RateCardTable: this panel stays mounted across tab
  // switches, so a local useState(initialRows) would only ever reflect the
  // page's original server-render snapshot.
  rows: ScopeLibraryRow[];
  setRows: Dispatch<SetStateAction<ScopeLibraryRow[]>>;
}

const EMPTY_CELLS = new Map<string, ScopeLibraryRow>();

export function ScopeLibraryAccordion({ rows, setRows }: Props) {
  // Grouped once per render: riba_stage -> (project_type -> row), so each
  // ScopeStageRow gets its own cells without scanning the full list.
  const rowsByStage = useMemo(() => {
    const map = new Map<number, Map<string, ScopeLibraryRow>>();
    for (const row of rows) {
      if (!map.has(row.riba_stage)) map.set(row.riba_stage, new Map());
      map.get(row.riba_stage)!.set(row.project_type, row);
    }
    return map;
  }, [rows]);

  const handleSaved = useCallback((row: ScopeLibraryRow) => {
    setRows(prev => {
      const exists = prev.some(r => r.id === row.id);
      return exists ? prev.map(r => (r.id === row.id ? row : r)) : [...prev, row];
    });
  }, [setRows]);

  const handleCleared = useCallback((riba_stage: number, project_type: string) => {
    setRows(prev => prev.filter(r => !(r.riba_stage === riba_stage && r.project_type === project_type)));
  }, [setRows]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {RIBA_STAGES.map((stage, i) => (
        <ScopeStageRow
          key={stage.stage}
          stage={stage}
          cellsByType={rowsByStage.get(stage.stage) ?? EMPTY_CELLS}
          defaultOpen={i === 0}
          onSaved={handleSaved}
          onCleared={handleCleared}
        />
      ))}
    </div>
  );
}
