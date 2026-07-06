// @ts-nocheck

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceId } from "@/lib/workspace";
import { createServerClient } from "@/lib/supabase";
import { BrandSettingsForm } from "@/components/brand/BrandSettingsForm";
import type { BrandSettings } from "@/types/database";

export default async function BrandSettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createServerClient();

  const { data: brand } = await supabase
    .from("brand_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  if (!brand) redirect("/dashboard");

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontWeight: 600, fontSize: 22,
          color: "var(--tv-text)", letterSpacing: "-.02em"
        }}>
          Brand settings
        </h1>
        <p style={{ marginTop: 4, fontSize: 13, color: "var(--tv-text-faint)" }}>
          Customise how your proposals look and sound. Changes apply to all future proposals.
        </p>
      </div>
      <BrandSettingsForm initialBrand={brand as BrandSettings} />
    </div>
  );