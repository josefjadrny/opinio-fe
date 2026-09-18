import { useI18n } from '../../i18n/I18nContext';
import { formatNumber } from '../../utils/formatNumber';
import { commentCountLabel } from './commentCountLabel';

// Same family as the add-opinio glyph (header button + FAB): the red outline
// bubble, green inside. A comment is another opinio, so it shares the shape;
// the inside is two text lines instead of the plus, which would read as "add".
export function CommentIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden>
      <path stroke="var(--color-negative)" strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
      <path stroke="var(--color-positive)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.5 10.5h7M8.5 14h4.5" />
    </svg>
  );
}

interface CommentCountProps {
  count: number;
  size?: 'sm' | 'xs';
  onClick?: (e: React.MouseEvent) => void;
}

// Muted count of comments on an opinio, for list cards. Hidden at zero: the
// feature is never advertised, and a row of "0" would advertise the emptiness.
// Not a pill and not coloured - the coloured pills on a card are the two votes;
// this is quiet on purpose, with the neutral bubble rather than the red/green
// opinio glyph the detail uses. (The owner's "unseen comments" signal is
// deliberately NOT here - it will live elsewhere.)
export function CommentCount({ count, size = 'sm', onClick }: CommentCountProps) {
  const { t, locale } = useI18n();
  if (count <= 0) return null;
  // Sized to the flag beside the name (20px glyph): icon 20, number 16, on
  // both cards. 'xs' only drops the padding - inside the mobile badge row the
  // gap is already the row's own and any extra reads as dead space.
  const dims = size === 'sm' ? 'gap-1.5 px-2 py-0.5' : 'gap-1 px-0 py-0';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={commentCountLabel(t, locale, count)}
      className={`inline-flex items-center rounded-lg text-base font-medium tabular-nums leading-none transition-colors text-white/50 hover:text-white/80 ${dims}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 0 1-4-.8L3 20l1.3-3.9A7.6 7.6 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span>{formatNumber(count)}</span>
    </button>
  );
}
