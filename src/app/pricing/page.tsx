// @ts-nocheck

"use client";

/**
 * app/pricing/page.tsx
 *
 * Pricing page. Shares MarketingNav/MarketingFooter/MarketingFAQ with
 * /welcome so both marketing pages stay visually and structurally in sync.
 * All CTAs point at /sign-in — no inline checkout, payments aren't live yet
 * (see CLAUDE.md — "What NOT to build yet").
 */

import Link from "next/link";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { MarketingNav } from "@/components/landing/MarketingNav";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { MarketingFAQ } from "@/components/landing/MarketingFAQ";
import "./pricing.css";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "£0",
    period: "/mo",
    tagline: "Try it properly before you commit",
    popular: false,
    features: ["3 proposals / month", "5 scores / month", "Basic branding", "Torvionyx watermark", "Shareable link"],
  },
  {
    id: "rise",
    name: "Rise",
    price: "£12",
    period: "/mo",
    tagline: "For solo operators sending a handful a month",
    popular: false,
    features: [
      "30 proposals / month",
      "60 scores / month",
      "Full branding",
      "No watermark",
      "Basic analytics",
      "PDF export",
    ],
  },
  {
    id: "strike",
    name: "Strike",
    price: "£16",
    period: "/mo",
    tagline: "For freelancers sending proposals every week",
    popular: true,
    features: [
      "45 proposals / month",
      "100 scores / month",
      "Everything in Rise, plus:",
      "Full analytics",
      "Email notifications",
      "Template library",
    ],
  },
  {
    id: "reign",
    name: "Reign",
    price: "£20",
    period: "/mo",
    tagline: "For established studios who want it all",
    popular: false,
    features: [
      "60 proposals / month",
      "Unlimited scores",
      "Everything in Strike, plus:",
      "Advanced branding",
      "Priority support",
    ],
  },
];

const PRICING_FAQ = [
  {
    q: "Can I change plans later?",
    a: "Yes — upgrade or downgrade any time from your account settings. Changes apply from your next billing cycle, and you keep everything you've already created either way.",
  },
  {
    q: "What happens if I hit my monthly limit?",
    a: "You'll be prompted to upgrade before generating or scoring any more proposals that month. Proposals you've already sent, shared, or had accepted are never affected.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is the trial — three real proposals and five scores every month, no card required and no expiry. Upgrade whenever you need more.",
  },
];

export default function PricingPage() {
  return (
    <ThemeProvider>
      <div style={{ background: "var(--tv-bg-page)", color: "var(--tv-text)", minHeight: "100vh" }}>
        <MarketingNav active="pricing" />

        {/* ── Heading ── */}
        <section className="mx-auto max-w-3xl px-6 pt-20 pb-10 text-center">
          <h1
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 600,
              fontSize: "clamp(2rem, 4.2vw, 2.8rem)",
              letterSpacing: "-.02em",
              color: "var(--tv-text)",
            }}
          >
            Simple, honest pricing
          </h1>
          <p className="mt-4" style={{ fontSize: 15.5, color: "var(--tv-text-faint)" }}>
            Start free. Upgrade only when you're sending enough proposals to need to.
          </p>
        </section>

        {/* ── Plan cards ── */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`tv-plan-card rounded-2xl p-6 flex flex-col ${plan.popular ? "tv-plan-card--popular" : ""}`}
                style={{
                  border: plan.popular ? "2px solid #DCAA33" : "1px solid var(--tv-border)",
                  background: plan.popular ? "rgba(220,170,51,.05)" : "var(--tv-bg-panel)",
                  boxShadow: plan.popular ? "0 20px 40px -24px rgba(220,170,51,.45)" : "var(--tv-shadow)",
                }}
              >
                {plan.popular && (
                  <span
                    className="tv-plan-badge px-3 py-1 rounded-full"
                    style={{
                      fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "#0A1322",
                      background: "linear-gradient(135deg,#F2C84E,#DCAA33)",
                    }}
                  >
                    Most popular
                  </span>
                )}

                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: "var(--tv-text)" }}>
                  {plan.name}
                </div>
                <p className="mt-1 text-xs leading-snug" style={{ color: "var(--tv-text-faint)", minHeight: 32 }}>
                  {plan.tagline}
                </p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 34, color: "var(--tv-text)" }}>
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: "var(--tv-text-faint)" }}>
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => {
                    const isDivider = f.startsWith("Everything in");
                    return (
                      <li
                        key={f}
                        className={`text-sm flex items-start gap-2 ${isDivider ? "pt-1.5 mt-1.5" : ""}`}
                        style={{
                          color: isDivider ? "var(--tv-text)" : "var(--tv-text-dim)",
                          fontWeight: isDivider ? 600 : 400,
                          borderTop: isDivider ? "1px solid var(--tv-border-soft)" : "none",
                        }}
                      >
                        {!isDivider && (
                          <span className="mt-0.5 shrink-0" style={{ color: "#DCAA33" }}>
                            ✓
                          </span>
                        )}
                        {f}
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href="/sign-in"
                  className="mt-6 block text-center rounded-lg py-2.5 text-sm font-semibold transition-all hover:-translate-y-px"
                  style={
                    plan.popular
                      ? {
                          fontFamily: "'Space Grotesk',sans-serif",
                          background: "linear-gradient(135deg,#F2C84E,#DCAA33)",
                          color: "#0A1322",
                        }
                      : {
                          fontFamily: "'Space Grotesk',sans-serif",
                          border: "1.5px solid var(--tv-border)",
                          color: "var(--tv-text)",
                        }
                  }
                >
                  {plan.id === "free" ? "Start free" : `Choose ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs" style={{ color: "var(--tv-text-faint)" }}>
            All prices exclude VAT. Billed monthly. No contracts.
          </p>
        </section>

        {/* ── FAQ ── */}
        <section className="mx-auto max-w-3xl px-6 py-16">
          <div className="text-center mb-6">
            <h2
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.5rem, 2.8vw, 1.9rem)",
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              Pricing questions
            </h2>
          </div>
          <MarketingFAQ items={PRICING_FAQ} />
        </section>

        <MarketingFooter />
      </div>
    </ThemeProvider>
  );
}
