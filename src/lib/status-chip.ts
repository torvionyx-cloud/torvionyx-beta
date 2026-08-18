// @ts-nocheck

// Shared proposal-status → chip-color map. Previously duplicated verbatim in
// dashboard/page.tsx, dashboard/proposals/page.tsx and dashboard/analytics/page.tsx —
// centralized here so new pages (Pipeline, etc.) don't add a 4th copy.
// Each page still owns its own <Chip> renderer (font-size/padding differ slightly
// between them), so only the color data lives here.

export type ProposalStatusChip = { label: string; bg: string; color: string };

export const STATUS_CHIP: Record<string, ProposalStatusChip> = {
  draft:    { label: "Draft",    bg: "rgba(250,242,232,.10)", color: "rgba(250,242,232,.5)" },
  shared:   { label: "Sent",     bg: "rgba(61,185,201,.14)",  color: "#3DB9C9" },
  viewed:   { label: "Viewed",   bg: "rgba(242,169,59,.14)",  color: "#F2A93B" },
  accepted: { label: "Accepted", bg: "rgba(95,208,138,.16)",  color: "#5FD08A" },
  declined: { label: "Declined", bg: "rgba(242,99,92,.14)",   color: "#F2635C" },
  expired:  { label: "Expired",  bg: "rgba(250,242,232,.08)", color: "rgba(250,242,232,.35)" },
  // "Lost" is an alias of "declined" (same chip color) — Pipeline's label for
  // a proposal that didn't convert.
  lost:     { label: "Lost",     bg: "rgba(242,99,92,.14)",   color: "#F2635C" },
};
