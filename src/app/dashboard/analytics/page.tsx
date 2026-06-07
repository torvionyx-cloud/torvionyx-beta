// @ts-nocheck

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import type { Proposal, ProposalContent, PricingBlock } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  draft:    { label: "Draft",    dot: "bg-neutral-400",  text: "text-neutral-500 dark:text-gray-400" },
  shared:   { label: "Sent",     dot: "bg-[#0891B2]",    text: "text-[#0891B2]" },
  viewed:   { label: "Viewed",   dot: "bg-purple-500",   text: "text-purple-600 dark:text-purple-400" },
  accepted: { label: "Accepted", dot: "bg-green-500",    text: "text-green-600 dark:text-green-400" },
  declined: { label: "Declined", dot: "bg-red-400",      text: "text-red-500 dark:text-red-400" },
  expired:  { label: "Expired",  dot: "bg-neutral-300",  text: "text-neutral-400 dark:text-gray-500" },
};

const SENT_STATUSES = ["shared", "viewed", "accepted", "declined", "expired"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${Math.round(amount).toLocaleString("en-GB")}`;
}

function proposalValue(content: ProposalContent | null): { currency: string; amount: number } | null {
  if (!content?.blocks) return null;
  const pricing = content.blocks.find((b) => b.type === "pricing") as PricingBlock | undefined;
  if (!pricing) return null;
  const amount = pricing.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  return { currency: pricing.currency, amount };
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return ms / 86_400_000;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function monthKey(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

// Last `count` months as ascending "YYYY-MM" keys, ending with the current month.
function recentMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

// ─── Small presentational pieces ──────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] px-5 py-4">
      <span className="text-sm text-neutral-500 dark:text-gray-400">{label}</span>
      <div className="mt-2 text-3xl font-bold text-neutral-900 dark:text-[#F3F4F6] tabular-nums">
        {value}
      </div>
      {sublabel && (
        <p className="mt-1 text-xs text-neutral-400 dark:text-gray-500">{sublabel}</p>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-5">
      <h3 className="text-xs font-semibold text-neutral-400 dark:text-gray-500 uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createAdminClient();

  const { data: proposalRows } = await supabase
    .from("proposals")
    .select("id, title, client_name, proposal_type, status, content, share_token, created_at, shared_at, accepted_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  const proposals = (proposalRows ?? []) as Proposal[];

  // ── View counts per proposal (from proposal_events) ──
  const viewCounts = new Map<string, number>();
  if (proposals.length > 0) {
    const { data: viewEvents } = await supabase
      .from("proposal_events")
      .select("proposal_id")
      .eq("event_type", "viewed")
      .in("proposal_id", proposals.map((p) => p.id));

    for (const event of viewEvents ?? []) {
      viewCounts.set(event.proposal_id, (viewCounts.get(event.proposal_id) ?? 0) + 1);
    }
  }

  // ── Empty state ──
  if (proposals.length === 0) {
    return (
      <div>
        <PageHeader />
        <div className="rounded-xl border-2 border-dashed border-neutral-200 dark:border-[#374151] p-16 text-center">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-[#F3F4F6]">No data yet</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-gray-400 max-w-xs mx-auto">
            Once you've sent your first proposal, your engagement and pipeline metrics will show up here.
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

  // ── Summary metrics ──
  const sent = proposals.filter((p) => SENT_STATUSES.includes(p.status) || p.shared_at);
  const accepted = proposals.filter((p) => p.status === "accepted" && p.accepted_at);

  const acceptRate = sent.length > 0 ? Math.round((accepted.length / sent.length) * 100) : null;

  const acceptDurations = accepted
    .filter((p) => p.shared_at)
    .map((p) => daysBetween(p.shared_at as string, p.accepted_at as string))
    .filter((d) => d >= 0);
  const avgTimeToAccept =
    acceptDurations.length > 0
      ? Math.round((acceptDurations.reduce((s, d) => s + d, 0) / acceptDurations.length) * 10) / 10
      : null;

  // Pipeline value — sum estimated value of every sent (non-draft) proposal, grouped by currency
  const pipelineByCurrency = new Map<string, number>();
  for (const p of sent) {
    const value = proposalValue(p.content as ProposalContent | null);
    if (value && value.amount > 0) {
      pipelineByCurrency.set(value.currency, (pipelineByCurrency.get(value.currency) ?? 0) + value.amount);
    }
  }
  const pipelineEntries = Array.from(pipelineByCurrency.entries()).sort((a, b) => b[1] - a[1]);

  // ── Acceptance trend — last 6 months: sent vs accepted ──
  const months = recentMonthKeys(6);
  const trend = months.map((key) => {
    const sentInMonth = sent.filter((p) => p.shared_at && monthKey(p.shared_at) === key).length;
    const acceptedInMonth = accepted.filter((p) => p.accepted_at && monthKey(p.accepted_at) === key).length;
    return { key, label: monthLabel(key), sent: sentInMonth, accepted: acceptedInMonth };
  });
  const trendMax = Math.max(1, ...trend.map((t) => Math.max(t.sent, t.accepted)));

  // ── View distribution buckets ──
  const buckets = [
    { label: "No views", test: (n: number) => n === 0 },
    { label: "1–2 views", test: (n: number) => n >= 1 && n <= 2 },
    { label: "3–5 views", test: (n: number) => n >= 3 && n <= 5 },
    { label: "6+ views", test: (n: number) => n >= 6 },
  ];
  const distribution = buckets.map((bucket) => ({
    label: bucket.label,
    count: sent.filter((p) => bucket.test(viewCounts.get(p.id) ?? 0)).length,
  }));
  const distributionMax = Math.max(1, ...distribution.map((d) => d.count));

  const recent = proposals.slice(0, 15);

  return (
    <div>
      <PageHeader />

      {/* ── Summary metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Proposals sent" value={sent.length} sublabel={`${proposals.length} total created`} />
        <MetricCard
          label="Accept rate"
          value={acceptRate !== null ? <>{acceptRate}<span className="text-lg font-medium text-neutral-400 dark:text-gray-500">%</span></> : "—"}
          sublabel={sent.length > 0 ? `${accepted.length} of ${sent.length} sent` : "No proposals sent yet"}
        />
        <MetricCard
          label="Avg. time to accept"
          value={avgTimeToAccept !== null ? <>{avgTimeToAccept}<span className="text-lg font-medium text-neutral-400 dark:text-gray-500"> days</span></> : "—"}
          sublabel={acceptDurations.length > 0 ? `Across ${acceptDurations.length} accepted` : "No accepted proposals yet"}
        />
        <MetricCard
          label="Pipeline value"
          value={pipelineEntries.length > 0 ? formatCurrency(pipelineEntries[0][1], pipelineEntries[0][0]) : "—"}
          sublabel={
            pipelineEntries.length > 1
              ? `+ ${pipelineEntries.slice(1).map(([c, a]) => formatCurrency(a, c)).join(", ")}`
              : "Estimated from pricing"
          }
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-2 gap-3 mb-8">
        <ChartCard title="Acceptance trend (last 6 months)">
          {trend.every((t) => t.sent === 0) ? (
            <p className="text-sm text-neutral-400 dark:text-gray-500">Not enough activity yet to show a trend.</p>
          ) : (
            <div className="space-y-3">
              {trend.map((t) => (
                <div key={t.key} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-xs text-neutral-400 dark:text-gray-500">{t.label}</span>
                  <div className="flex-1 space-y-1">
                    <div className="h-2 rounded-full bg-neutral-100 dark:bg-[#374151] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-neutral-300 dark:bg-[#4B5563]"
                        style={{ width: `${(t.sent / trendMax) * 100}%` }}
                      />
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 dark:bg-[#374151] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${(t.accepted / trendMax) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-neutral-400 dark:text-gray-500 tabular-nums">
                    {t.accepted}/{t.sent}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-1 text-xs text-neutral-400 dark:text-gray-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-[#4B5563]" /> Sent</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> Accepted</span>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="View distribution">
          <div className="space-y-3">
            {distribution.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-neutral-500 dark:text-gray-400">{d.label}</span>
                <div className="flex-1 h-2 rounded-full bg-neutral-100 dark:bg-[#374151] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0891B2]"
                    style={{ width: `${(d.count / distributionMax) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs text-neutral-400 dark:text-gray-500 tabular-nums">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-400 dark:text-gray-500">
            How many times each sent proposal has been opened on its live link.
          </p>
        </ChartCard>
      </div>

      {/* ── Recent proposals table ── */}
      <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-[#374151]">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#F3F4F6]">Recent proposals</h3>
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-gray-500">
            Click a proposal to open it and review its closing intelligence.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-400 dark:text-gray-500 uppercase tracking-wider border-b border-neutral-100 dark:border-[#374151]">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Views</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((proposal) => {
                const s = STATUS[proposal.status] ?? STATUS.draft;
                const views = viewCounts.get(proposal.id) ?? 0;
                return (
                  <tr key={proposal.id} className="border-b border-neutral-50 dark:border-[#374151]/60 last:border-0 group">
                    <td className="p-0">
                      <Link
                        href={`/dashboard/${proposal.id}/edit`}
                        className="flex flex-col px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-[#111827]/40 transition"
                      >
                        <span className="font-medium text-neutral-900 dark:text-[#F3F4F6] truncate group-hover:text-[#0891B2] transition">
                          {proposal.client_name}
                        </span>
                        <span className="text-xs text-neutral-400 dark:text-gray-500 truncate">{proposal.title}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/${proposal.id}/edit`} className="block capitalize text-neutral-600 dark:text-gray-300">
                        {proposal.proposal_type.replace(/_/g, " ")}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/${proposal.id}/edit`} className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/dashboard/${proposal.id}/edit`} className="block tabular-nums text-neutral-600 dark:text-gray-300">
                        {views}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/${proposal.id}/edit`} className="block text-neutral-500 dark:text-gray-400">
                        {formatDate(proposal.created_at)}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-[#F3F4F6]">Analytics</h1>
      <p className="mt-0.5 text-sm text-neutral-500 dark:text-gray-400">
        How your proposals are performing — and where to focus your follow-ups.
      </p>
    </div>
  );
}
