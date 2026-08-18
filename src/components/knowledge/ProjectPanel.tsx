// @ts-nocheck

"use client";

import { useCallback, useEffect, useState } from "react";
import { PROJECT_SECTORS, PROJECT_TYPES } from "@/lib/validation";
import type { Project } from "@/types/database";

interface Props {
  project: Project | null; // null = "add" mode
  onClose: () => void;
  onSaved: (project: Project) => void;
  onDeleted: (id: string) => void;
}

interface Draft {
  name: string;
  sector: string;
  project_type: string;
  location: string;
  construction_value: string;
  year_completed: string;
  riba_stages_delivered: number[];
  description: string;
  outcome: string;
}

const RIBA_STAGES = [0, 1, 2, 3, 4, 5, 6, 7];

function emptyDraft(): Draft {
  return {
    name: "", sector: PROJECT_SECTORS[0], project_type: PROJECT_TYPES[0],
    location: "", construction_value: "", year_completed: "",
    riba_stages_delivered: [], description: "", outcome: "",
  };
}

function draftFromProject(p: Project): Draft {
  return {
    name: p.name, sector: p.sector, project_type: p.project_type,
    location: p.location,
    construction_value: p.construction_value == null ? "" : String(p.construction_value),
    year_completed: p.year_completed == null ? "" : String(p.year_completed),
    riba_stages_delivered: p.riba_stages_delivered ?? [],
    description: p.description, outcome: p.outcome,
  };
}

