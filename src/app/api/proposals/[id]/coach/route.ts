// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/proposals/[id]/coach/route.ts
 *
 * GET /api/proposals/[id]/coach
 *
 * "Follow-up coach" — takes the engagement signals from lib/engagement.ts
 * (the same analysis behind /closing-intelligence) and asks Claude to turn
 * them into 3-5 ranked, copy-paste-ready follow-up strategies tailored to
 * how this specific client behaved on the live proposal link.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { getClosingIntelligence } from "@/lib/engagement";
import { getAnthropicClient, GENERATION_MODEL, GENERATION_LIMITS } from "@/lib/anthropic";
import {
  COACH_SYSTEM_PROMPT,
  buildCoachUserMessage,
  coachTool,
  buildFallbackStrategies,
} from "@/lib/coach";
import { followUpStrategiesSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("id, title, client_name, proposal_type")
      .eq("id", params.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const intelligence = await getClosingIntelligence(params.id, workspaceId);
    if (!intelligence) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const strategies = await generateStrategies(proposal, intelligence);

    return NextResponse.json({
      strategies,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[coach] Unhandled error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

// ---------------------------------------------------------------------------
// Strategy generation — Claude with a structured tool, validated output,
// one retry on malformed responses, deterministic fallback as last resort.
// ---------------------------------------------------------------------------

async function generateStrategies(
  proposal: { client_name: string; proposal_type: string; title: string },
  intelligence: Awaited<ReturnType<typeof getClosingIntelligence>>
) {
  const anthropic = getAnthropicClient();
  const userMessage = buildCoachUserMessage(proposal, intelligence);

  const callClaude = async () => {
    const message = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: GENERATION_LIMITS.MAX_OUTPUT_TOKENS,
      system: [
        {
          type: "text",
          text: COACH_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [coachTool],
      tool_choice: { type: "tool", name: "suggest_follow_up_strategies" },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("No tool_use block in Claude response");
    }
    return toolUse.input as unknown;
  };

  try {
    const first = await callClaude();
    const validation = followUpStrategiesSchema.safeParse(first);
    if (validation.success) {
      return sortByRank(validation.data.strategies);
    }

    console.warn("[coach] First strategy generation failed validation:", validation.error.issues[0]);
    const retry = await callClaude();
    const retryValidation = followUpStrategiesSchema.safeParse(retry);
    if (retryValidation.success) {
      return sortByRank(retryValidation.data.strategies);
    }

    console.error("[coach] Retry validation failed:", retryValidation.error.issues[0]);
    return buildFallbackStrategies(proposal, intelligence);
  } catch (err) {
    console.error("[coach] Claude call failed, using fallback strategies:", err);
    return buildFallbackStrategies(proposal, intelligence);
  }
}

function sortByRank<T extends { rank: number }>(strategies: T[]): T[] {
  return [...strategies].sort((a, b) => a.rank - b.rank);
}
