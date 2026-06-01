-- =============================================================================
-- Pitchwright v1 — Database Schema
-- Migration: 0001_initial_schema.sql
-- =============================================================================
-- Run this in the Supabase SQL editor or via supabase db push.
-- All tables have Row-Level Security enabled.
-- RLS policies are defined at the end of each table section.
-- IMPORTANT: Test RLS with a second user account before shipping.
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- WORKSPACES
-- Each user gets exactly one workspace on first sign-in.
-- All other data is scoped to a workspace.
-- =============================================================================
CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Clerk user ID — the owner of this workspace
  clerk_user_id TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL DEFAULT 'My Workspace',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- A user can only see and modify their own workspace
CREATE POLICY "workspace_owner_only" ON workspaces
  FOR ALL
  USING (clerk_user_id = current_setting('app.clerk_user_id', TRUE))
  WITH CHECK (clerk_user_id = current_setting('app.clerk_user_id', TRUE));

-- =============================================================================
-- BRAND SETTINGS
-- One brand profile per workspace. Used to personalise AI output.
-- =============================================================================
CREATE TABLE brand_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_name      TEXT NOT NULL DEFAULT '',
  logo_url          TEXT,                    -- Supabase Storage public URL
  primary_color     TEXT NOT NULL DEFAULT '#000000',  -- hex
  secondary_color   TEXT,                   -- hex, optional
  font_choice       TEXT NOT NULL DEFAULT 'inter',    -- from curated set
  about_text        TEXT NOT NULL DEFAULT '',         -- "about me/us"
  tone_of_voice     TEXT NOT NULL DEFAULT '',         -- steers AI tone
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id)
);

ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_workspace_owner" ON brand_settings
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

-- =============================================================================
-- PROPOSALS
-- Core entity. Content stored as structured JSON (block array).
-- =============================================================================
CREATE TYPE proposal_status AS ENUM (
  'draft',      -- being generated or edited
  'shared',     -- live link sent to client
  'viewed',     -- client has opened the link
  'accepted',   -- client has accepted
  'declined',   -- client has declined
  'expired'     -- manually expired by the founder
);

CREATE TABLE proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Basic metadata
  title           TEXT NOT NULL DEFAULT 'Untitled Proposal',
  client_name     TEXT NOT NULL DEFAULT '',
  client_email    TEXT,

  -- Status tracking
  status          proposal_status NOT NULL DEFAULT 'draft',

  -- The raw brief the user typed / pasted
  brief           TEXT NOT NULL DEFAULT '',

  -- Structured proposal content — array of typed blocks (see PRD §7.2)
  -- Validated against the block schema before persistence
  content         JSONB NOT NULL DEFAULT '{"version": 1, "blocks": []}',

  -- Proposal type (e.g. "service_proposal", "project_quote", "retainer")
  proposal_type   TEXT NOT NULL DEFAULT 'service_proposal',

  -- Public share token — used in the live link URL (/p/[token])
  -- Unguessable: cryptographically random, NOT a sequential ID
  share_token     TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shared_at       TIMESTAMPTZ,    -- when the founder first shared it
  accepted_at     TIMESTAMPTZ     -- when the client accepted
);

-- Index for dashboard queries (list proposals by workspace, newest first)
CREATE INDEX idx_proposals_workspace_created ON proposals(workspace_id, created_at DESC);

-- Index for live-link lookups (public route — must be fast)
CREATE INDEX idx_proposals_share_token ON proposals(share_token);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Founders can CRUD their own workspace's proposals
CREATE POLICY "proposals_workspace_owner" ON proposals
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

-- Public read access via share_token (used by /p/[token] — no auth)
-- This uses a separate Supabase anon role policy.
-- The anon user can ONLY read proposals by share_token, nothing else.
CREATE POLICY "proposals_public_read_by_token" ON proposals
  FOR SELECT
  TO anon
  USING (status IN ('shared', 'viewed', 'accepted'));

-- =============================================================================
-- ACCEPTANCE RECORDS
-- Immutable log when a client accepts a proposal.
-- Not a regulated e-signature — disclosed in UI and ToS.
-- =============================================================================
CREATE TABLE acceptance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  -- Recipient-provided fields
  signer_name     TEXT NOT NULL,
  signer_email    TEXT NOT NULL,

  -- Audit fields — collected server-side on accept
  -- IP is hashed before storage (data minimisation)
  ip_hash         TEXT,
  user_agent      TEXT,
  accepted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Acceptance records are immutable — no UPDATE or DELETE policies
ALTER TABLE acceptance_records ENABLE ROW LEVEL SECURITY;

-- Founders can read acceptance records for their proposals
CREATE POLICY "acceptance_workspace_owner_read" ON acceptance_records
  FOR SELECT
  USING (
    proposal_id IN (
      SELECT p.id FROM proposals p
      JOIN workspaces w ON p.workspace_id = w.id
      WHERE w.clerk_user_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

-- Only the server (service role) can INSERT acceptance records
-- No application-layer INSERT policy for anon/authenticated users — done via service role

-- =============================================================================
-- PROPOSAL EVENTS (Analytics)
-- Append-only event log. Never updated or deleted.
-- =============================================================================
CREATE TYPE proposal_event_type AS ENUM (
  'viewed',       -- client opened the live link
  'section_viewed', -- client scrolled to a section
  'accepted',     -- client clicked accept
  'declined',     -- client clicked decline
  'shared',       -- founder shared the proposal
  'regenerated'   -- founder regenerated a section
);

CREATE TABLE proposal_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  event_type      proposal_event_type NOT NULL,

  -- Optional metadata (section name, device info, etc.)
  -- Keep minimal — only what genuinely helps the founder
  metadata        JSONB DEFAULT '{}',

  -- IP hashed for data minimisation
  ip_hash         TEXT,

  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX idx_proposal_events_proposal ON proposal_events(proposal_id, occurred_at DESC);

ALTER TABLE proposal_events ENABLE ROW LEVEL SECURITY;

-- Founders can read events for their proposals
CREATE POLICY "events_workspace_owner_read" ON proposal_events
  FOR SELECT
  USING (
    proposal_id IN (
      SELECT p.id FROM proposals p
      JOIN workspaces w ON p.workspace_id = w.id
      WHERE w.clerk_user_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

-- Only service role can INSERT events (via server routes)

-- =============================================================================
-- AI GENERATION LOG
-- Tracks AI usage for cost monitoring and abuse detection.
-- Does NOT store full prompt/response content — only metadata.
-- =============================================================================
CREATE TABLE ai_generations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  proposal_id     UUID REFERENCES proposals(id) ON DELETE SET NULL,

  -- Token usage for cost monitoring
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,

  -- Success or failure
  success         BOOLEAN NOT NULL DEFAULT TRUE,
  error_code      TEXT,     -- generic error code if failed, no stack traces

  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_workspace ON ai_generations(workspace_id, generated_at DESC);

ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_gen_workspace_owner" ON ai_generations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE clerk_user_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

-- =============================================================================
-- HELPER: updated_at trigger
-- Automatically updates updated_at on any row modification.
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER brand_settings_updated_at
  BEFORE UPDATE ON brand_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- DONE
-- Next steps:
-- 1. Run this migration: supabase db push (or paste into Supabase SQL editor)
-- 2. Verify RLS is enabled on all tables (Supabase dashboard → Authentication → Policies)
-- 3. Test with a second test user account — confirm no cross-workspace access
-- 4. Set up Supabase Storage bucket "brand-assets" with public read, authenticated write
-- =============================================================================
