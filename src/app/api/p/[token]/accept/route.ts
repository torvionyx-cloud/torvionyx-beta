/**
 * app/api/p/[token]/accept/route.ts
 *
 * POST /api/p/[token]/accept
 *
 * Public endpoint — no auth required.
 * Records a client acceptance for a proposal identified by its share_token.
 * Uses the service-role client (bypasses RLS) because there is no user session.
 *
 * Security:
 * - Rate limited by IP
 * - Input validated + length-capped
 * - IP hashed before storage (data minimisation)
 * - Acceptance records are immutable (no UPDATE policy on the table)
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { validateInput, acceptProposalSchema } from "@/lib/validation";
import { checkPublicRateLimit } from "@/lib/rate-limit";
import { sendAcceptanceNotification, getClerkUserEmail } from "@/lib/email";
import { createHash } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Rate limit by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const rateLimitResponse = await checkPublicRateLimit(ip);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validation = validateInput(acceptProposalSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }
    const { signer_name, signer_email } = validation.data;

    const supabase = createAdminClient();

    // Look up proposal by share_token — include fields needed for the notification
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, status, title, client_name, workspace_id")
      .eq("share_token", params.token)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.status === "accepted") {
      return NextResponse.json(
        { error: "This proposal has already been accepted." },
        { status: 409 }
      );
    }

    if (!["shared", "viewed"].includes(proposal.status)) {
      return NextResponse.json(
        { error: "This proposal is not available for acceptance." },
        { status: 403 }
      );
    }

    // Hash the IP for data minimisation (never store raw IPs)
    const ipHash = ip !== "unknown"
      ? createHash("sha256").update(ip + (process.env.PROPOSAL_TOKEN_SECRET ?? "")).digest("hex")
      : null;

    const userAgent = req.headers.get("user-agent") ?? null;

    // Record acceptance (immutable — no DELETE/UPDATE policy on this table)
    await supabase.from("acceptance_records").insert({
      proposal_id: proposal.id,
      signer_name,
      signer_email,
      ip_hash: ipHash,
      user_agent: userAgent?.slice(0, 500) ?? null,
      accepted_at: new Date().toISOString(),
    });

    // Flip proposal status to accepted
    await supabase
      .from("proposals")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    // Log the accepted event
    await supabase.from("proposal_events").insert({
      proposal_id: proposal.id,
      event_type: "accepted",
      metadata: { signer_email },
      ip_hash: ipHash,
      occurred_at: new Date().toISOString(),
    });

    // Send acceptance notification email (best-effort — never fail the acceptance)
    try {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("clerk_user_id")
        .eq("id", proposal.workspace_id)
        .single();

      if (workspace?.clerk_user_id) {
        const ownerEmail = await getClerkUserEmail(workspace.clerk_user_id);
        if (ownerEmail) {
          await sendAcceptanceNotification({
            ownerEmail,
            signerName: signer_name,
            signerEmail: signer_email,
            proposalTitle: proposal.title,
            clientName: proposal.client_name,
            proposalId: proposal.id,
          });
        }
      }
    } catch (emailErr) {
      // Never let email failures surface to the client
      console.error("[accept] Email notification failed:", emailErr);
    }

    return NextResponse.json({ accepted: true });
  } catch (error) {
    console.error("[accept] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
