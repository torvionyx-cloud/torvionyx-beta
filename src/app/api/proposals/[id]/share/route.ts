// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

/**
 * app/api/proposals/[id]/share/route.ts
 *
 * POST /api/proposals/[id]/share
 *
 * Marks a proposal as shared and returns its public URL.
 * Logs a 'shared' event for analytics.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { checkGeneralRateLimit } from "@/lib/rate-limit";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const rateLimitResponse = await checkGeneralRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    // Verify ownership and get share_token
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, share_token, status, shared_at")
      .eq("id", params.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Update status to 'shared' if not already past that point
    const isAlreadyShared = ["shared", "viewed", "accepted", "declined"].includes(proposal.status);
    if (!isAlreadyShared) {
      await supabase
        .from("proposals")
        .update({ status: "shared", shared_at: new Date().toISOString() })
        .eq("id", params.id);

      // Log the share event
      await supabase.from("proposal_events").insert({
        proposal_id: params.id,
        event_type: "shared",
        metadata: {},
        occurred_at: new Date().toISOString(),
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/p/${proposal.share_token}`;

    return NextResponse.json({ share_url: shareUrl, share_token: proposal.share_token });
  } catch (error) {
    console.error("[proposals/share] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
