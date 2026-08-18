-- =============================================================================
-- Pitchwright — Rate card (Knowledge section)
-- Migration: 0005_add_rate_card.sql
-- =============================================================================
-- Charge-out rates by staff grade. Private practice data — never surfaced on
-- the public proposal/live-link — used internally to power the fee engine
-- (Phase 2+). Scoped to workspace_id and RLS'd exactly like brand_settings.

CREATE TABLE rate_card (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  grade           TEXT NOT NULL,                 -- e.g. "Director", "Associate"
  hourly_rate     NUMERIC(10,2) NOT NULL CHECK (hourly_rate >= 0),
  effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for dashboard queries (list rates by workspace)
CREATE INDEX idx_rate_card_workspace ON rate_card(workspace_id);

ALTER TABLE rate_card ENABLE ROW LEVEL SECURITY;

-- Same shape as brand_workspace_owner (brand_settings) — workspace owner
-- can CRUD their own rate card, nothing else.
CREATE POLICY "rate_card_workspace_owner" ON rate_card
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

CREATE TRIGGER rate_card_updated_at
  BEFORE UPDATE ON rate_card
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
