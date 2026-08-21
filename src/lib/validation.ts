// @ts-nocheck

/**
 * lib/validation.ts
 *
 * Zod schemas for all user-supplied inputs.
 * Every API route validates its payload against these schemas before
 * any DB or AI call. Oversized or malformed payloads are rejected at the edge.
 *
 * Principle: treat every input as potentially hostile.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex colour (e.g. #1A2B3C)");

const url = z.string().url().max(500);

// ---------------------------------------------------------------------------
// Brand settings
// ---------------------------------------------------------------------------

export const ALLOWED_FONTS = [
  "inter",
  "playfair",
  "dm-sans",
  "libre-baskerville",
  "space-grotesk",
  "bricolage-grotesque",
] as const;

export const brandSettingsSchema = z.object({
  company_name: z.string().min(1).max(100).trim(),
  logo_url: url.optional().nullable(),
  primary_color: hexColor,
  secondary_color: hexColor.optional().nullable(),
  font_choice: z.enum(ALLOWED_FONTS),
  about_text: z.string().max(2000).trim(),
  tone_of_voice: z.string().max(500).trim(),
  // Optional — only VAT-registered workspaces set this. Loose format check
  // since VAT number formats vary by country; not validated against HMRC.
  vat_number: z
    .string()
    .trim()
    .max(20)
    .regex(/^[A-Za-z0-9 ]*$/, "VAT number can only contain letters, numbers and spaces")
    .optional()
    .nullable(),
});

export type BrandSettingsInput = z.infer<typeof brandSettingsSchema>;

// ---------------------------------------------------------------------------
// Rate card (Knowledge section) — charge-out rates by staff grade.
// Never shown to clients; feeds the fee engine. Grade is free text (the
// founder's own titles), not a fixed enum.
// ---------------------------------------------------------------------------

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date in YYYY-MM-DD format");

export const rateCardSchema = z.object({
  grade: z.string().min(1).max(100).trim(),
  hourly_rate: z.number().min(0).max(100_000),
  effective_from: isoDate,
});

export type RateCardInput = z.infer<typeof rateCardSchema>;

export const updateRateCardSchema = rateCardSchema.partial();

export type UpdateRateCardInput = z.infer<typeof updateRateCardSchema>;

// ---------------------------------------------------------------------------
// Projects (Knowledge section) — a practice's past projects, pulled into
// proposals as "relevant experience". Sector/project type are fixed enums
// (drive the Projects tab's dropdowns); everything else is free text/numeric.
// Image upload is a second pass — no image field yet.
// ---------------------------------------------------------------------------

export const PROJECT_SECTORS = [
  "Residential",
  "Commercial",
  "Education",
  "Healthcare",
  "Other",
] as const;

export const PROJECT_TYPES = [
  "Residential Extension",
  "New-Build Residential",
  "Small Commercial",
  "Refurbishment",
  "Feasibility/Planning",
  "Other",
] as const;

// Fee basis — hourly vs lump-sum pricing presentation for resolved stage
// fee lines (proposal creation rework, Phase A). Distinct from
// proposal_type (which picks AI document structure): this picks how the
// fee engine presents resolved numbers. Null until set — same
// optional/nullable pattern as project_type on updateProposalSchema below.
export const FEE_BASIS = ["hourly", "lump_sum"] as const;

export const projectSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  sector: z.enum(PROJECT_SECTORS),
  project_type: z.enum(PROJECT_TYPES),
  location: z.string().min(1).max(200).trim(),
  construction_value: z.number().min(0).max(1_000_000_000).nullable(),
  year_completed: z.number().int().min(1900).max(2100).nullable(),
  // RIBA Plan of Work stages 0-7. Deduplicated + sorted so the same set
  // always persists the same way regardless of toggle order.
  riba_stages_delivered: z
    .array(z.number().int().min(0).max(7))
    .max(8)
    .transform(stages => Array.from(new Set(stages)).sort((a, b) => a - b)),
  description: z.string().max(4000).trim(),
  outcome: z.string().max(300).trim(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const updateProjectSchema = projectSchema.partial();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ---------------------------------------------------------------------------
// Scope library (Knowledge section) — reusable scope-of-works text keyed by
// RIBA stage + project type, pulled into proposal generation as boilerplate
// scope language. project_type reuses PROJECT_TYPES (above) so library
// entries stay aligned with the same project types used on the Projects tab.
// ---------------------------------------------------------------------------

export const scopeLibrarySchema = z.object({
  riba_stage: z.number().int().min(0).max(7),
  project_type: z.enum(PROJECT_TYPES),
  scope_text: z.string().max(4000).trim(),
});

export type ScopeLibraryInput = z.infer<typeof scopeLibrarySchema>;

// Identifies a single cell for DELETE, where riba_stage arrives as a query
// string and needs coercing to a number rather than parsed from JSON.
export const scopeLibraryCellQuerySchema = z.object({
  riba_stage: z.coerce.number().int().min(0).max(7),
  project_type: z.enum(PROJECT_TYPES),
});

export type ScopeLibraryCellInput = z.infer<typeof scopeLibraryCellQuerySchema>;

// ---------------------------------------------------------------------------
// Fee resourcing templates (Knowledge section) — reusable resourcing lines
// keyed by RIBA stage + project type + grade, each holding an hours value.
// Multiple lines can share a (riba_stage, project_type) "cell" — one per
// grade — pulled into the fee engine (Phase 2+) alongside rate_card to
// compute a fee subtotal. project_type reuses PROJECT_TYPES like
// scope_library; grade is free text, same reasoning as rate_card.grade — it
// must match whatever grades the founder has defined there, which can
// change independently and isn't a fixed enum.
// ---------------------------------------------------------------------------

export const feeResourcingTemplateSchema = z.object({
  riba_stage: z.number().int().min(0).max(7),
  project_type: z.enum(PROJECT_TYPES),
  grade: z.string().min(1).max(100).trim(),
  hours: z.number().min(0).max(9999.99),
});

export type FeeResourcingTemplateInput = z.infer<typeof feeResourcingTemplateSchema>;

// Identifies a single line for DELETE, where riba_stage arrives as a query
// string and needs coercing to a number rather than parsed from JSON.
export const feeResourcingTemplateCellQuerySchema = z.object({
  riba_stage: z.coerce.number().int().min(0).max(7),
  project_type: z.enum(PROJECT_TYPES),
  grade: z.string().min(1).max(100).trim(),
});

export type FeeResourcingTemplateCellInput = z.infer<typeof feeResourcingTemplateCellQuerySchema>;

// ---------------------------------------------------------------------------
// Proposal generation intake
// ---------------------------------------------------------------------------

export const PROPOSAL_TYPES = [
  "service_proposal",
  "project_quote",
  "retainer_proposal",
  "consultancy_proposal",
  "photography_proposal",
] as const;

export const CURRENCIES = ["GBP", "USD", "EUR"] as const;
export const TONE_PREFERENCES = ["concise", "balanced", "detailed"] as const;
// Kept in sync with the DB check constraints on proposals.template and
// brand_settings.default_template, and with lib/themes.ts's ProposalTemplateId.
export const PROPOSAL_TEMPLATES = [
  "custom",
  "monochrome",
  "warm_studio",
  "midnight",
  "corporate",
  "gradient",
  "developer",
] as const;

export const generateProposalSchema = z.object({
  client_name: z.string().min(1).max(200).trim(),
  client_email: z.string().email().optional().nullable(),
  proposal_type: z.enum(PROPOSAL_TYPES),
  // The user's brief / call notes — hard cap at 4000 chars to limit prompt injection surface
  brief: z
    .string()
    .min(20, "Brief must be at least 20 characters")
    .max(4000, "Brief must be under 4000 characters")
    .trim(),
  // Optional pricing hint — AI will suggest line items if omitted
  budget_hint: z.string().max(200).optional().nullable(),
  // Currency defaults to GBP (UK-focused product)
  currency: z.enum(CURRENCIES).default("GBP"),
  // Tone/length preference for the generated copy
  tone_preference: z.enum(TONE_PREFERENCES).default("balanced"),
  // Presentation theme for the generated proposal
  template: z.enum(PROPOSAL_TEMPLATES).default("custom"),
  // RIBA project type — optional at intake (Phase B). Reuses PROJECT_TYPES,
  // same nullable/optional pattern as updateProposalSchema.project_type
  // below. Not yet wired into the Claude generation call itself (Phase C) —
  // Claude still writes the full proposal; any RIBA stages selected at
  // intake are added afterward via the existing handleAddStage() flow.
  project_type: z.enum(PROJECT_TYPES).optional().nullable(),
});

export type GenerateProposalInput = z.infer<typeof generateProposalSchema>;
export type Currency = typeof CURRENCIES[number];
export type TonePreference = typeof TONE_PREFERENCES[number];
export type ProposalTemplate = typeof PROPOSAL_TEMPLATES[number];

// ---------------------------------------------------------------------------
// Proposal update (from editor)
// ---------------------------------------------------------------------------

// Per-block schemas — required fields enforced per type.
// .strict() on every block schema: an AI-generated (or malicious) block
// carrying unexpected extra keys should fail validation outright rather
// than have those keys silently stripped — matches the app's "treat every
// input as potentially hostile" principle for anything that touches Claude's
// output before it's persisted.
const heroBlockSchema = z.object({
  type: z.literal("hero"),
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).optional(),
  clientName: z.string().min(1).max(200),
}).strict();

const textBlockSchema = z.object({
  type: z.literal("text"),
  heading: z.string().min(1).max(300),
  body: z.string().min(1).max(10000),
}).strict();

const bulletsBlockSchema = z.object({
  type: z.literal("bullets"),
  heading: z.string().min(1).max(300),
  items: z.array(z.string().min(1).max(500)).min(1).max(20),
}).strict();

const scopeTableRowSchema = z.object({
  item: z.string().min(1).max(300),
  detail: z.string().max(500),
  weeks: z.number().int().min(0).max(520).optional(),
});
const scopeTableBlockSchema = z.object({
  type: z.literal("scope_table"),
  heading: z.string().max(300).optional(),
  rows: z.array(scopeTableRowSchema).min(1).max(50),
}).strict();

const timelineMilestoneSchema = z.object({
  label: z.string().min(1).max(300),
  when: z.string().min(1).max(200),
});
const timelineBlockSchema = z.object({
  type: z.literal("timeline"),
  heading: z.string().max(300).optional(),
  milestones: z.array(timelineMilestoneSchema).min(1).max(30),
}).strict();

const pricingLineItemSchema = z.object({
  name: z.string().min(1).max(300),
  qty: z.number().int().min(1).max(10000),
  unitPrice: z.number().min(0).max(10_000_000),
  description: z.string().max(500).optional(),
});
const pricingBlockSchema = z.object({
  type: z.literal("pricing"),
  heading: z.string().max(300).optional(),
  currency: z.enum(["GBP", "USD", "EUR"]),
  lineItems: z.array(pricingLineItemSchema).min(1).max(50),
  showTotals: z.boolean(),
  vatNote: z.string().max(300).optional(),
  vatEnabled: z.boolean().optional(),
  vatRate: z.number().min(0).max(100).optional(),
}).strict();

const ctaBlockSchema = z.object({
  type: z.literal("cta"),
  heading: z.string().max(300).optional(),
  label: z.string().min(1).max(100),
}).strict();

const termsBlockSchema = z.object({
  type: z.literal("terms"),
  heading: z.string().max(300).optional(),
  body: z.string().min(1).max(10000),
}).strict();

const dividerBlockSchema = z.object({
  type: z.literal("divider"),
  heading: z.string().max(300).optional(),
}).strict();

const blockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  textBlockSchema,
  bulletsBlockSchema,
  scopeTableBlockSchema,
  timelineBlockSchema,
  pricingBlockSchema,
  ctaBlockSchema,
  termsBlockSchema,
  dividerBlockSchema,
]);

export const proposalContentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(blockSchema).max(50),
  stagesAdded: z
    .array(z.number().int().min(0).max(7))
    .max(8)
    .transform(stages => Array.from(new Set(stages)).sort((a, b) => a - b))
    .optional(),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).max(300).trim().optional(),
  client_name: z.string().min(1).max(200).trim().optional(),
  client_email: z.string().email().optional().nullable(),
  content: proposalContentSchema.optional(),
  project_type: z.enum(PROJECT_TYPES).optional().nullable(),
  fee_basis: z.enum(FEE_BASIS).optional().nullable(),
  status: z
    .enum(["draft", "shared", "viewed", "accepted", "declined", "expired"])
    .optional(),
});

export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;

// ---------------------------------------------------------------------------
// Client acceptance (public endpoint — no auth)
// ---------------------------------------------------------------------------

export const acceptProposalSchema = z.object({
  // Share token is passed in the URL, not the body
  signer_name: z
    .string()
    .min(2, "Please enter your full name")
    .max(200)
    .trim(),
  signer_email: z.string().email("Please enter a valid email address"),
});

export type AcceptProposalInput = z.infer<typeof acceptProposalSchema>;

// ---------------------------------------------------------------------------
// Analytics event (public endpoint)
// ---------------------------------------------------------------------------

export const proposalEventSchema = z.object({
  event_type: z.enum([
    "viewed",
    "section_viewed",
    "accepted",
    "declined",
    "shared",
    "regenerated",
  ]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export type ProposalEventInput = z.infer<typeof proposalEventSchema>;

// ---------------------------------------------------------------------------
// Follow-up coach — ranked strategies generated from engagement signals
// ---------------------------------------------------------------------------

export const followUpStrategySchema = z.object({
  rank: z.number().int().min(1).max(5),
  title: z.string().min(1).max(120).trim(),
  why: z.string().min(1).max(600).trim(),
  suggested_copy: z.string().min(1).max(2000).trim(),
});

export const followUpStrategiesSchema = z.object({
  strategies: z.array(followUpStrategySchema).min(3).max(5),
});

export type FollowUpStrategy = z.infer<typeof followUpStrategySchema>;
export type FollowUpStrategies = z.infer<typeof followUpStrategiesSchema>;

// ---------------------------------------------------------------------------
// Clerk webhooks — only the fields we actually read from evt.data, not a
// full Clerk user object schema. Field names are Clerk's webhook/REST
// representation (snake_case) — distinct from the SDK's camelCase
// currentUser() shape used elsewhere (see lib/workspace.ts).
// ---------------------------------------------------------------------------

export const clerkUserCreatedSchema = z.object({
  id: z.string().min(1).max(100),
  first_name: z.string().max(200).trim().nullable().optional(),
  last_name: z.string().max(200).trim().nullable().optional(),
  username: z.string().max(200).trim().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Validation helper — returns typed result or throws a structured error
// ---------------------------------------------------------------------------

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Return a human-readable error without leaking internal schema details
  const firstError = result.error.errors[0];
  return {
    success: false,
    error: firstError
      ? `${firstError.path.join(".")}: ${firstError.message}`
      : "Invalid input",
  };
}
