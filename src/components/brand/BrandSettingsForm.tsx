// @ts-nocheck

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { BrandSettings } from "@/types/database";

const FONT_OPTIONS = [
  { value: "space-grotesk",       label: "Space Grotesk",       preview: "'Space Grotesk', sans-serif" },
  { value: "inter",               label: "Inter",               preview: "Inter, sans-serif" },
  { value: "playfair",            label: "Playfair Display",    preview: "Georgia, serif" },
  { value: "dm-sans",             label: "DM Sans",             preview: "DM Sans, sans-serif" },
  { value: "libre-baskerville",   label: "Libre Baskerville",   preview: "Georgia, serif" },
  { value: "bricolage-grotesque", label: "Bricolage Grotesque", preview: "sans-serif" },
];

const ACCENT_SWATCHES = [
  "#DCAA33","#3DB9C9","#7C6BE8","#52C285",
  "#E8635C","#E87D3E","#C94F8A","#2E86AB",
];

const TEMPLATES = [
  { name: "Gold Standard", desc: "Navy and gold",        accent: "#DCAA33" },
  { name: "Ocean Depth",   desc: "Cool and professional", accent: "#2E86AB" },
  { name: "Emerald",       desc: "Fresh and modern",      accent: "#52C285" },
  { name: "Violet",        desc: "Bold and expressive",   accent: "#7C6BE8" },
];

function hexToHsl(hex: string): [number, number, number] {
  const c = hex.replace("#","");
  const r = parseInt(c.slice(0,2),16)/255, g = parseInt(c.slice(2,4),16)/255, b = parseInt(c.slice(4,6),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h *= 60;
  }
  return [Math.round(h), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = (n: number) => {
    const k = (n+h/30)%12;
    const c = l - a*Math.max(Math.min(k-3,9-k,1),-1);
    return Math.round(255*c).toString(16).padStart(2,"0");
  };
  return "#"+f(0)+f(8)+f(4);
}

function hslToRgb(h: number, s: number, l: number): [number,number,number] {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = (n: number) => {
    const k = (n+h/30)%12;
    return l - a*Math.max(Math.min(k-3,9-k,1),-1);
  };
  return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)];
}

interface Props { initialBrand: BrandSettings }
type SaveState = "idle" | "saving" | "saved" | "error";

