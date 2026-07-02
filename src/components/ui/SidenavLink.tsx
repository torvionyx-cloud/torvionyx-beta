// @ts-nocheck

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  exact?: boolean;
  variant?: "sidenav" | "topbar" | "navy";
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

  if (variant === "navy") {
    return (
      <Link
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "10px 12px",
          borderRadius: 10,
          fontSize: 13.5,
          fontWeight: 500,
          textDecoration: "none",
          transition: "background .18s, color .18s",
          position: "relative",
          color: isActive ? "#DCAA33" : "rgba(250,242,232,.62)",
          background: isActive ? "rgba(220,170,51,.13)" : "transparent",
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(250,242,232,.06)";
            e.currentTarget.style.color = "#FAF2E8";
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(250,242,232,.62)";
          }
        }}
      >
        {/* Gold left bar when active */}
        {isActive && (
          <span style={{
            position: "absolute",
            left: -12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 22,
            background: "#DCAA33",
            borderRadius: "0 3px 3px 0",
          }} />
        )}
        {icon && (
          <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>
            {icon}
          </span>
        )}
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