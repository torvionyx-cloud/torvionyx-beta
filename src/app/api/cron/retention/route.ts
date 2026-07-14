// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/api/cron/retention/route.ts
 *
 * GET /api/cron/retention
 *
 * Data retention job (Standard #6). Invoked by Vercel Cron (see vercel.json,
 * schedule "0 3 * * *"). Not user-facing — auth is a shared-secret header,
 * not Clerk.
 *
 * DRY RUN ONLY: this counts rows past each table's retention window and
 * returns the counts. It does not delete anything. Wire up the DELETE once
 * the counts have been reviewed.
 *
 * Retention windows:
 * - proposal_events:    12 months (occurred_at)
 * - ai_generations:     12 months (generated_at)
 * - acceptance_records: 24 months (accepted_at) — kept longer for dispute/audit purposes
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

function monthsAgoIso(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const cutoffs = {
      proposal_events: monthsAgoIso(12),
      ai_generations: monthsAgoIso(12),
      acceptance_records: monthsAgoIso(24),
    };

    const [proposalEvents, aiGenerations, acceptanceRecords] = await Promise.all([
      supabase
        .from("proposal_events")
        .select("id", { count: "exact", head: true })
        .lt("occurred_at", cutoffs.proposal_events),
      supabase
        .from("ai_generations")
        .select("id", { count: "exact", head: true })
        .lt("generated_at", cutoffs.ai_generations),
      supabase
        .from("acceptance_records")
        .select("id", { count: "exact", head: true })
        .lt("accepted_at", cutoffs.acceptance_records),
    ]);

    if (proposalEvents.error || aiGenerations.error || acceptanceRecords.error) {
      console.error("[cron/retention] Query error:", {
        proposalEvents: proposalEvents.error,
        aiGenerations: aiGenerations.error,
        acceptanceRecords: acceptanceRecords.error,
      });
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    const result = {
      dryRun: true,
      ranAt: new Date().toISOString(),
      cutoffs,
      counts: {
        proposal_events: proposalEvents.count ?? 0,
        ai_generations: aiGenerations.count ?? 0,
        acceptance_records: acceptanceRecords.count ?? 0,
      },
    };

    console.log("[cron/retention] Dry run counts:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron/retention] Unhandled error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
