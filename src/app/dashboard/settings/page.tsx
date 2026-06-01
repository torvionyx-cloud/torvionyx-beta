import { redirect } from "next/navigation";

// /dashboard/settings → brand settings is the settings page for beta
export default function SettingsPage() {
  redirect("/dashboard/brand");
}
