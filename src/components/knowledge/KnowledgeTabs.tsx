// @ts-nocheck

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, RateCard } from "@/types/database";
import { ProjectsGrid } from "@/components/knowledge/ProjectsGrid";
import { RateCardTable } from "@/components/knowledge/RateCardTable";

type Tab = "projects" | "rates";

interface Props {
  initialTab: Tab;
  initialProjects: Project[];
  initialRates: RateCard[];
}

const TABS: { id: Tab; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "rates", label: "Rate card" },
];

export function KnowledgeTabs({ initialTab, initialProjects, initialRates }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const router = useRouter();

  const selectTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    // Keep the URL in sync so the Rate card tab stays a real, shareable/
    // refreshable link (old /dashboard/knowledge/rates redirects here with
    // ?tab=rates) — router.replace, not push, so tab-switching doesn't
    // pollute back-button history.
    router.replace(tab === "projects" ? "/dashboard/knowledge" : "/dashboard/knowledge?tab=rates", { scroll: false });
  }, [router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 22, borderBottom: "1px solid var(--tv-border-soft)" }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              style={{
                position: "relative",
                background: "none", border: "none", cursor: "pointer",
                padding: "0 2px 14px",
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15,
                color: isActive ? "var(--tv-text)" : "var(--tv-text-dim)",
                transition: "color .15s",
              }}
            >
              {tab.label}
              {isActive && (
                <span style={{
                  position: "absolute", left: 0, right: 0, bottom: -1,
                  height: 2, borderRadius: 2,
                  background: "linear-gradient(90deg, var(--tv-gold-bright), var(--tv-gold))",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "projects" ? (
        <ProjectsGrid initialProjects={initialProjects} />
      ) : (
        <RateCardTable initialRates={initialRates} />
      )}
    </div>
  );
}
