// @ts-nocheck

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
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
}

function Chip({ status }: { status: string }) {
  const s = STATUS_CHIP[status] ?? STATUS_CHIP.draft
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontFamily: "monospace", fontSize: 10, fontWeight: 700,
      letterSpacing: ".08em", textTransform: "uppercase",
      padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  )
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("proposals")
    .select("id, title, client_name, status, proposal_type, share_token, created_at, updated_at, shared_at, accepted_at, content")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  const proposals = (data ?? []) as Proposal[];

  const sent     = proposals.filter(p => ["shared","viewed","accepted","declined","expired"].includes(p.status))
  const accepted = proposals.filter(p => p.status === "accepted")

  const acceptRate = sent.length > 0 ? Math.round((accepted.length / sent.length) * 100) : 0

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const revenueThisMonth = accepted
    .filter(p => p.accepted_at && new Date(p.accepted_at) >= startOfMonth)
    .reduce((total, p) => {
      const blocks = (p.content as any)?.blocks ?? [];
      const pricingBlock = blocks.find((b: any) => b.type === "pricing");
      if (!pricingBlock?.lineItems) return total;
      const proposalTotal = pricingBlock.lineItems.reduce(
        (sum: number, item: any) => sum + (item.qty ?? 0) * (item.unitPrice ?? 0), 0
      );
      return total + proposalTotal;
    }, 0);

  const revenueDisplay = revenueThisMonth > 0
    ? `£${revenueThisMonth.toLocaleString("en-GB")}`
    : "£0";

  const revenueDelta = revenueThisMonth > 0
    ? `From ${accepted.filter(p => p.accepted_at && new Date(p.accepted_at) >= startOfMonth).length} accepted this month`
    : "No accepted proposals this month";

  const durationsHours = accepted
    .filter(p => p.shared_at && p.accepted_at)
    .map(p => (new Date(p.accepted_at!).getTime() - new Date(p.shared_at!).getTime()) / 3_600_000)
    .filter(d => d >= 0);

  const avgTimeHours = durationsHours.length > 0
    ? Math.round(durationsHours.reduce((s, d) => s + d, 0) / durationsHours.length)
    : null;

  const avgTimeDisplay = avgTimeHours !== null
    ? avgTimeHours < 24
      ? `${avgTimeHours}h`
      : `${Math.round(avgTimeHours / 24)}d`
    : "—";

  const avgTimeDelta = avgTimeHours !== null
    ? `Based on ${durationsHours.length} accepted`
    : "Not enough data yet";

  const recent = proposals.slice(0, 5)

  const activity = proposals.slice(0, 5).map(p => {
    if (p.status === "accepted") return { type: "ok",   text: <><strong>{p.client_name}</strong> accepted your proposal</>, time: relativeTime(p.updated_at) }
    if (p.status === "viewed")   return { type: "info", text: <><strong>{p.client_name}</strong> viewed your proposal</>,   time: relativeTime(p.updated_at) }
    if (p.status === "shared")   return { type: "send", text: <><strong>{p.client_name}</strong> was sent a proposal</>,    time: relativeTime(p.updated_at) }
    return { type: "warn", text: <><strong>{p.client_name}</strong> proposal is in draft</>, time: relativeTime(p.updated_at) }
  })

  const feedIconStyles: Record<string, {bg:string;color:string}> = {
    ok:   { bg: "rgba(95,208,138,.14)",  color: "#5FD08A" },
    info: { bg: "rgba(61,185,201,.14)",  color: "#3DB9C9" },
    send: { bg: "rgba(61,185,201,.14)",  color: "#3DB9C9" },
    warn: { bg: "rgba(242,169,59,.14)",  color: "#F2A93B" },
  }

  const feedIcons: Record<string, React.ReactNode> = {
    ok:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    warn: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* ── Stats row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        {[
          { label: "Revenue this month", value: revenueDisplay, delta: revenueDelta, up: revenueThisMonth > 0 },
          { label: "Proposals sent",      value: sent.length,    delta: `${sent.length} total sent`, up: true },
          { label: "Accept rate",         value: `${acceptRate}%`, delta: `${accepted.length} accepted`, up: true },
          { label: "Avg time to accept",  value: avgTimeDisplay, delta: avgTimeDelta, up: false },
        ].map(({ label, value, delta, up }) => (
          <div key={label} className="transition-colors duration-300" style={{
            background: "var(--tv-bg-panel)",
            border: "1px solid var(--tv-border)",
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: "var(--tv-shadow)",
          }}>
            <div style={{ fontFamily:"monospace", fontSize:10, letterSpacing:".16em", textTransform:"uppercase", color:"var(--tv-text-faint)", marginBottom:8 }}>
              {label}
            </div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:28, letterSpacing:"-.02em", color:"var(--tv-text)", marginBottom:6 }}>
              {value}
            </div>
            <div style={{ fontFamily:"monospace", fontSize:11.5, color: up ? "#5FD08A" : "var(--tv-text-faint)" }}>
              {up && sent.length > 0 ? "↑ " : ""}{delta}
            </div>
          </div>
        ))}
      </div>

      {/* ── Two column: proposals + activity ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:20 }}>

        {/* Recent proposals panel */}
        <div className="transition-colors duration-300" style={{
          background: "var(--tv-bg-panel)",
          border: "1px solid var(--tv-border)",
          borderRadius: 14,
          boxShadow: "var(--tv-shadow)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px", borderBottom:"1px solid var(--tv-border-soft)" }}>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15, color:"var(--tv-text)" }}>Recent proposals</span>
            <Link href="/dashboard/proposals" style={{ fontSize:12.5, color:"#DCAA33", fontWeight:500 }}>View all</Link>
          </div>

          {recent.length === 0 ? (
            <div style={{ padding:"40px 20px", textAlign:"center", color:"var(--tv-text-faint)", fontSize:13 }}>
              No proposals yet — create your first one
            </div>
          ) : (
            recent.map(p => (
              <Link
                key={p.id}
                href={`/dashboard/${p.id}/edit`}
                style={{
                  display:"grid", gridTemplateColumns:"1fr auto auto",
                  alignItems:"center", gap:12,
                  padding:"13px 20px",
                  borderBottom:"1px solid var(--tv-border-soft)",
                  cursor:"pointer", textDecoration:"none",
                }}
                className="transition-colors hover:bg-[var(--tv-row-hover)]"
              >
                <div>
                  <div style={{ fontWeight:500, fontSize:14, color:"var(--tv-text)" }}>{p.client_name}</div>
                  <div style={{ fontSize:12, color:"var(--tv-text-faint)", marginTop:2 }}>
                    {p.proposal_type.replace(/_/g," ")} · {p.shared_at ? `Sent ${relativeTime(p.shared_at)}` : "Draft"}
                  </div>
                </div>
                <div style={{ fontFamily:"monospace", fontWeight:700, fontSize:13.5, color:"var(--tv-text)", textAlign:"right" }}>
                  —
                </div>
                <Chip status={p.status} />
              </Link>
            ))
          )}

          {/* Quick actions */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:16 }}>
            {[
              { label:"New proposal", desc:"Start from scratch or a saved template", href:"/dashboard/new",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
              { label:"Import proposal", desc:"Bring in a PDF or Google Doc", href:"#",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
            ].map(({ label, desc, href, icon }) => (
              <Link key={label} href={href} className="transition-all hover:-translate-y-0.5" style={{
                background:"var(--tv-panel-accent)",
                border:"1px solid var(--tv-border)",
                borderRadius:12, padding:14,
                display:"flex", flexDirection:"column", gap:8,
                textDecoration:"none",
              }}>
                <div style={{ color:"#DCAA33" }}>{icon}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--tv-text)" }}>{label}</div>
                <div style={{ fontSize:11.5, color:"var(--tv-text-faint)", lineHeight:1.4 }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity panel */}
        <div className="transition-colors duration-300" style={{
          background: "var(--tv-bg-panel)",
          border: "1px solid var(--tv-border)",
          borderRadius: 14,
          boxShadow: "var(--tv-shadow)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px", borderBottom:"1px solid var(--tv-border-soft)" }}>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15, color:"var(--tv-text)" }}>Activity</span>
            <span style={{ fontSize:12.5, color:"#DCAA33", fontWeight:500, cursor:"pointer" }}>All activity</span>
          </div>

          {activity.length === 0 ? (
            <div style={{ padding:"40px 20px", textAlign:"center", color:"var(--tv-text-faint)", fontSize:13 }}>
              Activity will appear here as proposals are sent and viewed
            </div>
          ) : (
            activity.map((item, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"flex-start", gap:12,
                padding:"13px 20px",
                borderBottom: i < activity.length - 1 ? "1px solid var(--tv-border-soft)" : "none",
              }}>
                <div style={{
                  width:30, height:30, borderRadius:"50%",
                  background: feedIconStyles[item.type]?.bg,
                  color: feedIconStyles[item.type]?.color,
                  display:"grid", placeItems:"center", flexShrink:0, marginTop:1,
                }}>
                  {feedIcons[item.type]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, lineHeight:1.45, color:"var(--tv-text-dim)" }}>{item.text}</div>
                  <div style={{ fontFamily:"monospace", fontSize:11, color:"var(--tv-text-faint)", marginTop:2 }}>{item.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}