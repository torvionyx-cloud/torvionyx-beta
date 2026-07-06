// @ts-nocheck

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getWorkspaceId } from "@/lib/workspace";
import { createServerClient } from "@/lib/supabase";
import type { Proposal } from "@/types/database";

const SENT_STATUSES = ["shared", "viewed", "accepted", "declined", "expired"];

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000; // hours
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const STATUS_CHIP: Record<string, { label: string; bg: string; color: string }> = {
  draft:    { label: "Draft",    bg: "rgba(250,242,232,.10)", color: "rgba(250,242,232,.5)" },
  shared:   { label: "Sent",     bg: "rgba(61,185,201,.14)",  color: "#3DB9C9" },
  viewed:   { label: "Viewed",   bg: "rgba(242,169,59,.14)",  color: "#F2A93B" },
  accepted: { label: "Accepted", bg: "rgba(95,208,138,.16)",  color: "#5FD08A" },
  declined: { label: "Declined", bg: "rgba(242,99,92,.14)",   color: "#F2635C" },
  expired:  { label: "Expired",  bg: "rgba(250,242,232,.08)", color: "rgba(250,242,232,.35)" },
}

function Chip({ status }: { status: string }) {
  const s = STATUS_CHIP[status] ?? STATUS_CHIP.draft
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontFamily: "monospace", fontSize: 9.5, fontWeight: 700,
      letterSpacing: ".08em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  )
}

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createServerClient();

  const { data } = await supabase
    .from("proposals")
    .select("id, title, client_name, proposal_type, status, created_at, shared_at, accepted_at, updated_at, content")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  const proposals = (data ?? []) as Proposal[];
  const sent      = proposals.filter(p => SENT_STATUSES.includes(p.status));
  const viewed    = proposals.filter(p => ["viewed","accepted","declined"].includes(p.status));
  const accepted  = proposals.filter(p => p.status === "accepted");
  const declined  = proposals.filter(p => p.status === "declined");

  const acceptRate = sent.length > 0 ? Math.round((accepted.length / sent.length) * 100) : 0;

  const durations = accepted
    .filter(p => p.shared_at && p.accepted_at)
    .map(p => daysBetween(p.shared_at!, p.accepted_at!))
    .filter(d => d >= 0);
  const avgTime = durations.length > 0
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
    : null;

  const totalRevenue = accepted.reduce((total, p) => {
    const blocks = (p.content as any)?.blocks ?? [];
    const pricingBlock = blocks.find((b: any) => b.type === "pricing");
    if (!pricingBlock?.lineItems) return total;
    const proposalTotal = pricingBlock.lineItems.reduce(
      (sum: number, item: any) => sum + (item.qty ?? 0) * (item.unitPrice ?? 0), 0
    );
    return total + proposalTotal;
  }, 0);

  const revenueDisplay = totalRevenue > 0
    ? `£${totalRevenue.toLocaleString("en-GB")}`
    : "£0";

  const avgDealValue = accepted.length > 0 && totalRevenue > 0
    ? Math.round(totalRevenue / accepted.length)
    : null;

  const avgDealDisplay = avgDealValue !== null
    ? `£${avgDealValue.toLocaleString("en-GB")}`
    : "—";

  const recent = proposals.slice(0, 15);

  const panel = {
    background: "var(--tv-bg-panel)",
    border: "1px solid var(--tv-border)",
    borderRadius: 14,
    boxShadow: "var(--tv-shadow)",
  } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ── Page title ── */}
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 22, letterSpacing: "-.02em", color: "var(--tv-text)" }}>
          Analytics
        </h1>
        <p style={{ fontSize: 13, color: "var(--tv-text-faint)", marginTop: 3 }}>
          Proposal performance and revenue trends
        </p>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "Total revenue",    value: revenueDisplay,    delta: totalRevenue > 0 ? `From ${accepted.length} accepted` : "No revenue tracked yet", up: totalRevenue > 0 },
          { label: "Proposals sent",   value: sent.length,       delta: `${sent.length} total sent`,    up: sent.length > 0 },
          { label: "Accept rate",      value: `${acceptRate}%`,  delta: `${accepted.length} accepted`,  up: acceptRate > 0 },
          { label: "Avg deal value",   value: avgDealDisplay,    delta: avgDealValue !== null ? "Per accepted proposal" : "Add pricing to proposals", up: avgDealValue !== null },
        ].map(({ label, value, delta, up }) => (
          <div key={label} className="transition-colors duration-300" style={{
            background: "linear-gradient(160deg,var(--tv-bg-panel),var(--tv-bg-panel))",
            border: "1px solid var(--tv-border)",
            borderRadius: 14, padding: "18px 20px",
            boxShadow: "var(--tv-shadow)",
          }}>
            <div style={{ fontFamily:"monospace", fontSize:10, letterSpacing:".16em", textTransform:"uppercase", color:"var(--tv-text-faint)", marginBottom:8 }}>
              {label}
            </div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:30, letterSpacing:"-.02em", color:"var(--tv-text)", marginBottom:5 }}>
              {value}
            </div>
            <div style={{ fontFamily:"monospace", fontSize:11.5, color: up ? "#5FD08A" : "var(--tv-text-faint)" }}>
              {up ? "↑ " : ""}{delta}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>

        {/* Acceptance trend */}
        <div className="transition-colors duration-300" style={panel}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px 14px", borderBottom:"1px solid var(--tv-border-soft)" }}>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14.5, color:"var(--tv-text)" }}>Acceptance trend</span>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              {[["#3DB9C9","Sent"],["#5FD08A","Accepted"]].map(([c,l]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11.5, color:"var(--tv-text-faint)" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:c }} />{l}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "18px 22px" }}>
            {sent.length === 0 ? (
              <p style={{ fontSize:13, color:"var(--tv-text-faint)" }}>Send your first proposal to see trends here.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { label: "Sent",     count: sent.length,     color: "#3DB9C9", pct: 100 },
                  { label: "Opened",   count: viewed.length,   color: "#F2A93B", pct: sent.length > 0 ? Math.round((viewed.length/sent.length)*100) : 0 },
                  { label: "Accepted", count: accepted.length, color: "#5FD08A", pct: sent.length > 0 ? Math.round((accepted.length/sent.length)*100) : 0 },
                  { label: "Declined", count: declined.length, color: "#F2635C", pct: sent.length > 0 ? Math.round((declined.length/sent.length)*100) : 0 },
                ].map(({ label, count, color, pct }) => (
                  <div key={label}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:"var(--tv-text)" }}>{label}</span>
                      <span style={{ fontFamily:"monospace", fontSize:11.5, color:"var(--tv-text-faint)" }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height:8, background:"rgba(250,242,232,.08)", borderRadius:20, overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:20, background:color, width:`${pct}%`, transition:"width 1.2s" }} />
                    </div>
                  </div>
                ))}
                {avgTime !== null && (
                  <div style={{ marginTop:18, paddingTop:18, borderTop:"1px solid var(--tv-border-soft)" }}>
                    <div style={{ fontFamily:"monospace", fontSize:10, letterSpacing:".16em", textTransform:"uppercase", color:"var(--tv-text-faint)", marginBottom:10 }}>
                      Time to accept
                    </div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:28, color:"var(--tv-text)" }}>{avgTime}h</span>
                      <span style={{ fontSize:12.5, color:"var(--tv-text-faint)" }}>average</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Proposal funnel */}
        <div className="transition-colors duration-300" style={panel}>
          <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid var(--tv-border-soft)" }}>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14.5, color:"var(--tv-text)" }}>Proposal funnel</span>
          </div>
          <div style={{ padding:22, display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Created",  count: proposals.length, color:"var(--tv-text-faint)" },
              { label:"Sent",     count: sent.length,      color:"#3DB9C9" },
              { label:"Viewed",   count: viewed.length,    color:"#F2A93B" },
              { label:"Accepted", count: accepted.length,  color:"#5FD08A" },
            ].map(({ label, count, color }) => {
              const pct = proposals.length > 0 ? Math.round((count / proposals.length) * 100) : 0;
              return (
                <div key={label} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                    <span style={{ fontSize:13, fontWeight:500, color:"var(--tv-text)" }}>{label}</span>
                    <span style={{ fontFamily:"monospace", fontSize:11.5, color:"var(--tv-text-faint)" }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height:8, background:"rgba(250,242,232,.08)", borderRadius:20, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:20, background:color, width:`${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Proposals table ── */}
      <div className="transition-colors duration-300" style={panel}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px", borderBottom:"1px solid var(--tv-border-soft)" }}>
          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15, color:"var(--tv-text)" }}>All proposals</span>
          <span style={{ fontFamily:"monospace", fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:"var(--tv-text-faint)" }}>
            {proposals.length} total
          </span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
            <thead>
              <tr>
                {["Client","Type","Sent","Status","Views"].map(h => (
                  <th key={h} style={{
                    fontFamily:"monospace", fontSize:10, letterSpacing:".14em", textTransform:"uppercase",
                    color:"var(--tv-text-faint)", padding:"12px 16px", textAlign:"left",
                    borderBottom:"1px solid var(--tv-border-soft)", fontWeight:500, whiteSpace:"nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < recent.length - 1 ? "1px solid var(--tv-border-soft)" : "none" }}
                  className="transition-colors hover:bg-[var(--tv-row-hover)]">
                  <td style={{ padding:"11px 16px", fontWeight:500, fontSize:13, color:"var(--tv-text)" }}>
                    <Link href={`/dashboard/${p.id}/edit`} style={{ textDecoration:"none", color:"inherit" }}>
                      {p.client_name}
                    </Link>
                  </td>
                  <td style={{ padding:"11px 16px", fontSize:12, color:"var(--tv-text-faint)" }}>
                    {p.proposal_type.replace(/_/g," ")}
                  </td>
                  <td style={{ padding:"11px 16px", fontFamily:"monospace", fontSize:12, color:"var(--tv-text-faint)" }}>
                    {p.shared_at ? formatDate(p.shared_at) : "—"}
                  </td>
                  <td style={{ padding:"11px 16px" }}>
                    <Chip status={p.status} />
                  </td>
                  <td style={{ padding:"11px 16px", fontFamily:"monospace", fontSize:12, color:"var(--tv-text-faint)" }}>
                    —
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );