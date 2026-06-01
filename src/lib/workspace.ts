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

  // Attempt insert — a concurrent request (layout vs page race in Next.js App
  // Router) may have already inserted the row between our SELECT and INSERT.
  // Postgres unique_violation (23505) is the expected conflict code.
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      clerk_user_id: clerkUserId,
      name: displayName ?? "My Workspace",
    })
    .select("id")
    .single();

  if (workspaceError) {
    if (workspaceError.code === "23505") {
      // Another concurrent call beat us — fetch the row it created.
      const { data: race } = await supabase
        .from("workspaces")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .single();
      if (race) return race.id;
    }
    throw new Error("Failed to create workspace");
  }

  if (!workspace) throw new Error("Failed to create workspace");

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
