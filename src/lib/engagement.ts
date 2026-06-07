// @ts-nocheck

/**
 * lib/engagement.ts
 *
 * Shared engagement analysis — turns raw proposal_events into the
 * "closing intelligence" signals consumed by both the
 * /api/proposals/[id]/closing-intelligence route (raw signals + canned
 * recommendations) and the /api/proposals/[id]/coach route (which feeds
 * these signals to Claude to produce ranked follow-up strategies).
 *
 * Engagement metadata contract (written by the public proposal tracker):
 *   viewed         -> { visitor_id?, device?: "mobile" | "tablet" | "desktop", duration_ms? }
 *   section_viewed -> { visitor_id?, block_id?, block_type?, duration_ms? }
 * All fields are optional — events missing them are simply excluded from
 * the relevant aggregate rather than treated as errors.
 */

import { createAdminClient } from "@/lib/supabase";
import type { ProposalEvent, ProposalContent, ProposalBlock } from "@/types/database";

export type BehavioralCategory = "hot" | "warm" | "cold";

export type SectionEngagement = {
  block_id: string | null;
  block_type: string | null;
  label: string;
  views: number;
  avg_time_spent_seconds: number | null;
};

export type EngagementSignals = {
  total_views: number;
  unique_views: number;
  avg_time_spent_seconds: number | null;
  last_viewed_at: string | null;
  section_engagement: SectionEngagement[];
  device_breakdown: { mobile: number; tablet: number; desktop: number; unknown: number };
  accepted: boolean;
  declined: boolean;
};

export type ClosingIntelligence = {
  engagement_signals: EngagementSignals;
  behavioral_category: BehavioralCategory;
  recommendations: string[];
};

const BLOCK_LABELS: Record<ProposalBlock["type"], string> = {
  hero: "Introduction",
  text: "Overview",
  bullets: "Key points",
  scope_table: "Scope of work",
  timeline: "Timeline",
  pricing: "Pricing",
  cta: "Call to action",
  terms: "Terms",
  divider: "Divider",
};

/**
 * Loads events for a proposal (scoped to the given workspace) and runs the
 * full engagement analysis. Returns null if the proposal doesn't exist or
 * doesn't belong to the workspace.
 */
