// @ts-nocheck

"use client";

/**
 * components/landing/MarketingNav.tsx
 *
 * Shared nav for the marketing pages (/welcome, /pricing). Product/Why it
 * wins/FAQ always link back to /welcome's anchored sections, so the nav
 * works identically regardless of which marketing page it's rendered on.
 */

import Link from "next/link";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface MarketingNavProps {
  active?: "pricing";
}

const LINKS = [
  { href: "/welcome#product", label: "Product" },
  { href: "/welcome#why", label: "Why it wins" },
  { href: "/welcome#faq", label: "FAQ" },
];

export function MarketingNav({ active }: MarketingNavProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{ borderColor: "var(--tv-border-soft)", background: "var(--tv-bg-page)" }}
    >
      <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/welcome" className="flex items-center gap-2.5 shrink-0">
          <TorvionyxLogo size={22} />
          <span
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: "-.02em",
              color: "var(--tv-text)",
            }}
          >
            torvionyx
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--tv-row-hover)]"
              style={{ color: "var(--tv-text-dim)" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/pricing"
            className="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--tv-row-hover)]"
            style={{ color: active === "pricing" ? "#DCAA33" : "var(--tv-text-dim)" }}
          >
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="hidden sm:inline-block px-3.5 py-2 text-sm font-medium transition-colors hover:text-[var(--tv-text)]"
            style={{ color: "var(--tv-text-dim)" }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px"
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              background: "linear-gradient(135deg,#F2C84E,#DCAA33)",
              color: "#0A1322",
              boxShadow: "0 8px 20px -10px rgba(220,170,51,.6)",
            }}
          >
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
