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
import "./welcome.css";

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const RESEARCH_STATS = [
  { value: "23%", label: "Higher close rate", desc: "when a proposal lands within 24 hours vs 5+ days later.", callout: "Torvionyx makes \"within the hour\" realistic.", source: "Source: Proposify proposal data", statColor: "#0F1F3D" },
  { value: "41%", label: "More likely to be hired", desc: "when the proposal is tailored to the client, not generic.", callout: "Grounded in your brand voice and brief, every time.", source: "Source: freelance proposal industry analysis", statColor: "#DCAA33" },
  { value: "75%+", label: "Rejection rate", desc: "for generic, copy and paste proposals.", callout: "Personalised output is the default, not the effort.", source: "Source: freelance proposal industry analysis", statColor: "#F2C84E" },
  { value: "204 hrs", label: "Lost per year", desc: "per freelancer, to admin and paperwork, even with AI in the mix.", callout: "Reclaim the proposal slice of that.", source: "Source: Smallpdf Freelancer survey, 2026 (n=397)", statColor: "#DCAA33" },
  { value: "1 in 3", label: "Freelancers", desc: "have no way to know if a client even opened the proposal they sent.", callout: "Live link + view and accept notifications, built in.", source: "Source: Smallpdf Freelancer survey, 2026", statColor: "#0F1F3D" },
  { value: "84%", label: "Of freelancers", desc: "now use AI tools regularly, up from 41% in 2023.", callout: "You're not early. You're right on time.", source: "Source: Freelancer Kompass, 2026", statColor: "#F2C84E" },
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
  "Content generated from your brief",
  "Brand colours & logo applied automatically",
  "Switch style in one click",
  "Interactive live link + PDF export",
];

