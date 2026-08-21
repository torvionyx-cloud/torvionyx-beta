// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/dashboard/new/page.tsx
 *
 * Server component: loads scope library + fee templates so the intake
 * form's RIBA stage multi-select can show live, per-stage data
 * availability via stageHasData() (lib/stageResolver.ts). Form state,
 * submission, and rendering live in NewProposalFormClient (Phase B —
 * proposal creation rework).
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { NewProposalFormClient } from "@/components/proposals/NewProposalFormClient";

export default async function NewProposalPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createAdminClient();

  const [{ data: scopeLibrary }, { data: feeTemplates }] = await Promise.all([
    supabase.from("scope_library").select("*").eq("workspace_id", workspaceId),
    supabase.from("fee_resourcing_templates").select("*").eq("workspace_id", workspaceId),
  ]);

  return (
    <NewProposalFormClient
      scopeLibrary={scopeLibrary ?? []}
      feeTemplates={feeTemplates ?? []}
    />
  );
}
