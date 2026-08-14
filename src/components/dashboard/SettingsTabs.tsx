// @ts-nocheck

"use client";

/**
 * components/dashboard/SettingsTabs.tsx
 *
 * Tab bar shared by /dashboard/settings (Account) and /dashboard/settings/brand
 * (Branding). Kept as its own component so both pages render an identical,
 * always-in-sync tab bar rather than copy-pasting the markup.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/settings", label: "Account" },
  { href: "/dashboard/settings/brand", label: "Branding" },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 28,
        borderBottom: "1px solid var(--tv-border-soft)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: "10px 16px",
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 600,
              fontSize: 13.5,
              textDecoration: "none",
              color: isActive ? "var(--tv-text)" : "var(--tv-text-faint)",
              borderBottom: isActive ? "2px solid #DCAA33" : "2px solid transparent",
              marginBottom: -1,
              transition: "color .15s, border-color .15s",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
