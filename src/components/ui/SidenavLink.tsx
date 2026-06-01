"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  exact?: boolean;
  variant?: "sidenav" | "topbar";
}

export function SidenavLink({
  href,
  children,
  icon,
  exact = false,
  variant = "sidenav",
}: Props) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  if (variant === "topbar") {
    return (
      <Link
        href={href}
        className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
          isActive
            ? "bg-neutral-100 dark:bg-[#374151] text-neutral-900 dark:text-[#F3F4F6] font-medium"
            : "text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-[#F3F4F6] hover:bg-neutral-100 dark:hover:bg-[#374151]"
        }`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-neutral-100 dark:bg-[#374151] text-neutral-900 dark:text-[#F3F4F6] font-medium"
          : "text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-[#F3F4F6] hover:bg-neutral-50 dark:hover:bg-[#374151]/60"
      }`}
    >
      {icon && (
        <span className={`shrink-0 ${isActive ? "opacity-90" : "opacity-50"}`}>
          {icon}
        </span>
      )}
      {children}
    </Link>
  );
}
