import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { CountryFacts as Facts, CountryFactsLeader } from '../../hooks/useCountryFacts';
import { StatTip } from '../common/StatTip';

const TILE = 'rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]';
const LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-white/60';

// How long someone has been in office, in the largest whole unit that is not
// zero ("2 years", "5 months", "12 days") - Intl owns the plural forms.
function tenure(since: string, locale: string): string | null {
  const start = new Date(since + 'T00:00:00Z');
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  let months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + now.getUTCMonth() - start.getUTCMonth();
  if (now.getUTCDate() < start.getUTCDate()) months -= 1;
  const fmt = (n: number, unit: 'year' | 'month' | 'day') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(n);
  if (months >= 12) return fmt(Math.floor(months / 12), 'year');
  if (months >= 1) return fmt(months, 'month');
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
  return fmt(days, 'day');
}

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
}

function PersonPlaceholder({ className }: { className: string }) {
  return (
    <span className={`${className} rounded-full bg-white/[0.06] flex items-center justify-center`}>
      <svg className="w-1/2 h-1/2 text-white/30" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm0 2c-4.4 0-8 2.2-8 5v1.5h16V19c0-2.8-3.6-5-8-5z" />
      </svg>
    </span>
  );
}

function LeaderPhoto({ leader, size }: { leader: CountryFactsLeader; size: string }) {
  const [failed, setFailed] = useState(false);
  const photo = leader.photo;
  if (!photo || failed) return <PersonPlaceholder className={`${size} shrink-0`} />;
  return (
    <img
      src={photo.url}
      alt={leader.name}
      loading="lazy"
      width={128}
      height={128}
      onError={() => setFailed(true)}
      className={`${size} shrink-0 rounded-full object-cover bg-white/[0.06] ring-2 ring-white/5`}
    />
  );
}

function LeaderTile({ leader }: { leader: CountryFactsLeader }) {
  const { t, locale } = useI18n();
  const isMobile = useIsMobile();
  const title = leader.title[locale] ?? leader.title.en;
  const since = leader.since ? t.factsSince.replace('{date}', formatDate(leader.since, locale)) : null;
  const held = leader.since ? tenure(leader.since, locale) : null;
  return (
    <div className={`${TILE} flex items-center gap-3 px-3 py-2.5`}>
      <LeaderPhoto leader={leader} size={isMobile ? 'w-11 h-11' : 'w-12 h-12'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-white/60 leading-tight">{title}</span>
          {leader.acting && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-px rounded bg-white/10 text-white/70">
              {t.factsActing}
            </span>
          )}
        </div>
        <p className="text-sm md:text-[15px] font-semibold text-white leading-snug mt-0.5">{leader.name}</p>
        {since && (
          <p className="text-xs text-white/50 leading-tight mt-0.5">
            {since}
            {held && <span className="text-white/50"> · {held}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

// The exact figure sits behind the compact one - only the figure itself is
// the trigger, as only the photo is on a leader tile.
function Figure({ text, tip, className }: { text: string; tip?: string | null; className: string }) {
  if (!tip) return <span className={className}>{text}</span>;
  return (
    <StatTip label={tip} panel={<p className="text-sm text-white/80 whitespace-nowrap">{tip}</p>} className="-mx-1 px-1 hover:bg-white/[0.06]">
      <span className={className}>{text}</span>
    </StatTip>
  );
}

function Stat({ label, value, sub, valueTip, subTip }: {
  label: string; value: string; sub?: string | null; valueTip?: string | null; subTip?: string | null;
}) {
  return (
    <div className={`${TILE} px-3.5 py-3 min-w-0`}>
      <span className={`block ${LABEL}`}>{label}</span>
      <span className="flex items-baseline gap-2 mt-1 min-w-0">
        <Figure text={value} tip={valueTip} className="block min-w-0 text-lg md:text-xl font-semibold text-white leading-tight truncate" />
        {sub && <Figure text={sub} tip={subTip} className="block text-xs text-white/50 leading-tight shrink-0" />}
      </span>
    </div>
  );
}

// Population, capital and who is in office, from the daily country-facts file.
// Every part is optional: a missing figure drops its tile, and a country with
// nothing at all renders nothing.
export function CountryFacts({ facts }: { facts: Facts | undefined }) {
  const { t, locale } = useI18n();
  if (!facts) return null;
  const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat(locale);
  const people = (n: number) => t.factsPeople.replace('{n}', full.format(n));

  const capital = facts.capital;
  const capitalName = capital ? (capital.names?.[locale] ?? capital.name) : null;
  const leaders = facts.leaders ?? [];
  const hasStats = facts.population != null || !!capitalName;
  if (!hasStats && leaders.length === 0) return null;

  return (
    <div className="space-y-2">
      {hasStats && (
        <div className="grid grid-cols-2 gap-2">
          {facts.population != null && (
            <Stat
              label={t.factsPopulation}
              value={compact.format(facts.population)}
              sub={facts.populationYear ? String(facts.populationYear) : null}
              valueTip={people(facts.population)}
            />
          )}
          {capitalName && (
            <Stat
              label={t.factsCapital}
              value={capitalName}
              sub={capital?.population != null ? compact.format(capital.population) : null}
              subTip={capital?.population != null ? people(capital.population) : null}
            />
          )}
        </div>
      )}
      {leaders.length > 0 && (
        <div className={`grid gap-2 grid-cols-1 ${leaders.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {leaders.map((l) => <LeaderTile key={l.role + l.name} leader={l} />)}
        </div>
      )}
    </div>
  );
}
