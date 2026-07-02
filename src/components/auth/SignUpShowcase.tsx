"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const STATS = [
  { label: "Revenue won", value: 482000, format: (n: number) => `£${Math.round(n / 1000)}k` },
  { label: "Win rate", value: 68, format: (n: number) => `${Math.round(n)}%` },
  { label: "More per project", value: 34, format: (n: number) => `+${Math.round(n)}%` },
];

const ACCEPTANCES = [
  { name: "Maya Chen", project: "Brand identity refresh", amount: "£4,800" },
  { name: "Jordan Avila", project: "Webflow site rebuild", amount: "£9,200" },
  { name: "Priya Nair", project: "Lifecycle email program", amount: "£3,400" },
  { name: "Sam Okafor", project: "Product launch video", amount: "£7,650" },
  { name: "Elena Petrova", project: "UX audit & roadmap", amount: "£5,100" },
  { name: "Marcus Reed", project: "Shopify migration", amount: "£11,300" },
];

const HEADLINE_WORDS = ["Win", "more", "work.", "Earn", "more."];

const BARS = [0.28, 0.34, 0.31, 0.42, 0.48, 0.45, 0.58, 0.62, 0.71, 0.78, 0.86, 1];

const LINE_PATH =
  "M0,118 C36,114 58,98 88,92 C118,86 138,98 168,78 C198,58 220,66 252,46 C284,26 322,30 360,12";
const AREA_PATH = `${LINE_PATH} L360,140 L0,140 Z`;

function AcceptanceCard({ name, project, amount }: (typeof ACCEPTANCES)[number]) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M2.5 7.5L5.5 10.5L11.5 3.5"
            stroke="#34D399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">
          {name} accepted <span className="font-normal text-white/60">·</span>{" "}
          <span className="font-medium text-white/80">{project}</span>
        </span>
        <span className="block text-xs text-white/50">just now</span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-[#E4C76B]">{amount}</span>
    </li>
  );
}

export function SignUpShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const line = lineRef.current;
    if (!root || !line) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lineLength = line.getTotalLength();
        gsap.set(line, { strokeDasharray: lineLength, strokeDashoffset: lineLength });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from("[data-word]", {
          yPercent: 110,
          duration: 0.8,
          stagger: 0.09,
        })
          .from("[data-sub]", { opacity: 0, y: 14, duration: 0.6 }, "-=0.35")
          .from(
            "[data-chart-card]",
            { opacity: 0, y: 24, scale: 0.98, duration: 0.7 },
            "-=0.25"
          )
          .from(
            "[data-bar]",
            { scaleY: 0, transformOrigin: "bottom", duration: 0.5, stagger: 0.035 },
            "-=0.3"
          )
          .to(line, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, "-=0.4")
          .from(areaRef.current, { opacity: 0, duration: 0.8 }, "-=0.7")
          .from("[data-ping]", { scale: 0, opacity: 0, duration: 0.4, ease: "back.out(2)" }, "-=0.3")
          .from("[data-feed]", { opacity: 0, y: 20, duration: 0.6 }, "-=0.6");

        gsap.utils.toArray<HTMLElement>("[data-counter]").forEach((el, i) => {
          const target = Number(el.dataset.counter);
          const format = STATS[i].format;
          const state = { n: 0 };
          tl.to(
            state,
            {
              n: target,
              duration: 1.6,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = format(state.n);
              },
            },
            1.1 + i * 0.12
          );
        });

        gsap.to("[data-ping-halo]", {
          scale: 2.4,
          opacity: 0,
          duration: 1.6,
          repeat: -1,
          ease: "power1.out",
          delay: 2.4,
        });

        gsap.to("[data-feed-track]", {
          yPercent: -50,
          duration: ACCEPTANCES.length * 3.2,
          repeat: -1,
          ease: "none",
          delay: 2.2,
        });

        gsap.to("[data-orb-1]", {
          x: 50,
          y: -40,
          duration: 9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to("[data-orb-2]", {
          x: -40,
          y: 50,
          duration: 11,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.utils.toArray<HTMLElement>("[data-counter]").forEach((el, i) => {
          el.textContent = STATS[i].format(STATS[i].value);
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex h-full flex-col justify-between overflow-hidden bg-[#0A1428] px-10 py-12 xl:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(circle, #C9A84C 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden
        data-orb-1
        className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[#0891B2]/20 blur-3xl"
      />
      <div
        aria-hidden
        data-orb-2
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#C9A84C]/15 blur-3xl"
      />

      <div className="relative">
        <h2 className="text-4xl font-bold leading-[1.08] tracking-tight text-white xl:text-5xl">
          {HEADLINE_WORDS.map((word, i) => (
            <span key={`${word}-${i}`} className="inline-flex overflow-hidden pb-1 align-bottom">
              <span data-word className="inline-block">
                {word === "more." && i === 4 ? <span className="text-[#E4C76B]">{word}</span> : word}
              </span>
              <span className="inline-block">&nbsp;</span>
            </span>
          ))}
        </h2>
        <p data-sub className="mt-4 max-w-md text-base leading-relaxed text-white/60">
          The revenue system for freelancers. Track every proposal, see what closes, and turn your
          pipeline into predictable income, backed by your own numbers.
        </p>
      </div>

      <div
        data-chart-card
        className="relative mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            Revenue won · last 12 months
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Live
          </span>
        </div>

        <svg viewBox="0 0 360 140" className="block w-full" aria-hidden>
          <defs>
            <linearGradient id="su-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
            </linearGradient>
          </defs>

          {BARS.map((h, i) => (
            <rect
              key={i}
              data-bar
              x={i * 30 + 7}
              y={140 - h * 96}
              width={16}
              height={h * 96}
              rx={3}
              fill="#0891B2"
              opacity={0.35}
            />
          ))}

          <path ref={areaRef} d={AREA_PATH} fill="url(#su-area)" />
          <path
            ref={lineRef}
            d={LINE_PATH}
            fill="none"
            stroke="#E4C76B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <g data-ping transform="translate(360, 12)">
            <circle data-ping-halo r="5" fill="#E4C76B" opacity="0.5" />
            <circle r="4" fill="#E4C76B" />
          </g>
        </svg>

        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dd
                data-counter={stat.value}
                className="text-2xl font-bold tabular-nums tracking-tight text-white xl:text-3xl"
              >
                0
              </dd>
              <dt className="mt-1 text-xs text-white/50">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div
        data-feed
        className="relative mt-8 h-44 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 14%, black 78%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 14%, black 78%, transparent)",
        }}
        aria-label="Recent proposal acceptances"
      >
        <ul data-feed-track className="space-y-3">
          {[...ACCEPTANCES, ...ACCEPTANCES].map((a, i) => (
            <AcceptanceCard key={`${a.name}-${i}`} {...a} />
          ))}
        </ul>
      </div>
    </div>
  );
}