// Horizontal "book pages" stack — left/top/rotate/z-index fan the six
// templates out in order, front card (developer) sitting on top at the right.
const TEMPLATE_STACK = [
  { id: "monochrome", left: 0, top: 30, rotate: -8, z: 1 },
  { id: "warm_studio", left: 100, top: 15, rotate: -4, z: 2 },
  { id: "midnight", left: 200, top: 5, rotate: 0, z: 3 },
  { id: "corporate", left: 300, top: 15, rotate: 4, z: 4 },
  { id: "gradient", left: 380, top: 30, rotate: 8, z: 5 },
  { id: "developer", left: 460, top: 45, rotate: 12, z: 6 },
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
// Dust trail — mouse-follow particle field, canvas-based
// ---------------------------------------------------------------------------

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

function DustTrail() {
  const dustRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = dustRef.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return; // no particle motion for reduced-motion users

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: DustParticle[] = [];

    function resize() {
      canvas.width = section.clientWidth;
      canvas.height = section.clientHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function spawn(x: number, y: number) {
      for (let i = 0; i < 2; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.45,
          vy: -Math.random() * 0.65 - 0.1,
          life: 0,
          maxLife: 55 + Math.random() * 45,
          size: 1 + Math.random() * 2.2,
        });
      }
      if (particles.length > 160) particles = particles.slice(-160);
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      spawn(e.clientX - rect.left, e.clientY - rect.top);
    }
    section.addEventListener("pointermove", onPointerMove);

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter((p) => p.life < p.maxLife);
      for (const p of particles) {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        const t = p.life / p.maxLife;
        const alpha = (1 - t) * 0.5;
        ctx.beginPath();
        ctx.fillStyle = `rgba(242,200,78,${alpha.toFixed(3)})`;
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      section.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return <canvas ref={dustRef} className="hero-dust" aria-hidden="true" />;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WelcomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = heroRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-hero-reveal]",
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            delay: 0.1,
            onComplete: () => {
              document.querySelectorAll("[data-hero-reveal]").forEach((el) => el.classList.add("is-revealed"));
            },
          }
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-hero-reveal]", { opacity: 1 });
      });
    }, root);
    return () => ctx.revert();
  }, []);


  return (
    <ThemeProvider>
      <div style={{ background: "var(--tv-bg-page)", color: "var(--tv-text)", minHeight: "100vh" }}>
        <MarketingNav />

        {/* ── Hero ── */}
        <section ref={heroRef} className="relative overflow-hidden">
          <LightningField />
          <DustTrail />
          <div className="relative z-10 mx-auto px-6 pt-24 pb-20" style={{ maxWidth: 1120 }}>
            <div data-hero-reveal className="flex items-center gap-3 mb-7">
              <span aria-hidden="true" style={{ width: 28, height: 1.5, background: "#DCAA33", display: "inline-block" }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".24em",
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
                fontWeight: 700,
                fontSize: "clamp(38px, 6vw, 64px)",
                lineHeight: 1.02,
                letterSpacing: "-.03em",
                maxWidth: "15ch",
                color: "var(--tv-text)",
              }}
            >
              Send a proposal <span style={{ color: "#DCAA33" }}>before the lead goes cold.</span>
            </h1>

            <p
              data-hero-reveal
              className="mt-6"
              style={{ maxWidth: "52ch", fontSize: 18, lineHeight: 1.55, color: "var(--tv-text-dim)" }}
            >
              Torvionyx turns a rough brief or call notes into a beautiful, ready to send proposal in about two
              minutes. That's the difference between "I'll send it tomorrow" and closing the deal today.
            </p>

            <div data-hero-reveal className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
                Start free →
              </Link>
              <Link
                href="/sign-in"
                className="rounded-xl px-7 py-3.5 text-sm font-semibold transition-colors"
                style={{ border: "1.5px solid var(--tv-border)", color: "var(--tv-text)" }}
              >
                See the app →
              </Link>
            </div>

            <div
              data-hero-reveal
              className="mt-5"
              style={{
                fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                fontSize: 10.5,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--tv-text-faint)",
              }}
            >
              No card required · Built for UK freelancers
            </div>

            {/* Speed comparison card */}
            <div
              data-hero-reveal
              className="mt-14 grid grid-cols-[1fr_auto_1fr]"
              style={{ borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 80px -40px rgba(0,0,0,.55)" }}
            >
              <div style={{ background: "linear-gradient(150deg,#132543,#0F1F3D 60%,#16294a)", padding: "38px 34px" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: ".14em",
                    color: "rgba(250,242,232,.62)",
                  }}
                >
                  With Torvionyx
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(40px, 6vw, 60px)",
                    lineHeight: 1,
                    color: "#DCAA33",
                    marginTop: 14,
                  }}
                >
                  ~2 min
                </div>
                <p style={{ fontSize: 13.5, color: "rgba(250,242,232,.72)", marginTop: 14 }}>
                  Brief in → polished, branded proposal out, ready to send.
                </p>
              </div>

              <div style={{ background: "var(--tv-text)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: "#0A1322" }}>
                  vs
                </span>
              </div>

              <div style={{ background: "#0A1322", padding: "38px 34px" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: ".14em",
                    color: "rgba(250,242,232,.62)",
                  }}
                >
                  By hand
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(40px, 6vw, 60px)",
                    lineHeight: 1,
                    color: "#FFFFFF",
                    marginTop: 14,
                  }}
                >
                  2 to 3 hrs
                </div>
                <p style={{ fontSize: 13.5, color: "rgba(250,242,232,.72)", marginTop: 14 }}>
                  The time freelancers typically lose writing and formatting one proposal.
                </p>
              </div>
            </div>

            <p data-hero-reveal className="mt-4" style={{ fontSize: 12, color: "var(--tv-text-faint)" }}>
              <span style={{ color: "#DCAA33" }}>›</span> The two minute figure is a Torvionyx product measure; the
              2 to 3 hour comparison reflects commonly reported freelance proposal times.
            </p>
          </div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 48,
              background: "linear-gradient(to bottom, transparent, #FAF2E8)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
        </section>

        {/* ── Research stats ── */}
        <section style={{ background: "#FAF2E8" }}>
          <div className="mx-auto max-w-6xl px-6" style={{ paddingTop: 90, paddingBottom: 80 }}>
            <div className="text-center mb-10">
              <h2
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                  letterSpacing: "-.02em",
                  color: "#0A0A0A",
                }}
              >
                The numbers behind the pitch
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {RESEARCH_STATS.map((s) => (
                <div
                  key={s.label}
                  className="tv-hover-lift"
                  style={{ background: "var(--tv-bg-panel)", border: "1px solid var(--tv-border)", borderRadius: "var(--radius-xl)", padding: 5 }}
                >
                  <div style={{ background: "var(--tv-surface-panel, #FAFAF8)", borderRadius: "var(--radius-lg)", padding: "24px 22px 20px", height: "100%" }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 1, color: s.statColor }}>
                      {s.value}
                    </div>
                    <div className="mt-2" style={{ fontSize: 14, fontWeight: 500, color: "var(--tv-text)" }}>
                      {s.label}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "rgba(10,10,10,.6)" }}>
                      {s.desc}
                    </p>
                    <p style={{ color: "#DCAA33", fontWeight: 600, fontSize: 12, marginTop: 8 }}>
                      {s.callout}
                    </p>
                    <div
                      style={{
                        borderTop: "1px solid var(--tv-border-soft)",
                        marginTop: 12,
                        paddingTop: 10,
                        color: "var(--tv-text-faint)",
                        fontSize: 10.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span aria-hidden="true">↗</span>
                      {s.source}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs" style={{ color: "rgba(10,10,10,.5)" }}>
              Figures reflect general industry research and freelancer surveys on proposal and pitch performance.
            </p>
          </div>
          <div aria-hidden="true" style={{ height: 48, background: "linear-gradient(to bottom, transparent, #0F1F3D)" }} />
        </section>

        {/* ── Template previews — intro ── */}
        <section id="product" className="tv-anchor" style={{ background: "#0F1F3D" }}>
          <div className="mx-auto max-w-6xl px-6" style={{ paddingTop: 80, paddingBottom: 24 }}>
            <div className="text-center">
              <span
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
                style={{ border: "1px solid rgba(220,170,51,.35)", background: "rgba(220,170,51,.1)", color: "#DCAA33", fontSize: 12, fontWeight: 600 }}
              >
                ◆ One brief. Any style.
              </span>
              <h2
                className="mx-auto"
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(30px, 4.6vw, 50px)",
                  letterSpacing: "-.03em",
                  lineHeight: 1.08,
                  color: "#FAF2E8",
                  maxWidth: 760,
                }}
              >
                Not templates in different colours. Completely different proposals.
              </h2>
              <p className="mt-5 mx-auto" style={{ maxWidth: 620, fontSize: 15.5, lineHeight: 1.65, color: "rgba(250,242,232,.62)" }}>
                Write your brief once. Torvionyx fills a finished, on brand proposal (the words, the structure, the
                pricing), then lets you wear whichever style fits the client. Below is the same proposal, rendered
                six ways. Nothing here is placeholder lorem: it's real content, restyled.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                {FEATURE_PILLS.map((p) => (
                  <span
                    key={p}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                    style={{ border: "1px solid rgba(250,242,232,.15)", color: "rgba(250,242,232,.75)" }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div aria-hidden="true" style={{ height: 48, background: "linear-gradient(to bottom, transparent, #FAF2E8)" }} />
        </section>

        {/* ── Template previews — full renders ── */}
        <section style={{ background: "#FAF2E8" }}>
          <div className="mx-auto max-w-6xl px-6" style={{ paddingTop: 20, paddingBottom: 90 }}>
            <div className="tv-template-stack">
              {TEMPLATE_STACK.map((t) => {
                const Template = TEMPLATE_MAP[t.id];
                return (
                  <div
                    key={t.id}
                    className="tv-template-card-wrap"
                    style={{ left: t.left, top: t.top, transform: `rotate(${t.rotate}deg)`, zIndex: t.z }}
                  >
                    <Template />
                  </div>
                );
              })}
            </div>
            <p
              style={{
                textAlign: "center",
                marginTop: 24,
                fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: ".2em",
                color: "#DCAA33",
              }}
            >
              Same brief. Six different proposals.
            </p>
          </div>
          <div aria-hidden="true" style={{ height: 48, background: "linear-gradient(to bottom, transparent, var(--tv-bg-page))" }} />
        </section>

        {/* ── The proposal trap ── */}
        <section>
          <div className="mx-auto max-w-3xl px-6 py-20">
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
          </div>
          <div aria-hidden="true" style={{ height: 48, background: "linear-gradient(to bottom, transparent, #FAF2E8)" }} />
        </section>

        {/* ── Four screens. The whole business. ── */}
        <section style={{ background: "#FAF2E8" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 1120, paddingTop: 80, paddingBottom: 80 }}>
            <div className="text-center mb-12">
              <h2
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(32px, 4.8vw, 52px)",
                  letterSpacing: "-.02em",
                  color: "#0F1F3D",
                }}
              >
                Four screens. The whole business.
              </h2>
              <p style={{ marginTop: 10, fontSize: 18, color: "#DCAA33" }}>The pages you'll actually live in.</p>
            </div>

            {/* Screen 01 — New proposal */}
            <div style={{ background: "#F5F0E8", borderRadius: 16, padding: 28, marginBottom: 24, border: "1px solid rgba(19,37,67,.08)" }}>
              <div
                style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".18em", color: "#DCAA33" }}
              >
                SCREEN 01
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 24, color: "#0F1F3D", marginTop: 4 }}>
                New proposal
              </div>
              <p style={{ marginTop: 6, fontSize: 14, color: "#0F1F3D", opacity: 0.7 }}>
                Drop in the brief. We'll draft scope, pricing and terms.
              </p>

              <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid rgba(19,37,67,.1)", marginTop: 18 }}>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "#3a3a3a" }}>
                  <p>Client: Marlowe & Finch (independent bookshop, Bristol).</p>
                  <p style={{ marginTop: 8 }}>
                    Wants a Shopify storefront rebuild + local delivery booking. Budget hinted around £6–8k. Wants
                    it live before December.
                  </p>
                  <p style={{ marginTop: 8 }}>Two rounds of design review. They'll supply photography.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginTop: 16 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".14em", color: "#8a8a8a" }}>
                      SCOPE
                    </div>
                    <div style={{ fontSize: 13, color: "#0F1F3D", marginTop: 4 }}>6 sections · 4 deliverables · 2 review rounds</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".14em", color: "#8a8a8a" }}>
                      RECOMMENDED PRICE
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0F1F3D", marginTop: 4 }}>£7,400 + VAT</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Screen 02 — Proposals */}
            <div style={{ background: "#F5F0E8", borderRadius: 16, padding: 28, marginBottom: 24, border: "1px solid rgba(19,37,67,.08)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".18em", color: "#DCAA33" }}
                  >
                    SCREEN 02
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 24, color: "#0F1F3D", marginTop: 4 }}>
                    Proposals
                  </div>
                  <p style={{ marginTop: 6, fontSize: 14, color: "#0F1F3D", opacity: 0.7 }}>Every pitch, and exactly where it stands.</p>
                </div>
                <div
                  className="shrink-0"
                  style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 11, color: "#DCAA33", whiteSpace: "nowrap" }}
                >
                  12 OPEN · £31,900
                </div>
              </div>

              <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid rgba(19,37,67,.1)", marginTop: 18 }}>
                <div
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: "1fr auto auto auto",
                    gap: 16,
                    fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                    color: "#8a8a8a",
                    paddingBottom: 8,
                  }}
                >
                  <span>Client</span>
                  <span>Value</span>
                  <span>Sent</span>
                  <span>Status</span>
                </div>
                {[
                  { client: "Marlowe & Finch", value: "£7,400", sent: "23 April", status: "ACCEPTED", bg: "#dcfce7", fg: "#16a34a" },
                  { client: "Hartwell Studios", value: "£12,000", sent: "21 April", status: "VIEWED", bg: "#dbeafe", fg: "#2563eb" },
                  { client: "Northgate Coffee", value: "£3,200", sent: "19 April", status: "SENT", bg: "rgba(220,170,51,.15)", fg: "#DCAA33" },
                  { client: "Vale & Co Legal", value: "£9,300", sent: "—", status: "DRAFT", bg: "#f3f4f6", fg: "#6b7280" },
                ].map((row, i, arr) => (
                  <div
                    key={row.client}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: "1fr auto auto auto",
                      gap: 16,
                      padding: "12px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(19,37,67,.06)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 13.5, color: "#0F1F3D" }}>{row.client}</span>
                    <span style={{ fontSize: 13.5, color: "#0F1F3D" }}>{row.value}</span>
                    <span style={{ fontSize: 13.5, color: "#8a8a8a" }}>{row.sent}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: row.bg,
                        color: row.fg,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Screen 03 — Analytics */}
            <div style={{ background: "#F5F0E8", borderRadius: 16, padding: 28, marginBottom: 24, border: "1px solid rgba(19,37,67,.08)" }}>
              <div
                style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".18em", color: "#DCAA33" }}
              >
                SCREEN 03
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 24, color: "#0F1F3D", marginTop: 4 }}>
                Analytics
              </div>
              <p style={{ marginTop: 6, fontSize: 14, color: "#0F1F3D", opacity: 0.7 }}>Revenue you can see coming.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginTop: 18 }}>
                {[
                  { label: "WIN RATE", value: "41%", trend: "↑ +6 pts this quarter", trendColor: "#16a34a" },
                  { label: "AVG. PROPOSAL VALUE", value: "£6,850", trend: "↑ +£420", trendColor: "#16a34a" },
                  { label: "TIME TO SEND", value: "1m 52s", trend: "from 3h 10m", trendColor: "#8a8a8a" },
                ].map((box) => (
                  <div key={box.label} style={{ background: "#FFFFFF", borderRadius: 10, padding: 16, border: "1px solid rgba(19,37,67,.08)" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".14em", color: "#8a8a8a" }}>
                      {box.label}
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 28, color: "#0F1F3D", marginTop: 4 }}>
                      {box.value}
                    </div>
                    <div style={{ fontSize: 11, color: box.trendColor, marginTop: 4 }}>{box.trend}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#FAF2E8", borderRadius: 10, padding: 16, border: "1px solid rgba(19,37,67,.08)", marginTop: 12 }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: ".14em",
                    color: "#8a8a8a",
                    marginBottom: 12,
                  }}
                >
                  ACCEPTED VALUE · LAST 6 MONTHS
                </div>
                <svg viewBox="0 0 600 90" width="100%" height="90" preserveAspectRatio="none" aria-hidden="true">
                  <polyline points="0,80 100,72 200,60 300,50 400,35 500,20 600,10" stroke="#DCAA33" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>

            {/* Screen 04 — Branding */}
            <div style={{ background: "#F5F0E8", borderRadius: 16, padding: 28, marginBottom: 0, border: "1px solid rgba(19,37,67,.08)" }}>
              <div
                style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".18em", color: "#DCAA33" }}
              >
                SCREEN 04
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 24, color: "#0F1F3D", marginTop: 4 }}>
                Branding
              </div>
              <p style={{ marginTop: 6, fontSize: 14, color: "#0F1F3D", opacity: 0.7 }}>
                Set it once. Every proposal goes out looking like you.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 18 }}>
                <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid rgba(19,37,67,.08)" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".14em", color: "#8a8a8a" }}>
                    ACCENT COLOUR
                  </div>
                  <div style={{ marginTop: 12 }}>
                    {[
                      { color: "#DCAA33", selected: true },
                      { color: "#3DB9C9", selected: false },
                      { color: "#5FD08A", selected: false },
                      { color: "#0F1F3D", selected: false },
                    ].map((swatch, i) => (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: swatch.color,
                          marginRight: 8,
                          boxShadow: swatch.selected ? "0 0 0 2px #FFFFFF, 0 0 0 4px #DCAA33" : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid rgba(19,37,67,.08)" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".14em", color: "#8a8a8a" }}>
                    PROPOSAL TYPEFACE
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 26, color: "#0F1F3D", marginTop: 8 }}>
                    Playfair Display
                  </div>
                  <div style={{ fontSize: 12, color: "#8a8a8a", marginTop: 4 }}>6 options · applied to client-facing pages</div>
                </div>
              </div>

              <div
                style={{
                  fontFamily: "'JetBrains Mono',ui-monospace,monospace",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: ".18em",
                  color: "#DCAA33",
                  marginTop: 20,
                  marginBottom: 12,
                }}
              >
                CLIENT SEES
              </div>
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  padding: 20,
                  border: "1px solid rgba(19,37,67,.08)",
                  boxShadow: "0 8px 24px -12px rgba(19,37,67,.15)",
                }}
              >
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: "#0F1F3D" }}>
                  Website rebuild — Marlowe & Finch
                </div>
                <div style={{ width: 48, height: 2, background: "#DCAA33", margin: "6px 0 10px" }} />
                <p style={{ fontSize: 13, color: "#6b7280" }}>
                  Prepared by your studio · Valid for 14 days · Accept online with one click.
                </p>
                <div
                  className="inline-block"
                  style={{ background: "#DCAA33", color: "#0A1322", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 8, marginTop: 16 }}
                >
                  Accept proposal
                </div>
              </div>
            </div>
          </div>
          <div aria-hidden="true" style={{ height: 48, background: "linear-gradient(to bottom, transparent, var(--tv-bg-page))" }} />
        </section>

        {/* ── After you hit send ── */}
        <section>
          <div className="mx-auto max-w-5xl px-6 py-20">
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
          </div>
          <div aria-hidden="true" style={{ height: 48, background: "linear-gradient(to bottom, transparent, #FAF2E8)" }} />
        </section>

        {/* ── Why freelancers win ── */}
        <section id="why" className="tv-anchor" style={{ background: "#FAF2E8" }}>
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-10">
              <h2
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                  letterSpacing: "-.02em",
                  color: "#0A0A0A",
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
                  style={{ border: "1px solid rgba(19,37,67,.1)", background: "rgba(19,37,67,.06)" }}
                >
                  <div
                    style={{
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontWeight: 600,
                      fontSize: 17,
                      color: "#0A0A0A",
                      marginBottom: 6,
                    }}
                  >
                    {w.title}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(10,10,10,.6)" }}>
                    {w.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div aria-hidden="true" style={{ height: 48, background: "linear-gradient(to bottom, transparent, var(--tv-bg-page))" }} />
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
// Template previews — six full proposal renders (clipped to their top
// 280px inside .tv-template-card-wrap for the overlapping stack)
// ---------------------------------------------------------------------------

function MonochromeTemplate() {
  return (
    <div style={{ background: "#FAF9F6", color: "#141414", fontFamily: "'Space Grotesk',sans-serif" }}>
      <div style={{ padding: "60px 50px 40px", borderBottom: "1.5px solid #141414" }}>
        <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".34em", opacity: 0.6 }}>
          PROPOSAL · 2026
        </div>
        <h3 style={{ marginTop: 18, fontSize: "clamp(42px, 6vw, 74px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.02 }}>
          Brand identity & Shopify website
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ marginTop: 40 }}>
          {[
            ["Prepared for", "Northlane Coffee Co."],
            ["From", "Ava Bennett, Studio Ava"],
            ["Investment", "£4,200"],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", opacity: 0.5 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "38px 50px 0" }}>
        <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".2em", opacity: 0.5 }}>
          01 — The opportunity
        </div>
        <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.65, maxWidth: 620 }}>
          Northlane has outgrown a packaging led identity. As you move from three cafés into ecommerce, the brand
          needs to feel as considered on screen as it does in the room, and turn browsers into subscribers.
        </p>
      </div>

      <div style={{ padding: "38px 50px 0" }}>
        <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".2em", opacity: 0.5 }}>
          02 — Scope
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5" style={{ marginTop: 16 }}>
          {[
            ["A", "Brand identity system", "Logo, colour, type, and a usage guide your team can actually follow."],
            ["B", "Shopify storefront", "Custom theme design and build, from homepage to checkout."],
            ["C", "Launch asset kit", "Social templates, packaging refresh, and email header set."],
            ["D", "Two rounds of revisions", "Structured feedback rounds built into every phase."],
          ].map(([letter, title, desc]) => (
            <div key={letter} className="flex gap-4">
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.4, minWidth: 18 }}>{letter}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 13, opacity: 0.6, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "38px 50px 44px" }}>
        <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".2em", opacity: 0.5 }}>
          03 — Investment
        </div>
        <div style={{ marginTop: 16 }}>
          {[
            ["Brand identity", "£1,600"],
            ["Shopify design & build", "£2,100"],
            ["Launch asset kit", "£500"],
          ].map(([label, price]) => (
            <div
              key={label}
              className="flex items-center justify-between"
              style={{ padding: "12px 0", borderBottom: "1px solid rgba(20,20,20,.1)", fontSize: 14 }}
            >
              <span>{label}</span>
              <span style={{ fontWeight: 600 }}>{price}</span>
            </div>
          ))}
          <div className="flex items-center justify-between" style={{ padding: "16px 0 0", fontSize: 18, fontWeight: 700 }}>
            <span>Total</span>
            <span>£4,200</span>
          </div>
        </div>
      </div>

      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: "#141414", color: "#FAF9F6", padding: "26px 50px" }}
      >
        <p style={{ fontSize: 13.5, opacity: 0.85 }}>Ready when you are. 50% to start, 50% on launch · 5 week delivery.</p>
        <div className="shrink-0 rounded-full text-xs font-semibold" style={{ border: "1px solid rgba(250,249,246,.4)", padding: "10px 20px" }}>
          Accept proposal →
        </div>
      </div>
    </div>
  );
}

