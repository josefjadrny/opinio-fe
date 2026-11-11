// Blocks of the poll detail seen from one country (hooks/usePollCountryView).
import { Link, useLocation } from 'react-router-dom';
import type { PollCountryView } from '../../hooks/usePollCountryView';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { formatNumber } from '../../utils/formatNumber';
import { FlagImg } from '../common/CountryFlag';
import { DivergeIcon, GlobeIcon } from './PollIcons';
import { POLL_COUNTRY_MIN_VOTES } from '../../../cloudflare-worker/src/pollCountryMeta.js';

// The small uppercase label over a block - the style of the detail's
// Countries / Comments tabs.
export function BlockLabel({ icon, children, aside }: { icon: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
      {icon}
      <span className="min-w-0 truncate">{children}</span>
      {aside && <span className="ml-auto pl-2 shrink-0 normal-case tracking-normal font-normal text-[13px] text-white/60 tabular-nums">{aside}</span>}
    </p>
  );
}

// The detail's h1 on /p/:id/c/:code: "{country}: {question}", the question a
// link to the whole poll (as the country label links to the country).
export function CountryTitle({ view, question, pollId }: { view: PollCountryView; question: string; pollId: string }) {
  const { p } = useI18n();
  const location = useLocation();
  const [before, after = ''] = p.pollCountryTitle.replace('{country}', view.name).split('{question}');
  return (
    <>
      {before}
      <Link
        to={`/p/${pollId}${location.search}`}
        className="hover:underline underline-offset-4 decoration-white/40 transition-colors"
      >
        {question}
      </Link>
      {after}
    </>
  );
}

// The country's name is the way to its page (/c/:code): its other polls.
export function CountryLabel({ view }: { view: PollCountryView }) {
  const { p, locale } = useI18n();
  const location = useLocation();
  return (
    <BlockLabel icon={<FlagImg code={view.code} className="rounded-[2px] shrink-0" />} aside={plural(p.votes, locale, view.total, formatNumber)}>
      <Link
        to={`/c/${view.code}${location.search}`}
        className="hover:text-white hover:underline underline-offset-2 decoration-white/30 transition-colors"
      >
        {view.name}
      </Link>
    </BlockLabel>
  );
}

export function WorldLabel() {
  const { p } = useI18n();
  return <BlockLabel icon={<GlobeIcon className="w-3.5 h-3.5" />}>{p.world}</BlockLabel>;
}

// When the country's winner is not the world's: one sentence that says so,
// its two answers drawn as chips in their colours.
function DiffersLine({ view }: { view: PollCountryView }) {
  const { p } = useI18n();
  const d = view.differs;
  if (!d?.country.option || !d.world.option) return null;
  const chip = (o: NonNullable<typeof d.country.option>, pct: number) => (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 align-middle"
      style={{ background: `color-mix(in srgb, ${o.color} 18%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${o.color} 45%, transparent)` }}
    >
      <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: o.color }} />
      <span className="font-semibold text-white">{o.text}</span>{' '}
      <span className="tabular-nums text-white/80">{pct}%</span>
    </span>
  );
  const parts = p.pollCountryDiffers.replace('{country}', view.name).split(/(\{a\}|\{b\})/);
  return (
    <p className="flex items-start gap-2 text-sm text-white/80 leading-7">
      <DivergeIcon className="w-5 h-5 mt-1" />
      <span>
        {parts.map((part, i) =>
          part === '{a}' ? <span key={i}>{chip(d.country.option!, d.country.pct)}</span>
            : part === '{b}' ? <span key={i}>{chip(d.world.option!, d.world.pct)}</span>
              : <span key={i}>{part}</span>,
        )}
      </span>
    </p>
  );
}

// Under the country's answers: the empty and thin states, and the comparison
// with the world when the two winners differ.
export function CountryNotes({ view }: { view: PollCountryView }) {
  const { p } = useI18n();
  if (!(view.loaded && view.total === 0) && !(view.total > 0 && view.total < POLL_COUNTRY_MIN_VOTES) && !view.differs) return null;
  return (
    <div className="mt-3 space-y-2 text-[13px]">
      {view.loaded && view.total === 0 && <p className="text-white/60">{p.pollCountryNone.replace('{country}', view.name)}</p>}
      {view.total > 0 && view.total < POLL_COUNTRY_MIN_VOTES && <p className="text-white/50">{p.pollCountryFew}</p>}
      {view.differs && <DiffersLine view={view} />}
    </div>
  );
}
