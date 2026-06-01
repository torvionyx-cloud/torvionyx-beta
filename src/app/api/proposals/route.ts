// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

/**
 * app/api/proposals/route.ts
 *
 * GET /api/proposals — list proposals for the authenticated user's workspace
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { checkGeneralRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const rateLimitResponse = await checkGeneralRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: proposals, error } = await supabase
      .from("proposals")
      .select("id, title, client_name, client_email, status, proposal_type, share_token, created_at, updated_at, shared_at, accepted_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[proposals] List error:", error);
      return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
    }

    return NextResponse.json({ proposals: proposals ?? [] });
  } catch (error) {
    console.error("[proposals] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