function WarmStudioTemplate() {
  return (
    <div style={{ background: "#FDFBF7", color: "#2E2422" }}>
      <div style={{ background: "linear-gradient(160deg,#F6ECE1,#FDFBF7)", padding: "56px 50px 44px" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 17, color: "#C4623F" }}>
          A proposal, made with care
        </div>
        <h3
          style={{
            marginTop: 12,
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: "clamp(34px, 5vw, 54px)",
            letterSpacing: "-.01em",
            lineHeight: 1.08,
          }}
        >
          Brand identity & Shopify website
        </h3>
        <div className="inline-block" style={{ marginTop: 26, background: "#FFFFFF", border: "1px solid rgba(46,36,34,.12)", borderRadius: 14, padding: "14px 20px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", opacity: 0.55 }}>Prepared for</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>Maya Chen, Northlane Coffee Co.</div>
        </div>
      </div>

      <div style={{ padding: "44px 50px" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 21 }}>What I'll make for you</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ marginTop: 22 }}>
          {[
            ["1", "Brand identity system", "Logo, colour palette, type, and a guide that's actually usable day to day."],
            ["2", "Shopify storefront", "A custom-built storefront that feels like the cafés, online."],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ background: "#FFFFFF", border: "1px solid rgba(46,36,34,.1)", borderRadius: 16, padding: 22 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#C4623F",
                  color: "#FDFBF7",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {num}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 17, marginTop: 12 }}>{title}</div>
              <p style={{ fontSize: 13.5, opacity: 0.7, marginTop: 6, lineHeight: 1.55 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: "0 50px 50px", background: "#2E2422", color: "#FDFBF7", borderRadius: 18, padding: "30px 32px" }}>
        {[
          ["Brand identity", "£1,600"],
          ["Shopify design & build", "£2,100"],
          ["Launch asset kit", "£500"],
        ].map(([label, price]) => (
          <div
            key={label}
            className="flex items-center justify-between"
            style={{ padding: "10px 0", borderBottom: "1px solid rgba(250,251,247,.12)", fontSize: 14, opacity: 0.85 }}
          >
            <span>{label}</span>
            <span>{price}</span>
          </div>
        ))}
        <div className="flex items-center justify-between" style={{ paddingTop: 18 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 16 }}>Total investment</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: "#E9A671" }}>£4,200</span>
        </div>
        <div className="inline-block mt-6 rounded-full text-xs font-semibold" style={{ background: "#C4623F", color: "#FDFBF7", padding: "12px 24px" }}>
          Accept & book my start date →
        </div>
      </div>
    </div>
  );
}

