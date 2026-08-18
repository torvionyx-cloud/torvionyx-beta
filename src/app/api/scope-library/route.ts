// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/scope-library/route.ts
 *
 * GET    /api/scope-library — list all scope_library rows for the
 *        authenticated workspace (one row per RIBA stage + project type
 *        cell that's been filled in).
 * POST   /api/scope-library — upsert a single cell (riba_stage,
 *        project_type, scope_text), keyed on the table's
 *        (workspace_id, riba_stage, project_type) unique constraint.
 * DELETE /api/scope-library?riba_stage=&project_type= — clear a cell by
 *        removing its row entirely (mirrors rate-card's DELETE, which
 *        removes the row rather than blanking a field). Query params, not
 *        an /[id] path segment, because an empty cell has no row — and
 *        therefore no id — to address in the first place.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import {
  validateInput,
  scopeLibrarySchema,
  scopeLibraryCellQuerySchema,
} from "@/lib/validation";
import { checkGeneralRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const rateLimitResponse = await checkGeneralRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: rows, error: selectError } = await supabase
      .from("scope_library")
      .select()
      .eq("workspace_id", workspaceId)
      .order("riba_stage", { ascending: true })
      .order("project_type", { ascending: true });

    if (selectError) {
      console.error("[scope-library/get] Select error:", selectError);
      return NextResponse.json({ error: "Failed to load scope library" }, { status: 500 });
    }

    return NextResponse.json({ rows: rows ?? [] });
  } catch (error) {
    console.error("[scope-library/get] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const validation = validateInput(scopeLibrarySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: cell, error: upsertError } = await supabase
      .from("scope_library")
      .upsert(
        { ...validation.data, workspace_id: workspaceId },
        { onConflict: "workspace_id,riba_stage,project_type" }
      )
      .select()
      .single();

    if (upsertError || !cell) {
      console.error("[scope-library/post] Upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to save cell" }, { status: 500 });
    }

    return NextResponse.json({ cell });
  } catch (error) {
    console.error("[scope-library/post] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const rateLimitResponse = await checkGeneralRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const validation = validateInput(scopeLibraryCellQuerySchema, {
      riba_stage: searchParams.get("riba_stage"),
      project_type: searchParams.get("project_type"),
    });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    // No existence check before deleting (unlike rate-card's /[id] DELETE):
    // rate-card's id always names a real row, so "not found" is anomalous.
    // A scope-library cell is addressed by (riba_stage, project_type)
    // whether or not a row was ever saved for it, so deleting an
    // already-empty cell is a normal, idempotent no-op, not an error.
    // workspace_id is still part of the filter, so this can never touch
    // another workspace's row.
    const { error: deleteError } = await supabase
      .from("scope_library")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("riba_stage", validation.data.riba_stage)
      .eq("project_type", validation.data.project_type);

    if (deleteError) {
      console.error("[scope-library/delete] Delete error:", deleteError);
      return NextResponse.json({ error: "Failed to clear cell" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[scope-library/delete] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
