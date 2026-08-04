// @ts-nocheck

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";
import { SidenavLink } from "@/components/ui/SidenavLink";
import { ProposalsIcon, AnalyticsIcon, BrandIcon, SettingsIcon } from "@/components/dashboard/NavIcons";

export function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center rounded-lg"
        style={{ width: 36, height: 36, color: "var(--tv-text)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(10,19,34,.6)" }}
            onClick={() => setOpen(false)}
          />
          <aside
            className="absolute top-0 left-0 h-full flex flex-col"
            style={{ width: 260, maxWidth: "80vw", background: "#0C1A2E", borderRight: "1px solid rgba(250,242,232,.07)" }}
          >
            <div className="flex items-center justify-between px-5 py-7"
              style={{ borderBottom: "1px solid rgba(250,242,232,.07)" }}>
              <div className="flex items-center gap-2.5">
                <TorvionyxLogo size={22} />
                <span className="font-bold tracking-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, color: "#FAF2E8" }}>
                  torvionyx
                </span>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg"
                style={{ width: 32, height: 32, color: "rgba(250,242,232,.62)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

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
          </aside>
        </div>
      )}
    </>
  );
}
