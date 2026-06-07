// @ts-nocheck

export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkWorkspaceGenerationRateLimit } from "@/lib/rate-limit";
import { validateInput, generateProposalSchema, type GenerateProposalInput } from "@/lib/validation";
import { getWorkspaceId } from "@/lib/workspace";
import { generateProposalForWorkspace } from "./service";

export async function POST(req: Request) {
  const { userId } = (await auth()).protect();

  const workspaceId = await getWorkspaceId(userId);

  const rateLimitResponse = await checkWorkspaceGenerationRateLimit(workspaceId);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validateInput(generateProposalSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  const input = validation.data as GenerateProposalInput;

  try {
    const result = await generateProposalForWorkspace(workspaceId, input);

    return NextResponse.json({
      proposal_id: result.proposal.id,
      share_token: result.proposal.share_token,
      content: result.proposal.content,
    });
  } catch (error) {
    console.error("[proposals/generate] Unhandled error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