function MidnightTemplate() {
  return (
    <div style={{ background: "#07101E", color: "#FAF2E8" }}>
      <div style={{ padding: "56px 50px 42px", borderBottom: "1px solid rgba(220,170,51,.18)" }}>
        <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".3em", color: "#DCAA33" }}>
          PRIVATE PROPOSAL · 2026
        </div>
        <h3
          style={{
            marginTop: 20,
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: "clamp(36px, 5.4vw, 58px)",
            letterSpacing: "-.01em",
            lineHeight: 1.08,
          }}
        >
          Brand identity & <span style={{ fontStyle: "italic", color: "#DCAA33" }}>Shopify</span> website
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ marginTop: 34 }}>
          {[
            ["Prepared for", "Northlane Coffee Co."],
            ["From", "Studio Ava"],
            ["Investment", "£4,200"],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", opacity: 0.5 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "40px 50px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            ["Identity system", "Logo, colour, type, and a guide built to feel considered wherever it lands."],
            ["Shopify storefront", "Bespoke theme design and build, from homepage through to checkout."],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: "rgba(250,242,232,.04)", border: "1px solid rgba(220,170,51,.16)", borderRadius: 16, padding: 22 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18 }}>{title}</div>
              <p style={{ fontSize: 13.5, opacity: 0.65, marginTop: 8, lineHeight: 1.55 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 34 }}>
          {[
            ["Brand identity", "£1,600"],
            ["Shopify design & build", "£2,100"],
            ["Launch asset kit", "£500"],
          ].map(([label, price]) => (
            <div
              key={label}
              className="flex items-center justify-between"
              style={{ padding: "12px 0", borderBottom: "1px solid rgba(220,170,51,.14)", fontSize: 14, opacity: 0.8 }}
            >
              <span>{label}</span>
              <span>{price}</span>
            </div>
          ))}
          <div className="flex items-center justify-between" style={{ paddingTop: 18 }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>Total</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#DCAA33" }}>£4,200</span>
          </div>
        </div>

        <div
          className="inline-block mt-8 rounded-full text-xs font-semibold"
          style={{ background: "linear-gradient(135deg,#F2C84E,#DCAA33)", color: "#07101E", padding: "13px 26px" }}
        >
          Accept this proposal →
        </div>
      </div>
    </div>
  );
}

