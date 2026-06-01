"use client";

/**
 * app/p/[token]/AcceptSection.tsx
 *
 * Client component — the accept/CTA section on the public live link.
 * Renders the proposal's CTA block and an acceptance form.
 * Calls POST /api/p/[token]/accept.
 *
 * Disclosed as a lightweight acceptance, not a regulated e-signature.
 */

import { useState } from "react";
import type { Proposal, BrandSettings } from "@/types/database";

interface Props {
  proposal: Proposal;
  brand: BrandSettings | null;
  primaryColor: string;
}

type AcceptState = "idle" | "open" | "submitting" | "accepted" | "error";

export default function AcceptSection({ proposal, brand, primaryColor }: Props) {
  const [state, setState] = useState<AcceptState>(
    proposal.status === "accepted" ? "accepted" : "idle"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Find the CTA block to get the button label
  const ctaBlock = proposal.content.blocks.find((b) => b.type === "cta");
  const ctaLabel = ctaBlock && ctaBlock.type === "cta" ? ctaBlock.label : "Accept this proposal";

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setError(null);

    try {
      const res = await fetch(`/api/p/${proposal.share_token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signer_name: name.trim(), signer_email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.accepted) {
        setState("accepted");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setState("open");
      }
    } catch {
      setError("Connection error. Please try again.");
      setState("open");
    }
  }

  if (state === "accepted") {
    return (
      <div className="mt-12 rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h2 className="text-xl font-semibold text-green-900">Accepted!</h2>
        <p className="mt-2 text-sm text-green-700">
          Your acceptance has been recorded. {brand?.company_name || "The team"} will be in touch shortly.
        </p>
      </div>
    );
  }

  if (state === "open" || state === "submitting" || state === "error") {
    return (
      <div className="mt-12">
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: primaryColor + "0d", borderColor: primaryColor + "33", border: "2px solid" }}
        >
          <h2
            className="text-xl font-semibold text-center mb-2"
            style={{ color: primaryColor }}
          >
            {ctaLabel}
          </h2>
          <p className="text-sm text-neutral-500 text-center mb-6">
            Enter your details to record your acceptance.
          </p>

          <form onSubmit={handleAccept} className="max-w-sm mx-auto space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-400 transition"
                disabled={state === "submitting"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                maxLength={200}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-400 transition"
                disabled={state === "submitting"}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={state === "submitting" || !name.trim() || !email.trim()}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {state === "submitting" ? "Recording acceptance…" : "Confirm acceptance"}
            </button>

            <p className="text-xs text-neutral-400 text-center">
              By confirming, you acknowledge this is a lightweight acceptance record, not a regulated e-signature.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Idle state — show the main CTA button
  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <button
        onClick={() => setState("open")}
        className="rounded-xl px-10 py-4 text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: primaryColor }}
      >
        {ctaLabel}
      </button>
      <p className="text-xs text-neutral-400">
        Questions? Reply to this email or get in touch directly.
      </p>
    </div>
  );
}
