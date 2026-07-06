'use client';

export default function DashboardError() {
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
    </div>
  );
}
