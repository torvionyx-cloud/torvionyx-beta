// @ts-nocheck

"use client";

/**
 * app/welcome/page.tsx
 *
 * Main marketing landing page. All CTAs point at /sign-in — there's no
 * inline auth here, this page's only job is to get someone to click through.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";
import { MarketingNav } from "@/components/landing/MarketingNav";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { MarketingFAQ } from "@/components/landing/MarketingFAQ";
import { getTheme, PROPOSAL_TEMPLATES, type ProposalTemplateId } from "@/lib/themes";
import "./welcome.css";

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const RESEARCH_STATS = [
  { value: "23%", label: "Higher close rate", desc: "for well-branded, professional proposals vs. plain text" },
  { value: "41%", label: "More likely to be hired", desc: "when a proposal directly addresses the client's stated problem" },
  { value: "75%+", label: "Rejection rate", desc: "for generic, templated proposals with no personalisation" },
  { value: "204 hrs", label: "Lost per year", desc: "the average freelancer spends writing proposals annually" },
  { value: "1 in 3", label: "Freelancers", desc: "can't tell if a client has even opened their proposal" },
  { value: "84%", label: "Use AI tools", desc: "already use AI somewhere in their freelance workflow" },
];

const AFTER_SEND_STATS = [
  { value: "Live", label: "View tracking", desc: "Know the moment your proposal is opened" },
  { value: "Section", label: "-level signals", desc: "See which parts they actually read" },
  { value: "1-click", label: "Follow-up prompts", desc: "A nudge when a proposal goes quiet" },
  { value: "Instant", label: "Accept notifications", desc: "An email the second they say yes" },
];

const TRAP_POINTS = [
  "Staring at a blank document, unsure where to even start",
  "Digging through old proposals to copy-paste something close enough",
  "Guessing at pricing because working it out properly takes too long",
  "By the time it's sent, the client's already talking to someone else",
];

const FEATURE_PILLS = [
  "7 built-in styles",
  "Matches your brand automatically",
  "Switch anytime, no rebuild",
  "Zero design skills required",
];

const STYLE_PREVIEWS: { id: Exclude<ProposalTemplateId, "custom">; name: string }[] = [
  { id: "monochrome", name: "Monochrome Editorial" },
  { id: "warm_studio", name: "Warm Studio" },
  { id: "midnight", name: "Midnight Premium" },
  { id: "corporate", name: "Corporate Confident" },
  { id: "gradient", name: "Gradient Creative" },
  { id: "developer", name: "Developer Technical" },
];

const TOUR_TABS = [
  {
    id: "new",
    label: "New proposal",
    heading: "Paste a brief. Get a first draft in under a minute.",
    body: "Drop in your call notes or a rough scope — Torvionyx writes the whole thing: intro, deliverables, timeline, and pricing that matches what you quoted.",
    bullets: ["Reads your brief like a person would", "Picks the right sections for the job", "Suggests pricing if you didn't give one"],
  },
  {
    id: "proposals",
    label: "Proposals",
    heading: "Every proposal, one list, always up to date.",
    body: "See what's a draft, what's been sent, what's been viewed, and what's been accepted — without digging through email threads.",
    bullets: ["Status at a glance", "Sorted by what needs attention", "One click back into the editor"],
  },
  {
    id: "analytics",
    label: "Analytics",
    heading: "Revenue and acceptance trends, not vanity metrics.",
    body: "Accept rate, average deal size, and time-to-accept — the numbers that tell you if your pricing and pitch are actually working.",
    bullets: ["Acceptance funnel", "Revenue by month", "Average time to close"],
  },
  {
    id: "branding",
    label: "Branding",
    heading: "Set it once. Every proposal matches.",
    body: "Your logo, colours, font, and tone of voice — baked into every proposal Torvionyx writes, automatically.",
    bullets: ["Logo and colour", "Tone of voice for the AI", "7 presentation styles"],
  },
] as const;

const WHY_WINS = [
  { title: "Send in minutes", desc: "Stop losing momentum while a great call goes cold in your drafts folder." },
  { title: "Always on-brand", desc: "Every proposal looks like it came from a real studio — because it did: yours." },
  { title: "Know when it lands", desc: "Live tracking tells you the moment a client opens it, so you know when to follow up." },
  { title: "Punch above your size", desc: "A one-person operation that looks, sounds, and closes like a full agency." },
];

const FAQ_ITEMS = [
  { q: "How good is the AI? Will I need to rewrite everything?", a: "Good enough that most proposals need only light editing — five to fifteen minutes. Your brief is the input: the better your notes, the better the output." },
  { q: "Can I customise how my proposals look?", a: "Yes. Add your logo, pick your colours and font, or choose from seven built-in presentation styles. Every proposal is on-brand, never Torvionyx-branded." },
  { q: "How does pricing work?", a: "A free plan to try it properly, then simple monthly plans as you send more. No contracts, cancel any time. Full breakdown on the pricing page." },
  { q: "Is this a legal contract?", a: "No — it's a proposal with a lightweight acceptance record, not a regulated e-signature. For binding contracts, use a dedicated e-signature tool." },
  { q: "Can I export as PDF?", a: "Yes, one click from the editor or the live proposal link." },
  { q: "Who owns the proposals I create?", a: "You do — 100%. Your content, your client relationships, your business." },
  { q: "What if I don't like what the AI wrote?", a: "Hit regenerate for a fresh pass, rewrite a single section, or edit it by hand. It's your proposal, start to finish." },
];

// ---------------------------------------------------------------------------
// Lightning field — procedural midpoint-displacement bolts
// ---------------------------------------------------------------------------

type Point = [number, number];

function midpointDisplace(x1: number, y1: number, x2: number, y2: number, displace: number, depth: number): Point[] {
  if (depth <= 0 || displace < 0.6) return [[x1, y1], [x2, y2]];
  const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
  const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * displace * 0.35;
  const left = midpointDisplace(x1, y1, midX, midY, displace * 0.55, depth - 1);
  const right = midpointDisplace(midX, midY, x2, y2, displace * 0.55, depth - 1);
  return [...left.slice(0, -1), ...right];
}

interface Bolt {
  spine: Point[];
  forks: Point[][];
}

function makeBolt(): Bolt {
  const startX = 20 + Math.random() * 260;
  const endX = startX + (Math.random() - 0.5) * 70;
  const spine = midpointDisplace(startX, -6, endX, 106, 46, 6);

  const forks: Point[][] = [];
  const forkRoll = Math.random();
  const forkCount = forkRoll > 0.75 ? 2 : forkRoll > 0.35 ? 1 : 0;
  for (let f = 0; f < forkCount; f++) {
    const idx = Math.floor(spine.length * (0.25 + Math.random() * 0.4));
    const [fx, fy] = spine[idx];
    const dir = Math.random() > 0.5 ? 1 : -1;
    const forkEndX = fx + dir * (30 + Math.random() * 55);
    const forkEndY = fy + 12 + Math.random() * 24;
    forks.push(midpointDisplace(fx, fy, forkEndX, forkEndY, 28, 4));
  }

  return { spine, forks };
}

function pathFromPoints(points: Point[]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

function LightningField() {
  const [entries, setEntries] = useState<{ bolt: Bolt; delay: number; duration: number }[]>([]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);

    const count = mq.matches ? 2 : 6;
    setEntries(
      Array.from({ length: count }, (_, i) => ({
        bolt: makeBolt(),
        delay: i * 1.35 + Math.random() * 2.2,
        duration: 4.5 + Math.random() * 3.5,
      }))
    );

    return () => mq.removeEventListener?.("change", update);
  }, []);

  return (
    <svg className="hero-lightning" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="tv-bolt-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {entries.map(({ bolt, delay, duration }, i) => (
        <g
          key={i}
          className={reduced ? "bolt-group bolt-static" : "bolt-group"}
          style={reduced ? undefined : { animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
          filter="url(#tv-bolt-glow)"
        >
          <path d={pathFromPoints(bolt.spine)} className="bolt-path bolt-spine" />
          {bolt.forks.map((fork, fi) => (
            <path key={fi} d={pathFromPoints(fork)} className="bolt-path bolt-fork" />
          ))}
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WelcomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<(typeof TOUR_TABS)[number]["id"]>("new");

  useLayoutEffect(() => {
    const root = heroRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-hero-reveal]",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", delay: 0.1, clearProps: "opacity,transform" }
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-hero-reveal]", { opacity: 1 });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const tab = TOUR_TABS.find((t) => t.id === activeTab) ?? TOUR_TABS[0];

  return (
    <ThemeProvider>
      <div style={{ background: "var(--tv-bg-page)", color: "var(--tv-text)", minHeight: "100vh" }}>
        <MarketingNav />

        {/* ── Hero ── */}
        <section ref={heroRef} className="relative overflow-hidden">
          <LightningField />
          <div className="relative z-10 mx-auto max-w-4xl px-6 pt-24 pb-28 text-center">
            <div
              data-hero-reveal
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full"
              style={{ border: "1px solid var(--tv-border)", background: "var(--tv-panel-accent)" }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "#DCAA33",
                }}
              >
                Proposal OS for freelancers
              </span>
            </div>

            <h1
              data-hero-reveal
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(2.2rem, 5.2vw, 3.6rem)",
                lineHeight: 1.05,
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              Turn a rough brief into a proposal that <span style={{ color: "#DCAA33" }}>closes</span>.
            </h1>

            <p
              data-hero-reveal
              className="mt-6 mx-auto"
              style={{ maxWidth: 560, fontSize: 17, lineHeight: 1.6, color: "var(--tv-text-dim)" }}
            >
              Torvionyx writes it, brands it, and tells you the moment it's read — so you can send while the lead
              is still hot.
            </p>

            <div data-hero-reveal className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-in"
                className="rounded-xl px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-px"
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  background: "linear-gradient(135deg,#F2C84E,#DCAA33)",
                  color: "#0A1322",
                  boxShadow: "0 14px 30px -12px rgba(220,170,51,.7)",
                }}
              >
                Start free
              </Link>
              <a
                href="#product"
                className="rounded-xl px-7 py-3.5 text-sm font-semibold transition-colors"
                style={{ border: "1.5px solid var(--tv-border)", color: "var(--tv-text)" }}
              >
                See how it works
              </a>
            </div>
          </div>
        </section>

        {/* ── Send before it goes cold ── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-10">
            <h2
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              Send a proposal before the lead goes cold
            </h2>
            <p className="mt-3 mx-auto" style={{ maxWidth: 520, fontSize: 15, color: "var(--tv-text-faint)" }}>
              The faster you send, the more likely you win. Torvionyx collapses hours of writing into minutes.
            </p>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 overflow-hidden rounded-2xl"
            style={{ border: "1px solid var(--tv-border)" }}
          >
            <div className="px-8 py-12 text-center" style={{ background: "var(--tv-panel-accent)" }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                  fontSize: 11,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--tv-text-faint)",
                  marginBottom: 12,
                }}
              >
                Without Torvionyx
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700,
                  fontSize: 44,
                  color: "var(--tv-text-faint)",
                }}
              >
                2–3 hrs
              </div>
              <p className="mt-3 text-sm" style={{ color: "var(--tv-text-faint)" }}>
                Writing, formatting, and chasing your own pricing
              </p>
            </div>
            <div
              className="px-8 py-12 text-center"
              style={{ background: "rgba(220,170,51,.08)", borderLeft: "1px solid var(--tv-border)" }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                  fontSize: 11,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "#DCAA33",
                  marginBottom: 12,
                }}
              >
                With Torvionyx
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 44, color: "var(--tv-text)" }}>
                ~2 min
              </div>
              <p className="mt-3 text-sm" style={{ color: "var(--tv-text-dim)" }}>
                Brief in, branded proposal out
              </p>
            </div>
          </div>
        </section>

        {/* ── Research stats ── */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-10">
            <h2
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              The numbers behind the pitch
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESEARCH_STATS.map((s) => (
              <div
                key={s.label}
                className="tv-hover-lift rounded-2xl p-6"
                style={{ border: "1px solid var(--tv-border)", background: "var(--tv-bg-panel)" }}
              >
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 30, color: "#DCAA33" }}>
                  {s.value}
                </div>
                <div className="mt-1.5 font-semibold text-sm" style={{ color: "var(--tv-text)" }}>
                  {s.label}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--tv-text-faint)" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs" style={{ color: "var(--tv-text-faint)" }}>
            Figures reflect general industry research and freelancer surveys on proposal and pitch performance.
          </p>
        </section>

        {/* ── One brief. Any style. ── */}
        <section id="product" className="tv-anchor mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-8">
            <h2
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              One brief. Any style.
            </h2>
            <p className="mt-3 mx-auto" style={{ maxWidth: 520, fontSize: 15, color: "var(--tv-text-faint)" }}>
              The same brief, seven different looks. Pick a style, or let it default to your own brand.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {FEATURE_PILLS.map((p) => (
              <span
                key={p}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                style={{ border: "1px solid var(--tv-border)", color: "var(--tv-text-dim)" }}
              >
                {p}
              </span>
            ))}
          </div>

          <div className="tv-slideshow">
            {STYLE_PREVIEWS.map((s) => {
              const theme = getTheme(s.id);
              return (
                <div key={s.id} className="tv-slide-card">
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${theme.cardBorder}`, background: theme.cardBg, boxShadow: "var(--tv-shadow)" }}
                  >
                    <div style={{ background: theme.heroBg, height: 70, padding: "12px 14px" }}>
                      <div style={{ width: 26, height: 5, borderRadius: 3, background: theme.heroText, opacity: 0.9 }} />
                      <div style={{ width: 46, height: 4, borderRadius: 3, background: theme.heroText, opacity: 0.5, marginTop: 8 }} />
                    </div>
                    <div className="p-3.5 space-y-2">
                      <div style={{ width: "70%", height: 5, borderRadius: 3, background: theme.textMuted, opacity: 0.5 }} />
                      <div style={{ width: "45%", height: 5, borderRadius: 3, background: theme.textMuted, opacity: 0.5 }} />
                      <div className="flex items-center justify-between pt-1.5">
                        <div style={{ width: 30, height: 8, borderRadius: 2, background: theme.textFaint, opacity: 0.5 }} />
                        <div style={{ width: 34, height: 14, borderRadius: 4, background: theme.accent }} />
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-2.5 text-xs font-medium text-center"
                    style={{ color: "var(--tv-text-dim)", fontFamily: "'Space Grotesk',sans-serif" }}
                  >
                    {s.name}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── The proposal trap ── */}
        <section className="mx-auto max-w-3xl px-6 py-20">
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{ border: "1px solid var(--tv-border)", background: "var(--tv-bg-panel)" }}
          >
            <h2
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.5rem, 2.8vw, 1.9rem)",
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              The proposal trap
            </h2>
            <p className="mt-3 text-base" style={{ color: "var(--tv-text-dim)" }}>
              You've just had a great call. Now you face 2–4 hours of writing.
            </p>
            <ul className="mt-6 space-y-3">
              {TRAP_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-1 shrink-0" style={{ color: "#F2635C", fontSize: 13 }}>
                    ✕
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "var(--tv-text-faint)" }}>
                    {p}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-7 font-medium" style={{ color: "#DCAA33" }}>
              Torvionyx does the writing. You do the closing.
            </p>
          </div>
        </section>

        {/* ── Product tour ── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-8">
            <h2
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              A quick look around
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {TOUR_TABS.map((t) => {
              const isActive = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    border: `1px solid ${isActive ? "#DCAA33" : "var(--tv-border)"}`,
                    background: isActive ? "rgba(220,170,51,.12)" : "transparent",
                    color: isActive ? "#DCAA33" : "var(--tv-text-dim)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center rounded-2xl p-8 sm:p-10"
            style={{ border: "1px solid var(--tv-border)", background: "var(--tv-bg-panel)" }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: "-.015em",
                  color: "var(--tv-text)",
                }}
              >
                {tab.heading}
              </h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--tv-text-faint)" }}>
                {tab.body}
              </p>
              <ul className="mt-5 space-y-2.5">
                {tab.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#DCAA33" }} />
                    <span className="text-sm" style={{ color: "var(--tv-text-dim)" }}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <TourMock tabId={tab.id} />
          </div>
        </section>

        {/* ── After you hit send ── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-10">
            <h2
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              After you hit send
            </h2>
            <p className="mt-3 mx-auto" style={{ maxWidth: 480, fontSize: 15, color: "var(--tv-text-faint)" }}>
              Sending is only half the job. Torvionyx keeps working after the proposal leaves your outbox.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AFTER_SEND_STATS.map((s) => (
              <div
                key={s.label}
                className="tv-hover-lift rounded-2xl p-6 text-center"
                style={{ border: "1px solid var(--tv-border)", background: "var(--tv-bg-panel)" }}
              >
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: "#DCAA33" }}>
                  {s.value}
                </div>
                <div className="mt-1 font-semibold text-sm" style={{ color: "var(--tv-text)" }}>
                  {s.label}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--tv-text-faint)" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why freelancers win ── */}
        <section id="why" className="tv-anchor mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-10">
            <h2
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              Why freelancers win with Torvionyx
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHY_WINS.map((w) => (
              <div
                key={w.title}
                className="rounded-2xl p-6"
                style={{ border: "1px solid var(--tv-border)", background: "var(--tv-bg-panel)" }}
              >
                <div
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: 600,
                    fontSize: 17,
                    color: "var(--tv-text)",
                    marginBottom: 6,
                  }}
                >
                  {w.title}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--tv-text-faint)" }}>
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="tv-anchor mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-6">
            <h2
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                letterSpacing: "-.02em",
                color: "var(--tv-text)",
              }}
            >
              Questions, answered
            </h2>
          </div>
          <MarketingFAQ items={FAQ_ITEMS} />
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 600,
              fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)",
              letterSpacing: "-.02em",
              lineHeight: 1.15,
              color: "var(--tv-text)",
            }}
          >
            Your next proposal could be out before the kettle boils
          </h2>
          <p className="mt-4" style={{ color: "var(--tv-text-faint)", fontSize: 15 }}>
            Free to start. No card required.
          </p>
          <Link
            href="/sign-in"
            className="inline-block mt-8 rounded-xl px-8 py-4 text-sm font-semibold transition-all hover:-translate-y-px"
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              background: "linear-gradient(135deg,#F2C84E,#DCAA33)",
              color: "#0A1322",
              boxShadow: "0 14px 30px -12px rgba(220,170,51,.7)",
            }}
          >
            Start free
          </Link>
        </section>

        <MarketingFooter />
      </div>
    </ThemeProvider>
  );
}

// ---------------------------------------------------------------------------
// Product tour mock panels — abstract CSS-only illustrations, not screenshots
// ---------------------------------------------------------------------------

function TourMock({ tabId }: { tabId: string }) {
  const panelStyle = {
    border: "1px solid var(--tv-border)",
    background: "var(--tv-bg-page)",
    borderRadius: 14,
    padding: 18,
  } as const;

  if (tabId === "proposals") {
    return (
      <div style={panelStyle}>
        {["Acme Co.", "Northwind Studio", "Halcyon & Co."].map((name, i) => (
          <div
            key={name}
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: i < 2 ? "1px solid var(--tv-border-soft)" : "none" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--tv-text)" }}>{name}</span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: i === 0 ? "#5FD08A" : i === 1 ? "#F2A93B" : "#3DB9C9",
                background: i === 0 ? "rgba(95,208,138,.14)" : i === 1 ? "rgba(242,169,59,.14)" : "rgba(61,185,201,.14)",
              }}
            >
              {i === 0 ? "Accepted" : i === 1 ? "Viewed" : "Sent"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (tabId === "analytics") {
    const bars = [40, 65, 50, 80, 60, 95];
    return (
      <div style={panelStyle}>
        <div className="flex items-end gap-2" style={{ height: 100 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 4, background: "#DCAA33", opacity: 0.4 + i * 0.1 }} />
          ))}
        </div>
        <div className="mt-4 flex justify-between text-xs" style={{ color: "var(--tv-text-faint)" }}>
          <span>Accept rate</span>
          <span style={{ color: "#DCAA33", fontWeight: 700 }}>73%</span>
        </div>
      </div>
    );
  }

  if (tabId === "branding") {
    return (
      <div style={panelStyle}>
        <div className="flex gap-2.5 mb-4">
          {["#DCAA33", "#3DB9C9", "#7C6BE8", "#52C285"].map((c) => (
            <div key={c} style={{ width: 30, height: 30, borderRadius: 8, background: c }} />
          ))}
        </div>
        <div style={{ width: "60%", height: 6, borderRadius: 3, background: "var(--tv-border)" }} />
        <div style={{ width: "40%", height: 6, borderRadius: 3, background: "var(--tv-border)", marginTop: 8 }} />
      </div>
    );
  }

  // "new" — default
  return (
    <div style={panelStyle}>
      <div style={{ width: "80%", height: 8, borderRadius: 4, background: "var(--tv-border)" }} />
      <div style={{ width: "95%", height: 42, borderRadius: 8, background: "var(--tv-panel-accent)", marginTop: 12 }} />
      <div className="flex justify-end mt-4">
        <div
          className="px-4 py-2 rounded-lg text-xs font-semibold"
          style={{ background: "linear-gradient(135deg,#F2C84E,#DCAA33)", color: "#0A1322" }}
        >
          Generate →
        </div>
      </div>
    </div>
  );
}
