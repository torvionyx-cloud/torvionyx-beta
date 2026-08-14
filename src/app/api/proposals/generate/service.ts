// @ts-nocheck

import { APIError } from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase";
import {
  getAnthropicClient,
  GENERATION_MODEL,
  GENERATION_LIMITS,
} from "@/lib/anthropic";
import {
  buildSystemPrompt,
  buildUserMessage,
  proposalTool,
  buildFallbackContent,
  applyVatDefault,
} from "@/lib/prompt";
import { proposalContentSchema, type GenerateProposalInput } from "@/lib/validation";
import type { BrandSettings, Proposal, ProposalContent } from "@/types/database";

export type GenerateProposalResult = {
  proposal: Proposal;
  content: ProposalContent;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  errorCode: string | null;
};

// ---------------------------------------------------------------------------
// Retry wrapper around the raw Anthropic call
//
// Distinct from — and layered underneath — the existing "retry once if the
// parsed content fails schema validation" logic below. This layer only
// concerns itself with the API call itself failing transiently: network
// errors, rate limits, and Anthropic-side 5xx/overload. A 400/401/404 means
// the request itself is wrong and retrying won't fix it, so those fail fast.
// ---------------------------------------------------------------------------

const MAX_CLAUDE_ATTEMPTS = 3;
// Delay AFTER attempt 1 fails (before attempt 2), then AFTER attempt 2 fails
// (before attempt 3).
const CLAUDE_RETRY_DELAYS_MS = [1000, 2000];
const CLAUDE_TIMEOUT_MS = 55_000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 529]);

/** Thrown once all retry attempts are exhausted. */
export class ProposalGenerationError extends Error {
  cause?: unknown;
  constructor(cause?: unknown) {
    super("proposal_generation_failed");
    this.name = "ProposalGenerationError";
    this.cause = cause;
  }
}

