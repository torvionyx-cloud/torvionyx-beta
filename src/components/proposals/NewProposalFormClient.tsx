// @ts-nocheck

"use client";

/**
 * components/proposals/NewProposalFormClient.tsx
 *
 * Proposal intake form — the starting point of the golden path.
 * Same functional flow as before (client details, proposal type, optional
 * project type + RIBA stage multi-select with live stageHasData()
 * indicators, brief, style, pricing/tone; auto-add-on-redirect for
 * selected stages). This pass restyles the form to match the navy/gold
 * design system already used in app/dashboard/layout.tsx (--tv-* tokens),
 * instead of the old generic Tailwind neutral/dark: classes. No new
 * fields, no new API payload shape.
 */

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getTheme, PROPOSAL_TEMPLATES, type ProposalTemplateId } from "@/lib/themes";
import { PROJECT_TYPES } from "@/lib/validation";
import { RIBA_STAGES } from "@/lib/riba";
import { stageHasData } from "@/lib/stageResolver";
import type { BrandSettings, ScopeLibraryRow, FeeResourcingTemplateRow } from "@/types/database";

// Labels/descriptions are architecture-specific; the underlying `value`
// strings are historical (see lib/validation.ts PROPOSAL_TYPE_LABELS) and
// intentionally unchanged — 56 live proposals already hold these exact
// string values with no CHECK constraint.
const PROPOSAL_TYPES = [
  { value: "service_proposal", label: "Full RIBA Appointment", description: "Stage-by-stage architectural service across the RIBA Plan of Work. Scope, programme, and fees." },
  { value: "project_quote", label: "Planning Application", description: "A defined package to prepare and submit a planning application. Clear deliverables and a fixed quote." },
  { value: "retainer_proposal", label: "Retainer / Ongoing Advisory", description: "For ongoing advisory work — periodic site visits, technical input, or retained support. Fixed monthly fee." },
  { value: "consultancy_proposal", label: "Feasibility & Options Appraisal", description: "Early-stage feasibility study or options appraisal before a full appointment. Methodology and day rates." },
  { value: "photography_proposal", label: "Contract Administration", description: "On-site contract administration during construction — inspections, valuations, and certificates." },
] as const;

const CURRENCIES = [
  { value: "GBP", label: "£ GBP" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
] as const;

const TONES = [
  { value: "concise", label: "Concise", description: "Short, punchy, high signal-to-noise" },
  { value: "balanced", label: "Balanced", description: "Professional length, well-rounded" },
  { value: "detailed", label: "Detailed", description: "In-depth, for complex engagements" },
] as const;

const MAX_BRIEF = 4000;

const TEMPLATE_META: Record<ProposalTemplateId, { name: string; desc: string }> = {
  custom: { name: "Custom", desc: "Uses your brand colours and font" },
  monochrome: { name: "Monochrome", desc: "Bold black and white, maximum contrast" },
  warm_studio: { name: "Warm Studio", desc: "Cream and terracotta, warm and human" },
  midnight: { name: "Midnight", desc: "Navy and gold, premium and confident" },
  corporate: { name: "Corporate", desc: "Clean blue and slate, buttoned-up" },
  gradient: { name: "Gradient", desc: "Purple-to-coral gradient, bold and modern" },
  developer: { name: "Developer", desc: "Green accent on light grey, technical and precise" },
};

const PROGRESS_MESSAGES = [
  "Torvionyx is reading your brief…",
  "Structuring the proposal…",
  "Writing each section…",
  "Polishing the final draft…",
];

const RAIL_LABELS = ["Client details", "Proposal type", "Project & stages", "Brief", "Style", "Pricing & tone"];

// ---------------------------------------------------------------------------
// Shared style tokens — mirrors the navy/gold system already used in
// app/dashboard/layout.tsx via the --tv-* CSS variables in globals.css.
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  background: "var(--tv-bg-panel)",
  border: "1px solid var(--tv-border-soft)",
  borderRadius: 16,
  padding: 28,
  boxShadow: "var(--tv-shadow)",
  scrollMarginTop: 100,
};

const eyebrowStyle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: 10,
  letterSpacing: ".2em",
  textTransform: "uppercase",
  color: "var(--tv-gold)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 19,
  fontWeight: 600,
  margin: "0 0 4px",
  color: "var(--tv-text)",
};

const sectionSubStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--tv-text-dim)",
  margin: "0 0 22px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "var(--tv-text-dim)",
  marginBottom: 8,
};

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  fontSize: 14,
  borderRadius: 10,
  border: "1.5px solid var(--tv-border)",
  background: "var(--tv-panel-accent)",
  color: "var(--tv-text)",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color .15s",
};

const textareaBaseStyle: React.CSSProperties = {
  ...inputBaseStyle,
  resize: "none",
  lineHeight: 1.5,
};

function cardStyle(selected: boolean, extra?: React.CSSProperties): React.CSSProperties {
  return {
    textAlign: "left",
    cursor: "pointer",
    padding: 16,
    borderRadius: 12,
    fontFamily: "inherit",
    color: "var(--tv-text)",
    transition: "border-color .18s, background .18s",
    border: selected ? "1.5px solid var(--tv-gold)" : "1.5px solid var(--tv-border)",
    background: selected ? "rgba(220,170,51,.08)" : "var(--tv-panel-accent)",
    ...extra,
  };
}

interface Props {
  scopeLibrary: ScopeLibraryRow[];
  feeTemplates: FeeResourcingTemplateRow[];
}

export function NewProposalFormClient({ scopeLibrary, feeTemplates }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    proposal_type: "service_proposal" as typeof PROPOSAL_TYPES[number]["value"],
    project_type: "",
    brief: "",
    budget_hint: "",
    currency: "GBP" as "GBP" | "USD" | "EUR",
    tone_preference: "balanced" as "concise" | "balanced" | "detailed",
    template: "custom" as ProposalTemplateId,
  });

  const [selectedStages, setSelectedStages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progressIdx, setProgressIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  const clientRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const sectionRefs = [clientRef, typeRef, projectRef, briefRef, styleRef, pricingRef];

  // Default the template selection to the workspace's default_template once
  // brand settings load, unless the user has already picked something.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/brand")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.brand) return;
        setBrand(data.brand as BrandSettings);
        const fallback = (data.brand as BrandSettings).default_template;
        if (fallback && (PROPOSAL_TEMPLATES as readonly string[]).includes(fallback)) {
          setForm((f) => (f.template === "custom" ? { ...f, template: fallback } : f));
        }
      })
      .catch(() => {
        // Brand settings failing to load just means the template selector
        // falls back to 'custom' with the default palette — not fatal.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Progress rail — highlights the section nearest the top of the viewport
  // as the user scrolls. Purely a visual "where am I" indicator; the form
  // stays a single scrolling page, nothing is gated between sections.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = sectionRefs.findIndex((r) => r.current === entry.target);
          if (idx !== -1) setActiveSection(idx);
        });
      },
      { rootMargin: "-110px 0px -70% 0px", threshold: 0 }
    );
    sectionRefs.forEach((r) => {
      if (r.current) observer.observe(r.current);
    });
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToSection = (idx: number) => {
    sectionRefs[idx].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const briefLength = form.brief.length;
  const isValid = form.client_name.trim().length > 0 && briefLength >= 20 && briefLength <= MAX_BRIEF;

  function toggleStage(stage: number) {
    setSelectedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage].sort((a, b) => a - b)
    );
  }

  function handleSetProjectType(value: string) {
    setForm((f) => ({ ...f, project_type: value }));
    setSelectedStages([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isGenerating) return;

    setError(null);
    setIsGenerating(true);
    setProgressIdx(0);

    const interval = setInterval(() => {
      setProgressIdx((i) => Math.min(i + 1, PROGRESS_MESSAGES.length - 1));
    }, 8000);

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name.trim(),
          client_email: form.client_email.trim() || undefined,
          proposal_type: form.proposal_type,
          project_type: form.project_type || undefined,
          brief: form.brief.trim(),
          budget_hint: form.budget_hint.trim() || undefined,
          currency: form.currency,
          tone_preference: form.tone_preference,
          template: form.template,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || "Rate limit reached. Please try again shortly.");
        } else {
          setError(data.error || "Generation failed. Please try again.");
        }
        return;
      }

      // Success — navigate to the editor. If RIBA stages were selected,
      // pass them along so the editor auto-adds them via the existing
      // handleAddStage() flow (Phase B: "auto-add on redirect").
      const editUrl =
        selectedStages.length > 0
          ? `/dashboard/${data.proposal_id}/edit?add_stages=${selectedStages.join(",")}`
          : `/dashboard/${data.proposal_id}/edit`;

      startTransition(() => {
        router.push(editUrl);
      });
    } catch {
      setError("Connection error. Please check your internet and try again.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  }

  const selectedProposalType = PROPOSAL_TYPES.find((t) => t.value === form.proposal_type);
  const selectedTemplateMeta = TEMPLATE_META[form.template];

  return (
    <div style={{ maxWidth: 1360, width: "100%", display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
        <Link
          href="/dashboard"
          style={{ fontSize: 13.5, color: "var(--tv-text-dim)", display: "inline-flex", gap: 8, alignItems: "center", width: "fit-content", textDecoration: "none" }}
        >
          ← Back to proposals
        </Link>

        <div>
          <div style={{ ...eyebrowStyle, marginBottom: 10 }}>Proposal intake</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 600, letterSpacing: "-.02em", margin: 0, color: "var(--tv-text)" }}>
            New proposal
          </h1>
          <p style={{ fontSize: 15, color: "var(--tv-text-dim)", margin: "10px 0 0", maxWidth: "60ch" }}>
            Describe your project and Torvionyx writes a polished proposal in under a minute.
          </p>
        </div>

        {isGenerating ? (
          <GeneratingState progressIdx={progressIdx} />
        ) : (
          <>
            {/* Progress rail */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 14, borderRadius: 14, background: "var(--tv-bg-panel)", border: "1px solid var(--tv-border-soft)" }}>
              {RAIL_LABELS.map((label, i) => {
                const isActive = activeSection === i;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => scrollToSection(i)}
                    style={{
                      flex: "1 1 130px",
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      transition: "background .18s",
                      background: isActive ? "rgba(220,170,51,.1)" : "transparent",
                      border: isActive ? "1px solid rgba(220,170,51,.4)" : "1px solid transparent",
                      color: isActive ? "var(--tv-text)" : "var(--tv-text-faint)",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        flexShrink: 0,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "monospace",
                        fontSize: 10,
                        background: isActive ? "var(--tv-gold)" : "var(--tv-panel-accent)",
                        color: isActive ? "#0A1322" : "var(--tv-text-faint)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ textAlign: "left", lineHeight: 1.2 }}>{label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Client details */}
              <section ref={clientRef} style={panelStyle}>
                <h2 style={sectionTitleStyle}>Client details</h2>
                <p style={sectionSubStyle}>Who this proposal is for.</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div>
                    <label style={labelStyle}>
                      Client / company name <span style={{ color: "var(--tv-gold)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={form.client_name}
                      onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                      placeholder="e.g. Acme Corporation"
                      className="tv-input"
                      style={inputBaseStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Client email <span style={{ color: "var(--tv-text-faint)" }}>(optional)</span>
                    </label>
                    <input
                      type="email"
                      maxLength={200}
                      value={form.client_email}
                      onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                      placeholder="client@example.com"
                      className="tv-input"
                      style={inputBaseStyle}
                    />
                  </div>
                </div>
              </section>

              {/* Proposal type */}
              <section ref={typeRef} style={panelStyle}>
                <h2 style={sectionTitleStyle}>Proposal type</h2>
                <p style={sectionSubStyle}>Decides the document structure Torvionyx writes.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {PROPOSAL_TYPES.map((type) => {
                    const selected = form.proposal_type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm({ ...form, proposal_type: type.value })}
                        style={cardStyle(selected)}
                      >
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>{type.label}</div>
                        <div style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.45, color: selected ? "var(--tv-text-dim)" : "var(--tv-text-faint)" }}>
                          {type.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Project type & RIBA stages (optional) */}
              <section ref={projectRef} style={panelStyle}>
                <h2 style={sectionTitleStyle}>
                  Project type &amp; stages <span style={{ color: "var(--tv-text-faint)", fontWeight: 400 }}>(optional)</span>
                </h2>
                <p style={sectionSubStyle}>
                  Separate from proposal type above — this pulls real scope and fee data from your Knowledge tab
                  instead of the AI inventing it. Leave blank and Torvionyx writes the whole proposal from your
                  brief, same as today.
                </p>

                <label style={labelStyle}>Project type</label>
                <div style={{ position: "relative", marginBottom: form.project_type ? 22 : 0 }}>
                  <select
                    value={form.project_type}
                    onChange={(e) => handleSetProjectType(e.target.value)}
                    className="tv-input"
                    style={{ ...inputBaseStyle, appearance: "none", paddingRight: 38, cursor: "pointer" }}
                  >
                    <option value="">Not set — skip this section</option>
                    {PROJECT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ position: "absolute", right: 13, top: 14, pointerEvents: "none", color: "var(--tv-text-faint)" }}>
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </div>

                {form.project_type !== "" && (
                  <div>
                    <label style={labelStyle}>RIBA stages to include</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {RIBA_STAGES.map((s) => {
                        const isSelected = selectedStages.includes(s.stage);
                        const hasData = stageHasData(s.stage, form.project_type, scopeLibrary, feeTemplates);
                        return (
                          <button
                            key={s.stage}
                            type="button"
                            onClick={() => toggleStage(s.stage)}
                            style={cardStyle(isSelected)}
                          >
                            <div style={{ fontFamily: "monospace", fontSize: 10.5, letterSpacing: ".1em", color: "var(--tv-gold)", marginBottom: 4 }}>
                              STAGE {s.stage}
                            </div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                            <div style={{ fontSize: 12, marginTop: 4, color: hasData ? "var(--tv-success)" : (isSelected ? "var(--tv-text-dim)" : "var(--tv-text-faint)") }}>
                              {hasData ? "Real scope/fee data on file" : "No data yet — placeholder text only"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--tv-text-faint)", marginTop: 12 }}>
                      Selected stages are added automatically once the proposal is generated, using the same
                      &quot;Add a stage&quot; logic as the editor.
                    </p>
                  </div>
                )}
              </section>

              {/* Brief */}
              <section ref={briefRef} style={panelStyle}>
                <h2 style={sectionTitleStyle}>Your brief</h2>
                <p style={sectionSubStyle}>
                  Paste your call notes, email thread, or rough scope. Torvionyx reads it and writes the full
                  proposal — the more you share, the better it gets.
                </p>
                <textarea
                  required
                  minLength={20}
                  maxLength={MAX_BRIEF}
                  value={form.brief}
                  onChange={(e) => setForm({ ...form, brief: e.target.value })}
                  rows={10}
                  placeholder="e.g. Just off a call with Sarah at Acme Co. They need a full rebrand — logo, typography, colour palette, and brand guidelines. 6-week deadline before their product launch. Budget roughly £8–12k."
                  className="tv-input"
                  style={textareaBaseStyle}
                />
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--tv-text-faint)", fontFamily: "monospace" }}>
                  <span>{briefLength < 20 && briefLength > 0 ? `${20 - briefLength} more characters needed` : ""}</span>
                  <span style={briefLength > MAX_BRIEF * 0.9 ? { color: "var(--tv-warning)" } : undefined}>
                    {briefLength.toLocaleString()} / {MAX_BRIEF.toLocaleString()}
                  </span>
                </div>
              </section>

              {/* Template */}
              <section ref={styleRef} style={panelStyle}>
                <h2 style={sectionTitleStyle}>Style</h2>
                <p style={sectionSubStyle}>Choose how this proposal looks. You can change it later in the editor.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {PROPOSAL_TEMPLATES.map((id) => {
                    const meta = TEMPLATE_META[id];
                    const theme = getTheme(id, id === "custom" ? brand : null);
                    const selected = form.template === id;
                    return (
                      <button key={id} type="button" onClick={() => setForm({ ...form, template: id })} style={cardStyle(selected)}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                          <span style={{ width: 16, height: 16, borderRadius: "50%", display: "block", background: theme.heroBg, border: "1px solid rgba(0,0,0,.1)" }} />
                          <span style={{ width: 16, height: 16, borderRadius: "50%", display: "block", background: theme.accent, border: "1px solid rgba(0,0,0,.1)" }} />
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>{meta.name}</div>
                        <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.4, color: selected ? "var(--tv-text-dim)" : "var(--tv-text-faint)" }}>{meta.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Pricing + tone */}
              <section ref={pricingRef} style={panelStyle}>
                <h2 style={sectionTitleStyle}>Pricing &amp; style</h2>
                <p style={sectionSubStyle}>Currency, an optional budget steer, and how much Torvionyx writes.</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
                  <div>
                    <label style={labelStyle}>Currency</label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value as typeof form.currency })}
                        className="tv-input"
                        style={{ ...inputBaseStyle, appearance: "none", paddingRight: 38, cursor: "pointer" }}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        style={{ position: "absolute", right: 13, top: 14, pointerEvents: "none", color: "var(--tv-text-faint)" }}>
                        <path d="M6 9l6 6 6-6"></path>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Budget hint <span style={{ color: "var(--tv-text-faint)" }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={form.budget_hint}
                      onChange={(e) => setForm({ ...form, budget_hint: e.target.value })}
                      placeholder="e.g. £8–12k or suggest pricing"
                      className="tv-input"
                      style={inputBaseStyle}
                    />
                  </div>
                </div>

                <label style={labelStyle}>Writing style</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {TONES.map((t) => {
                    const selected = form.tone_preference === t.value;
                    return (
                      <button key={t.value} type="button" onClick={() => setForm({ ...form, tone_preference: t.value })} style={cardStyle(selected, { padding: "10px 12px" })}>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13.5, fontWeight: 600 }}>{t.label}</div>
                        <div style={{ fontSize: 11.5, marginTop: 3, color: selected ? "var(--tv-text-dim)" : "var(--tv-text-faint)" }}>{t.description}</div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {error && (
                <div style={{ borderRadius: 10, background: "rgba(242,99,92,.1)", border: "1px solid rgba(242,99,92,.3)", padding: "12px 16px", fontSize: 13.5, color: "var(--tv-text)" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingTop: 6, paddingBottom: 12 }}>
                <Link href="/dashboard" style={{ fontSize: 14, color: "var(--tv-text-dim)", textDecoration: "none" }}>
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!isValid || isGenerating || isPending}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 12,
                    padding: "13px 26px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    border: "none",
                    cursor: !isValid || isGenerating || isPending ? "not-allowed" : "pointer",
                    background: "linear-gradient(135deg,#F2C84E,#DCAA33)",
                    color: "#0A1322",
                    boxShadow: "0 8px 20px -10px rgba(220,170,51,.6)",
                    opacity: !isValid || isGenerating || isPending ? 0.4 : 1,
                  }}
                >
                  Generate with Torvionyx →
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {!isGenerating && (
        <aside style={{ position: "sticky", top: 96, display: "flex", flexDirection: "column", gap: 16, flex: "1 1 280px", maxWidth: 320, minWidth: 260 }}>
          <div style={panelStyle}>
            <div style={{ ...eyebrowStyle, marginBottom: 16 }}>Appointment</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13.5 }}>
              <SummaryRow label="Client" value={form.client_name || "—"} />
              <SummaryRow label="Proposal type" value={selectedProposalType?.label ?? "—"} />
              <SummaryRow label="Project type" value={form.project_type || "Not set"} />
              <SummaryRow label="Stages" value={selectedStages.length ? selectedStages.map((s) => `Stage ${s}`).join(" · ") : "—"} />
              <SummaryRow label="Style" value={selectedTemplateMeta?.name ?? "—"} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--tv-text-faint)", lineHeight: 1.55, margin: "0 4px" }}>
            Selected RIBA stages are added automatically once the proposal is generated, using the same scope and
            fee data as the editor&apos;s &quot;Add a stage&quot; tool.
          </p>
        </aside>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--tv-text-dim)" }}>{label}</span>
      <span style={{ textAlign: "right", color: "var(--tv-text)", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

function GeneratingState({ progressIdx }: { progressIdx: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 0", textAlign: "center" }}>
      <div className="animate-spin" style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid var(--tv-border)", borderTopColor: "var(--tv-gold)" }} />
      <p style={{ marginTop: 32, fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: "var(--tv-text)" }}>
        {PROGRESS_MESSAGES[progressIdx]}
      </p>
      <p style={{ marginTop: 8, fontSize: 13.5, color: "var(--tv-text-faint)" }}>
        Torvionyx usually takes 15–45 seconds. Don&apos;t close this tab.
      </p>
    </div>
  );
}
