// @ts-nocheck

"use client";

import Script from "next/script";

// Clerk domains that must be exempt from Termly's autoBlock resource
// blocker — auth is "strictly necessary" and must never be gated behind
// cookie consent. Reinforces the allowlist configured in the Termly
// dashboard (Auto-Blocker exceptions) so the two stay in sync even if
// the dashboard config drifts.
const CLERK_ALLOWED_DOMAINS = [
  "*.clerk.accounts.dev",
  "*.clerk.com",
  "api.clerk.com",
  "challenges.cloudflare.com",
];

export function TermlyScript() {
  return (
    <Script
      src="https://app.termly.io/resource-blocker/30b83852-5d87-4f38-8d18-e046db994443?autoBlock=on"
      strategy="afterInteractive"
      onLoad={() => {
        CLERK_ALLOWED_DOMAINS.forEach((domain) => {
          window.Termly?.addUnblockedDomain?.(domain);
        });
      }}
    />
  );
}
