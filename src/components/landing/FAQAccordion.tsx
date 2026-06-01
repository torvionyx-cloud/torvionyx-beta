// @ts-nocheck

"use client";

import { useState } from "react";

const faqs = [
  {
    q: "How good is the AI? Will I need to rewrite everything?",
    a: "Good enough that most proposals need only light editing (5–15 minutes). Your brief is the input — the better your notes, the better the output.",
  },
  {
    q: "Can I customize the look of the proposal?",
    a: "Yes. Add your logo, pick your colours, choose your font. Every proposal is on-brand, not Torvionyx-branded.",
  },
  {
    q: "What about pricing? How do I set line items, totals, VAT?",
    a: "Just mention it in your brief. Torvionyx pulls it into the pricing section. You can edit any numbers in the editor.",
  },
  {
    q: "Is this a legal contract?",
    a: "No. It's a proposal. For binding contracts, use a qualified e-signature tool.",
  },
  {
    q: "Can I export as PDF?",
    a: "Yes. One click, it exports to a beautiful PDF.",
  },
  {
    q: "Who owns the proposals I write?",
    a: "You do. 100%. Your proposals are yours.",
  },
  {
    q: "What if I hate the generated proposal?",
    a: 'Hit "Regenerate" and Torvionyx writes a new one. Or edit manually. It\'s your proposal.',
  },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-gray-100 dark:divide-[#374151]">
      {faqs.map(({ q, a }, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-6 text-left gap-6 group"
          >
            <span className="font-semibold text-[#111827] dark:text-[#F3F4F6] text-lg leading-snug">{q}</span>
            <span
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 dark:border-[#374151] text-gray-400 dark:text-gray-500 text-lg font-light transition-all duration-200 group-hover:border-[#0891B2] group-hover:text-[#0891B2]"
              style={{ transform: open === i ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
            >
              +
            </span>
          </button>
          <div
            style={{
              maxHeight: open === i ? "200px" : "0",
              overflow: "hidden",
              transition: "max-height 0.25s ease",
            }}
          >
            <p className="pb-6 text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
