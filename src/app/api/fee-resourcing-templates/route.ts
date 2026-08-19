// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/fee-resourcing-templates/route.ts
 *
 * GET    /api/fee-resourcing-templates — list all fee_resourcing_templates
 *        rows for the authenticated workspace (one row per RIBA stage +
 *        project type + grade line that's been added).
 * POST   /api/fee-resourcing-templates — upsert a single resourcing line
 *        (riba_stage, project_type, grade, hours), keyed on the table's
 *        (workspace_id, riba_stage, project_type, grade) unique constraint.
 * DELETE /api/fee-resourcing-templates?riba_stage=&project_type=&grade= —
 *        remove one line by that same key. Query params, not an /[id] path
 *        segment, same reasoning as scope-library's DELETE — a line that
 *        was never added has no row, and therefore no id, to address.
 *
 * Mirrors app/api/scope-library/route.ts exactly, with grade as the extra
 * key dimension (scope_library's cell holds one value; this one holds a
 * list of grade+hours lines per cell).
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import {
  validateInput,
  feeResourcingTemplateSchema,
  feeResourcingTemplateCellQuerySchema,
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
      .from("fee_resourcing_templates")
      .select()
      .eq("workspace_id", workspaceId)
      .order("riba_stage", { ascending: true })
      .order("project_type", { ascending: true })
      .order("grade", { ascending: true });

    if (selectError) {
      console.error("[fee-resourcing-templates/get] Select error:", selectError);
      return NextResponse.json({ error: "Failed to load fee resourcing templates" }, { status: 500 });
    }

    return NextResponse.json({ rows: rows ?? [] });
  } catch (error) {
    console.error("[fee-resourcing-templates/get] Unhandled error:", error);
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

    const validation = validateInput(feeResourcingTemplateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: line, error: upsertError } = await supabase
      .from("fee_resourcing_templates")
      .upsert(
        { ...validation.data, workspace_id: workspaceId },
        { onConflict: "workspace_id,riba_stage,project_type,grade" }
      )
      .select()
      .single();

    if (upsertError || !line) {
      console.error("[fee-resourcing-templates/post] Upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to save line" }, { status: 500 });
    }

    return NextResponse.json({ line });
  } catch (error) {
    console.error("[fee-resourcing-templates/post] Unhandled error:", error);
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
    const validation = validateInput(feeResourcingTemplateCellQuerySchema, {
      riba_stage: searchParams.get("riba_stage"),
      project_type: searchParams.get("project_type"),
      grade: searchParams.get("grade"),
    });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    // No existence check before deleting, same reasoning as scope-library's
    // DELETE: a line is addressed by (riba_stage, project_type, grade)
    // whether or not it was ever saved, so deleting one that isn't there is
    // a normal, idempotent no-op, not an error. workspace_id is still part
    // of the filter, so this can never touch another workspace's row.
    const { error: deleteError } = await supabase
      .from("fee_resourcing_templates")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("riba_stage", validation.data.riba_stage)
      .eq("project_type", validation.data.project_type)
      .eq("grade", validation.data.grade);

    if (deleteError) {
      console.error("[fee-resourcing-templates/delete] Delete error:", deleteError);
      return NextResponse.json({ error: "Failed to remove line" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[fee-resourcing-templates/delete] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
