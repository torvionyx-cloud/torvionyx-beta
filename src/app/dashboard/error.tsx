"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] Unhandled render error:", error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "40vh",
      gap: 12,
      color: "var(--tv-text-faint)",
      fontFamily: "monospace",
      fontSize: 13,
      textAlign: "center",
    }}>
      <span style={{ fontSize: 28 }}>⚠</span>
      <p style={{ color: "var(--tv-text)", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, margin: 0 }}>
        Something went wrong
      </p>
      <p style={{ margin: 0 }}>
        Try refreshing the page. If the problem persists, contact support.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: 8,
          background: "#DCAA33",
          color: "#0A1322",
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: 13,
          border: "none",
          borderRadius: 10,
          padding: "9px 20px",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
