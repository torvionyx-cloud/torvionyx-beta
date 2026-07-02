// @ts-nocheck

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureWorkspaceExists } from "@/lib/workspace";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";
import { SidenavLink } from "@/components/ui/SidenavLink";

function ProposalsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const displayName = user?.firstName
    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
    : undefined;
  const firstName = user?.firstName ?? "there";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  await ensureWorkspaceExists(userId!, displayName);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div
      className="min-h-screen flex transition-colors duration-300"
      style={{ background: "var(--tv-bg-page)", color: "var(--tv-text)" }}
    >
      {/* ── Sidebar — always navy ── */}
      <aside
        className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen"
        style={{ width: 220, background: "#0C1A2E", borderRight: "1px solid rgba(250,242,232,.07)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-7"
          style={{ borderBottom: "1px solid rgba(250,242,232,.07)" }}>
          <TorvionyxLogo size={22} />
          <span className="font-bold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, color: "#FAF2E8" }}>
            torvionyx
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 py-5">
          <p className="px-3 mb-1.5"
            style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(250,242,232,.38)", fontFamily: "monospace" }}>
            Workspace
          </p>
          <SidenavLink href="/dashboard" icon={<ProposalsIcon />} exact variant="navy">
            Proposals
          </SidenavLink>
          <SidenavLink href="/dashboard/analytics" icon={<AnalyticsIcon />} exact variant="navy">
            Analytics
          </SidenavLink>

          <p className="px-3 mt-4 mb-1.5"
            style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(250,242,232,.38)", fontFamily: "monospace" }}>
            Settings
          </p>
          <SidenavLink href="/dashboard/brand" icon={<BrandIcon />} exact variant="navy">
            Branding
          </SidenavLink>
          <SidenavLink href="/dashboard/settings" icon={<SettingsIcon />} exact variant="navy">
            Settings
          </SidenavLink>
        </nav>

        {/* User panel */}
        <div className="mx-3 mb-5 p-3 rounded-xl flex items-center gap-2.5"
          style={{ background: "rgba(250,242,232,.06)", border: "1px solid rgba(250,242,232,.09)" }}>
          {/* Gold avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#DCAA33,#F2C84E)",
            display: "grid", placeItems: "center",
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1322",
          }}>
            {firstName?.charAt(0)?.toUpperCase() ?? "K"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate"
              style={{ fontSize: 12.5, color: "#FAF2E8", lineHeight: 1.2 }}>
              {displayName ?? "My Account"}
            </div>
            <div style={{
              fontSize: 11, color: "rgba(250,242,232,.38)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110,
            }}>
              {email}
            </div>
          </div>
          <Link href="/dashboard/settings"
            style={{ color: "rgba(250,242,232,.38)", flexShrink: 0, transition: "color .2s" }}
            className="hover:text-[#FAF2E8]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header
          className="sticky top-0 z-30 h-[60px] shrink-0 flex items-center justify-between px-8 transition-colors duration-300"
          style={{ background: "var(--tv-bg-topbar)", borderBottom: "1px solid var(--tv-border-soft)" }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <TorvionyxLogo size={20} />
            <span className="font-bold text-sm"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--tv-text)" }}>
              torvionyx
            </span>
          </div>

          {/* Desktop greeting */}
          <div className="hidden lg:block">
            <div className="font-semibold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, letterSpacing: "-.015em", color: "var(--tv-text)" }}>
              {greeting}, {firstName}
            </div>
            <div style={{ fontSize: 12, color: "var(--tv-text-faint)", marginTop: 1 }}>{dateStr}</div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/dashboard/new"
              className="flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-sm transition-all hover:-translate-y-px"
              style={{
                background: "linear-gradient(135deg,#F2C84E,#DCAA33)",
                color: "#0A1322",
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: "0 8px 20px -10px rgba(220,170,51,.6)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New proposal
            </Link>
            <div className="lg:hidden">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-8 py-7 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}