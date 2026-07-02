// @ts-nocheck

export const dynamic = "force-dynamic";

/**
 * POST /api/proposals/[id]/score
 *
 * The DRAFTING coach — scores a draft proposal across the six dimensions
 * that correlate with won work and returns per-dimension coaching.
 *
 * Mirrors /api/generate's security posture:
 * - Clerk auth required
 * - Rate limited (scoring is an AI endpoint — see note on the limiter below)
 * - Proposal loaded scoped to the caller's workspace (no cross-workspace read)
 * - All AI calls server-side only
 * - Generic errors to the client; full detail logged server-side
 * - Deterministic fallback if the model fails or returns invalid output
 *
 * This increment is READ-ONLY: it scores and returns. It does not yet
 * persist score history (that's the next increment — the proposal_scores
 * table — which powers the "your average is climbing" line).
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
// NOTE: add checkScoringRateLimit to lib/rate-limit.ts (snippet provided
// alongside this file). It mirrors checkGenerationRateLimit but with more
// generous limits, since scoring is cheaper and runs more often than
// generation and must NOT share the generation budget.
import { checkScoringRateLimit } from "@/lib/rate-limit";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { getAnthropicClient, GENERATION_MODEL } from "@/lib/anthropic";
import {
  SCORE_SYSTEM_PROMPT,
  buildScoreUserMessage,
  scoreTool,
  validateScoreOutput,
  buildFallbackScore,
} from "@/lib/proposal-score";
import type { ProposalContent } from "@/types/database";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // 2. Rate limit (AI endpoint)
    const rateLimitResponse = await checkScoringRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    const proposalId = params.id;
    if (!proposalId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 3. Load the proposal scoped to the caller's workspace.
    //    Selecting by id AND workspace_id is the app-level guard; RLS is the
    //    database-level guard. A proposal from another workspace returns null.
    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("id, title, client_name, proposal_type, brief, content")
      .eq("id", proposalId)
      .eq("workspace_id", workspaceId)
      .single();

    if (proposalError || !proposal) {
      // Same generic message whether it doesn't exist or isn't theirs —
      // never leak which (Standard #8, no cross-workspace inference).
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const content = proposal.content as ProposalContent | null;
    if (!content || !Array.isArray(content.blocks) || content.blocks.length === 0) {
      return NextResponse.json(
        { error: "This proposal has no content to score yet." },
        { status: 422 }
      );
    }

    // 4. Brand tone (for the tone_match dimension). Optional.
    const { data: brand } = await supabase
      .from("brand_settings")
      .select("tone_of_voice")
      .eq("workspace_id", workspaceId)
      .single();

    // 5. Score with Claude.
    let score = null;
    try {
      const anthropic = getAnthropicClient();
      const message = await anthropic.messages.create({
        model: GENERATION_MODEL,
        max_tokens: 1500,
        system: [{ type: "text", text: SCORE_SYSTEM_PROMPT }],
        tools: [scoreTool],
        tool_choice: { type: "tool", name: "score_proposal_strength" },
        messages: [
          {
            role: "user",
            content: buildScoreUserMessage(proposal, content, brand ?? null),
          },
        ],
      });

      const toolUse = message.content.find((b) => b.type === "tool_use");
      if (toolUse && toolUse.type === "tool_use") {
        score = validateScoreOutput(toolUse.input);
      }
    } catch (err) {
      console.error("[score] Claude call failed:", err);
      // fall through to fallback
    }

    // 6. Fallback if the model failed or returned something invalid.
    if (!score) {
      console.warn("[score] Using deterministic fallback for proposal", proposalId);
      score = buildFallbackScore(content);
    }

    return NextResponse.json({ proposal_id: proposalId, score });
  } catch (error) {
    console.error("[score] Unhandled error:", error);
    return NextResponse.json(
      { error: "Something went wrong scoring this proposal. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}