function CorporateTemplate() {
  return (
    <div style={{ background: "#FFFFFF", color: "#1C2E4A" }}>
      <div style={{ background: "#1C2E4A", color: "#FFFFFF", padding: "48px 50px" }}>
        <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".2em", color: "rgba(255,255,255,.55)" }}>
          PROJECT PROPOSAL
        </div>
        <h3 style={{ marginTop: 14, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(30px, 4.4vw, 44px)", letterSpacing: "-.02em" }}>
          Brand identity & Shopify website
        </h3>
        <div style={{ marginTop: 18, fontSize: 13.5, color: "rgba(255,255,255,.7)" }}>
          Prepared for Northlane Coffee Co. · Studio Ava
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
        <div style={{ borderRight: "1px solid rgba(28,46,74,.1)", padding: "36px 28px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", color: "#2563EB", fontWeight: 700, marginBottom: 14 }}>
            Contents
          </div>
          {["01 Overview", "02 Scope", "03 Investment"].map((item) => (
            <div key={item} style={{ fontSize: 13.5, padding: "8px 0", color: "#1C2E4A", opacity: 0.75 }}>
              {item}
            </div>
          ))}
        </div>

        <div style={{ padding: "36px 42px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: ".1em" }}>01 — Overview</div>
          <p style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.6, opacity: 0.85, maxWidth: 480 }}>
            Northlane has outgrown a packaging led identity and needs a brand and storefront that scale from three
            cafés into a national ecommerce audience.
          </p>

          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 30 }}>
            02 — Scope
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 12 }}>
            {["Brand identity system", "Shopify storefront design & build", "Launch asset kit", "Handover & training"].map((item) => (
              <div key={item} style={{ fontSize: 13.5, padding: "10px 0", borderBottom: "1px solid rgba(28,46,74,.08)" }}>
                {item}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 30 }}>
            03 — Investment
          </div>
          <div style={{ marginTop: 12 }}>
            {[
              ["Brand identity", "£1,600"],
              ["Shopify design & build", "£2,100"],
              ["Launch asset kit", "£500"],
            ].map(([label, price]) => (
              <div key={label} className="flex items-center justify-between" style={{ padding: "9px 0", fontSize: 13.5, opacity: 0.85 }}>
                <span>{label}</span>
                <span style={{ fontWeight: 600 }}>{price}</span>
              </div>
            ))}
            <div className="flex items-center justify-between" style={{ paddingTop: 14, borderTop: "1px solid rgba(28,46,74,.12)", marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 700, color: "#2563EB", fontSize: 18 }}>£4,200</span>
            </div>
          </div>

          <div className="inline-block mt-8 rounded-lg text-xs font-semibold" style={{ background: "#2563EB", color: "#FFFFFF", padding: "12px 24px" }}>
            Approve & sign →
          </div>
        </div>
      </div>
    </div>
  );
}

