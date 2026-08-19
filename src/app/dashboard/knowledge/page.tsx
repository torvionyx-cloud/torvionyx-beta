// @ts-nocheck

export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { KnowledgeTabs } from "@/components/knowledge/KnowledgeTabs";
import type { FeeResourcingTemplateRow, Project, RateCard, ScopeLibraryRow } from "@/types/database";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  // Timing instrumentation — added while chasing an intermittent ~288s
  // 500 on first load after a dev-server restart/cold start (fast on
  // refresh). Nothing in this request path (auth(), getWorkspaceId(), or
  // the Supabase queries below) has an explicit timeout, so if any one of
  // them stalls, nothing here bounds it — nothing was logged the first two
  // times it happened, so these markers exist to catch the next one with
  // real numbers instead of another guess. Safe to remove once the cause
  // is confirmed and fixed.
  const authStart = Date.now();
  const { userId } = await auth();
  console.log(`[knowledge page] auth() resolved in ${Date.now() - authStart}ms`);
  if (!userId) redirect("/sign-in");

  const workspaceStart = Date.now();
  const workspaceId = await getWorkspaceId(userId);
  console.log(`[knowledge page] getWorkspaceId() resolved in ${Date.now() - workspaceStart}ms`);

  const supabase = createAdminClient();

  // All four tabs' data is fetched up front — a founder's portfolio, rate
  // card, scope library, and fee templates are all small lists, and this
  // keeps tab switching instant with no client-side fetch/RLS round trip.
  const queryStart = Date.now();
  const [projectsResult, ratesResult, scopeResult, feeTemplatesResult] = await Promise.all([
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
    supabase
      .from("fee_resourcing_templates")
      .select("id, workspace_id, riba_stage, project_type, grade, hours, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("riba_stage", { ascending: true }),
  ]);
  console.log(`[knowledge page] Promise.all Supabase queries resolved in ${Date.now() - queryStart}ms`);

  if (projectsResult.error) {
    console.error("[knowledge page] projects query failed:", projectsResult.error);
    throw new Error("Failed to load projects");
  }
  if (ratesResult.error) {
    console.error("[knowledge page] rates query failed:", ratesResult.error);
    throw new Error("Failed to load rate card");
  }
  if (scopeResult.error) {
    console.error("[knowledge page] scope query failed:", scopeResult.error);
    throw new Error("Failed to load scope library");
  }
  if (feeTemplatesResult.error) {
    console.error("[knowledge page] fee templates query failed:", feeTemplatesResult.error);
    throw new Error("Failed to load fee resourcing templates");
  }

  const projects = (projectsResult.data ?? []) as Project[];
  const rates = (ratesResult.data ?? []) as RateCard[];
  const scope = (scopeResult.data ?? []) as ScopeLibraryRow[];
  const feeTemplates = (feeTemplatesResult.data ?? []) as FeeResourcingTemplateRow[];
  const initialTab =
    searchParams?.tab === "rates" ? "rates"
    : searchParams?.tab === "scope" ? "scope"
    : searchParams?.tab === "templates" ? "templates"
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
        initialFeeTemplates={feeTemplates}
      />
    </div>
  );
}
