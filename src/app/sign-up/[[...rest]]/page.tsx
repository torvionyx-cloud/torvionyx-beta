import { SignUp } from "@clerk/nextjs";
import { TorvionyxLogo } from "@/components/ui/TorvionyxLogo";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-[#111827]">
      <div className="flex items-center gap-2.5 mb-8">
        <TorvionyxLogo size={28} aria-hidden={false} aria-label="Torvionyx" />
        <span className="text-xl font-bold text-neutral-900 dark:text-[#F3F4F6] tracking-tight">
          Torvionyx
        </span>
      </div>
      <SignUp />
    </div>
  );
}
