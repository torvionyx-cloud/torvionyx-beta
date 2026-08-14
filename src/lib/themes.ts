// @ts-nocheck

/**
 * lib/themes.ts
 *
 * The 7 proposal presentation themes ("templates") — selected per-proposal
 * (proposals.template) or defaulted per-workspace (brand_settings.default_template
 * in the live schema; not yet surfaced anywhere in this app's UI).
 *
 * 'custom' is the only dynamic one: it defers entirely to the workspace's
 * brand settings (primary/secondary colour, font) rather than a fixed
 * palette, and reproduces exactly what every proposal renders as today —
 * the other 6 are fixed palettes.
 *
 * Consumed by ProposalRenderer via getTheme().
 */

import type { BrandSettings } from "@/types/database";

export const PROPOSAL_TEMPLATES = [
  "custom",
  "monochrome",
  "warm_studio",
  "midnight",
  "corporate",
  "gradient",
  "developer",
] as const;

export type ProposalTemplateId = (typeof PROPOSAL_TEMPLATES)[number];

export interface ProposalTheme {
  id: ProposalTemplateId;
  fontFamily: string;
  /** CSS `background` value for the hero block — solid colour or gradient. */
  heroBg: string;
  heroText: string;
  /** Company-name label and "Prepared for" line inside the hero. */
  heroAccent: string;
  pageBg: string;
  cardBg: string;
  /** Card / table-wrapper border. */
  cardBorder: string;
  /** Lighter divider border used between rows inside a card. */
  cardBorderSoft: string;
  /** Table header row background (scope table, pricing table). */
  tableHeaderBg: string;
  /** Bullets, timeline, pricing totals — the theme's single "brand" colour outside the hero. */
  accent: string;
  /** Headings, primary content (item names, amounts, milestone labels). */
  textPrimary: string;
  /** Body copy. */
  textSecondary: string;
  /** Secondary/description-tier content (table header labels, detail columns). */
  textMuted: string;
  /** Least prominent tier (durations, terms copy, VAT note). */
  textFaint: string;
}

export const FONT_FAMILY_MAP: Record<string, string> = {
  inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  playfair: "'Playfair Display', Georgia, 'Times New Roman', serif",
  "dm-sans": "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  "libre-baskerville": "'Libre Baskerville', Georgia, 'Times New Roman', serif",
  "space-grotesk": "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
  "bricolage-grotesque": "'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif",
};

const JETBRAINS_MONO = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace";

// Tailwind's neutral-* palette hex values, used verbatim so the 'custom'
// theme is pixel-identical to the hardcoded classes it replaces.
const NEUTRAL_900 = "#171717";
const NEUTRAL_600 = "#525252";
const NEUTRAL_500 = "#737373";
const NEUTRAL_400 = "#a3a3a3";
const NEUTRAL_200 = "#e5e5e5";
const NEUTRAL_100 = "#f5f5f5";

function buildCustomTheme(
  brand?: Pick<BrandSettings, "primary_color" | "secondary_color" | "font_choice"> | null
): ProposalTheme {
  const primary = brand?.primary_color ?? "#111111";
  const secondary = brand?.secondary_color ?? "#f9fafb";
  const fontFamily = FONT_FAMILY_MAP[brand?.font_choice ?? "inter"] ?? FONT_FAMILY_MAP.inter;

  return {
    id: "custom",
    fontFamily,
    heroBg: primary,
    heroText: "#FFFFFF",
    heroAccent: "rgba(255,255,255,.5)",
    pageBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    cardBorder: NEUTRAL_200,
    cardBorderSoft: NEUTRAL_100,
    tableHeaderBg: secondary,
    accent: primary,
    textPrimary: NEUTRAL_900,
    textSecondary: NEUTRAL_600,
    textMuted: NEUTRAL_500,
    textFaint: NEUTRAL_400,
  };
}

