/**
 * app/api/proposals/[id]/route.ts
 *
 * GET  /api/proposals/[id] — fetch a single proposal (owner only)
 * PUT  /api/proposals/[id] — update proposal content/metadata (owner only)
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { validateInput, updateProposalSchema } from "@/lib/validation";
import { checkGeneralRateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
export async function GET(
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

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", params.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("[proposals/get] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT
// ---------------------------------------------------------------------------
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const rateLimitResponse = await checkGeneralRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validation = validateInput(updateProposalSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    // Verify ownership before update
    const { data: existing } = await supabase
      .from("proposals")
      .select("id")
      .eq("id", params.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("proposals")
      .update(validation.data)
      .eq("id", params.id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error("[proposals/put] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
    }

    return NextResponse.json({ proposal: updated });
  } catch (error) {
    console.error("[proposals/put] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
