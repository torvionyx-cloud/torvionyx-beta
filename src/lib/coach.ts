// @ts-nocheck

/**
 * lib/coach.ts
 *
 * Prompt building + tool definition for the follow-up coach
 * (/api/proposals/[id]/coach). Turns engagement signals into ranked,
 * copy-paste-ready follow-up strategies via Claude. Server-side only.
 */

import type { ClosingIntelligence } from "@/lib/engagement";
import type { Proposal } from "@/types/database";

export const COACH_SYSTEM_PROMPT = `You are a closing strategist helping a freelancer or solo operator decide how to follow up on a proposal they sent to a client.

You will be given:
- Basic facts about the proposal (client name, proposal type)
- Engagement signals captured from the client's behaviour on the live proposal link (views, time spent, which sections they focused on, device mix)
- A behavioural read: "hot", "warm", or "cold"

Produce 3–5 ranked follow-up strategies, ordered from most to least recommended (rank 1 = best). Each strategy must be genuinely distinct — different angles or timing, not minor rewordings of the same idea.

Rules:
- Ground every "why" in the actual signals you were given. Reference specific numbers, sections, or behaviours — never generic sales advice.
- "suggested_copy" must be a complete, ready-to-send email snippet: a short subject-appropriate opening, 2–4 sentences of body, and a light call to action. Write in the founder's voice — warm, confident, never pushy or salesy. No placeholder brackets like [Client Name] — use the real client name provided.
- Vary tone and approach across the ranked strategies (e.g. one direct, one consultative, one low-pressure check-in) so the founder has real options.
- If engagement is "cold" or there have been no views, favour low-pressure, curiosity-based outreach over pushing to close.
- If engagement is "hot", favour direct asks to schedule a call or move toward a decision.
- Keep "title" short and scannable (under 8 words), like a strategy name a founder could recognise at a glance.
- Never invent engagement details that weren't provided.`;

export function buildCoachUserMessage(
  proposal: Pick<Proposal, "client_name" | "proposal_type" | "title">,
  intelligence: ClosingIntelligence
): string {
  const { engagement_signals: signals, behavioral_category } = intelligence;

  const sectionLines = signals.section_engagement.length
    ? signals.section_engagement
        .map(
          (s) =>
            `  - ${s.label}: viewed ${s.views} time(s)${
              s.avg_time_spent_seconds !== null ? `, avg ${s.avg_time_spent_seconds}s` : ""
            }`
        )
        .join("\n")
    : "  - No section-level engagement captured yet.";

  const device = signals.device_breakdown;
  const deviceSummary = `mobile: ${device.mobile}, tablet: ${device.tablet}, desktop: ${device.desktop}, unknown: ${device.unknown}`;

  const dwellSummary =
    signals.avg_time_spent_seconds === null
      ? "Not captured"
      : signals.avg_time_spent_seconds < 20
      ? `${signals.avg_time_spent_seconds}s on average — looks like a quick scan rather than a deep read`
      : signals.avg_time_spent_seconds < 60
      ? `${signals.avg_time_spent_seconds}s on average — a moderate, attentive read`
      : `${signals.avg_time_spent_seconds}s on average — a thorough, deep review`;

  return `PROPOSAL CONTEXT
- Client name: ${proposal.client_name}
- Proposal type: ${proposal.proposal_type}
- Proposal title: ${proposal.title}

BEHAVIOURAL READ: ${behavioral_category.toUpperCase()}

ENGAGEMENT SIGNALS
- Total views: ${signals.total_views}
- Unique visitors: ${signals.unique_views}
- Average time spent per view: ${dwellSummary}
- Last viewed: ${signals.last_viewed_at ?? "never"}
- Accepted: ${signals.accepted ? "yes" : "no"}
- Declined: ${signals.declined ? "yes" : "no"}

SECTION ENGAGEMENT (most-viewed first)
${sectionLines}

DEVICE BREAKDOWN
- ${deviceSummary}

Using these signals, generate 3–5 ranked follow-up strategies for ${proposal.client_name}.`;
}

