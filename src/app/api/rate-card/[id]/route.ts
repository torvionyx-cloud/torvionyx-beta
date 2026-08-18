// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/rate-card/[id]/route.ts
 *
 * PUT    /api/rate-card/[id] — update one grade's rate/effective date (owner only)
 * DELETE /api/rate-card/[id] — remove a grade (owner only)
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { validateInput, updateRateCardSchema } from "@/lib/validation";
import { checkGeneralRateLimit } from "@/lib/rate-limit";

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

    const validation = validateInput(updateRateCardSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    // Verify ownership before update
    const { data: existing } = await supabase
      .from("rate_card")
      .select("id")
      .eq("id", params.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("rate_card")
      .update(validation.data)
      .eq("id", params.id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error("[rate-card/put] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save grade" }, { status: 500 });
    }

    return NextResponse.json({ rate: updated });
  } catch (error) {
    console.error("[rate-card/put] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Verify ownership before delete
    const { data: existing } = await supabase
      .from("rate_card")
      .select("id")
      .eq("id", params.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("rate_card")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      console.error("[rate-card/delete] Delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete grade" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[rate-card/delete] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
