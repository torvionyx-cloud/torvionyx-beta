// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

/**
 * app/api/proposals/[id]/regenerate/route.ts
 *
 * POST /api/proposals/[id]/regenerate
 *
 * Re-generates the AI content for an existing proposal, updating it in place.
 * Uses the same brief and proposal_type as the original, allowing an optional
 * tone_preference override.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { checkGenerationRateLimit } from "@/lib/rate-limit";
import { validateInput, proposalContentSchema } from "@/lib/validation";
import { z } from "zod";
import { getAnthropicClient, GENERATION_MODEL, GENERATION_LIMITS } from "@/lib/anthropic";
import {
  buildSystemPrompt,
  buildUserMessage,
  proposalTool,
  buildFallbackContent,
} from "@/lib/prompt";
import type { ProposalContent } from "@/types/database";
import type { GenerateProposalInput } from "@/lib/validation";

const regenerateSchema = z.object({
  tone_preference: z.enum(["concise", "balanced", "detailed"]).default("balanced"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const rateLimitResponse = await checkGenerationRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      // body is optional
    }

    const optValidation = validateInput(regenerateSchema, body);
    const tonePreference: "concise" | "balanced" | "detailed" =
      (optValidation.success ? (optValidation.data.tone_preference ?? "balanced") : "balanced") as
        "concise" | "balanced" | "detailed";

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, brief, proposal_type, client_name, client_email, content")
      .eq("id", params.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const { data: brandSettings } = await supabase
      .from("brand_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    // Reconstruct the input for the prompt builder
    const existingPricingBlock = (proposal.content as ProposalContent).blocks.find(
      (b) => b.type === "pricing"
    );
    const currency = existingPricingBlock && existingPricingBlock.type === "pricing"
      ? existingPricingBlock.currency
      : "GBP";

    const input: GenerateProposalInput = {
      client_name: proposal.client_name,
      client_email: proposal.client_email ?? undefined,
      proposal_type: proposal.proposal_type as GenerateProposalInput["proposal_type"],
      brief: proposal.brief,
      currency: currency as GenerateProposalInput["currency"],
      tone_preference: tonePreference as "concise" | "balanced" | "detailed",
    };

    const anthropic = getAnthropicClient();
    let content: ProposalContent;
    let inputTokens = 0;
    let outputTokens = 0;
    let success = false;
    let errorCode: string | null = null;

    const callClaude = async () => {
      const message = await anthropic.messages.create({
        model: GENERATION_MODEL,
        max_tokens: GENERATION_LIMITS.MAX_OUTPUT_TOKENS,
        system: [
          {
            type: "text",
            text: buildSystemPrompt(brandSettings, tonePreference),
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: [proposalTool],
        tool_choice: { type: "tool", name: "generate_proposal" },
        messages: [{ role: "user", content: buildUserMessage(input) }],
      });

      const toolUse = message.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("No tool_use block in response");
      }
      return { raw: toolUse.input as unknown, usage: message.usage };
    };

    try {
      const result = await callClaude();
      inputTokens += result.usage.input_tokens;
      outputTokens += result.usage.output_tokens;

      const parsed = proposalContentSchema.safeParse(result.raw);
      if (parsed.success) {
        content = parsed.data as ProposalContent;
        success = true;
      } else {
        const retry = await callClaude();
        inputTokens += retry.usage.input_tokens;
        outputTokens += retry.usage.output_tokens;
        const parsed2 = proposalContentSchema.safeParse(retry.raw);
        if (parsed2.success) {
          content = parsed2.data as ProposalContent;
          success = true;
        } else {
          content = buildFallbackContent(input);
          errorCode = "validation_failed_fallback";
        }
      }
    } catch (err) {
      console.error("[regenerate] Claude call failed:", err);
      content = buildFallbackContent(input);
      errorCode = "claude_call_failed";
    }

    // Update the proposal with new content
    const { data: updated, error: updateError } = await supabase
      .from("proposals")
      .update({ content })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("[regenerate] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save regenerated content" }, { status: 500 });
    }

    // Log the generation
    await supabase.from("ai_generations").insert({
      workspace_id: workspaceId,
      proposal_id: params.id,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      success,
      error_code: errorCode,
    });

    // Log a regenerated event
    await supabase.from("proposal_events").insert({
      proposal_id: params.id,
      event_type: "regenerated",
      metadata: { tone_preference: tonePreference },
      occurred_at: new Date().toISOString(),
    });

    return NextResponse.json({ content: updated?.content });
  } catch (error) {
    console.error("[regenerate] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
