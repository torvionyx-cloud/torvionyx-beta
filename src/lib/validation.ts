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
});

export type BrandSettingsInput = z.infer<typeof brandSettingsSchema>;

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
});

export type GenerateProposalInput = z.infer<typeof generateProposalSchema>;
export type Currency = typeof CURRENCIES[number];
export type TonePreference = typeof TONE_PREFERENCES[number];

// ---------------------------------------------------------------------------
// Proposal update (from editor)
// ---------------------------------------------------------------------------

// Per-block schemas — required fields enforced per type
const heroBlockSchema = z.object({
  type: z.literal("hero"),
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).optional(),
  clientName: z.string().min(1).max(200),
});

const textBlockSchema = z.object({
  type: z.literal("text"),
  heading: z.string().min(1).max(300),
  body: z.string().min(1).max(10000),
});

const bulletsBlockSchema = z.object({
  type: z.literal("bullets"),
  heading: z.string().min(1).max(300),
  items: z.array(z.string().min(1).max(500)).min(1).max(20),
});

const scopeTableRowSchema = z.object({
  item: z.string().min(1).max(300),
  detail: z.string().max(500),
  weeks: z.number().int().min(0).max(520).optional(),
});
const scopeTableBlockSchema = z.object({
  type: z.literal("scope_table"),
  heading: z.string().max(300).optional(),
  rows: z.array(scopeTableRowSchema).min(1).max(50),
});

const timelineMilestoneSchema = z.object({
  label: z.string().min(1).max(300),
  when: z.string().min(1).max(200),
});
const timelineBlockSchema = z.object({
  type: z.literal("timeline"),
  heading: z.string().max(300).optional(),
  milestones: z.array(timelineMilestoneSchema).min(1).max(30),
});

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
});

const ctaBlockSchema = z.object({
  type: z.literal("cta"),
  label: z.string().min(1).max(100),
});

const termsBlockSchema = z.object({
  type: z.literal("terms"),
  body: z.string().min(1).max(10000),
});

const dividerBlockSchema = z.object({
  type: z.literal("divider"),
});

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
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).max(300).trim().optional(),
  client_name: z.string().min(1).max(200).trim().optional(),
  client_email: z.string().email().optional().nullable(),
  content: proposalContentSchema.optional(),
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
