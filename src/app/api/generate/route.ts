// @ts-nocheck

// @ts-nocheck
 
 /**
 * POST /api/generate
 *... (rest of the JSDoc)
 * AI proposal generation endpoint — the core wedge.
 * Security measures applied:
 * - Clerk auth required (middleware guards this route + defence-in-depth check here)
 * - Strictest rate limit (2/min, 10/day per user)
 * - Input validated + length-capped before touching the AI layer
 * - All AI calls server-side only (API key never leaves the server)
 * - Generic errors to client; full detail logged server-side
 * - Repair-retry once on malformed JSON; safe fallback after that
 * - AI generation metadata logged for cost monitoring + abuse detection
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkGenerationRateLimit } from "@/lib/rate-limit";
import { validateInput, generateProposalSchema, proposalContentSchema, type GenerateProposalInput } from "@/lib/validation";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { getAnthropicClient, GENERATION_MODEL, GENERATION_LIMITS } from "@/lib/anthropic";
import {
  buildSystemPrompt,
  buildUserMessage,
  proposalTool,
  buildFallbackContent,
} from "@/lib/prompt";
import type { ProposalContent } from "@/types/database";

export async function POST(req: Request) {
  let workspaceId: string | null = null;
  let proposalId: string | null = null;
  let inputTokens = 0;
  let outputTokens = 0;
  let generationSuccess = false;
  let errorCode: string | null = null;

  try {
    // 1. Auth — Clerk middleware already guards this route, but verify here too
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // 2. Rate limiting — check BEFORE parsing body
    const rateLimitResponse = await checkGenerationRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    // 3. Parse + validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validation = validateInput(generateProposalSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }
    // Cast to the OUTPUT type — Zod has applied defaults (currency, tone_preference)
    const input = validation.data as GenerateProposalInput;

    // 4. Get workspace + brand settings
    workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: brandSettings } = await supabase
      .from("brand_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    // 5. Generate with Claude
    const anthropic = getAnthropicClient();
    let content: ProposalContent;

    const callClaude = async (): Promise<{ content: ProposalContent; usage: { input_tokens: number; output_tokens: number } }> => {
      const message = await anthropic.messages.create({
        model: GENERATION_MODEL,
        max_tokens: GENERATION_LIMITS.MAX_OUTPUT_TOKENS,
        system: [
          {
            type: "text",
            text: buildSystemPrompt(brandSettings, input.tone_preference),
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: [proposalTool],
        tool_choice: { type: "tool", name: "generate_proposal" },
        messages: [
          { role: "user", content: buildUserMessage(input) },
        ],
      });

      const toolUse = message.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("No tool_use block in Claude response");
      }

      const parsed = toolUse.input as unknown;
      // Force the currency to match the user's requested currency
      const withCurrency = ensureCurrency(parsed, input.currency || "GBP");
      return { content: withCurrency, usage: message.usage };
    };

    // First attempt
    let attempt1Result: { content: ProposalContent; usage: { input_tokens: number; output_tokens: number } } | null = null;
    try {
      attempt1Result = await callClaude();
      inputTokens += attempt1Result.usage.input_tokens;
      outputTokens += attempt1Result.usage.output_tokens;
    } catch (err) {
      console.error("[generate] First Claude call failed:", err);
      errorCode = "claude_call_failed";
    }

    if (attempt1Result) {
      // Validate the structured output
      const validation1 = proposalContentSchema.safeParse(attempt1Result.content);
      if (validation1.success) {
        content = validation1.data as ProposalContent;
        generationSuccess = true;
      } else {
        // Repair-retry once
        console.warn("[generate] First attempt validation failed, retrying:", validation1.error.issues[0]);
        try {
          const attempt2Result = await callClaude();
          inputTokens += attempt2Result.usage.input_tokens;
          outputTokens += attempt2Result.usage.output_tokens;
          const validation2 = proposalContentSchema.safeParse(attempt2Result.content);
          if (validation2.success) {
            content = validation2.data as ProposalContent;
            generationSuccess = true;
          } else {
            console.error("[generate] Retry also failed validation, using fallback");
            content = buildFallbackContent(input);
            errorCode = "validation_failed_fallback";
          }
        } catch (retryErr) {
          console.error("[generate] Retry Claude call failed:", retryErr);
          content = buildFallbackContent(input);
          errorCode = "retry_failed_fallback";
        }
      }
    } else {
      // First call failed entirely — use fallback
      content = buildFallbackContent(input);
    }

    // 6. Persist proposal
    const { data: proposal, error: insertError } = await supabase
      .from("proposals")
      .insert({
     workspace_id: workspaceId,
     title: extractTitle(content, input.client_name),
     client_name: input.client_name,
     client_email: input.client_email ?? null,
        proposal_type: input.proposal_type,
        content,
        status: "draft",
      } as any)
      .select()
      .single();

    if (insertError || !proposal) {
      console.error("[generate] DB insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create proposal. Please try again." } as any,
        { status: 500 }
      );
    }

    proposalId = (proposal as any).id;

    // 7. Log generation metadata (no full content — just cost/abuse data)
    await supabase.from("ai_generations").insert({
      workspace_id: workspaceId,
      proposal_id: proposalId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      success: generationSuccess,
      error_code: errorCode,
    });

    return NextResponse.json({
      proposal_id: proposal.id,
      share_token: proposal.share_token,
      content: proposal.content,
    });
  } catch (error) {
    console.error("[generate] Unhandled error:", error);

    // Attempt to log the failure if we got far enough
    if (workspaceId) {
      try {
        const supabase = createAdminClient();
        await supabase.from("ai_generations").insert({
          workspace_id: workspaceId,
          proposal_id: proposalId,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          success: false,
          error_code: "unhandled_error",
        });
      } catch {
        // Don't throw from error handler
      }
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTitle(content: ProposalContent, clientName: string): string {
  const heroBlock = content.blocks.find((b) => b.type === "hero");
  if (heroBlock && heroBlock.type === "hero" && heroBlock.title) {
    return heroBlock.title;
  }
  return `Proposal for ${clientName}`;
}

function ensureCurrency(parsed: unknown, currency: string): ProposalContent {
  if (typeof parsed !== "object" || parsed === null) return parsed as ProposalContent;
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.blocks)) return parsed as ProposalContent;

  obj.blocks = (obj.blocks as Array<Record<string, unknown>>).map((block) => {
    if (block.type === "pricing" && !block.currency) {
      return { ...block, currency };
    }
    return block;
  });

  return obj as unknown as ProposalContent;
}
