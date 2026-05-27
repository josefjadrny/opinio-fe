import { type ReactElement } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { SelectField } from '../common/SelectField';
import { Avatar } from '../profile/Avatar';
import { useI18n } from '../../i18n/I18nContext';
import { useFilters } from '../../context/useFilters';
import { useOnFireUsers, useTopVoters, useTrendingCountries } from '../../hooks/useTopVoters';
import { getCountryFlag, getCountryName, ALL_COUNTRIES } from '../../utils/countries';
import type { CountryMetric, TrendingCountry } from '../../types/api';

export type StatsCategory = 'voters' | 'onFire' | 'countries';
type Category = StatsCategory;

interface StatsModalProps {
  category: StatsCategory;
  onClose: () => void;
}

// Category <-> URL path. /stats is the canonical Trending Opinios page; the
// other two get their own keyword paths. Filters (country/metric) ride in query
// params and are canonicalled away, so these 3 stay the only indexable stats URLs.
const CATEGORY_PATH: Record<StatsCategory, string> = {
  onFire: '/stats',
  countries: '/stats/trending-countries',
  voters: '/stats/top-voters',
};

export function slugToCategory(slug?: string): StatsCategory {
  if (slug === 'trending-countries') return 'countries';
  if (slug === 'top-voters') return 'voters';
  return 'onFire';
}

const VALID_METRICS: CountryMetric[] = ['total', 'likes', 'dislikes', 'net'];

const StatsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// Trending Opinios glyph - replaces the 🔥 emoji with the app's two-tone
// outline style (same Heroicons family + brand red/green as the menu icons).
// Outer flame in dislike-red, inner flame in like-green: a vote-coloured fire.
const FlameIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
  </svg>
);

// Total keeps the existing bar-chart stats glyph (same shape as StatsIcon, sized
// down). Likes/Dislikes/Net reuse the app's ▲ / ▼ vote markers in the brand
// green/red - the same glyphs ProfileCard, tooltips and detail modals use.
const TotalMetricIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path stroke="#e94560" strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const LikeMetricIcon = () => <span className="text-positive text-xs leading-none">▲</span>;
const DislikeMetricIcon = () => <span className="text-negative text-xs leading-none">▼</span>;
const NetMetricIcon = () => (
  <span className="text-xs leading-none tracking-[-0.25em]">
    <span className="text-positive">▲</span>
    <span className="text-negative">▼</span>
  </span>
);

const METRIC_ICON: Record<CountryMetric, () => ReactElement> = {
  total: TotalMetricIcon,
  likes: LikeMetricIcon,
  dislikes: DislikeMetricIcon,
  net: NetMetricIcon,
};

function rankCell(i: number) {
  if (i === 0) return <span className="text-sm">🥇</span>;
  if (i === 1) return <span className="text-sm">🥈</span>;
  if (i === 2) return <span className="text-sm">🥉</span>;
  return <span className="text-xs text-white/30">{i + 1}</span>;
}

interface StatsRowProps {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  rank: number;
  subtitle: string | null;
  value: number;
  valueLabel: string;
}

function StatsRow({ id, displayName, avatarUrl, countryCode, rank, subtitle, value, valueLabel }: StatsRowProps) {
  const location = useLocation();
  return (
    <Link
      to={`/u/${id}${location.search}`}
      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
    >
      <span className="w-5 shrink-0 text-center">{rankCell(rank)}</span>
      <Avatar name={displayName} imageUrl={avatarUrl} className="w-7 h-7" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">
          @{displayName}
          {countryCode && <span className="ml-1.5">{getCountryFlag(countryCode)}</span>}
        </p>
        {subtitle && (
          <p className="text-[11px] text-white/30 truncate leading-tight">{subtitle}</p>
        )}
      </div>
      <span className="text-xs font-medium tabular-nums shrink-0 text-white/80">
        {value.toLocaleString()} <span className="text-white/40">{valueLabel}</span>
      </span>
    </Link>
  );
}

interface StatsCountryRowProps {
  countryCode: string;
  rank: number;
  subtitle: string | null;
  value: number;
  valueLabel: string;
}

