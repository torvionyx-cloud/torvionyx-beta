// @ts-nocheck

export const dynamic = 'force-dynamic';

/**
 * app/dashboard/settings/brand/page.tsx
 *
 * The Branding tab of the settings area. Renders the same BrandSettingsForm
 * as /dashboard/brand (the main-nav "Branding" link) — deliberately not a
 * separate implementation. This route exists so the Account/Branding tab
 * switcher on /dashboard/settings has somewhere real to link to.
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceId } from "@/lib/workspace";
import { createServerClient } from "@/lib/supabase";
import { BrandSettingsForm } from "@/components/brand/BrandSettingsForm";
import { SettingsTabs } from "@/components/dashboard/SettingsTabs";
import type { BrandSettings } from "@/types/database";

export default async function SettingsBrandPage() {
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
      <SettingsTabs />
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
}
