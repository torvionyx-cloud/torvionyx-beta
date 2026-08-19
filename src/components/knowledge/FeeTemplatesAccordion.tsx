// @ts-nocheck

"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FeeResourcingTemplateRow, RateCard } from "@/types/database";
import { RIBA_STAGES } from "@/lib/riba";
import { FeeTemplateStageRow } from "@/components/knowledge/FeeTemplateStageRow";

interface Props {
  // Owned by KnowledgeTabs, not forked into local state here — same reason
  // as the other three Knowledge panels: this stays mounted across tab
  // switches, so a local useState(initialRows) would only ever reflect the
  // page's original server-render snapshot.
  rows: FeeResourcingTemplateRow[];
  setRows: Dispatch<SetStateAction<FeeResourcingTemplateRow[]>>;
  // For the per-line subtotal lookup (getCurrentRate) — sourced from
  // KnowledgeTabs' own rates state, not fetched again here.
  rates: RateCard[];
}

const EMPTY_LINES: FeeResourcingTemplateRow[] = [];

export function FeeTemplatesAccordion({ rows, setRows, rates }: Props) {
  // Grouped once per render: riba_stage -> (project_type -> lines[]), so
  // each FeeTemplateStageRow gets its own cells without scanning the full
  // list. Unlike Scope Library's one-row-per-cell map, a cell here holds a
  // list — multiple grade+hours lines can share the same (stage, type).
  const rowsByStage = useMemo(() => {
    const map = new Map<number, Map<string, FeeResourcingTemplateRow[]>>();
    for (const row of rows) {
      if (!map.has(row.riba_stage)) map.set(row.riba_stage, new Map());
      const byType = map.get(row.riba_stage)!;
      if (!byType.has(row.project_type)) byType.set(row.project_type, []);
      byType.get(row.project_type)!.push(row);
    }
    return map;
  }, [rows]);

  const handleSaved = useCallback((row: FeeResourcingTemplateRow) => {
    setRows(prev => {
      const exists = prev.some(r => r.id === row.id);
      return exists ? prev.map(r => (r.id === row.id ? row : r)) : [...prev, row];
    });
  }, [setRows]);

  const handleDeleted = useCallback((riba_stage: number, project_type: string, grade: string) => {
    setRows(prev =>
      prev.filter(r => !(r.riba_stage === riba_stage && r.project_type === project_type && r.grade === grade))
    );
  }, [setRows]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {RIBA_STAGES.map((stage, i) => (
        <FeeTemplateStageRow
          key={stage.stage}
          stage={stage}
          linesByType={rowsByStage.get(stage.stage) ?? new Map()}
          emptyLines={EMPTY_LINES}
          rates={rates}
          defaultOpen={i === 0}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
