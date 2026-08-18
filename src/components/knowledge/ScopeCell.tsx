// @ts-nocheck

"use client";

import { useCallback, useState } from "react";
import type { ScopeLibraryRow } from "@/types/database";

interface Props {
  row: ScopeLibraryRow | undefined;
  riba_stage: number;
  project_type: string;
  onSaved: (row: ScopeLibraryRow) => void;
  onCleared: (riba_stage: number, project_type: string) => void;
}

export function ScopeCell({ row, riba_stage, project_type, onSaved, onCleared }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savedText = row?.scope_text ?? "";

  const startEdit = useCallback(() => {
    setDraftText(savedText);
    setError(null);
    setIsEditing(true);
  }, [savedText]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setError(null);
  }, []);

  const commit = useCallback(async () => {
    const trimmed = draftText.trim();

    // No-op: nothing changed since the last save, so there's nothing to
    // send — avoids a save-on-every-blur even when the user didn't edit.
    if (trimmed === savedText) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (trimmed === "") {
        // Only a real row is worth clearing — an already-empty cell with
        // no row has nothing on the server to delete.
        if (row) {
          const res = await fetch(
            `/api/scope-library?riba_stage=${riba_stage}&project_type=${encodeURIComponent(project_type)}`,
            { method: "DELETE" }
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "Failed to clear cell");
            setSaving(false);
            return;
          }
        }
        onCleared(riba_stage, project_type);
      } else {
        const res = await fetch("/api/scope-library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ riba_stage, project_type, scope_text: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to save");
          setSaving(false);
          return;
        }
        onSaved(data.cell);
      }
      setIsEditing(false);
    } catch {
      setError("Connection error — please try again");
    } finally {
      setSaving(false);
    }
  }, [draftText, savedText, row, riba_stage, project_type, onSaved, onCleared]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
    // Enter is left alone — scope wording is multi-line, so Enter must
    // insert a newline, not submit. Saving happens on blur.
  }, [cancelEdit]);

  return (
    <div style={cellContainerStyle}>
      <div style={cellLabelStyle}>{project_type}</div>

      {isEditing ? (
        <>
          <textarea
            autoFocus
            value={draftText}
            disabled={saving}
            onChange={e => setDraftText(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            maxLength={4000}
            rows={4}
            style={textareaStyle}
          />
          {error && <span style={errorStyle}>{error}</span>}
        </>
      ) : savedText ? (
        <button type="button" onClick={startEdit} style={filledCellStyle}>
          {savedText}
        </button>
      ) : (
        <button type="button" onClick={startEdit} style={placeholderCellStyle}>
          + Add scope wording
        </button>
      )}
    </div>
  );
}

const cellContainerStyle = {
  display: "flex", flexDirection: "column", gap: 8,
  minWidth: 0,
} as const;

const cellLabelStyle = {
  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 12.5,
  color: "var(--tv-text-dim)",
} as const;

const filledCellStyle = {
  textAlign: "left", cursor: "pointer",
  minHeight: 84, padding: "10px 12px",
  fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.55,
  color: "var(--tv-text)",
  background: "var(--tv-panel-accent)",
  border: "1px solid var(--tv-border)",
  borderRadius: 10,
  whiteSpace: "pre-wrap",
} as const;

const placeholderCellStyle = {
  textAlign: "left", cursor: "pointer",
  minHeight: 84, padding: "10px 12px",
  fontFamily: "Inter, sans-serif", fontSize: 13,
  color: "var(--tv-text-faint)",
  background: "transparent",
  border: "1px dashed var(--tv-border)",
  borderRadius: 10,
} as const;

const textareaStyle = {
  width: "100%", minHeight: 84, padding: "10px 12px", resize: "vertical",
  fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.55,
  borderRadius: 10, border: "1.5px solid var(--tv-gold)",
  background: "var(--tv-panel-accent)", color: "var(--tv-text)",
  outline: "none",
} as const;

const errorStyle = {
  fontSize: 12, color: "#F2635C",
} as const;
