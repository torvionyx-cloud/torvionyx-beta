import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceId } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase";
import { BrandSettingsForm } from "@/components/brand/BrandSettingsForm";
import type { BrandSettings } from "@/types/database";

export default async function BrandSettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspaceId = await getWorkspaceId(userId);
  const supabase = createAdminClient();

  const { data: brand } = await supabase
    .from("brand_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  if (!brand) redirect("/dashboard");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Brand settings</h1>
        <p className="mt-1 text-neutral-500">
          Customise how your proposals look and sound. Changes apply to all future proposals.
        </p>
      </div>
      <BrandSettingsForm initialBrand={brand as BrandSettings} />
    </div>
  );
}
