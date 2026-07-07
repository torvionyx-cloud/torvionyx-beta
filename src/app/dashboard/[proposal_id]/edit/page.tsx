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
import { createServerClient } from "@/lib/supabase";
import { ProposalEditorClient } from "@/components/proposals/ProposalEditorClient";

interface PageProps {
  params: { proposal_id: string };
}

export default async function EditProposalPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createServerClient();

  const [{ data: proposal }, { data: brand }] = await Promise.all([
    supabase
      .from("proposals")
      .select("*")
      .eq("id", params.proposal_id)
      .eq("workspace_id", workspaceId)
      .single(),
    supabase
      .from("brand_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single(),
  ]);

  if (!proposal) notFound();

  return <ProposalEditorClient proposal={proposal} brand={brand} />;
}
