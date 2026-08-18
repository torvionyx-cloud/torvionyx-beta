// @ts-nocheck

export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

// Knowledge became a tabbed page (Projects + Rate card) at /dashboard/knowledge.
// This route is kept only so old bookmarks/links land on the right tab.
export default function RateCardRedirect() {
  redirect("/dashboard/knowledge?tab=rates");
}
