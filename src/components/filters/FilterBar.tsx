import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { CountryFilter } from './CountryFilter';
import { RoleFilter } from './RoleFilter';
import { MobileFilterSheet } from './MobileFilterSheet';
import { useFilters } from '../../context/useFilters';
import { ProfileMenu } from './ProfileMenu';
import { useMe } from '../../hooks/useMe';

interface FilterBarProps {
  onAddProfile: () => void;
}

export function FilterBar({ onAddProfile }: FilterBarProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isLoading: meLoading } = useMe();
  const { country, roles, setCountry, setRoles } = useFilters();
  const hasFilters = !!(country || roles.length);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 mr-2 hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
          >
            <img src="/favicon.svg" alt="Opinio" className="w-7 h-7" />
            <h1 className="text-xl font-bold text-accent tracking-tight">{t.appName}</h1>
          </button>
          {/* Desktop filters — md+ only */}
          <div className="hidden md:flex items-center gap-3">
            <CountryFilter />
            <RoleFilter />
            <button
              onClick={() => { setCountry(undefined); setRoles([]); }}
              disabled={!hasFilters}
              className="text-sm font-medium px-4 py-1.5 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-white/30 text-white hover:enabled:border-white/60 whitespace-nowrap"
            >
              {t.clearFilters}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile filter icon — hidden at md+ */}
          <button
            onClick={() => setFilterSheetOpen(true)}
            className="relative md:hidden p-2 rounded-lg border border-white/30 text-white hover:border-white/60 hover:bg-white/5 transition-colors"
            aria-label="Filters"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {hasFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
          {!meLoading && (
            <button
              onClick={onAddProfile}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors border-white/30 text-white hover:border-white/60 hover:bg-white/5"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="hidden lg:inline">{t.addProfile}</span>
            </button>
          )}
          <ProfileMenu />
        </div>
      </div>
      {filterSheetOpen && <MobileFilterSheet onClose={() => setFilterSheetOpen(false)} />}
    </>
  );
}
