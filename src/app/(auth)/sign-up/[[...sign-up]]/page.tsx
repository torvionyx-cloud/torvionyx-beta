"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import gsap from "gsap";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";
import { SignUpShowcase } from "@/components/auth/SignUpShowcase";

export default function SignUpPage() {
  const formPanelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = formPanelRef.current;
    if (!panel) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-form-reveal]",
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.15,
            clearProps: "opacity,transform",
          }
        );
      });
    }, panel);

    return () => ctx.revert();
  }, []);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="hidden lg:block">
        <SignUpShowcase />
      </div>

      <div
        ref={formPanelRef}
        className="flex min-w-0 flex-col items-center justify-center bg-[#F5F0E8] px-4 py-10 sm:px-8"
      >
        <div className="w-full max-w-sm">
          <div data-form-reveal className="mb-8 flex items-center gap-2.5">
            <TorvionyxLogo size={30} aria-hidden={false} aria-label="Torvionyx" />
            <span className="text-xl font-bold tracking-tight text-[#0F1F3D]">Torvionyx</span>
          </div>

          <div data-form-reveal className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[#0F1F3D]">
              Create your account
            </h1>
            <p className="mt-2 text-base text-[#4A5568]">
              Win more work and earn more. Start free in seconds.
            </p>
          </div>

          <div>
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              appearance={{
                elements: {
                  rootBox: "w-full max-w-full",
                  cardBox: "w-full max-w-full shadow-none",
                  card: "w-full max-w-full rounded-2xl border border-[#0F1F3D]/10 bg-white p-6 shadow-[0_8px_30px_rgba(15,31,61,0.06)] sm:p-8",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "!opacity-100 !visible border-2 !border-[#0F1F3D]/25 !bg-white !text-[#0F1F3D] font-semibold",
                  socialButtonsBlockButtonText: "!opacity-100 !text-[#0F1F3D] font-semibold",
                  socialButtonsProviderIcon: "!opacity-100",
                  formFieldLabel: "text-sm font-medium text-[#0F1F3D]",
                  formFieldInput:
                    "rounded-lg border-2 border-[#0F1F3D]/20 px-4 py-3 text-[#0F1F3D] transition-colors focus:border-[#C9A84C] focus:ring-[3px] focus:ring-[#C9A84C]/15",
                  formButtonPrimary:
                    "rounded-lg bg-[#0F1F3D] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0D1929] hover:shadow-[0_4px_12px_rgba(201,168,76,0.3)]",
                  footerActionLink: "font-semibold text-[#0F1F3D] hover:text-[#C9A84C]",
                },
                variables: {
                  colorPrimary: "#0F1F3D",
                  colorText: "#4A5568",
                  colorTextSecondary: "#718096",
                  colorDanger: "#E53E3E",
                  colorInputBackground: "#FFFFFF",
                  borderRadius: "0.5rem",
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: "0.9375rem",
                },
              }}
            />
          </div>

          <style>{`
            .cl-rootBox,
            .cl-cardBox,
            .cl-card {
              width: 100% !important;
              max-width: 100% !important;
            }
            .cl-socialButtonsBlockButton,
            .cl-socialButtonsBlockButton__google,
            .cl-socialButtonsProviderIcon,
            .cl-socialButtonsBlockButtonText,
            .cl-socialButtons {
              opacity: 1 !important;
              color: #0F1F3D !important;
              visibility: visible !important;
            }
            .cl-socialButtonsBlockButton {
              border: 2px solid rgba(15,31,61,0.25) !important;
              background: #fff !important;
            }
          `}</style>

          <p data-form-reveal className="mt-8 text-center text-xs text-[#718096]">
            By signing up you agree to our{" "}
            <Link href="/terms" className="font-medium text-[#0F1F3D] hover:text-[#C9A84C]">
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy-policy"
              className="font-medium text-[#0F1F3D] hover:text-[#C9A84C]"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}