// @ts-nocheck

export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceId } from "@/lib/workspace";
import { createServerClient } from "@/lib/supabase";
import { RateCardTable } from "@/components/knowledge/RateCardTable";
import type { RateCard } from "@/types/database";

export default async function RateCardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("rate_card")
    .select("id, grade, hourly_rate, effective_from, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("hourly_rate", { ascending: false });

  if (error) throw new Error("Failed to load rate card");

  const rates = (data ?? []) as RateCard[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontWeight: 600, fontSize: 22,
          color: "var(--tv-text)",
          margin: 0,
        }}>
          Rate card
        </h1>
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--tv-text-dim)" }}>
          These rates are used to calculate fees. They are never shown to clients.
        </p>
      </div>

      <RateCardTable initialRates={rates} />
    </div>
  );
}
