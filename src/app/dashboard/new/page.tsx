"use client";

/**
 * app/dashboard/new/page.tsx
 *
 * Proposal intake form — the starting point of the golden path.
 * A client component: handles form state, submission, and progress feedback.
 * Calls POST /api/generate; redirects to the editor on success.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";

const PROPOSAL_TYPES = [
  {
    value: "service_proposal",
    label: "Service Proposal",
    description: "Best for service-based work. Covers scope, timeline, and pricing.",
  },
  {
    value: "project_quote",
    label: "Project Quote",
    description: "For one-off projects. Clear deliverables and a quoted total.",
  },
  {
    value: "retainer_proposal",
    label: "Retainer Proposal",
    description: "For ongoing monthly engagements. Fixed fee and monthly deliverables.",
  },
  {
    value: "consultancy_proposal",
    label: "Consultancy Proposal",
    description: "For advisory or strategy work. Methodology and day rates.",
  },
  {
    value: "photography_proposal",
    label: "Photography Proposal",
    description: "For shoots and creative projects. Includes usage rights and delivery.",
  },
] as const;

const CURRENCIES = [
  { value: "GBP", label: "£ GBP" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
] as const;

const TONES = [
  { value: "concise", label: "Concise", description: "Short, punchy, high signal-to-noise" },
  { value: "balanced", label: "Balanced", description: "Professional length, well-rounded" },
  { value: "detailed", label: "Detailed", description: "In-depth, for complex engagements" },
] as const;

const MAX_BRIEF = 4000;

const PROGRESS_MESSAGES = [
  "Torvionyx is reading your brief…",
  "Structuring the proposal…",
  "Writing each section…",
  "Polishing the final draft…",
];

export default function NewProposalPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    proposal_type: "service_proposal" as typeof PROPOSAL_TYPES[number]["value"],
    brief: "",
    budget_hint: "",
    currency: "GBP" as "GBP" | "USD" | "EUR",
    tone_preference: "balanced" as "concise" | "balanced" | "detailed",
  });

  const [error, setError] = useState<string | null>(null);
  const [progressIdx, setProgressIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const briefLength = form.brief.length;
  const isValid = form.client_name.trim().length > 0 && briefLength >= 20 && briefLength <= MAX_BRIEF;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isGenerating) return;

    setError(null);
    setIsGenerating(true);
    setProgressIdx(0);

    // Cycle through progress messages while waiting
    const interval = setInterval(() => {
      setProgressIdx((i) => Math.min(i + 1, PROGRESS_MESSAGES.length - 1));
    }, 8000);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name.trim(),
          client_email: form.client_email.trim() || undefined,
          proposal_type: form.proposal_type,
          brief: form.brief.trim(),
          budget_hint: form.budget_hint.trim() || undefined,
          currency: form.currency,
          tone_preference: form.tone_preference,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || "Rate limit reached. Please try again shortly.");
        } else {
          setError(data.error || "Generation failed. Please try again.");
        }
        return;
      }

      // Success — navigate to the editor
      startTransition(() => {
        router.push(`/dashboard/${data.proposal_id}/edit`);
      });
    } catch {
      setError("Connection error. Please check your internet and try again.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          ← Back to proposals
        </Link>
        <div className="mt-4 flex items-center gap-2.5">
          <TorvionyxLogo size={20} />
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-[#F3F4F6]">New proposal</h1>
        </div>
        <p className="mt-1 text-neutral-500 dark:text-gray-400">
          Describe your project and Torvionyx writes a polished proposal in under a minute.
        </p>
      </div>

      {isGenerating ? (
        <GeneratingState progressIdx={progressIdx} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client details */}
          <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-6 space-y-4">
            <h2 className="font-medium text-neutral-900 dark:text-[#F3F4F6]">Client details</h2>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-1.5">
                Client / company name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="e.g. Acme Corporation"
                className="w-full rounded-lg border border-neutral-300 dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2.5 text-sm text-neutral-900 dark:text-[#F3F4F6] placeholder-neutral-400 dark:placeholder-gray-600 focus:border-neutral-900 dark:focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-[#0891B2]/20 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-1.5">
                Client email{" "}
                <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                maxLength={200}
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                placeholder="client@example.com"
                className="w-full rounded-lg border border-neutral-300 dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2.5 text-sm text-neutral-900 dark:text-[#F3F4F6] placeholder-neutral-400 dark:placeholder-gray-600 focus:border-neutral-900 dark:focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-[#0891B2]/20 transition"
              />
            </div>
          </div>

          {/* Proposal type */}
          <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-6 space-y-3">
            <h2 className="font-medium text-neutral-900 dark:text-[#F3F4F6]">Proposal type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROPOSAL_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, proposal_type: type.value })}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    form.proposal_type === type.value
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white hover:border-neutral-400"
                  }`}
                >
                  <div className={`text-sm font-medium ${form.proposal_type === type.value ? "text-white" : "text-neutral-800"}`}>
                    {type.label}
                  </div>
                  <div className={`text-xs mt-0.5 leading-snug ${form.proposal_type === type.value ? "text-white/60" : "text-neutral-400"}`}>
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Brief */}
          <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-6 space-y-3">
            <div>
              <h2 className="font-medium text-neutral-900 dark:text-[#F3F4F6]">Your brief</h2>
              <p className="text-sm text-neutral-500 dark:text-gray-400 mt-0.5">
                Paste your call notes, email thread, or rough scope. Torvionyx reads it and writes the full proposal — the more you share, the better it gets.
              </p>
            </div>
            <div>
              <textarea
                required
                minLength={20}
                maxLength={MAX_BRIEF}
                value={form.brief}
                onChange={(e) => setForm({ ...form, brief: e.target.value })}
                rows={10}
                placeholder={`e.g. Just off a call with Sarah at Acme Co. They need a full rebrand — logo, typography, colour palette, and brand guidelines. 6-week deadline before their product launch. They want modern but approachable; said they like Notion and Linear's aesthetic. Current brand feels dated. Budget roughly £8–12k, decision made by Sarah and their CEO. Add a timeline and a clear deliverables breakdown.`}
                className="w-full rounded-lg border border-neutral-300 dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2.5 text-sm text-neutral-900 dark:text-[#F3F4F6] placeholder-neutral-400 dark:placeholder-gray-600 focus:border-neutral-900 dark:focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-[#0891B2]/20 transition resize-none"
              />
              <div className="mt-1.5 flex justify-between text-xs text-neutral-400">
                <span>
                  {briefLength < 20 && briefLength > 0
                    ? `${20 - briefLength} more characters needed`
                    : ""}
                </span>
                <span className={briefLength > MAX_BRIEF * 0.9 ? "text-amber-500" : ""}>
                  {briefLength.toLocaleString()} / {MAX_BRIEF.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing + tone */}
          <div className="rounded-xl border border-neutral-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] p-6 space-y-4">
            <h2 className="font-medium text-neutral-900 dark:text-[#F3F4F6]">Pricing & style</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-1.5">
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value as typeof form.currency })
                  }
                  className="w-full rounded-lg border border-neutral-300 dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2.5 text-sm text-neutral-900 dark:text-[#F3F4F6] focus:border-neutral-900 dark:focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-[#0891B2]/20 transition"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-1.5">
                  Budget hint{" "}
                  <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={form.budget_hint}
                  onChange={(e) => setForm({ ...form, budget_hint: e.target.value })}
                  placeholder="e.g. £8–12k or suggest pricing"
                  className="w-full rounded-lg border border-neutral-300 dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2.5 text-sm text-neutral-900 dark:text-[#F3F4F6] placeholder-neutral-400 dark:placeholder-gray-600 focus:border-neutral-900 dark:focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-[#0891B2]/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Writing style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, tone_preference: t.value })
                    }
                    className={`rounded-lg border px-3 py-2.5 text-left transition ${
                      form.tone_preference === t.value
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${form.tone_preference === t.value ? "text-white" : "text-neutral-900"}`}
                    >
                      {t.label}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${form.tone_preference === t.value ? "text-white/70" : "text-neutral-400"}`}
                    >
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 pb-12">
            <Link
              href="/dashboard"
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!isValid || isGenerating || isPending}
              className="rounded-lg bg-[#0891B2] px-6 py-3 text-sm font-medium text-white hover:bg-[#0e7490] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              Generate with Torvionyx →
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function GeneratingState({ progressIdx }: { progressIdx: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-neutral-100 border-t-[#0891B2] animate-spin" />
      </div>
      <p className="mt-8 text-base font-medium text-neutral-900 transition-all">
        {PROGRESS_MESSAGES[progressIdx]}
      </p>
      <p className="mt-2 text-sm text-neutral-400">
        Torvionyx usually takes 15–45 seconds. Don&apos;t close this tab.
      </p>
    </div>
  );
}
