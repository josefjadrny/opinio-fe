import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { CountryFacts as Facts, CountryFactsLeader } from '../../hooks/useCountryFacts';
import { StatTip } from '../common/StatTip';

const TILE = 'rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]';
const LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-white/60';

// Age in whole years on today's date, as Intl's "79 years" so each locale
// gets its own plural ("79 let", "42 lata"). Null without a full birth date -
// the data leaves `born` out when no source gives the day, and no age beats a
// wrong one.
function age(born: string, locale: string): string | null {
  const b = new Date(born + 'T00:00:00Z');
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let years = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) years -= 1;
  return new Intl.NumberFormat(locale, { style: 'unit', unit: 'year', unitDisplay: 'long' }).format(years);
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

// One person in office, sized for the window's header: photo, name, and the
// title with the age under it. The date they took office and the photo's
// credit (CC BY / BY-SA require showing it) sit in the tip rather than on the
// header, which is what keeps the header one row taller instead of a grid.
function LeaderChip({ leader }: { leader: CountryFactsLeader }) {
  const { t, locale } = useI18n();
  const isMobile = useIsMobile();
  const title = leader.title[locale] ?? leader.title.en;
  const years = leader.born ? age(leader.born, locale) : null;
  const meta = years ? `${title} · ${t.factsAge.replace('{age}', years)}` : title;
  const since = leader.since ? `${title} ${t.factsSince.replace('{date}', formatDate(leader.since, locale))}` : null;
  const credit = leader.photo ? t.factsPhoto.replace('{credit}', leader.photo.credit).replace('{license}', leader.photo.license) : null;
  const chip = (
    <span className="flex items-center gap-2 min-w-0 text-left">
      <LeaderPhoto leader={leader} size={isMobile ? 'w-8 h-8' : 'w-9 h-9'} />
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-white leading-tight truncate">{leader.name}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-white/50 leading-tight mt-0.5 whitespace-nowrap">
          {meta}
          {leader.acting && (
            <span className="text-[9px] font-semibold uppercase tracking-wide px-1 rounded bg-white/10 text-white/70">
              {t.factsActing}
            </span>
          )}
        </span>
      </span>
    </span>
  );
  if (!since && !credit) return chip;
  return (
    <StatTip
      label={[leader.name, since, credit].filter(Boolean).join('. ')}
      panel={
        <div className="space-y-1 max-w-[260px]">
          {since && <p className="text-sm text-white/80">{since}</p>}
          {credit && <p className="text-xs text-white/50">{credit}</p>}
        </div>
      }
      className="-m-1 p-1 min-w-0 hover:bg-white/[0.06]"
    >
      {chip}
    </StatTip>
  );
}

// Who is in office, in the window's header under the title. Wraps to a second
// line rather than truncating a name when three people do not fit.
export function CountryLeaders({ facts }: { facts: Facts | undefined }) {
  const leaders = facts?.leaders ?? [];
  if (leaders.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {leaders.map((l) => <LeaderChip key={l.role + l.name} leader={l} />)}
    </div>
  );
}

// The exact figure sits behind the compact one - only the figure itself is
// the trigger, not the whole tile.
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

// Population and capital, from the daily country-facts file (the people in
// office are CountryLeaders, in the header). Every part is optional: a missing
// figure drops its tile, and a country with neither renders nothing.
export function CountryFacts({ facts }: { facts: Facts | undefined }) {
  const { t, locale } = useI18n();
  if (!facts) return null;
  const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat(locale);
  const people = (n: number) => t.factsPeople.replace('{n}', full.format(n));

  const capital = facts.capital;
  const capitalName = capital ? (capital.names?.[locale] ?? capital.name) : null;
  if (facts.population == null && !capitalName) return null;

  return (
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
  );
}
