// @ts-nocheck

"use client";

import { useState, useCallback } from "react";
import type { BrandSettings } from "@/types/database";
import { ALLOWED_FONTS } from "@/lib/validation";

const FONT_LABELS: Record<typeof ALLOWED_FONTS[number], string> = {
  inter: "Inter — clean & modern",
  playfair: "Playfair Display — elegant serif",
  "dm-sans": "DM Sans — friendly & rounded",
  "libre-baskerville": "Libre Baskerville — classic serif",
  "space-grotesk": "Space Grotesk — technical & precise",
  "bricolage-grotesque": "Bricolage Grotesque — expressive & bold",
};

interface Props {
  initialBrand: BrandSettings;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function BrandSettingsForm({ initialBrand }: Props) {
  const [form, setForm] = useState({
    company_name: initialBrand.company_name,
    logo_url: initialBrand.logo_url ?? "",
    primary_color: initialBrand.primary_color || "#111111",
    secondary_color: initialBrand.secondary_color ?? "",
    font_choice: initialBrand.font_choice as typeof ALLOWED_FONTS[number],
    about_text: initialBrand.about_text,
    tone_of_voice: initialBrand.tone_of_voice,
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const set = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveState("idle");
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaveState("saving");
      setErrorMsg(null);

      try {
        const payload = {
          ...form,
          logo_url: form.logo_url.trim() || null,
          secondary_color: /^#[0-9A-Fa-f]{6}$/.test(form.secondary_color)
            ? form.secondary_color
            : null,
        };

        const res = await fetch("/api/brand", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok) {
          setSaveState("saved");
        } else {
          setErrorMsg(data.error ?? "Failed to save settings");
          setSaveState("error");
        }
      } catch {
        setErrorMsg("Connection error — please try again");
        setSaveState("error");
      }
    },
    [form]
  );

  const fieldClass =
    "w-full rounded-lg border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2.5 text-sm text-neutral-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-[#0891B2]/20 focus:border-neutral-400 dark:focus:border-[#0891B2] transition placeholder-neutral-400 dark:placeholder-gray-600";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-10">
      {/* Identity */}
      <section>
        <SectionTitle>Identity</SectionTitle>
        <div className="space-y-5">
          <Field label="Company / freelancer name" required>
            <input
              type="text"
              required
              minLength={1}
              maxLength={100}
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              placeholder="e.g. Acme Studio"
              className={fieldClass}
            />
          </Field>

          <Field
            label="Logo URL"
            hint="Host your logo publicly (e.g. Cloudflare R2 or Supabase Storage) and paste the URL here."
            optional
          >
            <input
              type="url"
              maxLength={500}
              value={form.logo_url}
              onChange={(e) => set("logo_url", e.target.value)}
              placeholder="https://yourdomain.com/logo.png"
              className={fieldClass}
            />
          </Field>
        </div>
      </section>

      {/* Brand colours */}
      <section>
        <SectionTitle>Brand colours</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Primary colour">
            <ColorPicker
              value={form.primary_color}
              onChange={(v) => set("primary_color", v)}
            />
          </Field>
          <Field label="Secondary colour" optional>
            <ColorPicker
              value={form.secondary_color || "#888888"}
              onChange={(v) => set("secondary_color", v)}
              allowEmpty
              currentValue={form.secondary_color}
              onClear={() => set("secondary_color", "")}
            />
          </Field>
        </div>

        {/* Swatch preview */}
        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg ring-1 ring-black/10 shadow-sm"
            style={{ backgroundColor: form.primary_color || "#111111" }}
          />
          {form.secondary_color && /^#[0-9A-Fa-f]{6}$/.test(form.secondary_color) && (
            <div
              className="h-9 w-9 rounded-lg ring-1 ring-black/10 shadow-sm"
              style={{ backgroundColor: form.secondary_color }}
            />
          )}
          <span className="text-xs text-neutral-400">Preview</span>
        </div>
      </section>

      {/* Typography */}
      <section>
        <SectionTitle>Typography</SectionTitle>
        <Field label="Proposal font">
          <select
            value={form.font_choice}
            onChange={(e) => set("font_choice", e.target.value)}
            className={fieldClass}
          >
            {ALLOWED_FONTS.map((font) => (
              <option key={font} value={font}>
                {FONT_LABELS[font]}
              </option>
            ))}
          </select>
        </Field>
      </section>

      {/* Voice & context */}
      <section>
        <SectionTitle>Voice &amp; context</SectionTitle>
        <p className="text-sm text-neutral-500 mb-5 leading-relaxed">
          Torvionyx uses this when generating proposals — the more detail you give, the more on-brand the output.
        </p>
        <div className="space-y-5">
          <Field label="About your business">
            <textarea
              rows={5}
              maxLength={2000}
              value={form.about_text}
              onChange={(e) => set("about_text", e.target.value)}
              placeholder="Describe what you do, who you work with, and what makes your work different…"
              className={`${fieldClass} resize-y`}
            />
            <p className="mt-1.5 text-xs text-neutral-400">
              {form.about_text.length} / 2,000 characters
            </p>
          </Field>

          <Field
            label="Tone of voice"
            hint="A short description Claude uses to calibrate writing style."
          >
            <input
              type="text"
              maxLength={500}
              value={form.tone_of_voice}
              onChange={(e) => set("tone_of_voice", e.target.value)}
              placeholder="e.g. Professional but warm, direct, avoids jargon"
              className={fieldClass}
            />
          </Field>
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saveState === "saving"}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition"
        >
          {saveState === "saving" ? "Saving…" : "Save brand settings"}
        </button>
        {saveState === "saved" && (
          <span className="text-sm text-green-600 font-medium">Saved</span>
        )}
        {saveState === "error" && errorMsg && (
          <span className="text-sm text-red-600">{errorMsg}</span>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Small helper components
// ---------------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-neutral-500 dark:text-gray-400 uppercase tracking-wider mb-5">
      {children}
    </h2>
  );
}

function Field({
  label,
  hint,
  required,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-1.5">
        {label}
        {optional && <span className="ml-1 text-neutral-400 font-normal">(optional)</span>}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
  allowEmpty,
  currentValue,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
  currentValue?: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 rounded-lg border border-neutral-200 dark:border-[#374151] cursor-pointer p-1 bg-white dark:bg-[#1F2937]"
      />
      <input
        type="text"
        value={allowEmpty ? (currentValue ?? "") : value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === "") onChange(v);
        }}
        maxLength={7}
        placeholder="#000000"
        className="flex-1 rounded-lg border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2.5 text-sm font-mono text-neutral-900 dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-[#0891B2]/20 transition"
      />
      {allowEmpty && currentValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition shrink-0"
          title="Clear"
        >
          ✕
        </button>
      )}
    </div>
  );
}
