import { useId } from 'react';

// The Opinio mark inline, not /favicon.svg: every logo asset we ship bakes in
// an opaque background (favicons and launcher icons need one), which on a
// lighter surface reads as a dark tile around the logo. Same geometry and the
// same gradients as the store icon - variant A in
// opinio-android/play-assets/icon-src.py, the one on Play and on Facebook -
// minus that background, cropped to the bubble so it fills the box.
export function LogoMark({ className }: { className?: string }) {
  // A page can hold several marks (header, map caption, activity rows) and
  // gradient ids are document-global, so the first one's stops would win
  // everywhere. Colons out: useId brackets its ids with them and they read
  // badly inside a url() reference.
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="64 80 384 368" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}-bubble`} x1="0%" y1="0%" x2="25%" y2="100%">
          <stop offset="0%" stopColor="#3076c2" />
          <stop offset="100%" stopColor="#103a6c" />
        </linearGradient>
        <linearGradient id={`${id}-up`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id={`${id}-down`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
      </defs>
      <rect x="64" y="80" width="384" height="272" rx="56" fill={`url(#${id}-bubble)`} />
      <path d="M144 352 L96 448 L256 352 Z" fill={`url(#${id}-bubble)`} />
      <polygon points="256,112 176,208 336,208" fill={`url(#${id}-up)`} />
      <polygon points="256,320 176,224 336,224" fill={`url(#${id}-down)`} />
    </svg>
  );
}
