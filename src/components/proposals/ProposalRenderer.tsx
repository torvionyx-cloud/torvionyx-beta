/**
 * components/proposals/ProposalRenderer.tsx
 *
 * Renders a ProposalContent block array into a readable, on-brand proposal.
 * Used by both the editor preview and the public live link.
 * Pure presentational — no data fetching.
 */

import type { ProposalContent, ProposalBlock, BrandSettings } from "@/types/database";

// ---------------------------------------------------------------------------
// Font configuration
// ---------------------------------------------------------------------------

const FONT_FAMILY_MAP: Record<string, string> = {
  inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  playfair: "'Playfair Display', Georgia, 'Times New Roman', serif",
  "dm-sans": "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  "libre-baskerville": "'Libre Baskerville', Georgia, 'Times New Roman', serif",
  "space-grotesk": "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
  "bricolage-grotesque": "'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProposalRendererProps {
  content: ProposalContent;
  brand?: BrandSettings | null;
}

export function ProposalRenderer({ content, brand }: ProposalRendererProps) {
  const primaryColor = brand?.primary_color ?? "#111111";
  const fontFamily =
    FONT_FAMILY_MAP[brand?.font_choice ?? "inter"] ?? FONT_FAMILY_MAP.inter;

  return (
    <div style={{ fontFamily }}>
      {content.blocks.map((block, idx) => (
        <BlockRenderer
          key={idx}
          block={block}
          primaryColor={primaryColor}
          brand={brand}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual block renderers
// ---------------------------------------------------------------------------

function BlockRenderer({
  block,
  primaryColor,
  brand,
}: {
  block: ProposalBlock;
  primaryColor: string;
  brand?: BrandSettings | null;
}) {
  switch (block.type) {
    case "hero":
      return <HeroBlock block={block} primaryColor={primaryColor} brand={brand} />;
    case "text":
      return <TextBlock block={block} />;
    case "bullets":
      return <BulletsBlock block={block} primaryColor={primaryColor} />;
    case "scope_table":
      return <ScopeTableBlock block={block} />;
    case "timeline":
      return <TimelineBlock block={block} primaryColor={primaryColor} />;
    case "pricing":
      return <PricingBlock block={block} primaryColor={primaryColor} />;
    case "cta":
      return null; // CTA rendered separately in the live link as the accept button
    case "terms":
      return <TermsBlock block={block} />;
    case "divider":
      return <hr className="border-neutral-200 my-10" />;
    default:
      return null;
  }
}

function HeroBlock({
  block,
  primaryColor,
  brand,
}: {
  block: Extract<ProposalBlock, { type: "hero" }>;
  primaryColor: string;
  brand?: BrandSettings | null;
}) {
  return (
    <div
      className="px-8 py-14 md:px-14 md:py-20 rounded-2xl mb-10 print:rounded-none print:px-0"
      style={{ backgroundColor: primaryColor }}
    >
      {brand?.company_name && (
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50 mb-5">
          {brand.company_name}
        </p>
      )}
      <h1 className="text-3xl md:text-[2.6rem] font-bold text-white leading-tight tracking-tight">
        {block.title}
      </h1>
      {block.subtitle && (
        <p className="mt-3 text-lg md:text-xl text-white/75 font-normal leading-relaxed">
          {block.subtitle}
        </p>
      )}
      <p className="mt-8 text-sm text-white/40 font-medium">
        Prepared for {block.clientName}
      </p>
    </div>
  );
}

function TextBlock({ block }: { block: Extract<ProposalBlock, { type: "text" }> }) {
  const paragraphs = block.body.split(/\n\n+/);
  return (
    <section className="py-8 px-1">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4 tracking-tight">
        {block.heading}
      </h2>
      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-neutral-600 leading-[1.75]">
            {p.trim()}
          </p>
        ))}
      </div>
    </section>
  );
}

function BulletsBlock({
  block,
  primaryColor,
}: {
  block: Extract<ProposalBlock, { type: "bullets" }>;
  primaryColor: string;
}) {
  return (
    <section className="py-8 px-1">
      <h2 className="text-xl font-semibold text-neutral-900 mb-5 tracking-tight">
        {block.heading}
      </h2>
      <ul className="space-y-3">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3.5">
            <span
              className="mt-[0.45rem] h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-neutral-600 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScopeTableBlock({
  block,
}: {
  block: Extract<ProposalBlock, { type: "scope_table" }>;
}) {
  return (
    <section className="py-8 px-1">
      {block.heading && (
        <h2 className="text-xl font-semibold text-neutral-900 mb-5 tracking-tight">
          {block.heading}
        </h2>
      )}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 print:overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-500 w-1/3">
                Deliverable
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-500">
                Detail
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-500 w-24">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3.5 font-medium text-neutral-900">{row.item}</td>
                <td className="px-4 py-3.5 text-neutral-500">{row.detail}</td>
                <td className="px-4 py-3.5 text-right text-neutral-400">
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
  primaryColor,
}: {
  block: Extract<ProposalBlock, { type: "timeline" }>;
  primaryColor: string;
}) {
  const heading = block.heading ?? "Timeline";
  return (
    <section className="py-8 px-1">
      <h2 className="text-xl font-semibold text-neutral-900 mb-7 tracking-tight">
        {heading}
      </h2>
      <div className="relative">
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px"
          style={{ backgroundColor: primaryColor, opacity: 0.15 }}
        />
        <ol className="space-y-5">
          {block.milestones.map((m, i) => (
            <li key={i} className="flex items-start gap-4">
              <div
                className="mt-0.5 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-white text-[11px] font-bold">{i + 1}</span>
              </div>
              <div className="pt-0.5">
                <p className="font-medium text-neutral-900 leading-snug">{m.label}</p>
                <p className="text-sm text-neutral-400 mt-0.5">{m.when}</p>
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
  primaryColor,
}: {
  block: Extract<ProposalBlock, { type: "pricing" }>;
  primaryColor: string;
}) {
  const symbol = CURRENCY_SYMBOLS[block.currency] ?? block.currency;
  const total = block.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const heading = block.heading ?? "Investment";

  return (
    <section className="py-8 px-1">
      <h2 className="text-xl font-semibold text-neutral-900 mb-5 tracking-tight">
        {heading}
      </h2>
      <div className="rounded-xl border border-neutral-200 overflow-hidden print:overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-500">Item</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-500 w-16">Qty</th>
              <th className="px-4 py-3 text-right font-medium text-neutral-500 w-32">
                Unit price
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-500 w-32">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {block.lineItems.map((item, i) => (
              <tr key={i} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3.5">
                  <span className="font-medium text-neutral-900">{item.name}</span>
                  {item.description && (
                    <span className="block text-xs text-neutral-400 mt-0.5">
                      {item.description}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right text-neutral-500">{item.qty}</td>
                <td className="px-4 py-3.5 text-right text-neutral-500">
                  {symbol}
                  {item.unitPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-right font-medium text-neutral-900">
                  {symbol}
                  {(item.qty * item.unitPrice).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          {block.showTotals && (
            <tfoot>
              <tr
                className="border-t-2 border-neutral-200"
                style={{ backgroundColor: primaryColor + "0d" }}
              >
                <td
                  colSpan={3}
                  className="px-4 py-4 font-semibold text-neutral-900 text-right"
                >
                  Total
                </td>
                <td
                  className="px-4 py-4 text-right text-lg font-bold"
                  style={{ color: primaryColor }}
                >
                  {symbol}
                  {total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {block.vatNote && (
          <div className="px-4 py-2.5 text-xs text-neutral-400 border-t border-neutral-100">
            {block.vatNote}
          </div>
        )}
      </div>
    </section>
  );
}

function TermsBlock({ block }: { block: Extract<ProposalBlock, { type: "terms" }> }) {
  const paragraphs = block.body.split(/\n\n+/);
  return (
    <section className="py-8 px-1 border-t border-neutral-100 mt-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-5">
        Terms &amp; Conditions
      </h2>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-neutral-400 leading-relaxed">
            {p.trim()}
          </p>
        ))}
      </div>
    </section>
  );
}

export { CURRENCY_SYMBOLS };
