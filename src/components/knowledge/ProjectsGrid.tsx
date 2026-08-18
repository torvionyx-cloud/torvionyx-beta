// @ts-nocheck

"use client";

import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Project } from "@/types/database";
import { ProjectPanel } from "@/components/knowledge/ProjectPanel";

interface Props {
  // Owned by KnowledgeTabs, not forked into local state here — this panel
  // stays mounted across tab switches (see KnowledgeTabs), so a local
  // useState(initialProjects) would only ever reflect the page's original
  // server-render snapshot, not anything added/edited/deleted since.
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
}

function formatCurrency(value: number | null): string | null {
  if (value == null) return null;
  return new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP", maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectsGrid({ projects, setProjects }: Props) {
  // null = closed, "new" = add mode, a Project = edit mode
  const [panelTarget, setPanelTarget] = useState<Project | "new" | null>(null);

  const closePanel = useCallback(() => setPanelTarget(null), []);

  const handleSaved = useCallback((project: Project) => {
    setProjects(prev => {
      const exists = prev.some(p => p.id === project.id);
      return exists ? prev.map(p => (p.id === project.id ? project : p)) : [project, ...prev];
    });
    setPanelTarget(null);
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setPanelTarget(null);
  }, []);

  const isEmpty = projects.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {!isEmpty && (
        <button type="button" onClick={() => setPanelTarget("new")} style={{ ...primaryButtonStyle, alignSelf: "flex-start" }}>
          {plusIcon}
          Add project
        </button>
      )}

      {isEmpty ? (
        <div className="transition-colors duration-300" style={{
          background: "var(--tv-bg-panel)",
          border: "1px solid var(--tv-border)",
          borderRadius: 14,
          boxShadow: "var(--tv-shadow)",
          padding: "56px 24px",
          textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 17,
            color: "var(--tv-text)", margin: 0,
          }}>
            Add your first project
          </h2>
          <p style={{
            maxWidth: 440, margin: "10px auto 22px", fontSize: 13, lineHeight: 1.55,
            color: "var(--tv-text-faint)",
          }}>
            These appear in the &ldquo;Relevant experience&rdquo; section of every proposal you send.
            Aim for four to six of your best.
          </p>
          <button type="button" onClick={() => setPanelTarget("new")} style={primaryButtonStyle}>
            {plusIcon}
            Add project
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid", gap: 16,
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}>
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onClick={() => setPanelTarget(project)} />
          ))}
        </div>
      )}

      {panelTarget !== null && (
        <ProjectPanel
          project={panelTarget === "new" ? null : panelTarget}
          onClose={closePanel}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const value = formatCurrency(project.construction_value);
  const stages = [...(project.riba_stages_delivered ?? [])].sort((a, b) => a - b);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group hover:bg-white/5 transition-colors duration-150"
      style={{
        textAlign: "left", cursor: "pointer",
        background: "var(--tv-bg-panel)",
        border: "1px solid var(--tv-border)",
        borderRadius: 14,
        boxShadow: "var(--tv-shadow)",
        padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <span style={{
          fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15,
          color: "var(--tv-text)", lineHeight: 1.3,
        }}>
          {project.name}
        </span>
        <span style={pillStyle}>{project.sector}</span>
      </div>

      <div style={{ fontSize: 13, color: "var(--tv-text-faint)" }}>
        {project.location}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontFamily: "monospace", fontSize: 13 }}>
        {value && <span style={{ color: "var(--tv-text)" }}>{value}</span>}
        {project.year_completed && (
          <span style={{ color: "var(--tv-text-faint)" }}>{project.year_completed}</span>
        )}
      </div>

      {stages.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 2 }}>
          {stages.map(stage => (
            <span key={stage} style={ribaStagePillStyle}>{stage}</span>
          ))}
        </div>
      )}
    </button>
  );
}

const pillStyle = {
  flexShrink: 0,
  background: "rgba(220,170,51,.14)", color: "var(--tv-gold)",
  fontFamily: "monospace", fontSize: 10, fontWeight: 700,
  letterSpacing: ".06em", textTransform: "uppercase",
  padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
} as const;

const ribaStagePillStyle = {
  display: "inline-grid", placeItems: "center",
  width: 20, height: 20, borderRadius: 6,
  border: "1px solid var(--tv-border)", background: "var(--tv-panel-accent)",
  fontFamily: "monospace", fontSize: 10.5, fontWeight: 700,
  color: "var(--tv-text-dim)",
} as const;

const plusIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const primaryButtonStyle = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer",
  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13.5, fontWeight: 700,
  background: "linear-gradient(135deg, var(--tv-gold-bright), var(--tv-gold))",
  color: "#0A1322", boxShadow: "0 8px 20px -10px rgba(220,170,51,.6)",
} as const;
