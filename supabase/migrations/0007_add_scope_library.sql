-- =============================================================================
-- Pitchwright — Scope library (Knowledge section)
-- Migration: 0007_add_scope_library.sql
-- =============================================================================
-- Reusable scope-of-works text keyed by RIBA stage + project type, pulled
-- into proposal generation as boilerplate scope language. Scoped to
-- workspace_id and RLS'd exactly like rate_card / projects (see
-- 0005_add_rate_card.sql, 0006_add_projects.sql).

CREATE TABLE scope_library (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  riba_stage    SMALLINT NOT NULL CHECK (riba_stage BETWEEN 0 AND 7),
  project_type  TEXT NOT NULL,
  scope_text    TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, riba_stage, project_type)
);

-- Index for dashboard queries (list scope entries by workspace)
CREATE INDEX idx_scope_library_workspace ON scope_library(workspace_id);

ALTER TABLE scope_library ENABLE ROW LEVEL SECURITY;

-- Same shape as rate_card_workspace_owner / projects_workspace_owner —
-- workspace owner can CRUD their own scope library, nothing else.
CREATE POLICY "scope_library_workspace_owner" ON scope_library
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

CREATE TRIGGER scope_library_updated_at
  BEFORE UPDATE ON scope_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