function GradientTemplate() {
  return (
    <div style={{ background: "#FFFFFF" }}>
      <div style={{ background: "linear-gradient(135deg,#7C3AED,#FF6F61)", padding: "60px 50px", color: "#FFFFFF" }}>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(34px, 5vw, 54px)", letterSpacing: "-.02em", lineHeight: 1.05 }}>
          Brand identity & Shopify website
        </h3>
        <p style={{ marginTop: 14, fontSize: 14.5, opacity: 0.9 }}>For Northlane Coffee Co. · by Ava Bennett</p>
      </div>

      <div style={{ padding: "40px 50px" }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ["Identity system", "#7C3AED"],
            ["Shopify storefront", "#8B5CF6"],
            ["Art direction", "#EC4899"],
            ["Launch kit", "#FF6F61"],
          ].map(([title, color]) => (
            <div key={title} style={{ background: color, color: "#FFFFFF", borderRadius: 14, padding: "18px 16px", minHeight: 90 }}>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{title}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, background: "#1A1225", color: "#FFFFFF", borderRadius: 18, padding: "28px 30px" }}>
          {[
            ["Brand identity", "£1,600"],
            ["Shopify design & build", "£2,100"],
            ["Launch asset kit", "£500"],
          ].map(([label, price]) => (
            <div
              key={label}
              className="flex items-center justify-between"
              style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.1)", fontSize: 14, opacity: 0.85 }}
            >
              <span>{label}</span>
              <span>{price}</span>
            </div>
          ))}
          <div className="flex items-center justify-between" style={{ paddingTop: 16 }}>
            <span style={{ fontSize: 15 }}>Total</span>
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                background: "linear-gradient(135deg,#FF6F61,#EC4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              £4,200
            </span>
          </div>
        </div>

        <div
          className="inline-block mt-8 rounded-full text-xs font-semibold"
          style={{ background: "linear-gradient(135deg,#7C3AED,#FF6F61)", color: "#FFFFFF", padding: "13px 26px" }}
        >
          Let's go, accept →
        </div>
      </div>
    </div>
  );
}

