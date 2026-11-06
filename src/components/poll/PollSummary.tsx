import type { ReactNode } from 'react';
import type { Profile } from '../../types/profile';
import { useProfileCountries } from '../../hooks/useProfileCountries';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { formatNumber } from '../../utils/formatNumber';
import { FlagImg } from '../common/CountryFlag';
import { GlobeIcon, VotedIcon } from './PollIcons';

// How far a plural template's words sit from its number: "{n} votes" ->
// ['', ' votes'], so the figure can be set large and the word small without a
// second set of strings.
const join = (w: [string, string]) => w.filter(Boolean).join(' ');

function splitPlural(tpl: string): [string, string] {
  const at = tpl.indexOf('{n}');
  return at < 0 ? ['', tpl] : [tpl.slice(0, at).trim(), tpl.slice(at + 3).trim()];
}

function Tile({ icon, value, label, children }: { icon: ReactNode; value: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 min-w-0 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] px-3 py-2.5">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-xl font-bold text-white tabular-nums leading-none">{value}</span>
          <span className="text-sm text-white/60 leading-none truncate">{label}</span>
        </div>
        <div className="mt-2 h-[15px] flex items-center">{children}</div>
      </div>
    </div>
  );
}

// The poll's reach under its answers: total votes and how many countries they
// came from, as two figures rather than a sentence, with the leading voter
// countries' flags beside the second. Same numbers everyone sees - the answers
// above already carry the split.
export function PollSummary({ profile }: { profile: Profile }) {
  const { p, locale } = useI18n();
  const { data } = useProfileCountries(profile.id);
  const total = profile.results ? profile.results.total : profile.voteCount;
  const countries = profile.results?.countries ?? data?.countries.length ?? 0;
  if (total === 0) return <p className="text-sm text-white/60">{p.beFirst}</p>;

  const votesWord = splitPlural(plural(p.votes, locale, total, () => '{n}'));
  const countriesWord = splitPlural(plural(p.countries, locale, countries, () => '{n}'));
  const flags = (data?.countries ?? []).slice(0, 3);

  const shares = profile.options.map((o) => ({
    id: o.id,
    color: o.color,
    n: profile.results?.options.find((r) => r.optionId === o.id)?.n ?? 0,
  }));

  return (
    <div className="grid grid-cols-2 gap-2" style={{ animation: 'stat-in 0.35s ease-out' }}>
      <Tile icon={<VotedIcon className="w-7 h-7" />} value={formatNumber(total)} label={join(votesWord)}>
        {/* The split in one line: every answer's share, in its colour. */}
        <span className="flex-1 flex h-1.5 rounded-full overflow-hidden gap-[2px]" aria-hidden>
          {shares.filter((x) => x.n > 0).map((x) => (
            <span key={x.id} style={{ width: `${(x.n / total) * 100}%`, background: x.color }} />
          ))}
        </span>
      </Tile>
      <Tile icon={<GlobeIcon className="w-7 h-7" />} value={formatNumber(countries)} label={join(countriesWord)}>
        {/* The countries most of the votes came from, biggest first. */}
        {/* The "+N" never shrinks; in a narrow tile flags drop off instead. */}
        <span className="flex items-center gap-1 min-w-0" aria-hidden>
          <span className="flex items-center gap-1 min-w-0 overflow-hidden">
            {flags.map((c) => <FlagImg key={c.code} code={c.code} className="rounded-[2px] shrink-0" />)}
          </span>
          {countries > flags.length && (
            <span className="shrink-0 ml-0.5 text-[13px] text-white/60 tabular-nums">+{formatNumber(countries - flags.length)}</span>
          )}
        </span>
      </Tile>
    </div>
  );
}
