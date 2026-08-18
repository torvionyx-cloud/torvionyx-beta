// @ts-nocheck

/**
 * lib/riba.ts
 *
 * RIBA Plan of Work stage numbers + names (2020 edition). Shared constant —
 * ProjectPanel.tsx has its own private `const RIBA_STAGES = [0,1,...,7]`
 * (bare numbers, no names, used only to drive its stage-toggle checkboxes),
 * left as-is here. This is the one place stage *names* live, for anything
 * that needs to display them (currently: the Scope Library accordion).
 */

export interface RibaStage {
  stage: number;
  name: string;
}

export const RIBA_STAGES: RibaStage[] = [
  { stage: 0, name: "Strategic Definition" },
  { stage: 1, name: "Preparation and Briefing" },
  { stage: 2, name: "Concept Design" },
  { stage: 3, name: "Spatial Coordination" },
  { stage: 4, name: "Technical Design" },
  { stage: 5, name: "Manufacturing and Construction" },
  { stage: 6, name: "Handover" },
  { stage: 7, name: "Use" },
];
