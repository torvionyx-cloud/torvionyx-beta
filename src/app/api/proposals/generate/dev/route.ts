// @ts-nocheck

export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { z } from "zod";
import { validateInput, generateProposalSchema, type GenerateProposalInput } from "@/lib/validation";
import { generateProposalForWorkspace } from "../service";

const devGenerateSchema = generateProposalSchema.extend({
  workspace_id: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validateInput(devGenerateSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  const { workspace_id, ...input } = validation.data;
  const workspaceId = workspace_id ?? process.env.DEV_WORKSPACE_ID;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspace_id is required in development mode" },
      { status: 400 }
    );
  }

  try {
    const result = await generateProposalForWorkspace(
      workspaceId,
      input as GenerateProposalInput
    );

    return NextResponse.json({
      proposal_id: result.proposal.id,
      share_token: result.proposal.share_token,
      content: result.proposal.content,
    });
  } catch (error) {
    console.error("[proposals/generate/dev] Unhandled error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