export async function getClosingIntelligence(
  proposalId: string,
  workspaceId: string
): Promise<ClosingIntelligence | null> {
  const supabase = createAdminClient();

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("id, content")
    .eq("id", proposalId)
    .eq("workspace_id", workspaceId)
    .single();

  if (proposalError || !proposal) {
    return null;
  }

  const { data: events, error: eventsError } = await supabase
    .from("proposal_events")
    .select("id, event_type, metadata, occurred_at")
    .eq("proposal_id", proposalId)
    .order("occurred_at", { ascending: true });

  if (eventsError) {
    console.error("[engagement] Failed to load events:", eventsError);
    throw new Error("Failed to load engagement data");
  }

  const signals = analyzeEngagement(events ?? [], proposal.content as ProposalContent | null);
  const behavioralCategory = categorize(signals);
  const recommendations = buildRecommendations(signals, behavioralCategory);

  return {
    engagement_signals: signals,
    behavioral_category: behavioralCategory,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Engagement analysis
// ---------------------------------------------------------------------------

function analyzeEngagement(
  events: Pick<ProposalEvent, "event_type" | "metadata" | "occurred_at">[],
  content: ProposalContent | null
): EngagementSignals {
  const viewed = events.filter((e) => e.event_type === "viewed");
  const sectionViewed = events.filter((e) => e.event_type === "section_viewed");

  // Unique visitors — fall back to counting raw views if no visitor_id was captured.
  const visitorIds = new Set<string>();
  let anonymousViews = 0;
  for (const event of viewed) {
    const visitorId = readString(event.metadata, "visitor_id");
    if (visitorId) {
      visitorIds.add(visitorId);
    } else {
      anonymousViews += 1;
    }
  }
  const uniqueViews = visitorIds.size + anonymousViews;

  const avgTimeSpent = average(viewed.map((e) => readDurationSeconds(e.metadata)));

  const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
  for (const event of viewed) {
    const device = readString(event.metadata, "device")?.toLowerCase();
    if (device === "mobile") deviceBreakdown.mobile += 1;
    else if (device === "tablet") deviceBreakdown.tablet += 1;
    else if (device === "desktop") deviceBreakdown.desktop += 1;
    else deviceBreakdown.unknown += 1;
  }

  const sectionEngagement = buildSectionEngagement(sectionViewed, content);

  const lastViewedAt = viewed.length > 0 ? viewed[viewed.length - 1].occurred_at : null;

  return {
    total_views: viewed.length,
    unique_views: uniqueViews,
    avg_time_spent_seconds: avgTimeSpent,
    last_viewed_at: lastViewedAt,
    section_engagement: sectionEngagement,
    device_breakdown: deviceBreakdown,
    accepted: events.some((e) => e.event_type === "accepted"),
    declined: events.some((e) => e.event_type === "declined"),
  };
}

function buildSectionEngagement(
  sectionViewed: Pick<ProposalEvent, "metadata">[],
  content: ProposalContent | null
): SectionEngagement[] {
  const labelByBlockId = new Map<string, string>();
  if (content?.blocks) {
    for (const block of content.blocks) {
      const blockWithId = block as ProposalBlock & { id?: string };
      if (blockWithId.id) {
        labelByBlockId.set(blockWithId.id, BLOCK_LABELS[block.type] ?? block.type);
      }
    }
  }

  const groups = new Map<
    string,
    { block_id: string | null; block_type: string | null; durations: number[]; views: number }
  >();

  for (const event of sectionViewed) {
    const blockId = readString(event.metadata, "block_id");
    const blockType = readString(event.metadata, "block_type");
    const key = blockId ?? blockType ?? "unknown";

    const existing = groups.get(key);
    const duration = readDurationSeconds(event.metadata);
    if (existing) {
      existing.views += 1;
      if (duration !== null) existing.durations.push(duration);
    } else {
      groups.set(key, {
        block_id: blockId,
        block_type: blockType,
        durations: duration !== null ? [duration] : [],
        views: 1,
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      block_id: group.block_id,
      block_type: group.block_type,
      label:
        (group.block_id && labelByBlockId.get(group.block_id)) ??
        (group.block_type ? BLOCK_LABELS[group.block_type as ProposalBlock["type"]] ?? group.block_type : "Unknown section"),
      views: group.views,
      avg_time_spent_seconds: average(group.durations),
    }))
    .sort((a, b) => b.views - a.views);
}

// ---------------------------------------------------------------------------
// Categorisation — simple weighted score across views, dwell time, and
// section depth. Thresholds are deliberately generous since proposals are
// typically viewed only a handful of times.
// ---------------------------------------------------------------------------

function categorize(signals: EngagementSignals): BehavioralCategory {
  if (signals.declined) return "cold";
  if (signals.accepted) return "hot";
  if (signals.total_views === 0) return "cold";

  let score = 0;
  if (signals.total_views >= 3) score += 2;
  else if (signals.total_views >= 2) score += 1;

  if (signals.unique_views >= 2) score += 1;

  if (signals.avg_time_spent_seconds !== null) {
    if (signals.avg_time_spent_seconds >= 90) score += 2;
    else if (signals.avg_time_spent_seconds >= 30) score += 1;
  }

  const sectionsExplored = signals.section_engagement.length;
  if (sectionsExplored >= 4) score += 2;
  else if (sectionsExplored >= 2) score += 1;

  const viewedPricing = signals.section_engagement.some(
    (s) => s.block_type === "pricing" || s.label === "Pricing"
  );
  if (viewedPricing) score += 1;

  if (score >= 5) return "hot";
  if (score >= 2) return "warm";
  return "cold";
}

// ---------------------------------------------------------------------------
// Recommendations — practical, founder-facing follow-up suggestions
// ---------------------------------------------------------------------------

function buildRecommendations(signals: EngagementSignals, category: BehavioralCategory): string[] {
  const recommendations: string[] = [];

  if (signals.accepted) {
    recommendations.push("Client has already accepted — move straight to onboarding and kickoff scheduling.");
    return recommendations;
  }

  if (signals.declined) {
    recommendations.push("Client declined — a short, no-pressure check-in to ask what didn't fit could surface a future opportunity.");
    return recommendations;
  }

  if (signals.total_views === 0) {
    recommendations.push("They haven't opened the proposal yet — send a brief nudge confirming it landed and offering to walk through it live.");
    return recommendations;
  }

  const topSection = signals.section_engagement[0];

  if (category === "hot") {
    recommendations.push("High engagement — strike while interest is warm; propose a short call to answer questions and close.");
  } else if (category === "warm") {
    recommendations.push("Solid initial interest — a light follow-up referencing what they looked at can help move things forward.");
  } else {
    recommendations.push("Engagement is light so far — a friendly check-in to confirm they received it and gauge interest is worth the effort.");
  }

  if (topSection && topSection.views > 0) {
    recommendations.push(
      `They spent the most time on "${topSection.label}" — lead your follow-up with that and be ready to go deeper there.`
    );
  }

  const viewedPricing = signals.section_engagement.find(
    (s) => s.block_type === "pricing" || s.label === "Pricing"
  );
  if (viewedPricing) {
    recommendations.push("They reviewed pricing — be prepared to discuss scope or budget flexibility if they raise it.");
  }

  if (signals.total_views >= 2 && signals.unique_views <= 1) {
    recommendations.push("They've revisited the proposal more than once — repeat views often signal they're discussing it internally; offer to join that conversation.");
  }

  const { mobile, desktop, tablet } = signals.device_breakdown;
  if (mobile > desktop + tablet && mobile > 0) {
    recommendations.push("Most views were on mobile — keep follow-up messages short and easy to skim.");
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readString(metadata: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!metadata) return null;
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readDurationSeconds(metadata: Record<string, unknown> | null | undefined): number | null {
  if (!metadata) return null;
  const ms = metadata["duration_ms"];
  if (typeof ms === "number" && Number.isFinite(ms) && ms >= 0) {
    return Math.round(ms / 100) / 10;
  }
  const seconds = metadata["duration_seconds"];
  if (typeof seconds === "number" && Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 10) / 10;
  }
  return null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 10) / 10;
}
