// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/proposals/[id]/closing-intelligence/route.ts
 *
 * GET /api/proposals/[id]/closing-intelligence
 *
 * Turns raw proposal_events into actionable "should I follow up, and how"
 * signals for the founder — view counts, section-level engagement, device
 * mix, an overall hot/warm/cold read, and concrete next-step suggestions.
 *
 * Analysis itself lives in lib/engagement.ts so it can be shared with the
 * /coach route, which feeds these same signals to Claude for ranked
 * follow-up strategies.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { getClosingIntelligence } from "@/lib/engagement";

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
    const intelligence = await getClosingIntelligence(params.id, workspaceId);

    if (!intelligence) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error("[closing-intelligence] Unhandled error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
