import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { SelectField } from '../common/SelectField';
import { Avatar } from '../profile/Avatar';
import { useI18n } from '../../i18n/I18nContext';
import { useTopProfiles, useTopVoters } from '../../hooks/useTopVoters';
import { getCountryFlag, getCountryName, ALL_COUNTRIES } from '../../utils/countries';
import type { TopProfile, TopVoter } from '../../types/api';

interface StatsModalProps {
  onClose: () => void;
}

type Category = 'voters' | 'profiles';

const StatsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

function rankCell(i: number) {
  if (i === 0) return <span className="text-sm">🥇</span>;
  if (i === 1) return <span className="text-sm">🥈</span>;
  if (i === 2) return <span className="text-sm">🥉</span>;
  return <span className="text-xs text-white/30">{i + 1}</span>;
}

function VoterRow({ voter, rank, votesLabel }: { voter: TopVoter; rank: number; votesLabel: string }) {
  const location = useLocation();
  return (
    <Link
      to={`/u/${voter.id}${location.search}`}
      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
    >
      <span className="w-5 shrink-0 text-center">{rankCell(rank)}</span>
      <span className="text-base leading-none shrink-0">
        {voter.countryCode ? getCountryFlag(voter.countryCode) : '🌍'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">@{voter.displayName}</p>
        {voter.countryCode && (
          <p className="text-[11px] text-white/30 truncate leading-tight">{getCountryName(voter.countryCode)}</p>
        )}
      </div>
      <span className="text-xs font-medium tabular-nums shrink-0 text-white/80">
        {voter.totalVotesCast.toLocaleString()} <span className="text-white/40">{votesLabel}</span>
      </span>
    </Link>
  );
}

function ProfileRow({ profile, rank, votesLabel }: { profile: TopProfile; rank: number; votesLabel: string }) {
  const location = useLocation();
  return (
    <Link
      to={`/p/${profile.id}${location.search}`}
      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
    >
      <span className="w-5 shrink-0 text-center">{rankCell(rank)}</span>
      <Avatar name={profile.name} imageUrl={profile.imageUrl} className="w-7 h-7" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{profile.name}</p>
        {profile.countryCode && (
          <p className="text-[11px] text-white/30 truncate leading-tight">
            {getCountryFlag(profile.countryCode)} {getCountryName(profile.countryCode)}
          </p>
        )}
      </div>
      <span className="text-xs font-medium tabular-nums shrink-0 text-white/80">
        {profile.totalVotes.toLocaleString()} <span className="text-white/40">{votesLabel}</span>
      </span>
    </Link>
  );
}

function CategoryTabs({ category, onChange, t }: { category: Category; onChange: (c: Category) => void; t: ReturnType<typeof useI18n>['t'] }) {
  const tab = (key: Category, label: string) => {
    const active = category === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
          active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
        }`}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="flex gap-1 p-1 bg-black/20 border border-border rounded-lg">
      {tab('profiles', t.statsCategoryProfiles)}
      {tab('voters', t.statsCategoryVoters)}
    </div>
  );
}

function StatsContent({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  const [country, setCountry] = useState<string>('');
  const [category, setCategory] = useState<Category>('profiles');
  const isVoters = category === 'voters';
  const voters = useTopVoters(isVoters ? country || undefined : undefined);
  const profiles = useTopProfiles(!isVoters ? country || undefined : undefined);

  const isLoading = isVoters ? voters.isLoading : profiles.isLoading;
  const voterRows = voters.data?.topVoters ?? [];
  const profileRows = profiles.data?.topProfiles ?? [];
  const isEmpty = isVoters ? voterRows.length === 0 : profileRows.length === 0;
  const description = isVoters ? t.statsVotersDescription : t.statsProfilesDescription;

  return (
    <div className="px-6 py-5 space-y-4">
      <CategoryTabs category={category} onChange={setCategory} t={t} />

      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">{t.country}</label>
        <SelectField value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="" style={{ backgroundColor: '#1a1a2e', color: 'white' }}>{t.allCountries}</option>
          {ALL_COUNTRIES.map(({ code, name }) => (
            <option key={code} value={code} style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
              {getCountryFlag(code)} {name}
            </option>
          ))}
        </SelectField>
      </div>

      <p className="text-xs text-white/50 leading-relaxed">{description}</p>

      {isLoading ? (
        <p className="text-sm text-white/40 text-center py-6">{t.loading}</p>
      ) : isEmpty ? (
        <p className="text-sm text-white/30 py-6 text-center">{t.statsNoData}</p>
      ) : (
        <div className="space-y-0.5">
          {isVoters
            ? voterRows.map((v, i) => <VoterRow key={v.id} voter={v} rank={i} votesLabel={t.statsVotes} />)
            : profileRows.map((p, i) => <ProfileRow key={p.id} profile={p} rank={i} votesLabel={t.statsVotes} />)}
        </div>
      )}
    </div>
  );
}

export function StatsModal({ onClose }: StatsModalProps) {
  const { t } = useI18n();

  return (
    <ModalShell onClose={onClose} title={t.statsTitle} icon={<StatsIcon />} maxWidth="max-w-lg">
      <StatsContent t={t} />
    </ModalShell>
  );
}
