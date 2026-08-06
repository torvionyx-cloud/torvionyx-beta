// @ts-nocheck

/**
 * lib/workspace.ts
 *
 * Workspace bootstrapping. Creation and lookup are deliberately split into
 * three functions with different jobs:
 *
 * - createWorkspaceForNewUser() — called ONLY from the Clerk `user.created`
 *   webhook (app/api/webhooks/clerk/route.ts). Normally the sole writer, so
 *   it doesn't need to negotiate a race with anything else.
 * - getWorkspaceId() — the general-purpose lookup, used by every dashboard
 *   sub-page and API route except dashboard/layout.tsx (16 call sites).
 *   Read-primary with a short poll, throws WorkspaceNotReadyError if
 *   exhausted — a real error at these call sites, since by the time any of
 *   them run, dashboard/layout.tsx has already confirmed the workspace
 *   exists (see checkWorkspaceReady below), so genuinely hitting this throw
 *   here means something unexpected happened, not routine onboarding delay.
 * - checkWorkspaceReady() — used ONLY by dashboard/layout.tsx. Single
 *   attempt, never throws for "not found" (returns null instead) — the
 *   layout uses this to decide whether to render the real dashboard or a
 *   client-side provisioning gate that polls until the workspace appears.
 *   See WorkspaceProvisioningGate.tsx and /api/workspace/ready.
 *
 * History: this used to be a single ensureWorkspaceExists() that created the
 * workspace on-demand from the dashboard layout AND page, which raced two
 * concurrent requests against each other on every first load (production
 * digests 1390409018, 4152770121, 2886361760). The webhook removed that
 * dual-writer race. getWorkspaceId()'s server-side retry then still lost a
 * real signup once (digest 579951725) because the SSR poll and the
 * webhook's dispatch are two independently-triggered processes with no
 * ordering guarantee — no server-side budget can be sized reliably against
 * that. checkWorkspaceReady() + client-side polling (Option C) fixes this
 * at the architecture level: the server render never blocks on workspace
 * existence at all.
 *
 * All three functions use the admin client (service role, bypasses RLS):
 * the webhook has no user session at all, and the lookups run before RLS
 * has anything to scope against for a brand-new user. Safe because the
 * caller-supplied clerkUserId always comes from a validated source (the
 * Clerk webhook's verified signature, or auth()'s validated session) — never
 * from user input.
 */

import { createAdminClient } from "@/lib/supabase";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Thrown by getWorkspaceId() when the poll below is exhausted. Distinct
 * from a generic Error so the dashboard error boundary (and logs) can tell
 * "webhook hasn't landed yet" apart from an actual failure. */
export class WorkspaceNotReadyError extends Error {
  constructor() {
    super("Your workspace is still being set up — please refresh in a moment.");
    this.name = "WorkspaceNotReadyError";
  }
}

async function ensureBrandSettingsExist(
  supabase: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  displayName?: string
): Promise<void> {
  const { data: existing } = await supabase
    .from("brand_settings")
    .select("id")
    .eq("workspace_id", workspaceId)
    .single();

  if (existing) return;

  const { error } = await supabase.from("brand_settings").insert({
    workspace_id: workspaceId,
    company_name: displayName ?? "",
    primary_color: "#111111",
    font_choice: "inter",
    about_text: "",
    tone_of_voice: "",
  });

  if (error) {
    console.error("[createWorkspaceForNewUser] brand_settings insert failed:", JSON.stringify(error));
    throw new Error("Failed to create default brand settings");
  }
}

/**
 * Creates a workspace (+ default brand_settings) for a newly-signed-up
 * Clerk user. Called only from the user.created webhook handler.
 *
 * Clerk delivers webhooks at-least-once, so a duplicate user.created event
 * is expected, not exceptional: a unique-violation on the workspace insert
 * means either a plain duplicate delivery, or a retry of an event whose
 * first attempt got partway through (workspace created, brand_settings
 * insert failed, handler returned non-2xx). Both are handled the same way
 * — fetch the existing row, backfill brand_settings if it's missing, return
 * success. No retry/backoff needed anywhere here: a unique-violation proves
 * the conflicting row is already committed, so re-reading it isn't racing
 * anything.
 */
export async function createWorkspaceForNewUser(
  clerkUserId: string,
  displayName?: string
): Promise<string> {
  const supabase = createAdminClient();

  const { data: workspace, error: insertError } = await supabase
    .from("workspaces")
    .insert({ clerk_user_id: clerkUserId, name: displayName ?? "My Workspace" })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing, error: selectError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .single();

      if (!existing) {
        console.error(
          "[createWorkspaceForNewUser] Unique-violation but re-select found nothing:",
          JSON.stringify(selectError)
        );
        throw new Error("Failed to create workspace");
      }

      await ensureBrandSettingsExist(supabase, existing.id, displayName);
      return existing.id;
    }

    console.error("[createWorkspaceForNewUser] Insert failed:", JSON.stringify(insertError));
    throw new Error("Failed to create workspace");
  }

  if (!workspace) throw new Error("Failed to create workspace");

  await ensureBrandSettingsExist(supabase, workspace.id, displayName);
  return workspace.id;
}

// Total budget ~3.5s. Larger than the old dual-writer race's ~1.9s budget
// even though this path should typically resolve much faster (Svix
// delivery is normally sub-second) — there's no concurrent transaction to
// lose a timing race against anymore, so the only real risk left is a
// slow/late webhook delivery. Tune against observed Svix p95 latency if
// this ever needs adjusting.
const WORKSPACE_LOOKUP_RETRY_DELAYS_MS = [0, 250, 500, 1000, 1750];

/**
 * Get the workspace ID for the current user. Read-primary: the workspace
 * should already exist (created by the user.created webhook at sign-up).
 * Polls briefly for the case where the webhook hasn't landed yet — not a
 * write race, just waiting on data that's already on its way.
 */
export async function getWorkspaceId(clerkUserId: string): Promise<string> {
  const supabase = createAdminClient();
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= WORKSPACE_LOOKUP_RETRY_DELAYS_MS.length; attempt++) {
    const delay = WORKSPACE_LOOKUP_RETRY_DELAYS_MS[attempt - 1];
    if (delay > 0) await sleep(delay);

    const { data: existing } = await supabase
      .from("workspaces")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (existing) return existing.id;
  }

  console.error(
    `[getWorkspaceId] workspace not found after ${WORKSPACE_LOOKUP_RETRY_DELAYS_MS.length} attempts (${Date.now() - startedAt}ms) for clerkUserId=${clerkUserId}`
  );
  throw new WorkspaceNotReadyError();
}

/**
 * Single-attempt, non-throwing check — used only by dashboard/layout.tsx to
 * decide whether to render the dashboard or a client-side provisioning gate.
 *
 * Deliberately never throws for "not found": that's an expected, normal
 * return value here (null), not an error. Even a genuine DB error is
 * swallowed to null rather than thrown — the layout only has two states
 * (dashboard / gate), there's no third "something's wrong with the DB" UI,
 * and the gate's own poll + timeout (via /api/workspace/ready) already
 * gives a bounded, user-visible failure path. Throwing here would just
 * reintroduce the uncaught-server-exception failure mode this whole
 * mechanism exists to remove. Full detail is still logged server-side.
 */
export async function checkWorkspaceReady(clerkUserId: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (data) return data.id;

  // PGRST116 = "0 rows" from .single() — the expected not-provisioned-yet
  // case, not an error worth logging.
  if (error && error.code !== "PGRST116") {
    console.error("[checkWorkspaceReady] Unexpected error:", JSON.stringify(error));
  }

  return null;
}
