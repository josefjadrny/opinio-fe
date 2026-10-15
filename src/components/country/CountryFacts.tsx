import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { CountryFacts as Facts, CountryFactsLeader } from '../../hooks/useCountryFacts';
import { usePersons } from '../../hooks/usePersons';
import type { Person } from '../../types/api';
import { StatTip } from '../common/StatTip';

const TILE = 'rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]';

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

function LeaderPhoto({ person, size }: { person: Person; size: string }) {
  const [failed, setFailed] = useState(false);
  const photo = person.photo;
  if (!photo || failed) return <PersonPlaceholder className={`${size} shrink-0`} />;
  return (
    <img
      src={photo.url}
      alt={person.name}
      loading="lazy"
      width={128}
      height={128}
      onError={() => setFailed(true)}
      className={`${size} shrink-0 rounded-full object-cover bg-white/[0.06] ring-2 ring-white/5`}
    />
  );
}

// One person in office: photo, title, name, and the age under them. The
// date they took office and the photo's credit (CC BY / BY-SA require showing
// it) sit in the tile's tip, which keeps the tile to three short lines.
function LeaderTile({ leader, person }: { leader: CountryFactsLeader; person: Person }) {
  const { t, locale } = useI18n();
  const isMobile = useIsMobile();
  const title = leader.title[locale] ?? leader.title.en;
  const years = person.born ? age(person.born, locale) : null;
  const since = leader.since ? `${title} ${t.factsSince.replace('{date}', formatDate(leader.since, locale))}` : null;
  const credit = person.photo ? t.factsPhoto.replace('{credit}', person.photo.credit).replace('{license}', person.photo.license) : null;
  const body = (
    <span className="flex items-center gap-3 min-w-0 text-left">
      <LeaderPhoto person={person} size={isMobile ? 'w-12 h-12' : 'w-14 h-14'} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-white/60 leading-tight">{title}</span>
          {leader.acting && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-px rounded bg-white/10 text-white/70">
              {t.factsActing}
            </span>
          )}
        </span>
        <span className="block text-sm md:text-[15px] font-semibold text-white leading-snug mt-0.5 truncate">{person.name}</span>
        {years && <span className="block text-xs text-white/50 leading-tight mt-0.5">{t.factsAge.replace('{age}', years)}</span>}
      </span>
    </span>
  );
  const tile = `${TILE} block w-full px-3 py-2.5 min-w-0`;
  if (!since && !credit) return <div className={tile}>{body}</div>;
  return (
    <StatTip
      label={[person.name, since, credit].filter(Boolean).join('. ')}
      panel={
        <div className="space-y-1 max-w-[260px]">
          {since && <p className="text-sm text-white/80">{since}</p>}
          {credit && <p className="text-xs text-white/50">{credit}</p>}
        </div>
      }
      className={`${tile} !rounded-xl hover:bg-white/[0.06]`}
    >
      {body}
    </StatTip>
  );
}

// Who is in office, as tiles under the window's header. The facts file holds
// the offices; the people come from /api/persons, so the block waits for them
// and a failed fetch leaves it out, like a missing facts file does.
export function CountryLeaders({ facts }: { facts: Facts | undefined }) {
  const offices = facts?.leaders ?? [];
  const persons = usePersons(offices.map((l) => l.personId));
  const leaders = persons
    ? offices.flatMap((l) => {
      const person = persons.get(l.personId);
      return person ? [{ leader: l, person }] : [];
    })
    : [];
  if (leaders.length === 0) return null;
  return (
    <div className={`grid gap-2 grid-cols-1 ${leaders.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
      {leaders.map(({ leader, person }) => <LeaderTile key={leader.role + person.id} leader={leader} person={person} />)}
    </div>
  );
}

// The exact figure sits behind the compact one - only the figure itself is
// the trigger.
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
    <span className="flex items-baseline gap-1.5 min-w-0">
      <span className="text-white/50">{label}</span>
      <Figure text={value} tip={valueTip} className="font-semibold text-white/90" />
      {sub && <Figure text={sub} tip={subTip} className="text-xs text-white/50" />}
    </span>
  );
}

// Population and capital as one line in the window's header, from the daily
// country-facts file. Every part is optional: a missing figure drops out, and
// a country with neither renders nothing.
export function CountryStats({ facts }: { facts: Facts | undefined }) {
  const { t, locale } = useI18n();
  if (!facts) return null;
  const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat(locale);
  const people = (n: number) => t.factsPeople.replace('{n}', full.format(n));

  const capital = facts.capital;
  const capitalName = capital ? (capital.names?.[locale] ?? capital.name) : null;
  if (facts.population == null && !capitalName) return null;

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] leading-tight">
      {facts.population != null && (
        <Stat
          label={t.factsPopulation}
          value={compact.format(facts.population)}
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
