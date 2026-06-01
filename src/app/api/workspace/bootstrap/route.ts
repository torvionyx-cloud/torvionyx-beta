// @ts-nocheck

// @ts-nocheck

// @ts-nocheck

/**
 * app/api/workspace/bootstrap/route.ts
 *
 * POST /api/workspace/bootstrap
 *
 * Called once after a new user's first sign-in to create their workspace
 * and default brand settings. Idempotent — safe to call multiple times.
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureWorkspaceExists } from "@/lib/workspace";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // Get the user's display name from Clerk for the workspace default
    const user = await currentUser();
    const displayName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName ?? undefined;

    const workspaceId = await ensureWorkspaceExists(userId, displayName);

    return NextResponse.json({ workspace_id: workspaceId });
  } catch (error) {
    console.error("[workspace/bootstrap] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialise workspace." },
      { status: 500 }
    );
  }
}