export function BrandSettingsForm({ initialBrand }: Props) {
  const [form, setForm] = useState({
    company_name:    initialBrand.company_name,
    logo_url:        initialBrand.logo_url ?? "",
    primary_color:   initialBrand.primary_color || "#DCAA33",
    secondary_color: initialBrand.secondary_color ?? "",
    font_choice:     initialBrand.font_choice || "space-grotesk",
    about_text:      initialBrand.about_text,
    tone_of_voice:   initialBrand.tone_of_voice,
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [prefs, setPrefs] = useState({ powered: true, acceptBtn: true, lineItems: true, tc: false });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hsl, setHsl] = useState<[number,number,number]>([39,73,52]);

  const set = useCallback((field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    setSaveState("idle");
  }, []);

  const applyAccent = useCallback((hex: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    set("primary_color", hex);
    setHsl(hexToHsl(hex));
  }, [set]);

  // Draw colour wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const CX = 70, CY = 70, CR = 66;
    const img = ctx.createImageData(140, 140);
    for (let y = 0; y < 140; y++) {
      for (let x = 0; x < 140; x++) {
        const dx = x-CX, dy = y-CY, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist <= CR) {
          const angle = (Math.atan2(dy,dx)*180/Math.PI+360)%360;
          const sat = dist/CR*100;
          const [r,g,b] = hslToRgb(angle, sat, 52);
          const i = (y*140+x)*4;
          img.data[i]=r; img.data[i+1]=g; img.data[i+2]=b; img.data[i+3]=255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (140/rect.width);
    const y = (e.clientY - rect.top) * (140/rect.height);
    const dx = x-70, dy = y-70, dist = Math.sqrt(dx*dx+dy*dy);
    if (dist <= 66) {
      const h = (Math.atan2(dy,dx)*180/Math.PI+360)%360;
      const s = Math.min(dist/66,1)*100;
      applyAccent(hslToHex(h, s, hsl[2]));
    }
  }, [hsl, applyAccent]);

  // Wheel cursor position
  const CX = 70, CY = 70, CR = 66;
  const angle = hsl[0] * Math.PI/180;
  const rad = hsl[1]/100 * CR;
  const cursorX = CX + rad*Math.cos(angle);
  const cursorY = CY + rad*Math.sin(angle);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState("saving");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          logo_url: form.logo_url.trim() || null,
          secondary_color: /^#[0-9A-Fa-f]{6}$/.test(form.secondary_color) ? form.secondary_color : null,
        }),
      });
      const data = await res.json();
      if (res.ok) { setSaveState("saved"); }
      else { setErrorMsg(data.error ?? "Failed to save"); setSaveState("error"); }
    } catch {
      setErrorMsg("Connection error — please try again");
      setSaveState("error");
    }
  }, [form]);

  const accent = /^#[0-9A-Fa-f]{6}$/.test(form.primary_color) ? form.primary_color : "#DCAA33";
  const previewFont = FONT_OPTIONS.find(f => f.value === form.font_choice)?.preview || "'Space Grotesk', sans-serif";

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    fontFamily: "Inter, sans-serif", fontSize: 14,
    borderRadius: 10, border: "1.5px solid var(--tv-border)",
    background: "var(--tv-panel-accent)", color: "var(--tv-text)",
    outline: "none", transition: "border-color .2s, box-shadow .2s",
  } as const;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

      {/* ── Left ── */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>

        {/* Logo */}
        <Section title="Logo" desc="Shown in your proposal header. Paste a public URL to your logo.">
          <Label>Logo URL</Label>
          <input type="url" maxLength={500} value={form.logo_url}
            onChange={e => set("logo_url", e.target.value)}
            placeholder="https://yourdomain.com/logo.png"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 4px ${accent}22`; }}
            onBlur={e => { e.target.style.borderColor = "var(--tv-border)"; e.target.style.boxShadow = "none"; }}
          />
        </Section>
        <Divider />

        {/* Accent colour */}
        <Section title="Accent colour" desc="Used across your proposal header, CTA button and prices. Pick a swatch, use the colour wheel, or enter a hex value.">
          {/* Swatches */}
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 18 }}>
            {ACCENT_SWATCHES.map(c => (
              <button key={c} type="button" onClick={() => applyAccent(c)}
                style={{
                  width: 34, height: 34, borderRadius: 10, background: c, border: "none",
                  outline: form.primary_color === c ? "2.5px solid var(--tv-text)" : "2.5px solid transparent",
                  cursor: "pointer", transition: "transform .2s, outline .15s",
                  transform: form.primary_color === c ? "translateY(-2px)" : "none",
                }}
              />
            ))}
          </div>

          {/* Colour wheel + sliders */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 14 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <canvas ref={canvasRef} width={140} height={140}
                onClick={handleCanvasClick}
                style={{ borderRadius: "50%", cursor: "crosshair", display: "block" }}
              />
              <div style={{
                position: "absolute", width: 14, height: 14, borderRadius: "50%",
                border: "2.5px solid #fff", boxShadow: "0 0 0 1.5px rgba(0,0,0,.4), 0 2px 6px rgba(0,0,0,.3)",
                transform: "translate(-50%,-50%)", pointerEvents: "none",
                background: accent,
                left: cursorX, top: cursorY,
              }} />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
              {[
                { label: "Hue", id: "h", min: 0, max: 360, val: hsl[0], unit: "°",
                  bg: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" },
                { label: "Saturation", id: "s", min: 0, max: 100, val: hsl[1], unit: "%",
                  bg: `linear-gradient(to right,#888,${accent})` },
                { label: "Lightness", id: "l", min: 5, max: 95, val: hsl[2], unit: "%",
                  bg: `linear-gradient(to right,#000,${accent},#fff)` },
              ].map(({ label, id, min, max, val, unit, bg }) => (
                <div key={id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--tv-text-faint)", marginBottom: 5 }}>
                    <span>{label}</span>
                    <span style={{ color: "var(--tv-text)", fontWeight: 700 }}>{val}{unit}</span>
                  </div>
                  <input type="range" min={min} max={max} value={val}
                    onChange={e => {
                      const newHsl: [number,number,number] = [...hsl] as [number,number,number];
                      newHsl[id==="h"?0:id==="s"?1:2] = +e.target.value;
                      setHsl(newHsl);
                      applyAccent(hslToHex(...newHsl));
                    }}
                    style={{ WebkitAppearance: "none", width: "100%", height: 6, borderRadius: 6, outline: "none", cursor: "pointer", background: bg }}
                  />
                </div>
              ))}

              {/* Hex input */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: accent, border: "1.5px solid var(--tv-border)", flexShrink: 0, overflow: "hidden", position: "relative" }}>
                  <input type="color" value={accent} onChange={e => applyAccent(e.target.value)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                  />
                </div>
                <input type="text" value={form.primary_color} maxLength={7}
                  onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) set("primary_color", e.target.value); }}
                  style={{ ...inputStyle, width: 110, fontFamily: "monospace" }}
                  onFocus={e => { e.target.style.borderColor = accent; }}
                  onBlur={e => { e.target.style.borderColor = "var(--tv-border)"; if (/^#[0-9A-Fa-f]{6}$/.test(form.primary_color)) applyAccent(form.primary_color); }}
                />
                <button type="button" onClick={() => applyAccent(form.primary_color)}
                  style={{ padding: "9px 16px", borderRadius: 10, background: accent, color: "#0A1322", fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        </Section>
        <Divider />

        {/* Font */}
        <Section title="Proposal font" desc="Sets the display typeface used in headings and totals.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {FONT_OPTIONS.map(f => (
              <button key={f.value} type="button" onClick={() => set("font_choice", f.value)}
                style={{
                  border: `1.5px solid ${form.font_choice === f.value ? accent : "var(--tv-border)"}`,
                  borderRadius: 12, padding: "14px 12px", cursor: "pointer", textAlign: "center",
                  background: form.font_choice === f.value ? `${accent}22` : "var(--tv-panel-accent)",
                  transition: "border-color .2s, background .2s",
                }}
              >
                <div style={{ fontFamily: f.preview, fontSize: 20, fontWeight: 700, marginBottom: 5, color: "var(--tv-text)" }}>Aa</div>
                <div style={{ fontFamily: "monospace", fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--tv-text-faint)" }}>{f.label}</div>
              </button>
            ))}
          </div>
        </Section>
        <Divider />

        {/* Business details */}
        <Section title="Business details">
          <Label>Business name *</Label>
          <input required type="text" minLength={1} maxLength={100}
            value={form.company_name}
            onChange={e => set("company_name", e.target.value)}
            placeholder="Your Studio"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 4px ${accent}22`; }}
            onBlur={e => { e.target.style.borderColor = "var(--tv-border)"; e.target.style.boxShadow = "none"; }}
          />
        </Section>
        <Divider />

        {/* Voice & context */}
        <Section title="Voice & context" desc="Torvionyx uses this when generating proposals — the more detail, the more on-brand the output.">
          <div style={{ marginBottom: 14 }}>
            <Label>About your business</Label>
            <textarea rows={5} maxLength={2000}
              value={form.about_text}
              onChange={e => set("about_text", e.target.value)}
              placeholder="Describe what you do, who you work with, and what makes your work different…"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55 }}
              onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 4px ${accent}22`; }}
              onBlur={e => { e.target.style.borderColor = "var(--tv-border)"; e.target.style.boxShadow = "none"; }}
            />
            <p style={{ marginTop: 6, fontSize: 12, color: "var(--tv-text-faint)" }}>{form.about_text?.length ?? 0} / 2,000</p>
          </div>
          <div>
            <Label>Tone of voice</Label>
            <input type="text" maxLength={500}
              value={form.tone_of_voice}
              onChange={e => set("tone_of_voice", e.target.value)}
              placeholder="e.g. Professional but warm, direct, avoids jargon"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 4px ${accent}22`; }}
              onBlur={e => { e.target.style.borderColor = "var(--tv-border)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </Section>
        <Divider />

        {/* Saved templates */}
        <Section title="Saved templates" desc="Save your current style as a named template and switch between looks instantly.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {TEMPLATES.map(t => (
              <div key={t.name}
                onClick={() => applyAccent(t.accent)}
                style={{
                  border: `2px solid ${accent === t.accent ? accent : "var(--tv-border)"}`,
                  borderRadius: 14, overflow: "hidden", cursor: "pointer",
                  background: "var(--tv-panel-accent)",
                  boxShadow: accent === t.accent ? `0 0 0 3px ${accent}22` : "none",
                  transition: "border-color .2s, box-shadow .2s, transform .2s",
                }}
              >
                {/* Mini preview */}
                <div style={{ height: 80, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ height: 28, background: t.accent, display: "flex", alignItems: "center", padding: "0 10px", gap: 8, flexShrink: 0 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: "rgba(255,255,255,.3)" }} />
                    <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk',sans-serif" }}>Your Studio</span>
                  </div>
                  <div style={{ flex: 1, background: "#fff", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ height: 5, borderRadius: 3, background: t.accent, opacity: .7, width: "60%" }} />
                    <div style={{ height: 4, borderRadius: 3, background: "#e8e8ee", width: "80%" }} />
                    <div style={{ height: 4, borderRadius: 3, background: "#e8e8ee", width: "60%" }} />
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ height: 4, width: 36, borderRadius: 3, background: "#e8e8ee" }} />
                      <div style={{ height: 12, width: 44, borderRadius: 3, background: t.accent, opacity: .8 }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: "10px 12px", borderTop: "1px solid var(--tv-border)" }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 12.5, color: "var(--tv-text)" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--tv-text-faint)", marginTop: 2 }}>{t.desc}</div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: accent, fontFamily: "monospace" }}>
                      {accent === t.accent ? "✓ Active" : "Use template"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Divider />

        {/* Proposal preferences */}
        <Section title="Proposal preferences">
          {[
            { key: "powered",   name: 'Show "Powered by Torvionyx"', desc: "Footer credit on each proposal" },
            { key: "acceptBtn", name: "Include accept button",        desc: "Clients can accept directly from the proposal" },
            { key: "lineItems", name: "Show line item breakdown",     desc: "Display individual service items and prices" },
            { key: "tc",        name: "Attach T&C link",              desc: "Shows your T&C document at the proposal footer" },
          ].map(({ key, name, desc }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--tv-border-soft)" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tv-text)" }}>{name}</div>
                <div style={{ fontSize: 12, color: "var(--tv-text-faint)", marginTop: 2 }}>{desc}</div>
              </div>
              <button type="button"
                onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                style={{
                  width: 40, height: 22, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0,
                  background: prefs[key] ? accent : "rgba(250,242,232,.15)",
                  position: "relative", transition: "background .25s",
                }}
              >
                <div style={{
                  position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "#fff",
                  transition: "transform .25s", transform: prefs[key] ? "translateX(21px)" : "translateX(3px)",
                }} />
              </button>
            </div>
          ))}
        </Section>
        <Divider />

        {/* Save */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 8, paddingBottom: 40 }}>
          <button type="submit" disabled={saveState === "saving"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 13.5, fontWeight: 700,
              background: saveState === "saved" ? "#5FD08A" : `linear-gradient(135deg,#F2C84E,#DCAA33)`,
              color: "#0A1322", boxShadow: "0 8px 20px -10px rgba(220,170,51,.6)",
              opacity: saveState === "saving" ? .6 : 1, transition: "background .3s",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save changes"}
          </button>
          {saveState === "error" && errorMsg && (
            <span style={{ fontSize: 13, color: "#F2635C" }}>{errorMsg}</span>
          )}
        </div>
      </form>

      {/* ── Right: live preview ── */}
      <div style={{ position: "sticky", top: 80 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10.5, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--tv-text-faint)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 20, height: 1, background: "var(--tv-text-faint)" }} />
          Live preview
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5FD08A", marginLeft: "auto", animation: "tvpulse 2s ease-in-out infinite" }} />
        </div>

        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 50px -20px rgba(0,0,0,.4)" }}>
          <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: accent, transition: "background .4s" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,.22)", display: "grid", placeItems: "center", fontFamily: previewFont, fontWeight: 700, fontSize: 15, color: "#fff", flexShrink: 0 }}>
              {form.company_name?.charAt(0)?.toUpperCase() || "Y"}
            </div>
            <div style={{ marginLeft: 12, flex: 1 }}>
              <div style={{ fontFamily: previewFont, fontWeight: 700, fontSize: 13.5, color: "#fff" }}>{form.company_name || "Your Studio"}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.74)", marginTop: 1 }}>Creative services</div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#fff", background: "rgba(255,255,255,.22)", padding: "3px 9px", borderRadius: 20 }}>PROPOSAL</div>
          </div>

          <div style={{ padding: "18px 20px", background: "#fff", color: "#1a1a2e" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "#aaa", marginBottom: 7 }}>Prepared for</div>
            <div style={{ fontFamily: previewFont, fontWeight: 600, fontSize: 17, letterSpacing: "-.015em", color: "#0d1626", marginBottom: 14 }}>Brand Strategy Package</div>

            {prefs.lineItems && [["Discovery","£1,200"],["Brand identity","£2,400"],["Guidelines doc","£800"]].map(([n,p]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "#f7f7fa", borderRadius: 9, marginBottom: 6, fontSize: 12.5, color: "#1a1a2e" }}>
                <span>{n}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: accent }}>{p}</span>
              </div>
            ))}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1.5px solid #f0f0f5" }}>
              <div>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>Total</div>
                <div style={{ fontFamily: previewFont, fontWeight: 700, fontSize: 20, color: "#0d1626" }}>£4,400</div>
              </div>
              {prefs.acceptBtn && (
                <button style={{ padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: previewFont, fontWeight: 600, fontSize: 13, background: accent, color: "#0d1626" }}>
                  Accept proposal
                </button>
              )}
            </div>

            {prefs.powered && (
              <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "#bbb" }}>
                Sent via <span style={{ color: accent, fontWeight: 600 }}>torvionyx</span>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes tvpulse{0%,100%{opacity:1}50%{opacity:.4}}
          input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--accent,#DCAA33);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);cursor:pointer}
          input[type=range]{-webkit-appearance:none}
        `}</style>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15.5, letterSpacing: "-.01em", color: "var(--tv-text)" }}>{title}</div>
        {desc && <div style={{ fontSize: 12.5, color: "var(--tv-text-faint)", marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--tv-border-soft)", marginBottom: 28 }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 7, color: "var(--tv-text-dim)" }}>{children}</label>;
}