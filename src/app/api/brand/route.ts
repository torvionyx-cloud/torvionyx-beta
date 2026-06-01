import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
// @ts-nocheck

export const dynamic = 'force-dynamic';
// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

/**
 * app/api/brand/route.ts
 *
 * GET /api/brand — fetch brand settings for the authenticated workspace
 * PUT /api/brand — update brand settings
 */

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

    const { data: brand, error } = await supabase
      .from("brand_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (error || !brand) {
      return NextResponse.json({ error: "Brand settings not found" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (err) {
    console.error("[brand/get] Unhandled error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
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

    const validation = validateInput(brandSettingsSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: brand, error: updateError } = await supabase
      .from("brand_settings")
      .update(validation.data as any as never)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (updateError || !brand) {
      console.error("[brand/put] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save brand settings" }, { status: 500 });
    }

    return NextResponse.json({ brand });
  } catch (err) {
    console.error("[brand/put] Unhandled error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
