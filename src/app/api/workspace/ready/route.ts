// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/workspace/ready/route.ts
 *
 * GET /api/workspace/ready
 *
 * Polled by WorkspaceProvisioningGate (client component, rendered by
 * dashboard/layout.tsx while a brand-new user's workspace hasn't been
 * created by the Clerk user.created webhook yet). Pure read — this route
 * never creates anything, the webhook remains the sole writer.
 *
 * "Not ready yet" is a normal, expected response (200, ready: false), not
 * an error — the caller polls until it flips to true or gives up itself.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkWorkspaceReady } from "@/lib/workspace";
import { checkGeneralRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const rateLimitResponse = await checkGeneralRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    const workspaceId = await checkWorkspaceReady(userId);

    if (workspaceId) {
      return NextResponse.json({ ready: true, workspaceId });
    }
    return NextResponse.json({ ready: false });
  } catch (error) {
    console.error("[workspace/ready] Unhandled error:", error);
    return NextResponse.json({ error: "Unable to check workspace status" }, { status: 500 });
  }
}