export function ProjectPanel({ project, onClose, onSaved, onDeleted }: Props) {
  const [draft, setDraft] = useState<Draft>(project ? draftFromProject(project) : emptyDraft());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = project !== null;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = useCallback(<K extends keyof Draft>(field: K, value: Draft[K]) => {
    setDraft(d => ({ ...d, [field]: value }));
  }, []);

  const toggleStage = useCallback((stage: number) => {
    setDraft(d => ({
      ...d,
      riba_stages_delivered: d.riba_stages_delivered.includes(stage)
        ? d.riba_stages_delivered.filter(s => s !== stage)
        : [...d.riba_stages_delivered, stage],
    }));
  }, []);

  const save = useCallback(async () => {
    const name = draft.name.trim();
    const location = draft.location.trim();

    if (!name) { setError("Project name is required"); return; }
    if (!location) { setError("Location is required"); return; }

    const constructionValue = draft.construction_value.trim() === ""
      ? null : parseFloat(draft.construction_value);
    if (constructionValue !== null && (isNaN(constructionValue) || constructionValue < 0)) {
      setError("Enter a valid construction value"); return;
    }

    const yearCompleted = draft.year_completed.trim() === ""
      ? null : parseInt(draft.year_completed, 10);
    if (yearCompleted !== null && (isNaN(yearCompleted) || yearCompleted < 1900 || yearCompleted > 2100)) {
      setError("Enter a valid year"); return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name,
      sector: draft.sector,
      project_type: draft.project_type,
      location,
      construction_value: constructionValue,
      year_completed: yearCompleted,
      riba_stages_delivered: draft.riba_stages_delivered,
      description: draft.description.trim(),
      outcome: draft.outcome.trim(),
    };

    try {
      const res = isEditing
        ? await fetch(`/api/projects/${project.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          })
        : await fetch("/api/projects", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save project"); setSaving(false); return; }
      onSaved(data.project);
    } catch {
      setError("Connection error — please try again");
      setSaving(false);
    }
  }, [draft, isEditing, project, onSaved]);

  const handleDelete = useCallback(async () => {
    if (!project) return;
    const confirmed = window.confirm(`Delete "${project.name}"? This can't be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete project");
        setDeleting(false);
        return;
      }
      onDeleted(project.id);
    } catch {
      setError("Connection error — please try again");
      setDeleting(false);
    }
  }, [project, onDeleted]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(10,19,34,.55)", backdropFilter: "blur(2px)" }}
      />

      {/* Panel */}
      <div
        className="transition-colors duration-300"
        style={{
          position: "relative", width: "min(520px, 100vw)", height: "100%",
          background: "var(--tv-bg-panel)", backdropFilter: "blur(24px)",
          borderLeft: "1px solid var(--tv-border)",
          boxShadow: "-24px 0 60px -30px rgba(0,0,0,.5)",
          display: "flex", flexDirection: "column",
          animation: "tvSlideIn .22s ease-out",
        }}
      >
        <style>{`@keyframes tvSlideIn { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "22px 26px", borderBottom: "1px solid var(--tv-border-soft)", flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18,
            color: "var(--tv-text)", margin: 0,
          }}>
            {isEditing ? "Edit project" : "Add project"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" style={closeButtonStyle}>
            {xIcon}
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 26px" }}>
          <Field label="Project name *">
            <input autoFocus type="text" maxLength={200} value={draft.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Elm House Extension"
              style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Sector">
              <select value={draft.sector} onChange={e => set("sector", e.target.value)} style={inputStyle}>
                {PROJECT_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Project type">
              <select value={draft.project_type} onChange={e => set("project_type", e.target.value)} style={inputStyle}>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Location *">
            <input type="text" maxLength={200} value={draft.location}
              onChange={e => set("location", e.target.value)}
              placeholder="e.g. Bath, Somerset"
              style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Construction value (£)">
              <input type="number" min={0} step="1000" value={draft.construction_value}
                onChange={e => set("construction_value", e.target.value)}
                placeholder="0"
                style={inputStyle} />
            </Field>
            <Field label="Year completed">
              <input type="number" min={1900} max={2100} step="1" value={draft.year_completed}
                onChange={e => set("year_completed", e.target.value)}
                placeholder="2025"
                style={inputStyle} />
            </Field>
          </div>

          <Field label="RIBA stages delivered">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {RIBA_STAGES.map(stage => {
                const isOn = draft.riba_stages_delivered.includes(stage);
                return (
                  <button key={stage} type="button" onClick={() => toggleStage(stage)}
                    style={{
                      width: 34, height: 34, borderRadius: 9, cursor: "pointer",
                      fontFamily: "monospace", fontWeight: 700, fontSize: 13,
                      border: `1.5px solid ${isOn ? "var(--tv-gold)" : "var(--tv-border)"}`,
                      background: isOn ? "rgba(220,170,51,.16)" : "var(--tv-panel-accent)",
                      color: isOn ? "var(--tv-gold)" : "var(--tv-text-dim)",
                      transition: "border-color .15s, background .15s, color .15s",
                    }}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Description">
            <textarea rows={4} maxLength={4000} value={draft.description}
              onChange={e => set("description", e.target.value)}
              placeholder="What the project involved, scope of our role…"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55 }} />
          </Field>

          <Field label="Outcome">
            <input type="text" maxLength={300} value={draft.outcome}
              onChange={e => set("outcome", e.target.value)}
              placeholder="e.g. Planning granted, on site 2025"
              style={inputStyle} />
          </Field>

          {/* Image upload — placeholder for a second pass */}
          <div style={{ marginBottom: 4 }}>
            <Label>Project image</Label>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "26px 16px", borderRadius: 10,
              border: "1.5px dashed var(--tv-border)", background: "var(--tv-panel-accent)",
              color: "var(--tv-text-faint)", textAlign: "center",
            }}>
              {imageIcon}
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Image upload coming next</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "18px 26px", borderTop: "1px solid var(--tv-border-soft)", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button type="button" onClick={save} disabled={saving || deleting} style={primaryButtonStyle}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Add project"}
          </button>
          <button type="button" onClick={onClose} disabled={saving || deleting} style={outlineButtonStyle}>
            Cancel
          </button>
          {isEditing && (
            <button type="button" onClick={handleDelete} disabled={saving || deleting}
              style={{ ...deleteTextButtonStyle, marginLeft: "auto" }}>
              {deleting ? "Deleting…" : "Delete project"}
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: "0 26px 16px" }}>
            <span style={{ fontSize: 13, color: "#F2635C" }}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 7, color: "var(--tv-text-dim)" }}>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 13px",
  fontFamily: "Inter, sans-serif", fontSize: 13.5,
  borderRadius: 9, border: "1.5px solid var(--tv-border)",
  background: "var(--tv-panel-accent)", color: "var(--tv-text)",
  outline: "none",
} as const;

const closeButtonStyle = {
  display: "grid", placeItems: "center",
  width: 30, height: 30, borderRadius: 8,
  border: "1px solid var(--tv-border)", background: "var(--tv-panel-accent)",
  cursor: "pointer", color: "var(--tv-text-dim)", flexShrink: 0,
} as const;

const primaryButtonStyle = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13.5, fontWeight: 700,
  background: "linear-gradient(135deg, var(--tv-gold-bright), var(--tv-gold))",
  color: "#0A1322", boxShadow: "0 8px 20px -10px rgba(220,170,51,.6)",
} as const;

const outlineButtonStyle = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "10px 18px", borderRadius: 10,
  border: "1.5px solid var(--tv-border)", background: "transparent",
  color: "var(--tv-text-dim)", fontFamily: "'Space Grotesk',sans-serif",
  fontWeight: 600, fontSize: 13.5, cursor: "pointer",
} as const;

const deleteTextButtonStyle = {
  padding: "10px 4px", border: "none", background: "transparent",
  color: "#F2635C", fontFamily: "'Space Grotesk',sans-serif",
  fontWeight: 600, fontSize: 13, cursor: "pointer",
} as const;

const xIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const imageIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="M21 15l-5-5L5 21"/>
  </svg>
);
