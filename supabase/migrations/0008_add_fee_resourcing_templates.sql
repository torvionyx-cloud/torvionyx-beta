-- =============================================================================
-- Pitchwright — Fee resourcing templates (Knowledge section)
-- Migration: 0008_add_fee_resourcing_templates.sql
-- =============================================================================
-- Reusable fee-resourcing lines keyed by RIBA stage + project type: for each
-- stage/project_type "cell", one row per grade giving the hours allocated to
-- that grade. E.g. (Stage 2, Extension, Associate, 12) and (Stage 2,
-- Extension, Part 2, 20) are two separate rows under the same cell. Pulled
-- into the fee engine (Phase 2+) alongside scope_library. grade is free text
-- (not a fixed enum) — it must match whatever grades the founder has defined
-- in their own rate_card, which can change independently. Scoped to
-- workspace_id and RLS'd exactly like rate_card / scope_library (see
-- 0005_add_rate_card.sql, 0007_add_scope_library.sql).

CREATE TABLE fee_resourcing_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  riba_stage    SMALLINT NOT NULL CHECK (riba_stage BETWEEN 0 AND 7),
  project_type  TEXT NOT NULL,
  grade         TEXT NOT NULL,                  -- free text — matches founder's own rate_card grades, not a fixed enum
  hours         NUMERIC(6,2) NOT NULL CHECK (hours >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, riba_stage, project_type, grade)
);

-- Index for dashboard queries (list resourcing templates by workspace)
CREATE INDEX idx_fee_resourcing_templates_workspace ON fee_resourcing_templates(workspace_id);

ALTER TABLE fee_resourcing_templates ENABLE ROW LEVEL SECURITY;

-- Same shape as rate_card_workspace_owner / scope_library_workspace_owner —
-- workspace owner can CRUD their own resourcing templates, nothing else.
CREATE POLICY "fee_resourcing_templates_workspace_owner" ON fee_resourcing_templates
  FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

CREATE TRIGGER fee_resourcing_templates_updated_at
  BEFORE UPDATE ON fee_resourcing_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
