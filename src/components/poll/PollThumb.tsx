import { useState } from 'react';
import type { Role } from '../../types/profile';
import { ROLE_COLORS } from '../../utils/roles';

// One small glyph per category, drawn on the category colour. A poll without
// an image shows this instead of initials: the initials of a question ("WC"
// for "Which cheese...") mean nothing.
const GLYPHS: Record<Role, string> = {
  politics: 'M3 21h18M4 10h16M12 3l8 5H4l8-5zM6 10v8M10 10v8M14 10v8M18 10v8',
  entertainment: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z',
  sports: 'M8 4h8v5a4 4 0 01-8 0V4zM8 6H5.5a2.5 2.5 0 002.7 3.5M16 6h2.5a2.5 2.5 0 01-2.7 3.5M12 13v4M9 21h6M10 17h4v4h-4z',
  business: 'M4 8h16v11H4zM9 8V6a1 1 0 011-1h4a1 1 0 011 1v2M4 13h16',
  media: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  health: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
  science: 'M9.5 3h5M10.5 3v6L5.3 18.5A1.7 1.7 0 006.8 21h10.4a1.7 1.7 0 001.5-2.5L13.5 9V3M7.5 15h9',
  environment: 'M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l8-8',
  tech: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4',
  // A cup: food, drink, home and everyday life.
  lifestyle: 'M5 9h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5V9zM16 10h1.5a2.5 2.5 0 010 5H16M8 3c-.6 1 .6 2 0 3M11 3c-.6 1 .6 2 0 3',
};

export function RoleGlyph({ role, className = 'w-5 h-5' }: { role: Role; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={GLYPHS[role]} />
    </svg>
  );
}

// The poll's picture in lists and headers: its thumbnail when it has an image,
// else the category glyph on the category colour.
export function PollThumb({ role, imageUrl, className = 'w-10 h-10' }: { role: Role; imageUrl: string | null; className?: string }) {
  const [errored, setErrored] = useState<string | null>(null);
  if (imageUrl && errored !== imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`rounded-lg object-cover shrink-0 ${className}`}
        onError={() => setErrored(imageUrl)}
      />
    );
  }
  return (
    <div className={`rounded-lg flex items-center justify-center shrink-0 text-white/90 ${ROLE_COLORS[role]} ${className}`}>
      <RoleGlyph role={role} className="w-1/2 h-1/2" />
    </div>
  );
}
