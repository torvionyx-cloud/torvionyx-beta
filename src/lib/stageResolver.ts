/**
 * lib/stageResolver.ts
 *
 * Shared, framework-agnostic stage resolution — the core of "Add a stage".
 * Given a RIBA stage + project type, resolves the matching Scope Library
 * text and Fee Resourcing Template lines, pricing each grade against the
 * *current* Rate Card via getCurrentRate().
 *
 * Extracted from ProposalEditorClient's handleAddStage (commit 8b9e58a) so
 * both the client-side editor and the future server-side generation path
 * (proposal creation rework, Phase C) call one source of truth instead of
 * two copies that quietly drift.
 */

import { RIBA_STAGES } from "@/lib/riba";
import { getCurrentRate } from "@/lib/rateCard";
import type { ScopeLibraryRow, FeeResourcingTemplateRow, RateCard } from "@/types/database";

export interface ResolvedFeeLineItem {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface ResolvedStage {
  ribaStage: number;
  stageName: string;
  scopeText: string;
  lineItems: ResolvedFeeLineItem[];
  skippedGrades: string[];
  hasFeeTemplate: boolean;
}

export function resolveStage(
  ribaStage: number,
  projectType: string,
  scopeLibrary: ScopeLibraryRow[],
  feeTemplates: FeeResourcingTemplateRow[],
  rates: RateCard[]
): ResolvedStage {
  const scopeRow = scopeLibrary.find(
    (r) => r.riba_stage === ribaStage && r.project_type === projectType
  );

  const feeLines = feeTemplates.filter(
    (r) => r.riba_stage === ribaStage && r.project_type === projectType
  );

  const stageInfo = RIBA_STAGES.find((s) => s.stage === ribaStage);
  const stageName = stageInfo ? `Stage ${stageInfo.stage} — ${stageInfo.name}` : `Stage ${ribaStage}`;

  const lineItems: ResolvedFeeLineItem[] = [];
  const skippedGrades: string[] = [];

  for (const line of feeLines) {
    const rate = getCurrentRate(line.grade, rates);
    if (rate) {
      lineItems.push({
        name: `${line.grade} — ${stageName}`,
        qty: line.hours,
        unitPrice: rate.hourly_rate,
      });
    } else {
      skippedGrades.push(line.grade);
    }
  }

  return {
    ribaStage,
    stageName,
    scopeText: scopeRow?.scope_text ?? "Scope details for this stage haven't been added to your Scope Library yet.",
    lineItems,
    skippedGrades,
    hasFeeTemplate: feeLines.length > 0,
  };
}

/**
 * Whether any real Scope Library or Fee Template data exists for this
 * stage + project type — for the new creation flow's stage multi-select,
 * which needs to show "live" per decision #1 whether picking a stage will
 * actually pull real content or just an empty placeholder.
 */
export function stageHasData(
  ribaStage: number,
  projectType: string,
  scopeLibrary: ScopeLibraryRow[],
  feeTemplates: FeeResourcingTemplateRow[]
): boolean {
  return (
    scopeLibrary.some((r) => r.riba_stage === ribaStage && r.project_type === projectType) ||
    feeTemplates.some((r) => r.riba_stage === ribaStage && r.project_type === projectType)
  );
}