export const coachTool = {
  name: "suggest_follow_up_strategies",
  description:
    "Return 3-5 ranked, distinct follow-up strategies for a proposal, each with a rationale grounded in the given engagement signals and a ready-to-send email snippet.",
  input_schema: {
    type: "object" as const,
    properties: {
      strategies: {
        type: "array" as const,
        description: "Ranked follow-up strategies, rank 1 = most recommended. 3-5 items.",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object" as const,
          properties: {
            rank: {
              type: "integer" as const,
              description: "Position in the ranking, 1 (best) to 5",
            },
            title: {
              type: "string" as const,
              description: "Short, scannable strategy name, e.g. 'Re-engage with pricing focus'",
            },
            why: {
              type: "string" as const,
              description: "1-3 sentences explaining why this strategy fits, grounded in the specific engagement signals provided",
            },
            suggested_copy: {
              type: "string" as const,
              description: "A complete, ready-to-send email snippet (opening + 2-4 sentence body + light call to action) the founder can copy, paste, and lightly customise. Use the real client name — no placeholder brackets.",
            },
          },
          required: ["rank", "title", "why", "suggested_copy"],
        },
      },
    },
    required: ["strategies"],
  },
};

/**
 * Deterministic fallback used if Claude fails or returns content that
 * doesn't validate — keeps the endpoint useful even when the model call
 * can't be trusted.
 */
export function buildFallbackStrategies(
  proposal: Pick<Proposal, "client_name">,
  intelligence: ClosingIntelligence
): { rank: number; title: string; why: string; suggested_copy: string }[] {
  const name = proposal.client_name;
  const { behavioral_category, engagement_signals: signals } = intelligence;

  if (signals.total_views === 0) {
    return [
      {
        rank: 1,
        title: "Confirm it landed",
        why: "They haven't opened the proposal yet, so the priority is making sure it didn't get lost rather than pushing for a decision.",
        suggested_copy: `Hi ${name},\n\nJust wanted to make sure the proposal I sent over reached you okay — sometimes these things end up in spam! Happy to walk you through it on a quick call if that's easier than reading through it cold.\n\nLet me know what works for you.`,
      },
      {
        rank: 2,
        title: "Offer a live walkthrough",
        why: "A short call lowers the effort required from them and gives you a chance to address questions in real time before they've even opened the document.",
        suggested_copy: `Hi ${name},\n\nNo pressure at all, but if it's easier, I'm happy to jump on a 15-minute call to walk you through the proposal and answer any questions as they come up.\n\nWould later this week work for you?`,
      },
      {
        rank: 3,
        title: "Low-pressure re-share",
        why: "Re-sending with a fresh, casual framing gives the proposal a second chance to surface in a busy inbox without sounding pushy.",
        suggested_copy: `Hi ${name},\n\nFollowing up in case this slipped down your inbox — here's the proposal again. Take your time with it, and just shout if anything's unclear or you'd like to tweak the scope.`,
      },
    ];
  }

  const topSection = signals.section_engagement[0];
  const focus = topSection ? topSection.label : null;

  const strategies = [
    {
      rank: 1,
      title: behavioral_category === "hot" ? "Propose a closing call" : "Reference what they viewed",
      why:
        behavioral_category === "hot"
          ? `They've viewed the proposal ${signals.total_views} time(s)${
              signals.avg_time_spent_seconds !== null ? ` with an average of ${signals.avg_time_spent_seconds}s per view` : ""
            } — strong enough engagement to ask directly for a short call to close.`
          : `${focus ? `They spent the most time on "${focus}"` : "They've engaged with the proposal"} — opening with that gives the follow-up a natural, specific hook.`,
      suggested_copy: focus
        ? `Hi ${name},\n\nI noticed you'd had a look through the proposal — I'd love to hear your initial thoughts, especially on the ${focus.toLowerCase()} side, since that's often where questions come up.\n\nWould you have 15 minutes this week for a quick call?`
        : `Hi ${name},\n\nWanted to check in after sending the proposal over — I'd love to hear your initial thoughts whenever you've had a chance to look through it.\n\nHappy to hop on a quick call if useful.`,
    },
    {
      rank: 2,
      title: "Offer to address questions",
      why: "Engagement suggests genuine interest but not yet a decision — offering a low-friction way to ask questions can help close any remaining gaps.",
      suggested_copy: `Hi ${name},\n\nJust checking in — if anything in the proposal raised questions or you'd like to tweak the scope or pricing, I'm very open to a conversation. No obligation either way, just want to make sure you have what you need to decide.`,
    },
    {
      rank: 3,
      title: "Light, no-pressure check-in",
      why: "A brief, friendly nudge keeps the proposal top of mind without pressuring a decision before they're ready.",
      suggested_copy: `Hi ${name},\n\nNo rush at all — just floating this back to the top of your inbox in case it's useful. Let me know if you'd like any changes or have questions whenever the time's right.`,
    },
  ];

  return strategies;
}
