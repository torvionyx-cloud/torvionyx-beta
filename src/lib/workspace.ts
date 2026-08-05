// @ts-nocheck

/**
 * lib/workspace.ts
 *
 * Workspace bootstrapping — called server-side on first sign-in.
 * Creates a workspace + default brand settings for a new Clerk user.
 * Uses the admin client (service role) because the user doesn't have a
 * workspace row yet, so RLS would block the insert.
 *
 * Safe because: (a) only runs server-side, (b) we verify the Clerk user ID
 * comes from the validated Clerk session — not user input.
 */

import { createAdminClient } from "@/lib/supabase";

export async function ensureWorkspaceExists(
  clerkUserId: string,
  displayName?: string
): Promise<string> {
  const supabase = createAdminClient();

  // Check if workspace already exists
  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (existing) return existing.id;

  // Atomic upsert — a concurrent request (layout vs page race in Next.js App
  // Router) may insert this user's row between our SELECT above and here.
  // ON CONFLICT DO NOTHING (ignoreDuplicates: true) lets Postgres resolve
  // that race in a single statement instead of us branching on a Postgres
  // error code after a plain INSERT.
  //
  // Note: when the upsert hits a real conflict, DO NOTHING means Postgres
  // does not RETURNING the pre-existing row — RETURNING only ever reflects
  // rows actually written by *this* statement. So on conflict, `workspace`
  // below comes back null and we still need one fallback SELECT to fetch the
  // row the other call created. That's expected, not a leftover bug.
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .upsert(
      { clerk_user_id: clerkUserId, name: displayName ?? "My Workspace" },
      { onConflict: "clerk_user_id", ignoreDuplicates: true }
    )
    .select("id")
    .single();

  if (workspaceError || !workspace) {
    if (workspaceError) {
      console.error("[ensureWorkspaceExists] Upsert returned no row:", JSON.stringify(workspaceError));
    }

    // Another concurrent call beat us — fetch the row it created.
    const { data: race, error: raceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (race) return race.id;

    // No error swallowed this time — if the recovery SELECT also failed
    // (rather than the row genuinely not existing), we'll see why here
    // instead of just "Failed to create workspace" with no context.
    if (raceError) {
      console.error("[ensureWorkspaceExists] Recovery select failed:", JSON.stringify(raceError));
    }
    throw new Error("Failed to create workspace");
  }

  // Create default brand settings for the new workspace
  await supabase.from("brand_settings").insert({
    workspace_id: workspace.id,
    company_name: displayName ?? "",
    primary_color: "#111111",
    font_choice: "inter",
    about_text: "",
    tone_of_voice: "",
  });

  return workspace.id;
}

/**
 * Get the workspace ID for the current user.
 * Delegates to ensureWorkspaceExists so the workspace is always created if
 * missing — guards against the layout/page concurrent-render race in Next.js
 * App Router where the page can run before the layout's bootstrap completes.
 */
export async function getWorkspaceId(clerkUserId: string): Promise<string> {
  return ensureWorkspaceExists(clerkUserId);
}
