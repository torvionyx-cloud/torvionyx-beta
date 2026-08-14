/**
 * components/proposals/ProposalRenderer.tsx
 *
 * Renders a ProposalContent block array into a readable, on-brand proposal.
 * Used by both the editor preview and the public live link.
 * Pure presentational — no data fetching.
 *
 * Theming: every colour comes from a ProposalTheme (see lib/themes.ts),
 * resolved once via getTheme(template, brand) and threaded down to each
 * block renderer. The 'custom' theme (the default, and what every existing
 * proposal effectively used before templates existed) reproduces the exact
 * hex values the old hardcoded Tailwind classes rendered, so proposals with
 * no template set are visually unchanged.
 */

import type { ProposalContent, ProposalBlock, BrandSettings } from "@/types/database";
import { getTheme, type ProposalTheme } from "@/lib/themes";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProposalRendererProps {
  content: ProposalContent;
  brand?: BrandSettings | null;
  template?: string;
}

export function ProposalRenderer({ content, brand, template }: ProposalRendererProps) {
  const theme = getTheme(template ?? "custom", brand);

  return (
    <div style={{ fontFamily: theme.fontFamily, background: theme.pageBg, color: theme.textPrimary }}>
      {content.blocks.map((block, idx) => (
        <BlockRenderer key={idx} block={block} theme={theme} brand={brand} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual block renderers
// ---------------------------------------------------------------------------

function BlockRenderer({
  block,
  theme,
  brand,
}: {
  block: ProposalBlock;
  theme: ProposalTheme;
  brand?: BrandSettings | null;
}) {
  switch (block.type) {
    case "hero":
      return <HeroBlock block={block} theme={theme} brand={brand} />;
    case "text":
      return <TextBlock block={block} theme={theme} />;
    case "bullets":
      return <BulletsBlock block={block} theme={theme} />;
    case "scope_table":
      return <ScopeTableBlock block={block} theme={theme} />;
    case "timeline":
      return <TimelineBlock block={block} theme={theme} />;
    case "pricing":
      return <PricingBlock block={block} theme={theme} brand={brand} />;
    case "cta":
      return null;
    case "terms":
      return <TermsBlock block={block} theme={theme} />;
    case "divider":
      return <hr className="my-10" style={{ borderColor: theme.cardBorder }} />;
    default:
      return null;
  }
}

function HeroBlock({
  block,
  theme,
  brand,
}: {
  block: Extract<ProposalBlock, { type: "hero" }>;
  theme: ProposalTheme;
  brand?: BrandSettings | null;
}) {
  return (
    <div
      className="px-8 py-14 md:px-14 md:py-20 rounded-2xl mb-10 print:rounded-none print:px-0"
      style={{ background: theme.heroBg }}
    >
      {brand?.company_name && (
        <p
          className="text-xs font-semibold uppercase tracking-[0.15em] mb-5"
          style={{ color: theme.heroAccent }}
        >
          {brand.company_name}
        </p>
      )}
      <h1
        className="text-3xl md:text-[2.6rem] font-bold leading-tight tracking-tight"
        style={{ color: theme.heroText }}
      >
        {block.title}
      </h1>
      {block.subtitle && (
        <p
          className="mt-3 text-lg md:text-xl font-normal leading-relaxed"
          style={{ color: theme.heroText, opacity: 0.75 }}
        >
          {block.subtitle}
        </p>
      )}
      <p className="mt-8 text-sm font-medium" style={{ color: theme.heroAccent, opacity: 0.8 }}>
        Prepared for {block.clientName}
      </p>
    </div>
  );
}

function TextBlock({ block, theme }: { block: Extract<ProposalBlock, { type: "text" }>; theme: ProposalTheme }) {
  const paragraphs = block.body.split(/\n\n+/);
  return (
    <section className="py-8 px-1 print:break-inside-avoid">
      <h2 className="text-xl font-semibold mb-4 tracking-tight" style={{ color: theme.textPrimary }}>
        {block.heading}
      </h2>
      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="leading-[1.75]" style={{ color: theme.textSecondary }}>
            {p.trim()}
          </p>
        ))}
      </div>
    </section>
  );
}

function BulletsBlock({
  block,
  theme,
}: {
  block: Extract<ProposalBlock, { type: "bullets" }>;
  theme: ProposalTheme;
}) {
  return (
    <section className="py-8 px-1 print:break-inside-avoid">
      <h2 className="text-xl font-semibold mb-5 tracking-tight" style={{ color: theme.textPrimary }}>
        {block.heading}
      </h2>
      <ul className="space-y-3">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3.5">
            <span
              className="mt-[0.45rem] h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: theme.accent }}
            />
            <span className="leading-relaxed" style={{ color: theme.textSecondary }}>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScopeTableBlock({
  block,
  theme,
}: {
  block: Extract<ProposalBlock, { type: "scope_table" }>;
  theme: ProposalTheme;
}) {
  return (
    <section className="py-8 px-1 print:break-inside-avoid">
      {block.heading && (
        <h2 className="text-xl font-semibold mb-5 tracking-tight" style={{ color: theme.textPrimary }}>
          {block.heading}
        </h2>
      )}
      <div
        className="overflow-x-auto rounded-xl print:overflow-visible print:break-inside-avoid"
        style={{ border: `1px solid ${theme.cardBorder}`, background: theme.cardBg }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: theme.tableHeaderBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
              <th className="px-4 py-3 text-left font-medium w-1/3" style={{ color: theme.textMuted }}>
                Deliverable
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: theme.textMuted }}>
                Detail
              </th>
              <th className="px-4 py-3 text-right font-medium w-24" style={{ color: theme.textMuted }}>
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: i < block.rows.length - 1 ? `1px solid ${theme.cardBorderSoft}` : "none",
                }}
              >
                <td className="px-4 py-3.5 font-medium" style={{ color: theme.textPrimary }}>
                  {row.item}
                </td>
                <td className="px-4 py-3.5" style={{ color: theme.textMuted }}>
                  {row.detail}
                </td>
                <td className="px-4 py-3.5 text-right" style={{ color: theme.textFaint }}>
                  {row.weeks ? `${row.weeks}w` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TimelineBlock({
  block,
  theme,
}: {
  block: Extract<ProposalBlock, { type: "timeline" }>;
  theme: ProposalTheme;
}) {
  const heading = block.heading ?? "Timeline";
  return (
    <section className="py-8 px-1 print:break-inside-avoid">
      <h2 className="text-xl font-semibold mb-7 tracking-tight" style={{ color: theme.textPrimary }}>
        {heading}
      </h2>
      <div className="relative">
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px"
          style={{ backgroundColor: theme.accent, opacity: 0.15 }}
        />
        <ol className="space-y-5">
          {block.milestones.map((m, i) => (
            <li key={i} className="flex items-start gap-4">
              <div
                className="mt-0.5 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm"
                style={{ backgroundColor: theme.accent }}
              >
                <span className="text-white text-[11px] font-bold">{i + 1}</span>
              </div>
              <div className="pt-0.5">
                <p className="font-medium leading-snug" style={{ color: theme.textPrimary }}>
                  {m.label}
                </p>
                <p className="text-sm mt-0.5" style={{ color: theme.textFaint }}>
                  {m.when}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

function PricingBlock({
  block,
  theme,
  brand,
}: {
  block: Extract<ProposalBlock, { type: "pricing" }>;
  theme: ProposalTheme;
  brand?: BrandSettings | null;
}) {
  const symbol = CURRENCY_SYMBOLS[block.currency] ?? block.currency;
  const subtotal = block.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const vatEnabled = !!block.vatEnabled;
  const vatRate = typeof block.vatRate === "number" ? block.vatRate : 0;
  const vatAmount = vatEnabled ? subtotal * (vatRate / 100) : 0;
  const total = subtotal + vatAmount;
  const heading = block.heading ?? "Investment";

  return (
    <section className="py-8 px-1 print:break-inside-avoid">
      <h2 className="text-xl font-semibold mb-5 tracking-tight" style={{ color: theme.textPrimary }}>
        {heading}
      </h2>
      <div
        className="rounded-xl overflow-hidden print:overflow-visible print:break-inside-avoid"
        style={{ border: `1px solid ${theme.cardBorder}`, background: theme.cardBg }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: theme.tableHeaderBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
              <th className="px-4 py-3 text-left font-medium" style={{ color: theme.textMuted }}>
                Item
              </th>
              <th className="px-4 py-3 text-right font-medium w-16" style={{ color: theme.textMuted }}>
                Qty
              </th>
              <th className="px-4 py-3 text-right font-medium w-32" style={{ color: theme.textMuted }}>
                Unit price
              </th>
              <th className="px-4 py-3 text-right font-medium w-32" style={{ color: theme.textMuted }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {block.lineItems.map((item, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < block.lineItems.length - 1 ? `1px solid ${theme.cardBorderSoft}` : "none",
                }}
              >
                <td className="px-4 py-3.5">
                  <span className="font-medium" style={{ color: theme.textPrimary }}>
                    {item.name}
                  </span>
                  {item.description && (
                    <span className="block text-xs mt-0.5" style={{ color: theme.textFaint }}>
                      {item.description}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right" style={{ color: theme.textMuted }}>
                  {item.qty}
                </td>
                <td className="px-4 py-3.5 text-right" style={{ color: theme.textMuted }}>
                  {symbol}
                  {item.unitPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-right font-medium" style={{ color: theme.textPrimary }}>
                  {symbol}
                  {(item.qty * item.unitPrice).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          {block.showTotals && vatEnabled && (
            <tfoot>
              <tr style={{ borderTop: `1px solid ${theme.cardBorderSoft}` }}>
                <td colSpan={3} className="px-4 py-2 text-sm text-right" style={{ color: theme.textMuted }}>
                  Subtotal
                </td>
                <td className="px-4 py-2 text-right text-sm" style={{ color: theme.textMuted }}>
                  {symbol}
                  {subtotal.toLocaleString()}
                </td>
              </tr>
              <tr style={{ borderTop: `1px solid ${theme.cardBorderSoft}` }}>
                <td colSpan={3} className="px-4 py-2 text-sm text-right" style={{ color: theme.textMuted }}>
                  VAT ({vatRate}%)
                </td>
                <td className="px-4 py-2 text-right text-sm" style={{ color: theme.textMuted }}>
                  {symbol}
                  {vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr style={{ borderTop: `2px solid ${theme.cardBorder}`, backgroundColor: theme.accent + "0d" }}>
                <td colSpan={3} className="px-4 py-4 font-semibold text-right" style={{ color: theme.textPrimary }}>
                  Total (inc. VAT)
                </td>
                <td className="px-4 py-4 text-right text-lg font-bold" style={{ color: theme.accent }}>
                  {symbol}
                  {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          )}
          {block.showTotals && !vatEnabled && (
            <tfoot>
              <tr style={{ borderTop: `2px solid ${theme.cardBorder}`, backgroundColor: theme.accent + "0d" }}>
                <td colSpan={3} className="px-4 py-4 font-semibold text-right" style={{ color: theme.textPrimary }}>
                  Total
                </td>
                <td className="px-4 py-4 text-right text-lg font-bold" style={{ color: theme.accent }}>
                  {symbol}
                  {total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {vatEnabled && brand?.vat_number && (
          <div className="px-4 py-2.5 text-xs" style={{ color: theme.textFaint, borderTop: `1px solid ${theme.cardBorderSoft}` }}>
            VAT registration: {brand.vat_number}
          </div>
        )}
        {!vatEnabled && block.vatNote && (
          <div className="px-4 py-2.5 text-xs" style={{ color: theme.textFaint, borderTop: `1px solid ${theme.cardBorderSoft}` }}>
            {block.vatNote}
          </div>
        )}
      </div>
    </section>
  );
}

function TermsBlock({ block, theme }: { block: Extract<ProposalBlock, { type: "terms" }>; theme: ProposalTheme }) {
  const paragraphs = block.body.split(/\n\n+/);
  return (
    <section className="py-8 px-1 border-t mt-4" style={{ borderColor: theme.cardBorderSoft }}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] mb-5" style={{ color: theme.textFaint }}>
        Terms &amp; Conditions
      </h2>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed" style={{ color: theme.textFaint }}>
            {p.trim()}
          </p>
        ))}
      </div>
    </section>
  );
}

export { CURRENCY_SYMBOLS };
