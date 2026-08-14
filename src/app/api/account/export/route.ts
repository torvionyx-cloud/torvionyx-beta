// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/account/export/route.ts
 *
 * POST /api/account/export
 *
 * Data export isn't built yet — this stub returns 501 so the "Export my
 * data" button on the settings page can show a clear "not available yet"
 * state instead of a raw network error. Auth-gated and rate-limited like
 * every other authenticated route, even though it does no work yet.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkGeneralRateLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const rateLimitResponse = await checkGeneralRateLimit(userId);
    if (rateLimitResponse) return rateLimitResponse;

    return NextResponse.json(
      { error: "Data export isn't available yet." },
      { status: 501 }
    );
  } catch (error) {
    console.error("[account/export] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