function isRetryableClaudeError(err: unknown): boolean {
  if (err instanceof APIError) {
    // status is undefined for connection-level failures (APIConnectionError,
    // APIConnectionTimeoutError) — always transient, always retry.
    if (err.status === undefined) return true;
    return RETRYABLE_STATUS_CODES.has(err.status);
  }
  // Not a recognised SDK error shape — don't guess, don't retry.
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callClaudeWithRetry(
  anthropic: ReturnType<typeof getAnthropicClient>,
  params: Parameters<ReturnType<typeof getAnthropicClient>["messages"]["create"]>[0]
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_CLAUDE_ATTEMPTS; attempt++) {
    try {
      return await anthropic.messages.create(params, { timeout: CLAUDE_TIMEOUT_MS });
    } catch (err) {
      lastError = err;
      const attemptsRemain = attempt < MAX_CLAUDE_ATTEMPTS;
      if (!attemptsRemain || !isRetryableClaudeError(err)) break;

      const delayMs = CLAUDE_RETRY_DELAYS_MS[attempt - 1];
      const status = err instanceof APIError ? err.status ?? "network" : "unknown";
      console.warn(
        `[generateProposalForWorkspace] Claude call attempt ${attempt} failed (status: ${status}) — retrying in ${delayMs}ms`
      );
      await sleep(delayMs);
    }
  }

  console.error("[generateProposalForWorkspace] All Claude call attempts exhausted:", lastError);
  throw new ProposalGenerationError(lastError);
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export async function generateProposalForWorkspace(
  workspaceId: string,
  input: GenerateProposalInput
): Promise<GenerateProposalResult> {
  const supabase = createAdminClient();

  const { data: brandSettings, error: brandError } = await supabase
    .from("brand_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (brandError) {
    console.error("[generateProposalForWorkspace] Failed to load brand settings:", brandError);
    throw new Error("Failed to load brand settings");
  }

  let content: ProposalContent;
  let inputTokens = 0;
  let outputTokens = 0;
  let success = false;
  let errorCode: string | null = null;

  const callClaude = async () => {
    const anthropic = getAnthropicClient();
    const message = await callClaudeWithRetry(anthropic, {
      model: GENERATION_MODEL,
      max_tokens: GENERATION_LIMITS.MAX_OUTPUT_TOKENS,
      system: [
        {
          type: "text",
          text: buildSystemPrompt(brandSettings as BrandSettings | null, input.tone_preference),
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [proposalTool],
      tool_choice: { type: "tool", name: "generate_proposal" },
      messages: [{ role: "user", content: buildUserMessage(input) }],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("No tool_use block in Claude response");
    }

    const parsed = toolUse.input as unknown;
    const withCurrency = ensureCurrency(parsed, input.currency ?? "GBP");
    return { content: withCurrency, usage: message.usage };
  };

  const attemptCall = async () => {
    try {
      const result = await callClaude();
      inputTokens += result.usage.input_tokens;
      outputTokens += result.usage.output_tokens;
      return result.content;
    } catch (err) {
      console.error("[generateProposalForWorkspace] Claude call failed:", err);
      throw err;
    }
  };

  try {
    const firstResult = await attemptCall();
    const validation = proposalContentSchema.safeParse(firstResult);
    if (validation.success) {
      content = validation.data as ProposalContent;
      success = true;
    } else {
      console.warn(
        "[generateProposalForWorkspace] First generation validation failed:",
        validation.error.issues[0]
      );
      try {
        const retryResult = await attemptCall();
        const retryValidation = proposalContentSchema.safeParse(retryResult);
        if (retryValidation.success) {
          content = retryValidation.data as ProposalContent;
          success = true;
        } else {
          console.error(
            "[generateProposalForWorkspace] Retry validation failed:",
            retryValidation.error.issues[0]
          );
          content = buildFallbackContent(input);
          errorCode = "validation_failed_fallback";
        }
      } catch (retryError) {
        console.error("[generateProposalForWorkspace] Retry Claude call failed:", retryError);
        content = buildFallbackContent(input);
        errorCode = "retry_failed_fallback";
      }
    }
  } catch (generationError) {
    console.error("[generateProposalForWorkspace] Generation failed, using fallback:", generationError);
    content = buildFallbackContent(input);
    errorCode = "claude_call_failed";
  }

  content = applyVatDefault(content, brandSettings as BrandSettings | null);

  const title = extractTitle(content, input.client_name);
  const { data: proposal, error: insertError } = await supabase
    .from("proposals")
    .insert({
      workspace_id: workspaceId,
      title,
      client_name: input.client_name,
      client_email: input.client_email ?? null,
      status: "draft",
      brief: input.brief,
      content,
      proposal_type: input.proposal_type,
      template: input.template ?? "custom",
    })
    .select()
    .single();

  if (insertError || !proposal) {
    console.error("[generateProposalForWorkspace] Failed to insert proposal:", insertError);
    throw new Error("Failed to create proposal");
  }

  await supabase.from("ai_generations").insert({
    workspace_id: workspaceId,
    proposal_id: proposal.id,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    success,
    error_code: errorCode,
  });

  return {
    proposal: proposal as Proposal,
    content,
    inputTokens,
    outputTokens,
    success,
    errorCode,
  };
}

function extractTitle(content: ProposalContent, clientName: string): string {
  const heroBlock = content.blocks.find(
    (block) => block.type === "hero" && typeof (block as any).title === "string"
  );
  if (heroBlock && heroBlock.type === "hero") {
    return (heroBlock as { title?: string }).title ?? `Proposal for ${clientName}`;
  }
  return `Proposal for ${clientName}`;
}

function ensureCurrency(parsed: unknown, currency: string): ProposalContent {
  if (typeof parsed !== "object" || parsed === null) {
    return parsed as ProposalContent;
  }

  const payload = parsed as Record<string, unknown>;
  if (!Array.isArray(payload.blocks)) {
    return parsed as ProposalContent;
  }

  payload.blocks = (payload.blocks as Array<Record<string, unknown>>).map(
    (block) => {
      if (block.type === "pricing" && !block.currency) {
        return { ...block, currency };
      }
      return block;
    }
  );

  return payload as ProposalContent;
}
