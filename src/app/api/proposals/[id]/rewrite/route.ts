// @ts-nocheck

export const dynamic = "force-dynamic";

/**
 * app/api/proposals/[id]/rewrite/route.ts
 *
 * POST /api/proposals/[id]/rewrite
 * Body: { block_index: number, coaching_note?: string }
 *
 * Rewrites ONE block of a proposal to fix a specific weakness (from the
 * proposal-strength scorer), swapping only that block back into the stored
 * content. All other blocks — including any the user has hand-edited — are
 * preserved exactly.
 *
 * Mirrors the regenerate route's structure, but:
 * - scoped to a single block
 * - uses the scoring rate limiter (editor-side, frequent, cheap) rather than
 *   the generation budget
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { checkScoringRateLimit } from "@/lib/rate-limit";
import { validateInput, proposalContentSchema } from "@/lib/validation";
import { getAnthropicClient, GENERATION_MODEL, GENERATION_LIMITS } from "@/lib/anthropic";
import {
  buildSystemPrompt,
  buildBlockRewriteMessage,
  proposalTool,
} from "@/lib/prompt";
import type { ProposalContent } from "@/types/database";
import type { GenerateProposalInput } from "@/lib/validation";

const rewriteSchema = z.object({
  block_index: z.number().int().min(0),
  coaching_note: z.string().max(500).nullish(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let workspaceId: string | null = null;
  let inputTokens = 0;
  let outputTokens = 0;
  let success = false;
  let errorCode: string | null = null;

  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // 2. Rate limit (shares the scoring bucket — editor-side AI calls)
    const rateLimitResponse = await checkScoringRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    // 3. Validate body
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validation = validateInput(rewriteSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }
    const { block_index, coaching_note } = validation.data;

    // 4. Load proposal scoped to workspace
    workspaceId = await getWorkspaceId(userId);
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

    const currentContent = proposal.content as ProposalContent;
    if (
      !currentContent ||
      !Array.isArray(currentContent.blocks) ||
      block_index < 0 ||
      block_index >= currentContent.blocks.length
    ) {
      return NextResponse.json(
        { error: "That section no longer exists in this proposal." },
        { status: 422 }
      );
    }

    const { data: brandSettings } = await supabase
      .from("brand_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    // Reconstruct the generation input (same shape regenerate uses)
    const existingPricingBlock = currentContent.blocks.find((b) => b.type === "pricing");
    const currency =
      existingPricingBlock && existingPricingBlock.type === "pricing"
        ? existingPricingBlock.currency
        : "GBP";

    const input: GenerateProposalInput = {
      client_name: proposal.client_name,
      client_email: proposal.client_email ?? undefined,
      proposal_type: proposal.proposal_type as GenerateProposalInput["proposal_type"],
      brief: proposal.brief,
      currency: currency as GenerateProposalInput["currency"],
      tone_preference: "balanced",
    };

    const anthropic = getAnthropicClient();

    const callClaude = async () => {
      const message = await anthropic.messages.create({
        model: GENERATION_MODEL,
        max_tokens: GENERATION_LIMITS.MAX_OUTPUT_TOKENS,
        system: [
          {
            type: "text",
            text: buildSystemPrompt(brandSettings, "balanced"),
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: [proposalTool],
        tool_choice: { type: "tool", name: "generate_proposal" },
        messages: [
          {
            role: "user",
            content: buildBlockRewriteMessage(
              input,
              currentContent,
              block_index,
              coaching_note ?? null
            ),
          },
        ],
      });

      const toolUse = message.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("No tool_use block in response");
      }
      return { raw: toolUse.input as unknown, usage: message.usage };
    };

    // Call Claude, validate, retry once, else give up gracefully (no fallback
    // here — on failure we leave the proposal untouched rather than replacing
    // a single block with a template).
    let rewrittenContent: ProposalContent | null = null;
    try {
      const result = await callClaude();
      inputTokens += result.usage.input_tokens;
      outputTokens += result.usage.output_tokens;

      const parsed = proposalContentSchema.safeParse(result.raw);
      if (parsed.success) {
        rewrittenContent = parsed.data as ProposalContent;
      } else {
        const retry = await callClaude();
        inputTokens += retry.usage.input_tokens;
        outputTokens += retry.usage.output_tokens;
        const parsed2 = proposalContentSchema.safeParse(retry.raw);
        if (parsed2.success) {
          rewrittenContent = parsed2.data as ProposalContent;
        } else {
          errorCode = "validation_failed";
        }
      }
    } catch (err) {
      console.error("[rewrite] Claude call failed:", err);
      errorCode = "claude_call_failed";
    }

    if (!rewrittenContent) {
      // Log the failed attempt, but don't touch the proposal.
      await supabase.from("ai_generations").insert({
        workspace_id: workspaceId,
        proposal_id: params.id,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        success: false,
        error_code: errorCode ?? "rewrite_failed",
      });
      return NextResponse.json(
        { error: "Couldn't rewrite that section. Please try again." },
        { status: 502 }
      );
    }

    // Pull out ONLY the rewritten target block and swap it into the existing
    // content. Everything else (including user edits) is preserved.
    const newBlock = rewrittenContent.blocks[block_index];

    // Safety: the model must have returned a block at that index of the same type.
    if (!newBlock || newBlock.type !== currentContent.blocks[block_index].type) {
      await supabase.from("ai_generations").insert({
        workspace_id: workspaceId,
        proposal_id: params.id,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        success: false,
        error_code: "block_type_mismatch",
      });
      return NextResponse.json(
        { error: "Couldn't rewrite that section cleanly. Please try again." },
        { status: 502 }
      );
    }

    const mergedBlocks = currentContent.blocks.map((b, i) =>
      i === block_index ? newBlock : b
    );
    const mergedContent: ProposalContent = { ...currentContent, blocks: mergedBlocks };

    const { data: updated, error: updateError } = await supabase
      .from("proposals")
      .update({ content: mergedContent })
      .eq("id", params.id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (updateError) {
      console.error("[rewrite] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save the rewrite." }, { status: 500 });
    }

    success = true;

    await supabase.from("ai_generations").insert({
      workspace_id: workspaceId,
      proposal_id: params.id,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      success: true,
      error_code: null,
    });

    // Return the full updated content + which block changed, so the editor
    // can swap it in state without a full reload.
    return NextResponse.json({
      content: updated?.content,
      block_index,
      block: newBlock,
    });
  } catch (error) {
    console.error("[rewrite] Unhandled error:", error);
    if (workspaceId) {
      try {
        const supabase = createAdminClient();
        await supabase.from("ai_generations").insert({
          workspace_id: workspaceId,
          proposal_id: params.id,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          success: false,
          error_code: "unhandled_error",
        });
      } catch {
        // don't throw from the error handler
      }
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}