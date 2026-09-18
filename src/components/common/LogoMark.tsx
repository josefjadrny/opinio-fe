// The Opinio mark inline, not /favicon.svg: every logo asset we ship bakes
// in an opaque #1a1a2e background circle (favicons and launcher icons need
// one), which on a lighter surface reads as a dark disc around the logo.
// Same shapes, minus that circle, cropped to the bubble so it fills the box.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="4 5 24 23" aria-hidden="true" className={className}>
      <rect x="4" y="5" width="24" height="17" rx="4" fill="#0f3460" />
      <path d="M9 22 L6 28 L16 22 Z" fill="#0f3460" />
      <polygon points="16,7 11,13 21,13" fill="#22c55e" />
      <polygon points="16,20 11,14 21,14" fill="#ef4444" />
    </svg>
  );
}