const FIXED_THEMES: Record<Exclude<ProposalTemplateId, "custom">, ProposalTheme> = {
  monochrome: {
    id: "monochrome",
    fontFamily: FONT_FAMILY_MAP["space-grotesk"],
    heroBg: "#000000",
    heroText: "#FFFFFF",
    heroAccent: "rgba(255,255,255,.55)",
    pageBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    cardBorder: "#000000",
    cardBorderSoft: "#E5E5E5",
    tableHeaderBg: "#F5F5F5",
    accent: "#000000",
    textPrimary: "#000000",
    textSecondary: "#1F1F1F",
    textMuted: "#595959",
    textFaint: "#8C8C8C",
  },
  warm_studio: {
    id: "warm_studio",
    fontFamily: FONT_FAMILY_MAP.playfair,
    heroBg: "#B5502C",
    heroText: "#FFF8F0",
    heroAccent: "rgba(244,233,216,.7)",
    pageBg: "#F4E9D8",
    cardBg: "#FFFCF7",
    cardBorder: "#E3D2B8",
    cardBorderSoft: "#EDE1CC",
    tableHeaderBg: "#EFE1CB",
    accent: "#B5502C",
    textPrimary: "#3A2317",
    textSecondary: "#54392A",
    textMuted: "#6B4A36",
    textFaint: "#9B7E67",
  },
  midnight: {
    id: "midnight",
    fontFamily: FONT_FAMILY_MAP.playfair,
    heroBg: "#0A1322",
    heroText: "#FAF2E8",
    heroAccent: "rgba(220,170,51,.7)",
    pageBg: "#0A1322",
    cardBg: "#0F1E36",
    cardBorder: "rgba(250,242,232,.14)",
    cardBorderSoft: "rgba(250,242,232,.08)",
    tableHeaderBg: "rgba(250,242,232,.06)",
    accent: "#DCAA33",
    textPrimary: "#FAF2E8",
    textSecondary: "rgba(250,242,232,.72)",
    textMuted: "rgba(250,242,232,.55)",
    textFaint: "rgba(250,242,232,.38)",
  },
  corporate: {
    id: "corporate",
    fontFamily: FONT_FAMILY_MAP.inter,
    heroBg: "#1E40AF",
    heroText: "#FFFFFF",
    heroAccent: "rgba(219,234,254,.8)",
    pageBg: "#F8FAFC",
    cardBg: "#FFFFFF",
    cardBorder: "#E2E8F0",
    cardBorderSoft: "#EEF2F6",
    tableHeaderBg: "#F1F5F9",
    accent: "#1E40AF",
    textPrimary: "#0F172A",
    textSecondary: "#334155",
    textMuted: "#64748B",
    textFaint: "#94A3B8",
  },
  gradient: {
    id: "gradient",
    fontFamily: FONT_FAMILY_MAP["bricolage-grotesque"],
    heroBg: "linear-gradient(135deg, #7C3AED, #FF6F61)",
    heroText: "#FFFFFF",
    heroAccent: "rgba(255,255,255,.6)",
    pageBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    cardBorder: "#EDEDF2",
    cardBorderSoft: "#F5F5F8",
    tableHeaderBg: "#F7F5FC",
    accent: "#7C3AED",
    textPrimary: "#18181B",
    textSecondary: "#3F3F46",
    textMuted: "#71717A",
    textFaint: "#A1A1AA",
  },
  developer: {
    id: "developer",
    fontFamily: JETBRAINS_MONO,
    heroBg: "#16A34A",
    heroText: "#FFFFFF",
    heroAccent: "rgba(248,249,250,.75)",
    pageBg: "#F8F9FA",
    cardBg: "#FFFFFF",
    cardBorder: "#DEE2E6",
    cardBorderSoft: "#E9ECEF",
    tableHeaderBg: "#F1F3F5",
    accent: "#16A34A",
    textPrimary: "#212529",
    textSecondary: "#343A40",
    textMuted: "#495057",
    textFaint: "#868E96",
  },
};

/**
 * Resolves a template id to its ProposalTheme. 'custom' — and any
 * unrecognised id, so a bad or legacy value never hard-fails rendering —
 * defers to the workspace's brand settings; the other 6 ids are fixed
 * palettes and ignore brand settings entirely.
 */
export function getTheme(
  templateId: string | null | undefined,
  brand?: Pick<BrandSettings, "primary_color" | "secondary_color" | "font_choice"> | null
): ProposalTheme {
  if (templateId && templateId !== "custom" && templateId in FIXED_THEMES) {
    return FIXED_THEMES[templateId as Exclude<ProposalTemplateId, "custom">];
  }
  return buildCustomTheme(brand);
}
