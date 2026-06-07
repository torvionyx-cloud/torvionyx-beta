// @ts-nocheck

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
    const message = await anthropic.messages.create({
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
