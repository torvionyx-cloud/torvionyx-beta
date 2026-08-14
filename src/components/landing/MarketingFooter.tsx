// @ts-nocheck

"use client";

import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";

export function MarketingFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--tv-border-soft)", background: "var(--tv-bg-page)" }}>
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2.5">
          <TorvionyxLogo size={20} />
          <span
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--tv-text)",
            }}
          >
            torvionyx
          </span>
        </div>
        <p
          style={{
            fontFamily: "'JetBrains Mono',ui-monospace,monospace",
            fontSize: 11.5,
            letterSpacing: ".04em",
            color: "var(--tv-text-faint)",
          }}
        >
          Proposal OS for freelancers · Made in the UK
        </p>
      </div>
    </footer>
  );
}
