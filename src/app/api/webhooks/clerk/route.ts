// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/webhooks/clerk/route.ts
 *
 * POST /api/webhooks/clerk
 *
 * Public endpoint — Clerk's servers call this, not a signed-in user. Trust
 * comes entirely from Svix signature verification (CLERK_WEBHOOK_SIGNING_SECRET),
 * not from a Clerk session — see middleware.ts's isPublicRoute.
 *
 * Handles `user.created` only: creates the new user's workspace + default
 * brand settings via createWorkspaceForNewUser(). All other event types are
 * acknowledged (200) without action, so Clerk doesn't retry events we don't
 * care about.
 *
 * Security:
 * - Missing signing secret hard-fails (500), unlike lib/email.ts's pattern
 *   of gracefully no-op'ing on a missing optional key — a silent no-op here
 *   means new users never get a workspace, discovered only when the
 *   (now-broken) dashboard fails later.
 * - Body size capped before signature verification.
 * - Raw body read via req.text() before anything else touches it — Svix
 *   verification needs the exact raw bytes; req.json() would consume the
 *   stream and break verification.
 * - Unverified/tampered requests get a generic 401, no detail in the body.
 * - Clerk's "at-least-once" delivery means duplicate/retried events are
 *   expected — createWorkspaceForNewUser() handles that idempotently.
 */

import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createWorkspaceForNewUser } from "@/lib/workspace";
import { validateInput, clerkUserCreatedSchema } from "@/lib/validation";

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(req: Request) {
  try {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error("[webhooks/clerk] CLERK_WEBHOOK_SIGNING_SECRET is not configured");
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // Raw text, read before anything else touches the body — Svix verifies
    // against these exact bytes.
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    let evt: { type: string; data: unknown };
    try {
      evt = new Webhook(signingSecret).verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("[webhooks/clerk] Signature verification failed:", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    if (evt.type !== "user.created") {
      // Not an event we act on — acknowledge so Clerk doesn't retry it.
      return NextResponse.json({ ok: true, ignored: evt.type });
    }

    const validation = validateInput(clerkUserCreatedSchema, evt.data);
    if (!validation.success) {
      console.error("[webhooks/clerk] user.created payload failed validation:", validation.error, JSON.stringify(evt.data));
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { id, first_name, last_name, username } = validation.data;

    // Snake_case fields from Clerk's webhook payload — distinct from the SDK's
    // camelCase currentUser() shape used in dashboard/layout.tsx. Same intent,
    // different source, not shared code.
    const displayName =
      first_name && last_name
        ? `${first_name} ${last_name}`
        : first_name ?? username ?? undefined;

    await createWorkspaceForNewUser(id, displayName);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhooks/clerk] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
