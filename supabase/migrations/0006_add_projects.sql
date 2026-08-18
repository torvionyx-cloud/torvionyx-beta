-- =============================================================================
-- Pitchwright — Projects (Knowledge section)
-- Migration: 0006_add_projects.sql
-- =============================================================================
-- A practice's past projects — the portfolio pulled into proposals as
-- "relevant experience". Scoped to workspace_id and RLS'd exactly like
-- rate_card (see 0005_add_rate_card.sql). Image upload is a second pass —
-- this migration is data fields only.

CREATE TABLE projects (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  sector                 TEXT NOT NULL,                 -- e.g. "Residential", "Commercial"
  project_type           TEXT NOT NULL,                 -- e.g. "New-Build Residential"
  location               TEXT NOT NULL,
  construction_value     NUMERIC(12,2) CHECK (construction_value >= 0),
  year_completed         INTEGER CHECK (year_completed BETWEEN 1900 AND 2100),
  -- RIBA Plan of Work stages delivered on this project, e.g. {1,2,3,4}.
  -- Each element constrained to 0-7 at the application layer (Zod) — Postgres
  -- array element CHECKs aren't expressible directly, so this is enforced in
  -- lib/validation.ts's projectSchema, not here.
  riba_stages_delivered  INTEGER[] NOT NULL DEFAULT '{}',
  description            TEXT NOT NULL DEFAULT '',
  outcome                TEXT NOT NULL DEFAULT '',       -- e.g. "Planning granted, on site 2025"
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for dashboard queries (list projects by workspace)
CREATE INDEX idx_projects_workspace ON projects(workspace_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Same shape as rate_card_workspace_owner — workspace owner can CRUD their
-- own projects, nothing else.
CREATE POLICY "projects_workspace_owner" ON projects
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

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
