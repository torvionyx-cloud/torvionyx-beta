// @ts-nocheck

/**
 * lib/proposal-score.ts
 *
 * Prompt building + tool definition for the DRAFTING coach
 * (/api/proposals/[id]/score). Scores a draft proposal across the
 * dimensions that correlate with won work, and returns a specific,
 * actionable coaching note + target block for each weak dimension.
 *
 * This is the pre-send counterpart to lib/coach.ts (which is the
 * post-send closing coach). Server-side only.
 *
 * Design notes:
 * - Proposal blocks have NO id field, so weak dimensions target a block
 *   by ARRAY INDEX (block_index), matching ProposalContent.blocks order.
 * - Scores are deliberately calibrated, not flattering. A coherent
 *   AI-generated first draft should land ~60-78 (endowed-progress floor),
 *   never near 0 — but the floor must come from the draft genuinely being
 *   part-way good, not from inflating the number.
 */

import type {
  BrandSettings,
  Proposal,
  ProposalContent,
  ProposalBlock,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

export const SCORE_DIMENSIONS = [
  "client_centricity",
  "specificity",
  "clear_next_step",
  "pricing_confidence",
  "proof",
  "tone_match",
] as const;

export type ScoreDimensionKey = (typeof SCORE_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<ScoreDimensionKey, string> = {
  client_centricity: "Leads with the client's problem",
  specificity: "Concrete, specific deliverables",
  clear_next_step: "Clear single next step",
  pricing_confidence: "Confident, value-framed pricing",
  proof: "Proof and credibility",
  tone_match: "Matches your brand voice",
};

export type DimensionStatus = "strong" | "okay" | "weak";

export type DimensionScore = {
  key: ScoreDimensionKey;
  label: string;
  score: number; // 0-100
  status: DimensionStatus;
  block_index: number | null; // which block to fix; null if proposal-wide
  coaching_note: string | null; // null when strong
};

export type ProposalScore = {
  overall_score: number; // 0-100
  headline: string;
  dimensions: DimensionScore[];
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export const SCORE_SYSTEM_PROMPT = `You are a proposal strategist who scores a freelancer's or consultant's DRAFT proposal before they send it. Your job is to show them, honestly, how strong the proposal is and exactly what would make it more likely to win — not to flatter them.

You score across six dimensions, each tied to something that genuinely correlates with won work:

1. client_centricity — Does the proposal lead with and centre the CLIENT's problem and desired outcome, or does it talk mostly about the sender ("about us", "our process") too early? Judge this against the original brief: does it show it has truly understood what the client asked for?
2. specificity — Are deliverables, scope, and outcomes concrete and specific, or vague and generic ("high-quality work", "bespoke solutions")? Specific beats vague every time.
3. clear_next_step — Is there a single, obvious, low-friction next step (one clear call to action), or is the ask unclear, missing, or competing with other asks?
4. pricing_confidence — Is pricing framed around value and presented with confidence (clear line items, optionally tiered/options), or is it apologetic, buried, a single bare number, or missing?
5. proof — Is there any credibility signal — a relevant past result, testimonial, a described process that builds trust, or specific expertise — or none at all?
6. tone_match — Does the writing match the sender's stated brand tone of voice? If no brand tone is provided, judge against a professional, warm, confident default.

SCORING RULES (read carefully — calibration matters more than kindness):
- Each dimension is scored 0-100. Overall is your holistic judgement, NOT a simple average — weight client_centricity and specificity most heavily, since they matter most to winning.
- A coherent, complete, on-topic first draft should land roughly 60-78 overall. It already did real work — never score a genuine draft near 0. But a proposal that is genuinely missing pricing, has no CTA, or ignores the brief SHOULD score lower, in the 40s-50s. Do not inflate.
- status: "strong" = 80+, "okay" = 60-79, "weak" = below 60. Be willing to mark things weak when they are.
- coaching_note: ONE sentence, founder-facing, specific to THIS proposal — reference the actual content, never generic advice. Required for "okay" and "weak" dimensions; use null for "strong".
- block_index: the 0-based index of the block in the blocks array that this dimension most relates to and that a rewrite should target. Use null if the issue spans the whole proposal (e.g. proof missing entirely — nothing to point at). When a whole block is MISSING (e.g. no pricing block exists at all), use null and say so in the note.
- headline: one short, honest, encouraging line summarising where the proposal stands and the single highest-leverage improvement. Plain UK English. No hype.

You will be given the proposal as an indexed list of blocks, the original client brief, and the sender's brand tone. Use the score_proposal_strength tool to return your assessment.`;

// ---------------------------------------------------------------------------
// User message — serialise the proposal into something the model can read,
// with block indices so coaching can point at specific blocks.
// ---------------------------------------------------------------------------

export function buildScoreUserMessage(
  proposal: Pick<Proposal, "client_name" | "proposal_type" | "title" | "brief">,
  content: ProposalContent,
  brand: Pick<BrandSettings, "tone_of_voice"> | null
): string {
  const tone = brand?.tone_of_voice?.trim()
    ? brand.tone_of_voice.trim()
    : "Not specified — judge against a professional, warm, confident default.";

  const blockLines = (content.blocks ?? [])
    .map((block, index) => `[Block ${index}] ${describeBlock(block)}`)
    .join("\n\n");

  return `PROPOSAL TO SCORE
- Client name: ${proposal.client_name}
- Proposal type: ${proposal.proposal_type}
- Proposal title: ${proposal.title}

ORIGINAL CLIENT BRIEF (score client_centricity against this)
<brief>
${proposal.brief?.trim() || "No brief recorded."}
</brief>

SENDER'S BRAND TONE OF VOICE (score tone_match against this)
${tone}

PROPOSAL CONTENT (indexed blocks — use these indices for block_index)
${blockLines || "No blocks present."}

Score this proposal across all six dimensions using the score_proposal_strength tool. Be honest and specific.`;
}

/**
 * Render a single block into compact, readable text for the model,
 * tagged with its type. Kept defensive — any field may be missing.
 */
function describeBlock(block: ProposalBlock): string {
  switch (block.type) {
    case "hero":
      return `HERO\n  Title: ${block.title ?? ""}\n  Subtitle: ${block.subtitle ?? ""}\n  Client: ${block.clientName ?? ""}`;
    case "text":
      return `TEXT — ${block.heading ?? "(no heading)"}\n  ${truncate(block.body ?? "", 900)}`;
    case "bullets":
      return `BULLETS — ${block.heading ?? "(no heading)"}\n${(block.items ?? [])
        .map((i) => `  - ${i}`)
        .join("\n")}`;
    case "scope_table":
      return `SCOPE TABLE${block.heading ? ` — ${block.heading}` : ""}\n${(block.rows ?? [])
        .map((r) => `  - ${r.item}: ${r.detail}${r.weeks ? ` (${r.weeks}w)` : ""}`)
        .join("\n")}`;
    case "timeline":
      return `TIMELINE${block.heading ? ` — ${block.heading}` : ""}\n${(block.milestones ?? [])
        .map((m) => `  - ${m.when}: ${m.label}`)
        .join("\n")}`;
    case "pricing":
      return `PRICING (${block.currency ?? "?"})\n${(block.lineItems ?? [])
        .map((li) => `  - ${li.name} x${li.qty} @ ${li.unitPrice}`)
        .join("\n")}${block.vatNote ? `\n  ${block.vatNote}` : ""}`;
    case "cta":
      return `CTA\n  Label: ${block.label ?? ""}`;
    case "terms":
      return `TERMS\n  ${truncate(block.body ?? "", 600)}`;
    case "divider":
      return `DIVIDER`;
    default:
      return `UNKNOWN BLOCK (${(block as any).type})`;
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

// ---------------------------------------------------------------------------
// Tool schema for structured output
// ---------------------------------------------------------------------------

export const scoreTool = {
  name: "score_proposal_strength",
  description:
    "Score a draft proposal across the six dimensions that correlate with won work, returning an honest overall score, a headline, and a per-dimension breakdown with a specific coaching note and target block index for each dimension that isn't already strong.",
  input_schema: {
    type: "object" as const,
    properties: {
      overall_score: {
        type: "integer" as const,
        description:
          "0-100 holistic strength. A coherent complete first draft lands ~60-78. Score genuinely missing/weak proposals lower (40s-50s). Never inflate; never near 0 for a real draft.",
      },
      headline: {
        type: "string" as const,
        description:
          "One short, honest, encouraging line (UK English) summarising where the proposal stands and the single highest-leverage fix. No hype.",
      },
      dimensions: {
        type: "array" as const,
        description: "Exactly six dimension scores, one per dimension key.",
        minItems: 6,
        maxItems: 6,
        items: {
          type: "object" as const,
          properties: {
            key: {
              type: "string" as const,
              enum: SCORE_DIMENSIONS as unknown as string[],
              description: "Which dimension this score is for.",
            },
            score: {
              type: "integer" as const,
              description: "0-100 score for this single dimension.",
            },
            status: {
              type: "string" as const,
              enum: ["strong", "okay", "weak"] as const,
              description: "strong = 80+, okay = 60-79, weak = below 60.",
            },
            block_index: {
              type: ["integer", "null"] as const,
              description:
                "0-based index of the block a rewrite should target for this dimension. null if proposal-wide or the relevant block is missing entirely.",
            },
            coaching_note: {
              type: ["string", "null"] as const,
              description:
                "One sentence, specific to THIS proposal, founder-facing. Required for 'okay'/'weak'; null for 'strong'.",
            },
          },
          required: ["key", "score", "status"] as const,
        },
      },
    },
    required: ["overall_score", "headline", "dimensions"] as const,
  },
};

// ---------------------------------------------------------------------------
// Validation of the model's tool output (light — mirrors coach.ts philosophy,
// no external schema dependency). Returns a clean ProposalScore or null.
// ---------------------------------------------------------------------------

export function validateScoreOutput(raw: unknown): ProposalScore | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  const overall = clampScore(obj.overall_score);
  if (overall === null) return null;

  const headline = typeof obj.headline === "string" && obj.headline.trim() ? obj.headline.trim() : null;
  if (!headline) return null;

  if (!Array.isArray(obj.dimensions)) return null;

  const byKey = new Map<ScoreDimensionKey, DimensionScore>();
  for (const d of obj.dimensions) {
    if (typeof d !== "object" || d === null) continue;
    const dim = d as Record<string, unknown>;
    const key = dim.key as ScoreDimensionKey;
    if (!SCORE_DIMENSIONS.includes(key)) continue;

    const score = clampScore(dim.score);
    if (score === null) continue;

    const status: DimensionStatus =
      dim.status === "strong" || dim.status === "okay" || dim.status === "weak"
        ? dim.status
        : score >= 80
        ? "strong"
        : score >= 60
        ? "okay"
        : "weak";

    const block_index =
      typeof dim.block_index === "number" && Number.isInteger(dim.block_index) && dim.block_index >= 0
        ? dim.block_index
        : null;

    const coaching_note =
      status === "strong"
        ? null
        : typeof dim.coaching_note === "string" && dim.coaching_note.trim()
        ? dim.coaching_note.trim()
        : null;

    byKey.set(key, {
      key,
      label: DIMENSION_LABELS[key],
      score,
      status,
      block_index,
      coaching_note,
    });
  }

  // Require all six dimensions present — otherwise treat as invalid.
  if (byKey.size !== SCORE_DIMENSIONS.length) return null;

  return {
    overall_score: overall,
    headline,
    dimensions: SCORE_DIMENSIONS.map((k) => byKey.get(k)!),
  };
}

function clampScore(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, Math.round(v)));
}

// ---------------------------------------------------------------------------
// Deterministic fallback — used if Claude fails or returns invalid output.
// Computes a rough but HONEST structural score from the blocks present, so
// the endpoint stays useful even when the model call can't be trusted.
// Deliberately conservative: structure can only tell us so much.
// ---------------------------------------------------------------------------

export function buildFallbackScore(content: ProposalContent): ProposalScore {
  const blocks = content.blocks ?? [];
  const indexOfType = (t: ProposalBlock["type"]) => blocks.findIndex((b) => b.type === t);

  const heroIdx = indexOfType("hero");
  const pricingIdx = indexOfType("pricing");
  const ctaIdx = indexOfType("cta");

  const textBlocks = blocks.filter((b) => b.type === "text");
  const bulletBlocks = blocks.filter((b) => b.type === "bullets");

  // Heuristics — coarse, but anchored to real signals.
  const hasUnderstanding = textBlocks.some((b) =>
    /understand|your needs|your challenge|your goal/i.test(`${(b as any).heading ?? ""}`)
  );
  const hasProof = textBlocks.some((b) =>
    /about|why|experience|result|testimonial|track record/i.test(`${(b as any).heading ?? ""}`)
  );
  const deliverableCount = bulletBlocks.reduce(
    (n, b) => n + ((b as any).items?.length ?? 0),
    0
  );
  const pricingBlock = pricingIdx >= 0 ? (blocks[pricingIdx] as any) : null;
  const lineItemCount = pricingBlock?.lineItems?.length ?? 0;

  const dim = (
    key: ScoreDimensionKey,
    score: number,
    block_index: number | null,
    note: string | null
  ): DimensionScore => {
    const status: DimensionStatus = score >= 80 ? "strong" : score >= 60 ? "okay" : "weak";
    return {
      key,
      label: DIMENSION_LABELS[key],
      score,
      status,
      block_index,
      coaching_note: status === "strong" ? null : note,
    };
  };

  const dimensions: DimensionScore[] = [
    dim(
      "client_centricity",
      hasUnderstanding ? 72 : 58,
      heroIdx >= 0 ? heroIdx : null,
      hasUnderstanding ? null : "Add a section that reflects the client's specific problem back to them before talking about your solution."
    ),
    dim(
      "specificity",
      deliverableCount >= 5 ? 75 : deliverableCount >= 1 ? 64 : 50,
      bulletBlocks.length ? blocks.indexOf(bulletBlocks[0]) : null,
      deliverableCount >= 5 ? null : "List more concrete, specific deliverables so the client knows exactly what they're getting."
    ),
    dim(
      "clear_next_step",
      ctaIdx >= 0 ? 82 : 45,
      ctaIdx >= 0 ? ctaIdx : null,
      ctaIdx >= 0 ? null : "There's no clear call to action — add a single, obvious next step at the end."
    ),
    dim(
      "pricing_confidence",
      lineItemCount >= 2 ? 70 : lineItemCount === 1 ? 60 : 42,
      pricingIdx >= 0 ? pricingIdx : null,
      lineItemCount >= 2 ? null : pricingIdx >= 0
        ? "Break pricing into clear line items (or tiered options) so it reads as considered value, not a bare number."
        : "There's no pricing block — add one with clear line items."
    ),
    dim(
      "proof",
      hasProof ? 72 : 52,
      null,
      hasProof ? null : "Add a credibility signal — a relevant result, short testimonial, or a sentence on your track record."
    ),
    dim(
      "tone_match",
      68,
      null,
      "Read it aloud once to check it sounds like your brand voice — the model couldn't verify tone automatically here."
    ),
  ];

  // Weighted overall, client_centricity + specificity heaviest.
  const weights: Record<ScoreDimensionKey, number> = {
    client_centricity: 0.25,
    specificity: 0.25,
    clear_next_step: 0.15,
    pricing_confidence: 0.15,
    proof: 0.1,
    tone_match: 0.1,
  };
  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * weights[d.key], 0)
  );

  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];

  return {
    overall_score: overall,
    headline: weakest
      ? `A solid draft to build on — the biggest win right now is strengthening "${weakest.label.toLowerCase()}".`
      : "A solid draft to build on.",
    dimensions,
  };
}