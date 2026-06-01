// @ts-nocheck

/**
 * lib/email.ts
 *
 * Transactional email via Resend.
 * Server-side only — never import this in client components.
 * Fails gracefully when RESEND_API_KEY is not configured.
 */

import { Resend } from "resend";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith("re_REPLACE")) return null;
  return new Resend(apiKey);
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Pitchwright <notifications@pitchwright.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export interface AcceptanceNotificationParams {
  ownerEmail: string;
  signerName: string;
  signerEmail: string;
  proposalTitle: string;
  clientName: string;
  proposalId: string;
}

export async function sendAcceptanceNotification(
  params: AcceptanceNotificationParams
): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping acceptance notification");
    return;
  }

  const editUrl = `${APP_URL}/dashboard/${params.proposalId}/edit`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.ownerEmail,
      subject: `${params.signerName} accepted your proposal`,
      html: buildAcceptanceEmailHtml({ ...params, editUrl }),
    });
    if (error) {
      console.error("[email] Acceptance notification failed:", error);
    }
  } catch (err) {
    console.error("[email] Acceptance notification unhandled error:", err);
  }
}

// ---------------------------------------------------------------------------
// Clerk user email lookup (REST API — avoids SDK version coupling)
// ---------------------------------------------------------------------------

export async function getClerkUserEmail(clerkUserId: string): Promise<string | null> {
  try {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey || secretKey.startsWith("sk_test_REPLACE")) return null;

    const res = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const user = (await res.json()) as {
      email_addresses?: { email_address: string; id: string }[];
      primary_email_address_id?: string;
    };

    // Prefer the primary email address
    const primary = user.email_addresses?.find(
      (e) => e.id === user.primary_email_address_id
    );
    return primary?.email_address ?? user.email_addresses?.[0]?.email_address ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildAcceptanceEmailHtml(
  params: AcceptanceNotificationParams & { editUrl: string }
): string {
  const { signerName, signerEmail, proposalTitle, clientName, editUrl } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Proposal accepted</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f5f5;padding:48px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;max-width:560px;">
        <tr><td style="background:#111111;padding:24px 36px;">
          <span style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-0.01em;">Pitchwright</span>
        </td></tr>
        <tr><td style="padding:36px 36px 0;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;">Proposal Accepted</p>
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;line-height:1.25;">${esc(signerName)} said yes</h1>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.65;">
            <strong style="color:#111827;">${esc(clientName)}</strong> has accepted your proposal.
          </p>
        </td></tr>
        <tr><td style="padding:28px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-radius:8px;">
            <tr><td style="padding:0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr><td style="padding:16px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="display:block;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;">Proposal</span>
                  <span style="font-size:14px;font-weight:600;color:#111827;">${esc(proposalTitle)}</span>
                </td></tr>
                <tr><td style="padding:16px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="display:block;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;">Accepted by</span>
                  <span style="font-size:14px;font-weight:500;color:#111827;">${esc(signerName)}</span>
                </td></tr>
                <tr><td style="padding:16px 0;">
                  <span style="display:block;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;">Contact email</span>
                  <span style="font-size:14px;color:#111827;">${esc(signerEmail)}</span>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 36px 40px;">
          <a href="${editUrl}" style="display:inline-block;padding:12px 24px;background:#111111;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
            View proposal →
          </a>
          <p style="margin:16px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
            Next step: follow up with <strong style="color:#374151;">${esc(signerEmail)}</strong> to kick things off.
          </p>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            You received this because a client accepted a proposal in your Pitchwright account. If this was unexpected, you can safely ignore it.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