function DeveloperTemplate() {
  return (
    <div style={{ background: "#FAFAF9", color: "#141414" }}>
      <div style={{ padding: "44px 50px 30px", borderBottom: "1px solid rgba(20,20,20,.1)" }}>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#16A34A" }}>// proposal.md · 2026</div>
        <h3
          style={{
            marginTop: 14,
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700,
            fontSize: "clamp(30px, 4.4vw, 46px)",
            letterSpacing: "-.02em",
          }}
        >
          Brand identity & Shopify website
        </h3>
        <div style={{ marginTop: 16, fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.9, opacity: 0.75 }}>
          <div>&gt; client&nbsp;&nbsp;&nbsp;Northlane Coffee Co.</div>
          <div>&gt; from&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Studio Ava</div>
          <div>&gt; total&nbsp;&nbsp;&nbsp;&nbsp;£4,200</div>
        </div>
      </div>

      <div style={{ padding: "34px 50px" }}>
        <div style={{ fontFamily: "monospace", fontSize: 12.5, color: "#16A34A" }}>## the_opportunity</div>
        <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, opacity: 0.85, maxWidth: 560 }}>
          Northlane has outgrown a packaging led identity. Moving from three cafés into ecommerce means the brand
          needs to feel as considered on screen as it does in the room.
        </p>

        <div style={{ fontFamily: "monospace", fontSize: 12.5, color: "#16A34A", marginTop: 26 }}>## scope</div>
        <div style={{ marginTop: 10 }}>
          {["Brand identity system", "Shopify storefront design & build", "Launch asset kit", "Handover & training"].map((item) => (
            <div key={item} style={{ fontFamily: "monospace", fontSize: 13, padding: "5px 0", opacity: 0.85 }}>
              [✓] {item}
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "monospace", fontSize: 12.5, color: "#16A34A", marginTop: 26 }}>## investment</div>
        <div style={{ marginTop: 10, fontFamily: "monospace" }}>
          {[
            ["brand_identity", "£1,600"],
            ["shopify_build", "£2,100"],
            ["launch_kit", "£500"],
          ].map(([label, price]) => (
            <div key={label} className="flex items-center justify-between" style={{ padding: "6px 0", fontSize: 13, opacity: 0.8 }}>
              <span>{label}</span>
              <span>{price}</span>
            </div>
          ))}
          <div
            className="flex items-center justify-between"
            style={{ paddingTop: 12, borderTop: "1px solid rgba(20,20,20,.15)", marginTop: 6, fontWeight: 700 }}
          >
            <span>total</span>
            <span>£4,200</span>
          </div>
        </div>

        <div className="inline-block mt-8 rounded text-xs font-semibold" style={{ fontFamily: "monospace", background: "#141414", color: "#FAFAF9", padding: "12px 22px" }}>
          $ accept_proposal
        </div>
      </div>
    </div>
  );
}

const TEMPLATE_MAP: Record<string, () => JSX.Element> = {
  monochrome: MonochromeTemplate,
  warm_studio: WarmStudioTemplate,
  midnight: MidnightTemplate,
  corporate: CorporateTemplate,
  gradient: GradientTemplate,
  developer: DeveloperTemplate,
};
