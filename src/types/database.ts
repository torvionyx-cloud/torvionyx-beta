// @ts-nocheck

/**
 * types/database.ts
 *
 * TypeScript types matching the Supabase Postgres schema.
 * Keep in sync with supabase/migrations/0001_initial_schema.sql.
 *
 * TIP: Once the project is live, replace these hand-written types with
 * auto-generated ones: `npx supabase gen types typescript --local`
 */

export type ProposalStatus =
  | "draft"
  | "shared"
  | "viewed"
  | "accepted"
  | "declined"
  | "expired";

export type ProposalEventType =
  | "viewed"
  | "section_viewed"
  | "accepted"
  | "declined"
  | "shared"
  | "regenerated";

// ---------------------------------------------------------------------------
// Block types (proposal content schema — PRD §7.2)
// ---------------------------------------------------------------------------

export interface HeroBlock {
  type: "hero";
  title: string;
  subtitle?: string;
  clientName: string;
}

export interface TextBlock {
  type: "text";
  heading: string;
  body: string;
}

export interface BulletsBlock {
  type: "bullets";
  heading: string;
  items: string[];
}

export interface ScopeTableRow {
  item: string;
  detail: string;
  weeks?: number;
}

export interface ScopeTableBlock {
  type: "scope_table";
  heading?: string;
  rows: ScopeTableRow[];
}

export interface TimelineMilestone {
  label: string;
  when: string;
}

export interface TimelineBlock {
  type: "timeline";
  heading?: string;
  milestones: TimelineMilestone[];
}

export interface PricingLineItem {
  name: string;
  qty: number;
  unitPrice: number;
  description?: string;
}

export interface PricingBlock {
  type: "pricing";
  heading?: string;
  currency: "GBP" | "USD" | "EUR";
  lineItems: PricingLineItem[];
  showTotals: boolean;
  vatNote?: string;
}

export interface CtaBlock {
  type: "cta";
  label: string;
}

export interface TermsBlock {
  type: "terms";
  body: string;
}

export interface DividerBlock {
  type: "divider";
}

export type ProposalBlock =
  | HeroBlock
  | TextBlock
  | BulletsBlock
  | ScopeTableBlock
  | TimelineBlock
  | PricingBlock
  | CtaBlock
  | TermsBlock
  | DividerBlock;

export interface ProposalContent {
  version: 1;
  blocks: ProposalBlock[];
}

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export interface Workspace {
  id: string;
  clerk_user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface BrandSettings {
  id: string;
  workspace_id: string;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string | null;
  font_choice: string;
  about_text: string;
  tone_of_voice: string;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  workspace_id: string;
  title: string;
  client_name: string;
  client_email: string | null;
  status: ProposalStatus;
  brief: string;
  content: ProposalContent;
  proposal_type: string;
  share_token: string;
  created_at: string;
  updated_at: string;
  shared_at: string | null;
  accepted_at: string | null;
}

export interface AcceptanceRecord {
  id: string;
  proposal_id: string;
  signer_name: string;
  signer_email: string;
  ip_hash: string | null;
  user_agent: string | null;
  accepted_at: string;
}

export interface ProposalEvent {
  id: string;
  proposal_id: string;
  event_type: ProposalEventType;
  metadata: Record<string, unknown>;
  ip_hash: string | null;
  occurred_at: string;
}

export interface AiGeneration {
  id: string;
  workspace_id: string;
  proposal_id: string | null;
  input_tokens: number;
  output_tokens: number;
  success: boolean;
  error_code: string | null;
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Supabase Database type (for createClient<Database> generic)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: Workspace;
        Insert: Omit<Workspace, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Workspace, "id" | "clerk_user_id">>;
      };
      brand_settings: {
        Row: BrandSettings;
        Insert: Omit<BrandSettings, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BrandSettings, "id" | "workspace_id">>;
      };
      proposals: {
        Row: Proposal;
        Insert: Omit<
          Proposal,
          "id" | "share_token" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Omit<Proposal, "id" | "workspace_id" | "share_token" | "created_at">
        >;
      };
      acceptance_records: {
        Row: AcceptanceRecord;
        Insert: Omit<AcceptanceRecord, "id">;
        Update: never; // Immutable
      };
      proposal_events: {
        Row: ProposalEvent;
        Insert: Omit<ProposalEvent, "id">;
        Update: never; // Append-only
      };
      ai_generations: {
        Row: AiGeneration;
        Insert: Omit<AiGeneration, "id" | "generated_at">;
        Update: never;
      };
    };
  };
}
