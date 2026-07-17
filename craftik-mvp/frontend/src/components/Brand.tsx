import Link from 'next/link';

export function Logo({ className = '', linkTo = '/' }: { className?: string; linkTo?: string | null }) {
  const content = (
    <div className={`flex items-center gap-2 font-display font-black text-night ${className}`}>
      <svg viewBox="0 0 40 40" className="h-8 w-8 flex-none" aria-hidden="true">
        <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#FF6B1A" />
        <path d="M13 20.5l5 5 9-11" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xl">craftik</span>
    </div>
  );
  if (linkTo === null) return content;
  return <Link href={linkTo}>{content}</Link>;
}

export function VerifiedSeal({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="verificato">
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#1DB954" />
      <path d="M13 20.5l5 5 9-11" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ScoreRingProps {
  value: number;
  size?: number;
  stroke?: number;
  dark?: boolean;
}

/** Circular score display used across the app — the signature Craftik visual. */
export function ScoreRing({ value, size = 64, stroke = 6, dark = false }: ScoreRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  const trackColor = dark ? 'rgba(255,255,255,0.15)' : '#E3E7EC';
  const textColor = dark ? '#FFFFFF' : '#0F2A43';
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#FF6B1A"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms ease' }}
        />
      </svg>
      <span
        className="absolute font-display font-black"
        style={{ color: textColor, fontSize: size * 0.3 }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}
