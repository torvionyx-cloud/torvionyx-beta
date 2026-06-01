/**
 * Inline SVG logo — use this everywhere instead of <img src="...svg">.
 * Inline means no extra network request, scales perfectly, and can be
 * styled with className/opacity from the parent.
 *
 * The gradient ID is scoped per-instance via a stable hash so multiple
 * logos on the same page don't cross-contaminate their gradient fills.
 */

interface TorvionyxLogoProps {
  size?: number;
  className?: string;
  /** Override to flip gradient direction for very dark backgrounds */
  variant?: "default" | "light";
  "aria-hidden"?: boolean;
  "aria-label"?: string;
}

let counter = 0;

export function TorvionyxLogo({
  size = 24,
  className,
  variant = "default",
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
}: TorvionyxLogoProps) {
  // Stable per-module counter — fine for SSR since the same component
  // tree produces the same sequence on server and client.
  const id = `tv-g-${++counter}`;

  const topColor = "#0891B2";
  const bottomColor = variant === "light" ? "#38BDF8" : "#1E293B";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden || undefined}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      <defs>
        <linearGradient
          id={id}
          x1="50" y1="8"
          x2="50" y2="98"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={topColor} />
          <stop offset="100%" stopColor={bottomColor} />
        </linearGradient>
      </defs>
      {/* Stylised T: bevelled outer-top corners, chamfered inner armpits,
          tapered stem to a point at the base */}
      <path
        d="M13,8 L87,8 L95,18 L93,40 L65,40 L61,44 L59,78 L54,93 L50,98 L46,93 L41,78 L39,44 L35,40 L7,40 L5,18 Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
