// @ts-nocheck

"use client";

import { useCallback, useState } from "react";
import type { RateCard } from "@/types/database";

interface Props {
  initialRates: RateCard[];
}

interface Draft {
  grade: string;
  hourly_rate: string;
  effective_from: string;
}

const EMPTY_DRAFT: Draft = { grade: "", hourly_rate: "", effective_from: "" };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const inputStyle = {
  width: "100%", padding: "7px 10px",
  fontFamily: "Inter, sans-serif", fontSize: 13.5,
  borderRadius: 8, border: "1.5px solid var(--tv-gold)",
  background: "var(--tv-panel-accent)", color: "var(--tv-text)",
  outline: "none",
} as const;

export function RateCardTable({ initialRates }: Props) {
  const [rows, setRows] = useState<RateCard[]>(initialRates);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startEdit = useCallback((row: RateCard) => {
    if (editingId) return; // one row at a time
    setEditingId(row.id);
    setDraft({
      grade: row.grade,
      hourly_rate: String(row.hourly_rate),
      effective_from: row.effective_from,
    });
    setError(null);
  }, [editingId]);

  const startAdd = useCallback(() => {
    if (editingId) return;
    setEditingId("new");
    setDraft({ grade: "", hourly_rate: "", effective_from: today() });
    setError(null);
  }, [editingId]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setError(null);
  }, []);

  const save = useCallback(async () => {
    const grade = draft.grade.trim();
    const rate = parseFloat(draft.hourly_rate);

    if (!grade) { setError("Grade name is required"); return; }
    if (isNaN(rate) || rate < 0) { setError("Enter a valid hourly rate"); return; }
    if (!draft.effective_from) { setError("Effective from date is required"); return; }

    setSaving(true);
    setError(null);

    const payload = { grade, hourly_rate: rate, effective_from: draft.effective_from };

    try {
      if (editingId === "new") {
        const res = await fetch("/api/rate-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Failed to add grade"); setSaving(false); return; }
        setRows(prev => [...prev, data.rate].sort((a, b) => b.hourly_rate - a.hourly_rate));
      } else {
        const res = await fetch(`/api/rate-card/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Failed to save"); setSaving(false); return; }
        setRows(prev =>
          prev.map(r => (r.id === editingId ? data.rate : r)).sort((a, b) => b.hourly_rate - a.hourly_rate)
        );
      }
      setEditingId(null);
    } catch {
      setError("Connection error — please try again");
    } finally {
      setSaving(false);
    }
  }, [draft, editingId]);

  const handleDelete = useCallback(async (e: React.MouseEvent, row: RateCard) => {
    e.stopPropagation();
    if (editingId) return; // don't delete while another row is mid-edit

    const confirmed = window.confirm(`Delete the "${row.grade}" rate? This can't be undone.`);
    if (!confirmed) return;

    setDeletingId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/rate-card/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete grade");
        return;
      }
      setRows(prev => prev.filter(r => r.id !== row.id));
    } catch {
      setError("Connection error — please try again");
    } finally {
      setDeletingId(null);
    }
  }, [editingId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
  }, [save, cancelEdit]);

  const isEmpty = rows.length === 0 && editingId !== "new";

  if (isEmpty) {
    return (
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
          Add your charge-out rates
        </h2>
        <p style={{
          maxWidth: 420, margin: "10px auto 22px", fontSize: 13, lineHeight: 1.55,
          color: "var(--tv-text-faint)",
        }}>
          Five lines is usually enough — director, associate, architect, assistant, technician.
          Clients never see these; they power the fee engine.
        </p>
        <button type="button" onClick={startAdd} style={primaryButtonStyle}>
          {plusIcon}
          Add first grade
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="transition-colors duration-300" style={{
        background: "var(--tv-bg-panel)",
        border: "1px solid var(--tv-border)",
        borderRadius: 14,
        boxShadow: "var(--tv-shadow)",
        overflow: "hidden",
      }}>
        {/* Header row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 160px 180px 30px",
          padding: "12px 20px", borderBottom: "1px solid var(--tv-border-soft)",
          fontFamily: "monospace", fontSize: 10.5, letterSpacing: ".1em",
          textTransform: "uppercase", color: "var(--tv-text-faint)",
        }}>
          <span>Grade</span>
          <span>Hourly rate (£)</span>
          <span>Effective from</span>
          <span />
        </div>

        {rows.map((row, i) => {
          const isEditing = editingId === row.id;
          return (
            <div
              key={row.id}
              onClick={() => !isEditing && startEdit(row)}
              onKeyDown={isEditing ? handleKeyDown : undefined}
              className={isEditing ? "" : "group hover:bg-white/5 transition-colors duration-150"}
              style={{
                display: "grid", gridTemplateColumns: "1fr 160px 180px 30px",
                alignItems: "center", gap: 10,
                padding: "12px 20px",
                borderBottom: i < rows.length - 1 || editingId === "new" ? "1px solid var(--tv-border-soft)" : "none",
                cursor: isEditing ? "default" : "pointer",
              }}
            >
              {isEditing ? (
                <>
                  <input autoFocus type="text" maxLength={100} value={draft.grade}
                    onChange={e => setDraft(d => ({ ...d, grade: e.target.value }))}
                    style={inputStyle} />
                  <input type="number" min={0} step="0.5" value={draft.hourly_rate}
                    onChange={e => setDraft(d => ({ ...d, hourly_rate: e.target.value }))}
                    style={inputStyle} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="date" value={draft.effective_from}
                      onChange={e => setDraft(d => ({ ...d, effective_from: e.target.value }))}
                      style={inputStyle} />
                    <button type="button" onClick={save} disabled={saving}
                      aria-label="Save" title="Save"
                      style={{ ...iconButtonStyle, color: "#5FD08A" }}>
                      {checkIcon}
                    </button>
                    <button type="button" onClick={cancelEdit} disabled={saving}
                      aria-label="Cancel" title="Cancel"
                      style={{ ...iconButtonStyle, color: "var(--tv-text-faint)" }}>
                      {xIcon}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 14, color: "var(--tv-text)" }}>
                    {row.grade}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 13.5, color: "var(--tv-text)" }}>
                    £{Number(row.hourly_rate).toFixed(2)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--tv-text-faint)" }}>
                    {formatDate(row.effective_from)}
                  </span>
                  <button type="button"
                    onClick={e => handleDelete(e, row)}
                    disabled={deletingId === row.id}
                    aria-label={`Delete ${row.grade}`}
                    title="Delete"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={deleteButtonStyle}
                    onMouseEnter={e => { e.currentTarget.style.color = "#F2635C"; e.currentTarget.style.borderColor = "rgba(242,99,92,.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--tv-text-faint)"; e.currentTarget.style.borderColor = "var(--tv-border)"; }}
                  >
                    {trashIcon}
                  </button>
                </>
              )}
            </div>
          );
        })}

        {editingId === "new" && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 160px 180px 30px",
            alignItems: "center", gap: 10, padding: "12px 20px",
          }} onKeyDown={handleKeyDown}>
            <input autoFocus type="text" maxLength={100} placeholder="e.g. Associate"
              value={draft.grade}
              onChange={e => setDraft(d => ({ ...d, grade: e.target.value }))}
              style={inputStyle} />
            <input type="number" min={0} step="0.5" placeholder="0.00"
              value={draft.hourly_rate}
              onChange={e => setDraft(d => ({ ...d, hourly_rate: e.target.value }))}
              style={inputStyle} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="date" value={draft.effective_from}
                onChange={e => setDraft(d => ({ ...d, effective_from: e.target.value }))}
                style={inputStyle} />
              <button type="button" onClick={save} disabled={saving}
                aria-label="Save" title="Save"
                style={{ ...iconButtonStyle, color: "#5FD08A" }}>
                {checkIcon}
              </button>
              <button type="button" onClick={cancelEdit} disabled={saving}
                aria-label="Cancel" title="Cancel"
                style={{ ...iconButtonStyle, color: "var(--tv-text-faint)" }}>
                {xIcon}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 13, color: "#F2635C" }}>{error}</span>
      )}

      {editingId === null && (
        <button type="button" onClick={startAdd} style={outlineButtonStyle}>
          {plusIcon}
          Add grade
        </button>
      )}
    </div>
  );
}

const plusIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const checkIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const xIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const trashIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const iconButtonStyle = {
  display: "grid", placeItems: "center",
  width: 28, height: 28, borderRadius: 8,
  border: "1px solid var(--tv-border)", background: "var(--tv-panel-accent)",
  cursor: "pointer", flexShrink: 0,
} as const;

const deleteButtonStyle = {
  display: "grid", placeItems: "center",
  width: 26, height: 26, borderRadius: 8,
  border: "1px solid var(--tv-border)", background: "var(--tv-panel-accent)",
  cursor: "pointer", flexShrink: 0,
  color: "var(--tv-text-faint)",
} as const;

const outlineButtonStyle = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "9px 18px", borderRadius: 10,
  border: "1.5px solid var(--tv-border)", background: "transparent",
  color: "var(--tv-text-dim)", fontFamily: "'Space Grotesk',sans-serif",
  fontWeight: 600, fontSize: 13, cursor: "pointer", alignSelf: "flex-start",
} as const;

const primaryButtonStyle = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer",
  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13.5, fontWeight: 700,
  background: "linear-gradient(135deg, var(--tv-gold-bright), var(--tv-gold))",
  color: "#0A1322", boxShadow: "0 8px 20px -10px rgba(220,170,51,.6)",
} as const;
