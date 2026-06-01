import Link from "next/link";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#111827] flex flex-col items-center justify-center px-6 text-center">
      <TorvionyxLogo size={40} aria-hidden={false} aria-label="Torvionyx" />

      <p className="mt-6 text-sm font-semibold text-[#0891B2] uppercase tracking-widest">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-[#F3F4F6] tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-neutral-500 dark:text-gray-400 max-w-xs">
        This page doesn&apos;t exist, or the link may have expired.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-[#0891B2] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0e7490] transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-200 dark:border-[#374151] px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-[#1F2937] transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
