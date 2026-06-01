// @ts-nocheck

import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import FAQAccordion from "@/components/landing/FAQAccordion";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F3F4F6]">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#1F2937]/95 backdrop-blur-sm border-b border-gray-100 dark:border-[#374151]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xl font-bold text-[#1E293B] dark:text-[#F3F4F6] tracking-tight">
            <TorvionyxLogo size={22} />
            Torvionyx
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="/sign-up"
              className="inline-flex items-center gap-1.5 bg-[#0891B2] text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#0e7490] transition-colors"
            >
              Start Free →
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-28 pb-24 px-6 bg-gradient-to-b from-[#f0f9ff] to-white dark:from-[#111827] dark:to-[#111827]">
        <div className="max-w-4xl mx-auto text-center">
          {/* Brand lockup */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <TorvionyxLogo size={48} aria-hidden={false} aria-label="Torvionyx" />
            <span className="text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
              Torvionyx
            </span>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#0891B2]/10 text-[#0891B2] text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-[#0891B2]/20">
            Now in beta · Free to join
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-bold text-[#111827] dark:text-[#F3F4F6] leading-[1.1] tracking-tight mb-6">
            Turn a Brief Into a{" "}
            <span className="text-[#0891B2]">Beautiful Proposal</span>
            {" "}in Under 2 Minutes
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Freelancers and consultants spend hours writing proposals. Torvionyx writes them for you in 60 seconds. You polish it. You send it. You win the work.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-[#0891B2] text-white font-bold px-9 py-4 rounded-xl text-lg hover:bg-[#0e7490] transition-colors shadow-lg shadow-[#0891B2]/25"
          >
            Start Free — No credit card
          </a>
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">Takes 2 minutes to set up.</p>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-24 px-6 bg-[#1E293B]">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#0891B2] font-semibold text-sm uppercase tracking-widest mb-4">The Problem</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8 tracking-tight leading-tight">
            The Proposal Trap
          </h2>
          <p className="text-lg text-slate-300 mb-6 leading-relaxed">
            You've just had a great call with a potential client. They're interested. But now you face 2–4 hours of proposal writing — researching scope, pricing, timelines, terms. By the time you send it, the momentum is gone. They've forgotten the call.
          </p>
          <p className="text-lg text-slate-300 mb-12 leading-relaxed">
            Worse: your competitor sends a proposal that looks more polished. You lose the deal.
          </p>
          <ul className="space-y-4">
            {[
              "Proposals take longer than the actual work",
              "You lose momentum after the call",
              "Your proposals compete on design, not substance",
              "Writing the same thing over and over is soul-crushing",
            ].map((item) => (
              <li key={item} className="flex items-start gap-4 text-slate-200 text-lg">
                <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-red-500/15 text-red-400 text-xs flex items-center justify-center font-bold">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Solution ── */}
      <section className="py-24 px-6 bg-white dark:bg-[#111827]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-[#0891B2] font-semibold text-sm uppercase tracking-widest mb-4">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight mb-4">
              Meet Torvionyx
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              An AI co-writer that handles the proposal grunt work.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                step: "01",
                title: "Paste Your Brief",
                body: "Paste your call notes, the scope, the client's goals — anything rough. 20 sentences. 100 words. Doesn't matter.",
              },
              {
                step: "02",
                title: "Hit Generate",
                body: "Torvionyx reads your brief, pulls in your brand settings, and writes a complete proposal. Beautiful. Professional. Yours. 60 seconds. One button. Done.",
              },
              {
                step: "03",
                title: "Light Edit & Send",
                body: "Edit for specifics — exact pricing, timeline, your personal touch. Then share the live link. No PDFs. No email attachments. A beautiful interactive page on any device.",
              },
              {
                step: "04",
                title: "Get Notified",
                body: "Your client opens it. You get an email. They accept. You get another email. Momentum stays alive.",
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="flex gap-5 p-8 rounded-2xl border border-gray-100 dark:border-[#374151] bg-gray-50 dark:bg-[#1F2937] hover:border-[#0891B2]/40 hover:bg-[#f0f9ff] dark:hover:bg-[#374151] transition-all duration-200"
              >
                <span className="text-4xl font-bold text-[#0891B2]/20 dark:text-[#0891B2]/40 leading-none flex-shrink-0 font-mono tabular-nums">
                  {step}
                </span>
                <div>
                  <h3 className="font-bold text-[#111827] dark:text-[#F3F4F6] text-xl mb-2">{title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-[#1F2937]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#0891B2] font-semibold text-sm uppercase tracking-widest mb-4">Why Torvionyx</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight mb-4">
              Built for Freelancers & Consultants
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Everything you need. Nothing you don't.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(
              [
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L4 14H12L10 22L21 10H13L13 2Z" fill="#0891B2"/>
                    </svg>
                  ),
                  title: "Speed",
                  body: "60 seconds from brief to proposal. No more 'I'll send that by end of day.' Send in the call.",
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C13.1 21 14 20.1 14 19C14 18.48 13.79 18 13.46 17.65C13.14 17.3 13 16.84 13 16.4C13 15.29 13.9 14.4 15 14.4H17C19.76 14.4 22 12.16 22 9.4C22 5.86 17.44 3 12 3Z" fill="#0891B2"/>
                      <circle cx="7.5" cy="12" r="1.5" fill="white"/>
                      <circle cx="9" cy="8.5" r="1.5" fill="white"/>
                      <circle cx="13" cy="7.5" r="1.5" fill="white"/>
                      <circle cx="16.5" cy="10.5" r="1.5" fill="white"/>
                    </svg>
                  ),
                  title: "Beautiful",
                  body: "Your proposals look like they came from a top agency. Client-branded. Interactive. Professional. No ugly templates.",
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L14.39 9.26L22 9.27L16 13.97L18.18 21.27L12 16.9L5.82 21.27L8 13.97L2 9.27L9.61 9.26L12 2Z" fill="#0891B2"/>
                    </svg>
                  ),
                  title: "Stand Out",
                  body: "Your competitors are sending Word docs. You're sending interactive, beautiful proposals. You win more.",
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="13" width="5" height="8" rx="1" fill="#0891B2"/>
                      <rect x="9.5" y="8" width="5" height="13" rx="1" fill="#0891B2"/>
                      <rect x="16" y="3" width="5" height="18" rx="1" fill="#0891B2"/>
                    </svg>
                  ),
                  title: "Smart",
                  body: "See who opened your proposal, how long they spent on pricing, whether they accepted or declined. Make smarter decisions next time.",
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="11" width="18" height="11" rx="2" fill="#0891B2"/>
                      <path fillRule="evenodd" d="M6 11V7Q6 2 12 2Q18 2 18 7V11ZM9 11V7Q9 5 12 5Q15 5 15 7V11Z" fill="#0891B2"/>
                      <circle cx="12" cy="16.5" r="2" fill="white"/>
                      <rect x="11" y="16.5" width="2" height="2.5" rx="1" fill="white"/>
                    </svg>
                  ),
                  title: "Yours",
                  body: "Your branding. Your voice. Your proposals. No software company in the middle.",
                },
                {
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#0891B2"/>
                      <path d="M12 6V7.5M12 16.5V18M9.5 9.5C9.5 8.4 10.62 7.5 12 7.5C13.38 7.5 14.5 8.4 14.5 9.5C14.5 10.6 13.38 11.5 12 11.5C10.62 11.5 9.5 12.4 9.5 13.5C9.5 14.6 10.62 15.5 12 15.5C13.38 15.5 14.5 14.6 14.5 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    </svg>
                  ),
                  title: "Affordable",
                  body: "Flat-rate pricing. No per-seat fees. No surprise overage charges. One price for all the proposals you can write.",
                },
              ] as { icon: React.ReactNode; title: string; body: string }[]
            ).map(({ icon, title, body }) => (
              <div
                key={title}
                className="bg-white dark:bg-[#111827] p-8 rounded-2xl border border-gray-100 dark:border-[#374151] hover:border-[#0891B2]/30 hover:shadow-md transition-all duration-200"
              >
                <div className="mb-5">{icon}</div>
                <h3 className="font-bold text-[#111827] dark:text-[#F3F4F6] text-xl mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-[15px]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-white dark:bg-[#111827]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#0891B2] font-semibold text-sm uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
              Common Questions
            </h2>
          </div>
          <FAQAccordion />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6 bg-[#1E293B]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
            Ready to Stop Writing Proposals?
          </h2>
          <p className="text-slate-300 text-xl mb-10 leading-relaxed">
            Join the beta. It&apos;s free. No credit card. Takes 2 minutes.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-[#0891B2] text-white font-bold px-9 py-4 rounded-xl text-lg hover:bg-[#0e7490] transition-colors shadow-lg shadow-[#0891B2]/30"
          >
            Start Free →
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-gray-100 dark:border-[#374151] bg-white dark:bg-[#111827]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 dark:text-gray-500">
          <span>© 2024 Torvionyx. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              Terms of Service
            </a>
            <a href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
