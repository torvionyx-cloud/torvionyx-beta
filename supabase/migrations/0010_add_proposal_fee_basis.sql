-- =============================================================================
-- Pitchwright — Proposal fee basis
-- Migration: 0010_add_proposal_fee_basis.sql
-- =============================================================================
-- Pricing presentation for resolved stage fee lines — hourly or lump_sum.
-- Additive only: proposal_type is untouched and still drives AI document
-- structure via SECTION_GUIDES in lib/prompt.ts (the full-AI-generation
-- fallback when zero RIBA stages are selected). fee_basis is a separate,
-- independent axis for the proposal creation rework (Phase A). Nullable
-- until set by the new intake flow (Phase B/C) — same optional/nullable
-- pattern as project_type above (0009_add_proposal_project_type.sql).

ALTER TABLE proposals ADD COLUMN fee_basis text;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_fee_basis_check
  CHECK (fee_basis IS NULL OR fee_basis = ANY (ARRAY['hourly'::text, 'lump_sum'::text]));
