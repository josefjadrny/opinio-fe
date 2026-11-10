import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ModalShell } from '../common/ModalShell';
import { SelectField } from '../common/SelectField';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { useProfiles } from '../../hooks/useProfiles';
import { useCountries } from '../../hooks/useCountries';
import { getStatsDivided, getStatsPeople, getStatsSummary } from '../../api/client';
import { getCountryFlag, getCountryName, getCountriesList } from '../../utils/countries';
import { formatNumber } from '../../utils/formatNumber';
import { FlagImg } from '../common/CountryFlag';
import { PollThumb } from '../poll/PollThumb';
import { Avatar } from '../profile/Avatar';
import type { StatsCategory } from './statsCategory';
import type { Profile } from '../../types/profile';

interface StatsModalProps {
  category: StatsCategory;
  onClose: () => void;
}

const CATEGORY_PATH: Record<StatsCategory, string> = {
  profiles: '/stats',
  countries: '/stats/trending-countries',
  people: '/stats/top-voters',
};

// The app's two-tone stats glyph (same as the profile menu entry): every
// modal header icon carries the brand red/green.
const StatsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path className="stroke-negative" strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
    <path className="stroke-positive" strokeLinecap="round" strokeLinejoin="round" d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const OPTION_STYLE = { backgroundColor: '#1a1a2e', color: 'white' };

