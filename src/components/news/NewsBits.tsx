import { useI18n } from '../../i18n/I18nContext';
import { Avatar } from '../profile/Avatar';
import { FlagImg } from '../common/CountryFlag';
import { HoverTip } from '../common/HoverTip';
import type { NewsItem } from '../../types/api';
import { NEWS_COPY } from './newsCopy';

// The person's photo, or the country flag in a disc while we have no photo.
// `credit` puts the photo's licence credit behind a hover (author + licence)
// and makes the picture a link to its Commons page - the attribution the
// licence asks for, kept out of the way until someone looks for it.
export function NewsPicture({ news, className, flagSize = 28, credit = false }: {
  news: NewsItem;
  className: string;
  flagSize?: number;
  credit?: boolean;
}) {
  const p = news.person;
  if (!p.photoUrl) {
    return (
      <span className={`${className} rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden`}>
        <FlagImg code={news.countryCode} size={flagSize} />
      </span>
    );
  }
  const img = <Avatar name={p.name} imageUrl={p.photoUrl} className={className} />;
  if (!credit || !p.photoCredit || !p.photoSource) return img;
  return (
    <HoverTip label={NEWS_COPY.photoCredit.replace('{author}', p.photoCredit).replace('{license}', p.photoLicense ?? '')} className="inline-flex shrink-0 rounded-full">
      <a href={p.photoSource} target="_blank" rel="noopener noreferrer" className="block rounded-full" onClick={(e) => e.stopPropagation()}>
        {img}
      </a>
    </HoverTip>
  );
}

// The red NEWS pill, the same one the live banner and the map caption carry.
// `live` adds the breathing glow and the ping on its dot.
export function NewsPill({ live = false, className = '' }: { live?: boolean; className?: string }) {
  const { t } = useI18n();
  return (
    <span className={`${live ? 'live-pill' : ''} shrink-0 inline-flex items-center uppercase font-bold tracking-[0.16em] text-[10px] leading-none text-negative-soft bg-accent/15 border border-accent/60 rounded-full px-2 py-1 ${className}`}>
      <span className="relative inline-flex w-1.5 h-1.5 mr-1.5">
        {live && <span className="absolute inset-0 rounded-full bg-accent animate-ping motion-reduce:hidden" />}
        <span className="relative w-1.5 h-1.5 rounded-full bg-accent" />
      </span>
      {t.newsLabel}
    </span>
  );
}

// Broadcast: a red dot sending waves both ways - "live", the way stories
// reach the page. The dot is the NEWS pill's red. `brand` colours the waves
// like the header's other discs (the like green); plain, they take the text
// colour and the dot stays red.
export function NewsIcon({ className = 'w-5 h-5', brand = false }: { className?: string; brand?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2.2" fill="var(--color-accent)" stroke="var(--color-accent)" />
      <path stroke={brand ? 'var(--color-positive)' : undefined} d="M8.6 8.6a4.8 4.8 0 000 6.8M15.4 8.6a4.8 4.8 0 010 6.8M5.6 5.6a9 9 0 000 12.8M18.4 5.6a9 9 0 010 12.8" />
    </svg>
  );
}

export function ExternalIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
