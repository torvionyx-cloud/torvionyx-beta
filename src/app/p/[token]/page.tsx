// @ts-nocheck

/**
 * app/p/[token]/page.tsx
 *
 * Public proposal live link — no auth required.
 * Renders the proposal branded and beautifully, and provides an accept flow.
 *
 * Security notes:
 * - The share_token is a 256-bit cryptographically random hex string (unguessable)
 * - No auth required, but the token must be known to access the proposal
 * - View events are logged server-side; IP is hashed before storage
 * - force-dynamic to ensure view logging happens on every request
 */

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { ProposalRenderer } from "@/components/proposals/ProposalRenderer";
import type { Proposal, BrandSettings } from "@/types/database";
import { createHash } from "crypto";
import AcceptSection from "./AcceptSection";
import PrintButton from "./PrintButton";
import { headers } from "next/headers";

interface PageProps {
  params: { token: string };
}

export default async function PublicProposalPage({ params }: PageProps) {
  const supabase = createAdminClient();

  // Look up proposal by share_token
  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("share_token", params.token)
    .single();

  if (!proposal) notFound();

  // Declined/expired proposals show a message instead
  if (proposal.status === "declined" || proposal.status === "expired") {
    return <ProposalUnavailable status={proposal.status} />;
  }

  // Fetch brand settings for the proposal's workspace
  const { data: brand } = await supabase
    .from("brand_settings")
    .select("*")
    .eq("workspace_id", proposal.workspace_id)
    .single();

  // Log a view event and update status if shared → viewed
  await logViewEvent(proposal, supabase);

  const primaryColor = brand?.primary_color ?? "#111111";

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media print {
          section { break-inside: avoid; }
          table { break-inside: avoid; }
          h2 { break-after: avoid; }
          li { break-inside: avoid; }
          tr { break-inside: avoid; }
        }
      `}</style>

      {/* Brand header */}
      <header className="border-b border-neutral-100 print:hidden">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo_url}
                alt={brand.company_name || "Logo"}
                className="h-7 w-auto"
              />
            ) : (
              <span className="font-semibold text-neutral-900 text-sm">
                {brand?.company_name || ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-400">Proposal</span>
            <PrintButton />
          </div>
        </div>
      </header>

      {/* Proposal content */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <ProposalRenderer content={proposal.content} brand={brand} />

        {/* Accept section — interactive, hidden when printing */}
        <div className="print:hidden">
          <AcceptSection
            proposal={proposal as unknown as Proposal}
            brand={brand as unknown as BrandSettings | null}
            primaryColor={primaryColor}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 mt-16 print:hidden">
        <div className="mx-auto max-w-3xl px-6 py-6 text-center">
          <p className="text-xs text-neutral-300">
            Created with{" "}
            <span className="font-medium" style={{ color: primaryColor }}>
              Torvionyx
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Server-side view event logging
// ---------------------------------------------------------------------------

async function logViewEvent(
  proposal: { id: string; status: string; workspace_id: string },
  supabase: ReturnType<typeof createAdminClient>
) {
  try {
    const headersList = headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const ipHash =
      ip !== "unknown"
        ? createHash("sha256")
            .update(ip + (process.env.PROPOSAL_TOKEN_SECRET ?? ""))
            .digest("hex")
        : null;

    await supabase.from("proposal_events").insert({
      proposal_id: proposal.id,
      event_type: "viewed",
      metadata: {},
      ip_hash: ipHash,
      occurred_at: new Date().toISOString(),
    });

    if (proposal.status === "shared") {
      await supabase
        .from("proposals")
        .update({ status: "viewed" })
        .eq("id", proposal.id);
    }
  } catch (err) {
    console.error("[p/token] View event logging failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Unavailable state
// ---------------------------------------------------------------------------

function ProposalUnavailable({ status }: { status: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-sm px-6">
        <p className="text-3xl mb-5 text-neutral-300">—</p>
        <h1 className="text-xl font-semibold text-neutral-900">
          {status === "declined" ? "Proposal declined" : "Proposal unavailable"}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {status === "declined"
            ? "This proposal has been declined."
            : "This proposal link is no longer active."}
        </p>
      </div>
    </div>
  );
}