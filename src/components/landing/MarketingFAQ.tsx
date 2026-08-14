// @ts-nocheck

"use client";

import { useState } from "react";

interface FAQItem {
  q: string;
  a: string;
}

interface MarketingFAQProps {
  items: FAQItem[];
}

export function MarketingFAQ({ items }: MarketingFAQProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={{ borderTop: "1px solid var(--tv-border-soft)" }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-6 py-5 text-left"
            >
              <span
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 600,
                  fontSize: 15.5,
                  color: "var(--tv-text)",
                }}
              >
                {q}
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 flex items-center justify-center rounded-full border transition-transform duration-200"
                style={{
                  width: 26,
                  height: 26,
                  borderColor: "var(--tv-border)",
                  color: "var(--tv-text-faint)",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                }}
              >
                +
              </span>
            </button>
            <div style={{ maxHeight: isOpen ? 260 : 0, overflow: "hidden", transition: "max-height .25s ease" }}>
              <p
                className="pb-5 text-sm leading-relaxed"
                style={{ color: "var(--tv-text-faint)", maxWidth: 640 }}
              >
                {a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
