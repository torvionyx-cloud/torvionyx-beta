// @ts-nocheck

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, RateCard, ScopeLibraryRow } from "@/types/database";
import { ProjectsGrid } from "@/components/knowledge/ProjectsGrid";
import { RateCardTable } from "@/components/knowledge/RateCardTable";
import { ScopeLibraryAccordion } from "@/components/knowledge/ScopeLibraryAccordion";

type Tab = "projects" | "rates" | "scope";

interface Props {
  initialTab: Tab;
  initialProjects: Project[];
  initialRates: RateCard[];
  initialScope: ScopeLibraryRow[];
}

const TABS: { id: Tab; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "rates", label: "Rate card" },
  { id: "scope", label: "Scope Library" },
];

export function KnowledgeTabs({ initialTab, initialProjects, initialRates, initialScope }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Lists live here, one level above both panels, and are seeded from the
  // server only once (on this component's own initial mount). Previously
  // ProjectsGrid/RateCardTable each forked their own useState(initialX) —
  // harmless as long as they never unmounted, but the tab ternary below
  // used to unmount whichever panel wasn't active, so switching back to it
  // re-seeded from that original snapshot and silently dropped anything
  // added/edited since (the row was always still in the DB — see the
  // Supabase check from the bug report). Lifting the arrays here, plus
  // keeping both panels permanently mounted below, removes the remount
  // entirely: there's exactly one array per list, and it's only ever
  // mutated in place by each panel's save/delete handlers.
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [rates, setRates] = useState<RateCard[]>(initialRates);
  const [scope, setScope] = useState<ScopeLibraryRow[]>(initialScope);

  const router = useRouter();

  const selectTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    // Keep the URL in sync so every tab stays a real, shareable/refreshable
    // link (old /dashboard/knowledge/rates redirects here with ?tab=rates)
    // — router.replace, not push, so tab-switching doesn't pollute
    // back-button history. Any fresh server data this triggers is harmless
    // to ignore: projects/rates/scope above are only seeded once, so a
    // resulting prop update to initialProjects/initialRates/initialScope
    // never overwrites the live client-side lists.
    const path =
      tab === "projects" ? "/dashboard/knowledge"
      : tab === "rates" ? "/dashboard/knowledge?tab=rates"
      : "/dashboard/knowledge?tab=scope";
    router.replace(path, { scroll: false });
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

      {/* All three panels stay mounted at all times — the inactive ones are
          just display:none, never unmounted — so none of them ever re-seeds
          its list from a stale snapshot on switch. */}
      <div style={{ display: activeTab === "projects" ? "block" : "none" }}>
        <ProjectsGrid projects={projects} setProjects={setProjects} />
      </div>
      <div style={{ display: activeTab === "rates" ? "block" : "none" }}>
        <RateCardTable rates={rates} setRates={setRates} />
      </div>
      <div style={{ display: activeTab === "scope" ? "block" : "none" }}>
        <ScopeLibraryAccordion rows={scope} setRows={setScope} />
      </div>
    </div>
  );
}
