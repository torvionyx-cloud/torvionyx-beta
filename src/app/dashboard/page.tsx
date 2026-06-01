// @ts-nocheck

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import type { Proposal } from "@/types/database";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  draft:    { label: "Draft",    dot: "bg-neutral-400",  text: "text-neutral-500 dark:text-gray-400" },
  shared:   { label: "Sent",     dot: "bg-[#0891B2]",    text: "text-[#0891B2]" },
  viewed:   { label: "Viewed",   dot: "bg-purple-500",   text: "text-purple-600 dark:text-purple-400" },
  accepted: { label: "Accepted", dot: "bg-green-500",    text: "text-green-600 dark:text-green-400" },
  declined: { label: "Declined", dot: "bg-red-400",      text: "text-red-500 dark:text-red-400" },
  expired:  { label: "Expired",  dot: "bg-neutral-300",  text: "text-neutral-400 dark:text-gray-500" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function dateGroup(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const item  = new Date(d.getFullYear(),   d.getMonth(),   d.getDate());
  const diff  = Math.round((today.getTime() - item.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)  return "This week";
  if (diff < 30) return "This month";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function groupProposals(list: Proposal[]): { label: string; items: Proposal[] }[] {
  const order: string[] = [];
  const map = new Map<string, Proposal[]>();
  for (const p of list) {
    const g = dateGroup(p.created_at);
    if (!map.has(g)) { order.push(g); map.set(g, []); }
    map.get(g)!.push(p);
  }
  return order.map((label) => ({ label, items: map.get(label)! }));
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-neutral-500 dark:text-gray-400">{label}</span>
        <div className={`rounded-lg p-1.5 ${accent}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-neutral-900 dark:text-[#F3F4F6] tabular-nums">
        {value}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("proposals")
    .select("id, title, client_name, status, proposal_type, share_token, created_at, updated_at, shared_at, accepted_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  const proposals = (data ?? []) as Proposal[];

  // Beta stats — simple counts only
  const stats = {
    total:    proposals.length,
    sent:     proposals.filter((p) => ["shared","viewed","accepted","declined","expired"].includes(p.status)).length,
    viewed:   proposals.filter((p) => ["viewed","accepted","declined"].includes(p.status)).length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
  };

  const groups = groupProposals(proposals);

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (proposals.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-[#F3F4F6]">Your proposals</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-gray-400">Create, send, and track your proposals.</p>
          </div>
          <Link
            href="/dashboard/new"
            className="rounded-lg bg-[#0891B2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0e7490] transition lg:hidden"
          >
            + New proposal
          </Link>
        </div>
        <div className="rounded-xl border-2 border-dashed border-neutral-200 dark:border-[#374151] p-16 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-neutral-100 dark:bg-[#374151] flex items-center justify-center">
            <svg className="text-neutral-400 dark:text-gray-500" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-3-8H9v2h6v-2zm-3-4H9v2h3V8zm3 8H9v2h6v-2z"/>
            </svg>
          </div>
          <h2 className="text-lg font-medium text-neutral-900 dark:text-[#F3F4F6]">No proposals yet</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-gray-400 max-w-xs mx-auto">
            Paste a brief and Torvionyx writes your first proposal in under a minute.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-6 inline-flex items-center rounded-lg bg-[#0891B2] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0e7490] transition"
          >
            Create your first proposal
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-[#F3F4F6]">Your proposals</h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-gray-400">Create, send, and track your proposals.</p>
        </div>
        {/* Mobile only — desktop has sidenav CTA */}
        <Link
          href="/dashboard/new"
          className="lg:hidden rounded-lg bg-[#0891B2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0e7490] transition"
        >
          + New proposal
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Created"
          value={stats.total}
          accent="bg-neutral-100 dark:bg-[#374151]"
          icon={
            <svg className="text-neutral-500 dark:text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
          }
        />
        <StatCard
          label="Sent"
          value={stats.sent}
          accent="bg-blue-50 dark:bg-blue-950/40"
          icon={
            <svg className="text-[#0891B2]" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          }
        />
        <StatCard
          label="Viewed"
          value={stats.viewed}
          accent="bg-purple-50 dark:bg-purple-950/40"
          icon={
            <svg className="text-purple-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          }
        />
        <StatCard
          label="Accepted"
          value={stats.accepted}
          accent="bg-green-50 dark:bg-green-950/40"
          icon={
            <svg className="text-green-500" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          }
        />
      </div>

      {/* ── Two-column: timeline list + right panel ── */}
      <div className="flex gap-8 items-start">

        {/* ─ Timeline proposal list ─ */}
        <div className="flex-1 min-w-0 space-y-8">
          {groups.map(({ label, items }) => (
            <div key={label}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-neutral-400 dark:text-gray-500 uppercase tracking-wider">
                  {label}
                </span>
                <div className="flex-1 h-px bg-neutral-200 dark:bg-[#374151]" />
              </div>

              {/* Proposals in this group */}
              <div className="relative pl-6 space-y-2">
                {/* Vertical timeline line */}
                {items.length > 1 && (
                  <div
                    className="absolute left-[7px] top-4 bottom-4 w-px bg-neutral-200 dark:bg-[#374151]"
                    aria-hidden="true"
                  />
                )}

                {items.map((proposal) => {
                  const s = STATUS[proposal.status] ?? STATUS.draft;
                  return (
                    <div key={proposal.id} className="relative">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-neutral-50 dark:border-[#111827] shrink-0 ${s.dot}`}
                        aria-hidden="true"
                      />
                      <Link
                        href={`/dashboard/${proposal.id}/edit`}
                        className="flex items-center gap-4 rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] px-4 py-3.5 hover:border-neutral-300 dark:hover:border-[#4B5563] hover:shadow-sm transition group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-medium text-sm text-neutral-900 dark:text-[#F3F4F6] truncate group-hover:text-neutral-700 dark:group-hover:text-gray-200 transition">
                              {proposal.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-neutral-400 dark:text-gray-500">
                            <span className="truncate">{proposal.client_name}</span>
                            <span>·</span>
                            <span className="capitalize shrink-0">{proposal.proposal_type.replace(/_/g, " ")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
                          <span className="text-xs text-neutral-300 dark:text-gray-600">
                            {relativeTime(proposal.updated_at)}
                          </span>
                          <span className="text-neutral-300 dark:text-gray-600 group-hover:text-neutral-500 dark:group-hover:text-gray-400 transition text-sm">
                            →
                          </span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ─ Right panel: beta stats ─ */}
        <aside className="hidden xl:flex flex-col w-60 shrink-0 gap-3 sticky top-24">
          <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-4">
            <h3 className="text-xs font-semibold text-neutral-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              Overview
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Total proposals", value: stats.total,    dot: "bg-neutral-400" },
                { label: "Sent",            value: stats.sent,     dot: "bg-[#0891B2]" },
                { label: "Viewed",          value: stats.viewed,   dot: "bg-purple-500" },
                { label: "Accepted",        value: stats.accepted, dot: "bg-green-500" },
              ].map(({ label, value, dot }) => (
                <li key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                    <span className="text-sm text-neutral-600 dark:text-gray-400">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-[#F3F4F6] tabular-nums">
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Acceptance rate if anything was sent */}
          {stats.sent > 0 && (
            <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-4">
              <h3 className="text-xs font-semibold text-neutral-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Close rate
              </h3>
              <div className="text-3xl font-bold text-neutral-900 dark:text-[#F3F4F6] tabular-nums">
                {Math.round((stats.accepted / stats.sent) * 100)}
                <span className="text-lg font-medium text-neutral-400 dark:text-gray-500">%</span>
              </div>
              <p className="text-xs text-neutral-400 dark:text-gray-500 mt-1">
                {stats.accepted} accepted of {stats.sent} sent
              </p>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-neutral-100 dark:bg-[#374151] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0891B2]"
                  style={{ width: `${Math.round((stats.accepted / stats.sent) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
