// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/dashboard/[proposal_id]/edit/page.tsx
 *
 * Server component: fetches the proposal and brand settings,
 * then hands off to the client-side editor.
 */

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { ProposalEditorClient } from "@/components/proposals/ProposalEditorClient";

interface PageProps {
  params: { proposal_id: string };
}

export default async function EditProposalPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createAdminClient();

  const [
    { data: proposal },
    { data: brand },
    { data: scopeLibrary },
    { data: feeTemplates },
    { data: rates },
  ] = await Promise.all([
    supabase.from("proposals").select("*").eq("id", params.proposal_id).eq("workspace_id", workspaceId).single(),
    supabase.from("brand_settings").select("*").eq("workspace_id", workspaceId).single(),
    supabase.from("scope_library").select("*").eq("workspace_id", workspaceId),
    supabase.from("fee_resourcing_templates").select("*").eq("workspace_id", workspaceId),
    supabase.from("rate_card").select("*").eq("workspace_id", workspaceId),
  ]);

  if (!proposal) notFound();

  return (
    <ProposalEditorClient
      proposal={proposal}
      brand={brand}
      scopeLibrary={scopeLibrary ?? []}
      feeTemplates={feeTemplates ?? []}
      rates={rates ?? []}
    />
  );
}
