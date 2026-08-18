// @ts-nocheck

export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceId } from "@/lib/workspace";
import { createServerClient } from "@/lib/supabase";
import { KnowledgeTabs } from "@/components/knowledge/KnowledgeTabs";
import type { Project, RateCard, ScopeLibraryRow } from "@/types/database";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createServerClient();

  // All three tabs' data is fetched up front — a founder's portfolio, rate
  // card, and scope library are all small lists, and this keeps tab
  // switching instant with no client-side fetch/RLS round trip.
  const [projectsResult, ratesResult, scopeResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, workspace_id, name, sector, project_type, location, construction_value, year_completed, riba_stages_delivered, description, outcome, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("rate_card")
      .select("id, grade, hourly_rate, effective_from, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("hourly_rate", { ascending: false }),
    supabase
      .from("scope_library")
      .select("id, workspace_id, riba_stage, project_type, scope_text, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("riba_stage", { ascending: true }),
  ]);

  if (projectsResult.error) throw new Error("Failed to load projects");
  if (ratesResult.error) throw new Error("Failed to load rate card");
  if (scopeResult.error) throw new Error("Failed to load scope library");

  const projects = (projectsResult.data ?? []) as Project[];
  const rates = (ratesResult.data ?? []) as RateCard[];
  const scope = (scopeResult.data ?? []) as ScopeLibraryRow[];
  const initialTab =
    searchParams?.tab === "rates" ? "rates"
    : searchParams?.tab === "scope" ? "scope"
    : "projects";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontWeight: 600, fontSize: 22,
          color: "var(--tv-text)",
          margin: 0,
        }}>
          Knowledge
        </h1>
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--tv-text-dim)" }}>
          Your portfolio, charge-out rates, and scope wording — private data that powers every proposal you send.
        </p>
      </div>

      <KnowledgeTabs
        initialTab={initialTab}
        initialProjects={projects}
        initialRates={rates}
        initialScope={scope}
      />
    </div>
  );
}
