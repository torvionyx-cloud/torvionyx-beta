// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/rate-card/route.ts
 *
 * POST /api/rate-card — add a new charge-out grade to the authenticated
 * workspace's rate card. GET is unnecessary — the Rate Card page reads
 * rate_card server-side directly (see dashboard/knowledge/rates/page.tsx),
 * matching how every other dashboard list page is built.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { validateInput, rateCardSchema } from "@/lib/validation";
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

    const validation = validateInput(rateCardSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    const workspaceId = await getWorkspaceId(userId);
    const supabase = createAdminClient();

    const { data: rate, error: insertError } = await supabase
      .from("rate_card")
      .insert({ ...validation.data, workspace_id: workspaceId })
      .select()
      .single();

    if (insertError || !rate) {
      console.error("[rate-card/post] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to add grade" }, { status: 500 });
    }

    return NextResponse.json({ rate });
  } catch (error) {
    console.error("[rate-card/post] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