function StatsCountryRow({ countryCode, rank, subtitle, value, valueLabel }: StatsCountryRowProps) {
  const location = useLocation();
  return (
    <Link
      to={`/c/${countryCode}${location.search}`}
      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
    >
      <span className="w-5 shrink-0 text-center">{rankCell(rank)}</span>
      <span className="w-7 h-7 shrink-0 flex items-center justify-center text-xl leading-none">{getCountryFlag(countryCode)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{getCountryName(countryCode)}</p>
        {subtitle && (
          <p className="text-[11px] text-white/30 truncate leading-tight">{subtitle}</p>
        )}
      </div>
      <span className="text-xs font-medium tabular-nums shrink-0 text-white/80">
        {value.toLocaleString()} <span className="text-white/40">{valueLabel}</span>
      </span>
    </Link>
  );
}

function CategoryTabs({ category, onChange, t }: { category: Category; onChange: (c: Category) => void; t: ReturnType<typeof useI18n>['t'] }) {
  const tab = (key: Category, label: string, icon?: ReactElement) => {
    const active = category === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
          active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };
  return (
    <div className="flex gap-1 p-0.5 bg-black/20 border border-border rounded-lg overflow-x-auto no-scrollbar">
      {tab('onFire', t.statsCategoryProfiles, <FlameIcon />)}
      {tab('countries', t.statsCategoryCountries)}
      {tab('voters', t.statsCategoryVoters)}
    </div>
  );
}

// Segmented control mirroring CategoryTabs, but with opinio glyphs per metric
// (a native <select> can't render the SVG icons or their brand colors).
function MetricTabs({ metric, onChange, t }: { metric: CountryMetric; onChange: (m: CountryMetric) => void; t: ReturnType<typeof useI18n>['t'] }) {
  const tab = (key: CountryMetric, label: string) => {
    const Icon = METRIC_ICON[key];
    const active = metric === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
          active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
        }`}
      >
        <Icon />
        {label}
      </button>
    );
  };
  return (
    <div className="flex gap-1 p-0.5 bg-black/20 border border-border rounded-lg overflow-x-auto no-scrollbar">
      {tab('total', t.statsMetricTotal)}
      {tab('likes', t.statsMetricLikes)}
      {tab('dislikes', t.statsMetricDislikes)}
      {tab('net', t.statsMetricNet)}
    </div>
  );
}

// Maps the selected metric to the value shown for a country row and its label.
function countryMetricValue(c: TrendingCountry, metric: CountryMetric, t: ReturnType<typeof useI18n>['t']) {
  switch (metric) {
    case 'likes':
      return { value: c.totalLikes, valueLabel: t.statsLikes };
    case 'dislikes':
      return { value: c.totalDislikes, valueLabel: t.statsDislikes };
    case 'net':
      return { value: c.totalLikes - c.totalDislikes, valueLabel: t.statsNet };
    default:
      return { value: c.totalLikes + c.totalDislikes, valueLabel: t.statsVotes };
  }
}

function StatsContent({ category, t }: { category: StatsCategory; t: ReturnType<typeof useI18n>['t'] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { country, setCountry } = useFilters();

  const isVoters = category === 'voters';
  const isCountries = category === 'countries';
  const isOnFire = category === 'onFire';

  // Metric rides in ?metric= (countries tab only); validated, total = default.
  const rawMetric = searchParams.get('metric');
  const metric: CountryMetric = VALID_METRICS.includes(rawMetric as CountryMetric)
    ? (rawMetric as CountryMetric)
    : 'total';
  const setMetric = (m: CountryMetric) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (m === 'total') next.delete('metric'); else next.set('metric', m);
      return next;
    }, { replace: true });
  };

  // Tab clicks change the path (each category is its own URL). Country rides in
  // the global ?country= (shared with the feed); metric is dropped off the
  // non-countries tabs to keep their URLs clean.
  const goToCategory = (cat: StatsCategory) => {
    const params = new URLSearchParams(location.search);
    if (cat !== 'countries') params.delete('metric');
    const qs = params.toString();
    navigate(`${CATEGORY_PATH[cat]}${qs ? `?${qs}` : ''}`, { replace: true });
  };

  const voters = useTopVoters(isVoters ? country : undefined);
  const onFire = useOnFireUsers(isOnFire ? country : undefined);
  const countries = useTrendingCountries(metric);

  const voterRows = voters.data?.topVoters ?? [];
  const onFireRows = onFire.data?.onFire ?? [];
  const countryRows = countries.data?.trendingCountries ?? [];

  const isLoading = isVoters ? voters.isLoading : isCountries ? countries.isLoading : onFire.isLoading;
  const isEmpty = isVoters
    ? voterRows.length === 0
    : isCountries
      ? countryRows.length === 0
      : onFireRows.length === 0;
  const description = isVoters
    ? t.statsVotersDescription
    : isCountries
      ? t.statsCountriesDescription
      : t.statsProfilesDescription;

  return (
    <div className="px-6 py-5 space-y-4">
      <CategoryTabs category={category} onChange={goToCategory} t={t} />

      {/* Trending countries is itself a country ranking, so a country filter
          is meaningless there - that tab swaps in a metric picker instead. */}
      {isCountries ? (
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.statsMetricLabel}</label>
          <MetricTabs metric={metric} onChange={setMetric} t={t} />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">{t.country}</label>
          <SelectField value={country ?? ''} onChange={(e) => setCountry(e.target.value || undefined)}>
            <option value="" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>{t.allCountries}</option>
            {ALL_COUNTRIES.map(({ code, name }) => (
              <option key={code} value={code} style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
                {getCountryFlag(code)} {name}
              </option>
            ))}
          </SelectField>
        </div>
      )}

      <p className="text-xs text-white/50 leading-snug min-h-[3rem]">{description}</p>

      {/* Lock the list to a full 10-row height (LIMIT=10 server-side) so switching
          tabs/metrics, or a thin pool, doesn't make the modal jump up and down.
          Looks empty on dev's sparse DB; prod fills all 10. */}
      <div className="min-h-[436px]">
      {isLoading ? (
        <p className="text-sm text-white/40 text-center py-6">{t.loading}</p>
      ) : isEmpty ? (
        <p className="text-sm text-white/30 py-6 text-center">{t.statsNoData}</p>
      ) : (
        <div className="space-y-0.5">
          {isVoters &&
            voterRows.map((v, i) => (
              <StatsRow
                key={v.id}
                id={v.id}
                displayName={v.displayName}
                avatarUrl={v.avatarUrl}
                countryCode={v.countryCode}
                rank={i}
                subtitle={`${v.activeProfiles} ${t.statsPostsLabel}`}
                value={v.totalVotesCast}
                valueLabel={t.statsVotes}
              />
            ))}
          {isCountries &&
            countryRows.map((c, i) => {
              const { value, valueLabel } = countryMetricValue(c, metric, t);
              return (
                <StatsCountryRow
                  key={c.countryCode}
                  countryCode={c.countryCode}
                  rank={i}
                  subtitle={`${c.activeProfiles} ${t.statsPostsLabel}`}
                  value={value}
                  valueLabel={valueLabel}
                />
              );
            })}
          {isOnFire &&
            onFireRows.map((u, i) => (
              <StatsRow
                key={u.id}
                id={u.id}
                displayName={u.displayName}
                avatarUrl={u.avatarUrl}
                countryCode={u.countryCode}
                rank={i}
                subtitle={`${u.activeProfiles} ${t.statsPostsLabel}`}
                value={u.totalVotes}
                valueLabel={t.statsVotes}
              />
            ))}
        </div>
      )}
      </div>
    </div>
  );
}

export function StatsModal({ category, onClose }: StatsModalProps) {
  const { t } = useI18n();

  return (
    <ModalShell onClose={onClose} title={t.statsTitle} icon={<StatsIcon />} maxWidth="max-w-lg">
      <StatsContent category={category} t={t} />
    </ModalShell>
  );
}
