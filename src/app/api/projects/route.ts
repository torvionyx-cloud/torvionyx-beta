// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/projects/route.ts
 *
 * POST /api/projects — add a new project to the authenticated workspace's
 * portfolio. GET is unnecessary — the Knowledge page reads projects
 * server-side directly (see dashboard/knowledge/page.tsx), matching how
 * every other dashboard list page is built.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { validateInput, projectSchema } from "@/lib/validation";
import { checkGeneralRateLimit } from "@/lib/rate-limit";

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

    const validation = validateInput(projectSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({ ...validation.data, workspace_id: workspaceId })
      .select()
      .single();

    if (insertError || !project) {
      console.error("[projects/post] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to add project" }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("[projects/post] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
