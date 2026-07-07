// @ts-nocheck

export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getWorkspaceId } from "@/lib/workspace";
import { createServerClient } from "@/lib/supabase";
import type { Proposal } from "@/types/database";

function relativeTime(dateString: string): string {
  const ms = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const STATUS_CHIP: Record<string, { label: string; bg: string; color: string }> = {
  draft:    { label: "Draft",    bg: "rgba(250,242,232,.10)", color: "rgba(250,242,232,.5)" },
  shared:   { label: "Sent",     bg: "rgba(61,185,201,.14)",  color: "#3DB9C9" },
  viewed:   { label: "Viewed",   bg: "rgba(242,169,59,.14)",  color: "#F2A93B" },
  accepted: { label: "Accepted", bg: "rgba(95,208,138,.16)",  color: "#5FD08A" },
  declined: { label: "Declined", bg: "rgba(242,99,92,.14)",   color: "#F2635C" },
  expired:  { label: "Expired",  bg: "rgba(250,242,232,.08)", color: "rgba(250,242,232,.35)" },
};

function Chip({ status }: { status: string }) {
  const s = STATUS_CHIP[status] ?? STATUS_CHIP.draft;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontFamily: "monospace", fontSize: 10, fontWeight: 700,
      letterSpacing: ".08em", textTransform: "uppercase",
      padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

export default async function ProposalsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("proposals")
    .select("id, title, client_name, status, proposal_type, share_token, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to load proposals");

  const proposals = (data ?? []) as Proposal[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontWeight: 600, fontSize: 22,
          color: "var(--tv-text)",
          margin: 0,
        }}>
          All proposals
        </h1>
        <Link
          href="/dashboard/new"
          style={{
            background: "#DCAA33",
            color: "#0F1F3D",
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 600, fontSize: 13,
            padding: "8px 18px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          + New proposal
        </Link>
      </div>

      <div className="transition-colors duration-300" style={{
        background: "var(--tv-bg-panel)",
        border: "1px solid var(--tv-border)",
        borderRadius: 14,
        boxShadow: "var(--tv-shadow)",
      }}>
        {proposals.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--tv-text-faint)", fontSize: 13 }}>
            No proposals yet —{" "}
            <Link href="/dashboard/new" style={{ color: "#DCAA33", fontWeight: 500 }}>
              create your first one
            </Link>
          </div>
        ) : (
          <div>
            {proposals.map((p, i) => (
              <Link
                key={p.id}
                href={`/dashboard/${p.id}/edit`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: i < proposals.length - 1 ? "1px solid var(--tv-border-soft)" : "none",
                  textDecoration: "none",
                  gap: 12,
                }}
                className="hover:bg-white/5 transition-colors duration-150"
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: 500, fontSize: 14,
                    color: "var(--tv-text)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    marginBottom: 3,
                  }}>
                    {p.title || "Untitled proposal"}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--tv-text-faint)" }}>
                    {p.client_name} · {relativeTime(p.created_at)}
                  </div>
                </div>
                <Chip status={p.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
