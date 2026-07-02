// @ts-nocheck
interface TorvionyxLogoProps {
  size?: number;
  className?: string;
}

export function TorvionyxLogo({ size = 22, className }: TorvionyxLogoProps) {
  const h = Math.round(size * 1.55);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 157"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M50 0 L100 48.4 L50 156.5 L0 48.4 Z"
        fill="var(--tv-text, #FAF2E8)"
      />
      <path
        d="M79.7 37.7 L19.9 37.9 L19.9 52 L41.5 52.2 L35 96.5 L46.4 93.5 L45.1 135.3 L66.1 75.9 L54.5 78.1 L59.6 52.7 L79.7 52 Z"
        fill="var(--tv-accent, #DCAA33)"
        stroke="#132543"
        strokeWidth="3"
        paintOrder="stroke"
      />
    </svg>
  )
}