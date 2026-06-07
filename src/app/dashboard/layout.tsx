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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-3-8H9v2h6v-2zm0 4H9v2h6v-2z" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zM6.5 12C5.67 12 5 11.33 5 10.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
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
  await ensureWorkspaceExists(userId!, displayName);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#111827] flex flex-col">

      {/* ── Topbar ── */}
      <header className="sticky top-0 z-30 h-14 shrink-0 bg-white dark:bg-[#1F2937] border-b border-neutral-200 dark:border-[#374151] flex items-center">
        {/* Logo zone — same width as sidenav on desktop */}
        <div className="flex items-center px-4 h-full lg:w-56 lg:shrink-0 lg:border-r lg:border-neutral-200 lg:dark:border-[#374151]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-[#F3F4F6] tracking-tight text-sm"
          >
            <TorvionyxLogo size={22} />
            Torvionyx
          </Link>
        </div>

        {/* Mobile nav (hidden on desktop — sidenav takes over) */}
        <nav className="lg:hidden flex items-center gap-0.5 ml-3">
          <SidenavLink href="/dashboard" exact variant="topbar">
            Proposals
          </SidenavLink>
          <SidenavLink href="/dashboard/analytics" exact variant="topbar">
            Analytics
          </SidenavLink>
          <SidenavLink href="/dashboard/brand" exact variant="topbar">
            Brand
          </SidenavLink>
        </nav>

        <div className="flex-1" />

        <div className="px-4 flex items-center gap-2">
          <ThemeToggle />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1">

        {/* Sidenav — desktop only */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white dark:bg-[#1F2937] border-r border-neutral-200 dark:border-[#374151] sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="flex-1 px-3 py-5 space-y-1">
            <SidenavLink href="/dashboard" icon={<ProposalsIcon />} exact>
              Proposals
            </SidenavLink>
            <SidenavLink href="/dashboard/analytics" icon={<AnalyticsIcon />} exact>
              Analytics
            </SidenavLink>
            <SidenavLink href="/dashboard/brand" icon={<BrandIcon />} exact>
              Brand
            </SidenavLink>
          </nav>

          {/* Pinned CTA at the bottom */}
          <div className="px-3 pb-5 border-t border-neutral-100 dark:border-[#374151] pt-4">
            <Link
              href="/dashboard/new"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#0891B2] text-white text-sm font-medium px-3 py-2.5 hover:bg-[#0e7490] transition-colors"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Proposal
            </Link>
          </div>
        </aside>

        {/* Main content — children use px-6 py-10 padding */}
        <main className="flex-1 min-w-0">
          <div className="px-6 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