function Tabs<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: [T, string][]; onChange: (v: T) => void; size?: 'md' | 'sm' }) {
  return (
    <div className={`flex gap-1 p-0.5 rounded-lg ${size === 'md' ? 'bg-black/20 border border-border' : ''}`}>
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex-1 rounded-md transition-colors whitespace-nowrap ${size === 'md' ? 'px-2 py-2 text-sm font-medium' : 'px-2 py-1 text-xs font-semibold uppercase tracking-wider'} ${
            value === key ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Row({ rank, picture, children, value, onClick }: { rank: number; picture: ReactNode; children: ReactNode; value: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left">
      <span className="w-6 shrink-0 text-center text-xs tabular-nums text-white/50">{rank + 1}</span>
      {picture}
      <span className="flex-1 min-w-0">{children}</span>
      <span className="shrink-0 text-xs tabular-nums text-text-secondary">{value}</span>
    </button>
  );
}

// Community stats - all real votes (POLLS-DESIGN.md G1). Polls: Trending,
// Top, Most divided. Countries: today, all time. People (signed-in accounts
// only): top askers, most polls answered. Which option anyone chose never
// appears.
function StatsContent({ category }: { category: StatsCategory }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, p, locale } = useI18n();
  const [pollBoard, setPollBoard] = useState<'trending' | 'top' | 'divided'>('trending');
  const [countryBoard, setCountryBoard] = useState<'today' | 'all'>('today');
  const [peopleBoard, setPeopleBoard] = useState<'askers' | 'answerers'>('askers');
  // Its own selection, not the URL filter: the feed has no country filter.
  const [country, setCountry] = useState<string | undefined>(undefined);

  const summary = useQuery({ queryKey: ['stats', 'summary'], queryFn: getStatsSummary, staleTime: 60_000 });
  const listPolls = category === 'profiles' && pollBoard !== 'divided';
  // Every list is a top 10 (the API pages polls by 15; the rest is cut here).
  const polls = useProfiles({ sort: pollBoard === 'top' ? 'top' : 'trending', country, limit: 15 }, listPolls);
  const divided = useQuery({
    queryKey: ['stats', 'divided', locale],
    queryFn: () => getStatsDivided(locale),
    enabled: category === 'profiles' && pollBoard === 'divided',
    staleTime: 60_000,
  });
  const { data: countriesData, isLoading: countriesLoading } = useCountries();
  const people = useQuery({
    queryKey: ['stats', 'people', peopleBoard],
    queryFn: () => getStatsPeople(peopleBoard),
    enabled: category === 'people',
    staleTime: 60_000,
  });

  const countryRows = [...(countriesData?.countries ?? [])]
    .filter((c) => (countryBoard === 'today' ? c.today : c.total) > 0)
    .sort((a, b) => (countryBoard === 'today' ? b.today - a.today : b.total - a.total))
    .slice(0, 10);

  const goTo = (cat: StatsCategory) => navigate(CATEGORY_PATH[cat] + location.search, { replace: true });
  const openPoll = (id: string) => navigate('/p/' + id + location.search);
  const thumb = (poll: Profile) => <PollThumb role={poll.role} imageUrl={poll.imageUrl} className="w-7 h-7" />;
  const votes = (n: number) => plural(p.votes, locale, n, formatNumber);

  let help: string;
  let isLoading: boolean;
  let body: ReactNode;
  if (category === 'profiles' && pollBoard === 'divided') {
    help = p.statsDividedHelp;
    isLoading = divided.isLoading;
    const items = divided.data?.items ?? [];
    body = items.length > 0 && items.map((it, i) => {
      const colorOf = (id: string) => it.poll.options.find((o) => o.id === id)?.color;
      const text = (id: string) => it.poll.options.find((o) => o.id === id)?.text ?? '';
      return (
        <Row key={it.poll.id} rank={i} picture={thumb(it.poll)} onClick={() => openPoll(it.poll.id)} value={votes(it.poll.voteCount)}>
          <span className="block text-sm text-white line-clamp-2">{it.poll.name}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-text-secondary">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorOf(it.first.optionId) }} />
            <span className="truncate">{text(it.first.optionId)} {it.first.pct}%</span>
            <span className="text-white/30">/</span>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorOf(it.second.optionId) }} />
            <span className="truncate">{text(it.second.optionId)} {it.second.pct}%</span>
          </span>
        </Row>
      );
    });
  } else if (category === 'profiles') {
    help = pollBoard === 'top' ? p.statsTopHelp : p.statsTrendingHelp;
    isLoading = polls.isLoading;
    const rows = (polls.data?.profiles ?? []).slice(0, 10);
    body = rows.length > 0 && rows.map((poll, i) => (
      <Row key={poll.id} rank={i} picture={thumb(poll)} onClick={() => openPoll(poll.id)}
        value={votes(pollBoard === 'top' ? poll.voteCount : poll.votes24h ?? 0)}>
        <span className="block text-sm text-white line-clamp-2">{poll.name}</span>
      </Row>
    ));
  } else if (category === 'countries') {
    help = countryBoard === 'today' ? p.statsCountriesHelp : p.statsCountriesAllHelp;
    isLoading = countriesLoading;
    body = countryRows.length > 0 && countryRows.map((c, i) => (
      <Row key={c.code} rank={i} picture={<FlagImg code={c.code} className="shrink-0" />} onClick={() => navigate('/c/' + c.code + location.search)}
        value={votes(countryBoard === 'today' ? c.today : c.total)}>
        <span className="block text-sm text-white truncate">{getCountryName(c.code, locale)}</span>
      </Row>
    ));
  } else {
    help = peopleBoard === 'askers' ? p.statsAskersHelp : p.statsAnswerersHelp;
    isLoading = people.isLoading;
    const rows = people.data?.people ?? [];
    body = rows.length > 0 && rows.map((u, i) => (
      <Row key={u.id} rank={i} picture={<Avatar name={u.displayName} imageUrl={u.avatarUrl} className="w-7 h-7" />}
        onClick={() => navigate('/u/' + u.id + location.search)}
        value={peopleBoard === 'askers' ? votes(u.value) : `${formatNumber(u.value)} ${p.statsPollsCount.toLowerCase()}`}>
        <span className="flex items-center gap-1.5 text-sm text-white min-w-0">
          <span className="truncate">@{u.displayName}</span>
          {u.countryCode && <FlagImg code={u.countryCode} className="shrink-0" />}
        </span>
        {peopleBoard === 'askers' && (
          <span className="block text-[12px] text-text-secondary">{formatNumber(u.polls)} {p.statsPollsCount.toLowerCase()}</span>
        )}
      </Row>
    ));
  }

  const s = summary.data;
  return (
    <div className="px-6 py-5 space-y-4">
      {/* The whole site in four numbers. */}
      <div className="grid grid-cols-4 gap-2">
        {([[p.statsVotes, s?.votes], [p.statsPollsCount, s?.polls], [p.statsVoters, s?.voters], [p.statsCountries, s?.countries]] as const).map(([label, n]) => (
          <div key={label} className="rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06] px-2 py-2 text-center">
            <p className="text-lg font-bold tabular-nums text-white leading-none">{n == null ? '-' : formatNumber(n)}</p>
            <p className="mt-1 text-[11px] text-white/55 truncate">{label}</p>
          </div>
        ))}
      </div>

      <Tabs<StatsCategory> value={category} onChange={goTo} options={[['profiles', p.statsPolls], ['countries', p.statsCountries], ['people', p.statsPeople]]} />

      {category === 'profiles' && (
        <Tabs size="sm" value={pollBoard} onChange={setPollBoard} options={[['trending', p.sortTrending], ['top', p.statsTop], ['divided', p.statsDivided]]} />
      )}
      {category === 'countries' && (
        <Tabs size="sm" value={countryBoard} onChange={setCountryBoard} options={[['today', p.statsToday], ['all', p.statsAllTime]]} />
      )}
      {category === 'people' && (
        <Tabs size="sm" value={peopleBoard} onChange={setPeopleBoard} options={[['askers', p.statsAskers], ['answerers', p.statsAnswerers]]} />
      )}

      {listPolls && (
        <div>
          <label className="block text-xs font-medium text-white/80 mb-1.5">{p.votedFrom}</label>
          <SelectField value={country ?? ''} onChange={(e) => setCountry(e.target.value || undefined)}>
            <option value="" style={OPTION_STYLE}>{p.votedFromAll}</option>
            {getCountriesList(locale).map(({ code, name }) => (
              <option key={code} value={code} style={OPTION_STYLE}>
                {getCountryFlag(code)} {name}
              </option>
            ))}
          </SelectField>
        </div>
      )}

      <p className="text-xs text-white/50 leading-snug">{help}</p>

      {isLoading ? (
        <p className="text-sm text-white/50 text-center py-16">{t.loading}</p>
      ) : body ? (
        <div className="space-y-0.5">{body}</div>
      ) : (
        <p className="text-sm text-white/50 text-center py-16">{t.statsNoData}</p>
      )}
    </div>
  );
}

export function StatsModal({ category, onClose }: StatsModalProps) {
  const { t } = useI18n();
  return (
    <ModalShell onClose={onClose} title={t.statsTitle} titleAs="h1" icon={<StatsIcon />} maxWidth="max-w-lg" desktopScrollable>
      <StatsContent category={category} />
    </ModalShell>
  );
}
