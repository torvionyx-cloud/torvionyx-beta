-- =============================================================================
-- Pitchwright — Proposal project type
-- Migration: 0009_add_proposal_project_type.sql
-- =============================================================================
-- RIBA project-type category on proposals — what "Add a stage" (in the
-- proposal editor) matches against scope_library and fee_resourcing_templates
-- to resolve scope text and fee lines. Distinct from proposal_type, an older,
-- unrelated column that picks AI document structure (service proposal /
-- quote / retainer / etc.) — same name, one letter apart, different meaning.
-- Nullable: the editor prompts once for project type if it's unset, same
-- pattern used elsewhere for optional proposal fields.
--
-- Reconstructed from the live schema — this migration was originally applied
-- directly to the Supabase project without a local file. Written to close
-- that gap so a fresh checkout/db reset produces the same schema as
-- production. See docs/Torvionyx_Session_Handoff_20Aug.md for the original
-- context (Fee engine Phase B, commit 8b9e58a).

ALTER TABLE proposals ADD COLUMN project_type text;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_project_type_check
  CHECK (project_type IS NULL OR (project_type = ANY (ARRAY[
    'Residential Extension'::text,
    'New-Build Residential'::text,
    'Small Commercial'::text,
    'Refurbishment'::text,
    'Feasibility/Planning'::text,
    'Other'::text
  ])));
