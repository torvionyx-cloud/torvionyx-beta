// @ts-nocheck

"use client";

/**
 * components/dashboard/WorkspaceProvisioningGate.tsx
 *
 * Rendered by dashboard/layout.tsx in place of the entire dashboard shell
 * when checkWorkspaceReady() finds no workspace yet — i.e. the Clerk
 * user.created webhook hasn't landed by the time this render happens.
 * Polls GET /api/workspace/ready from the browser (not blocking SSR) until
 * the row appears, then calls router.refresh() so the layout's Server
 * Component re-checks and renders the real dashboard.
 *
 * Why client-side polling instead of a server-side retry budget: we tried
 * that twice (retry loops with ~1.9s then ~3.5s budgets) and both lost to
 * real production timing — the SSR poll and the webhook's dispatch are two
 * independently-triggered processes with no ordering guarantee between
 * them, so no fixed server-side budget can be sized reliably. Polling from
 * the browser removes that coupling entirely: the page renders immediately,
 * and waits however long it actually needs to, bounded only by the
 * client-side timeout below — which fails visibly with a retry option,
 * rather than throwing a server exception into dashboard/error.tsx.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./WorkspaceProvisioningGate.css";

// Sized against the one real measurement we have: Clerk fired user.created
// 53ms after user creation, the workspace row committed 2.16s after that.
// 1000ms gives ~2 poll attempts inside that window with margin — faster
// buys little given Vercel round-trip overhead is itself 100-300ms; slower
// risks a visibly static screen through one whole extra interval. 20
// attempts (~20s) is roughly 9x the observed delay — generous headroom for
// slow delivery or a DB hiccup, still bounded. One real data point, not a
// distribution — worth revisiting once more signups have gone through this
// path (see the console.log below, kept specifically so this is tunable
// with real numbers later rather than picked by feel forever).
const POLL_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = 20;

interface WorkspaceProvisioningGateProps {
  firstName?: string;
}

export function WorkspaceProvisioningGate({ firstName }: WorkspaceProvisioningGateProps) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttemptGeneration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const startedAt = Date.now();
    setTimedOut(false);

    async function poll() {
      attempts += 1;

      try {
        const res = await fetch("/api/workspace/ready", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.ready) {
            clearInterval(intervalId);
            console.log(`[WorkspaceProvisioningGate] ready after ${Date.now() - startedAt}ms (${attempts} attempts)`);
            if (!cancelled) router.refresh();
            return;
          }
        }
        // Non-ready (or non-OK) response — keep polling. Don't treat a
        // single flaky request as fatal.
      } catch {
        // Network blip — same reasoning. Only the attempt-count timeout
        // below gives up, not one failed fetch.
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        if (!cancelled) setTimedOut(true);
      }
    }

    poll(); // immediate first check — no reason to wait a full interval
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [router, attempt]);

  const greeting = firstName && firstName !== "there" ? `Hi ${firstName} — ` : "";

  if (timedOut) {
    return (
      <div style={gateContainerStyle}>
        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", color: "var(--tv-text)" }}>
          This is taking longer than expected
        </div>
        <p style={{ margin: 0, maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tv-text-faint)", lineHeight: 1.5 }}>
          We're still setting up your workspace — you can try again, or contact support if this keeps happening.
        </p>
        <button
          onClick={() => setAttemptGeneration((g) => g + 1)}
          style={{
            marginTop: 4,
            background: "linear-gradient(135deg,#F2C84E,#DCAA33)",
            color: "#0A1322",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            border: "none",
            borderRadius: 12,
            padding: "10px 22px",
            cursor: "pointer",
            boxShadow: "0 8px 20px -10px rgba(220,170,51,.6)",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={gateContainerStyle}>
      <div
        className="tv-gate-spinner"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid rgba(220,170,51,.2)",
          borderTopColor: "#DCAA33",
        }}
      />
      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", color: "var(--tv-text)" }}>
        {greeting}Setting up your workspace…
      </div>
      <p style={{ margin: 0, fontFamily: "monospace", fontSize: 12, color: "var(--tv-text-faint)" }}>
        This usually takes a few seconds.
      </p>
    </div>
  );
}

const gateContainerStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  padding: 24,
  background: "var(--tv-bg-page)",
};
