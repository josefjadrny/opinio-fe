import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useI18n } from '../../i18n/I18nContext';
import { useCountries } from '../../hooks/useCountries';
import { useCountryDiscussed } from '../../hooks/useCountryDiscussed';
import { getCountryFlag, getCountryName, isKnownCountry } from '../../utils/countries';
import { formatNumber } from '../../utils/formatNumber';
import { Avatar } from '../profile/Avatar';
import { CountryFlag } from '../common/CountryFlag';
import { RoleBadge } from '../common/RoleBadge';
import { VoteButtons } from '../voting/VoteButtons';
import type { Profile } from '../../types/profile';

interface CountryDetailModalProps {
  countryCode: string;
}

function ShareCountryButton({ code, name }: { code: string; name: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function handleShare() {
    const url = `${window.location.origin}/c/${code}`;
    const title = `${name} - Opinio`;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title, url }); return; } catch { return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.linkCopied, url);
    }
  }
  return (
    <button
      onClick={handleShare}
      title={copied ? t.linkCopied : t.share}
      aria-label={t.share}
      className="text-white/40 hover:text-white/80 transition-colors p-1 shrink-0"
    >
      {copied ? (
        <svg className="w-5 h-5 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )}
    </button>
  );
}

function ProfileRow({ profile, onOpen }: { profile: Profile; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg ring-1 ring-transparent hover:bg-surface-light hover:ring-white/10 transition-all duration-150 cursor-pointer"
    >
      <Avatar name={profile.name} imageUrl={profile.imageUrl} className="w-9 h-9 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
          <span className="font-semibold text-white truncate min-w-0 flex-shrink">{profile.name}</span>
          <CountryFlag code={profile.countryCode} />
          <RoleBadge role={profile.role} />
        </div>
        <p className="text-[13px] text-text-secondary truncate">{profile.description}</p>
      </div>
      <div className="shrink-0">
        <VoteButtons
          profileId={profile.id}
          likes={profile.likes}
          dislikes={profile.dislikes}
          reverseVotes={profile.dislikes > profile.likes}
        />
      </div>
    </div>
  );
}

function ProfilesList({
  profiles,
  loading,
  t,
  onOpen,
}: {
  profiles: Profile[];
  loading: boolean;
  t: { loading: string; noProfiles: string };
  onOpen: (id: string) => void;
}) {
  if (loading && profiles.length === 0) {
    return <p className="text-sm text-white/30 py-6 text-center">{t.loading}</p>;
  }
  if (profiles.length === 0) {
    return <p className="text-sm text-white/30 py-6 text-center">{t.noProfiles}</p>;
  }
  return (
    <div className="space-y-1">
      {profiles.map((p) => (
        <ProfileRow key={p.id} profile={p} onOpen={() => onOpen(p.id)} />
      ))}
    </div>
  );
}

export function CountryDetailModal({ countryCode }: CountryDetailModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { t } = useI18n();

  const code = countryCode.toUpperCase();
  const notFound = !isKnownCountry(code);
  const name = getCountryName(code);
  const flag = getCountryFlag(code);
  const { data } = useCountries();
  const counts = data?.countries.find((c) => c.code === code) ?? { likes: 0, dislikes: 0 };
  // Skip the discussed fetch for an unknown code - there's nothing to load and
  // the API would just 404.
  const { data: countryData, isLoading: profilesLoading } = useCountryDiscussed(notFound ? '' : code);
  const profiles = countryData?.profiles ?? [];

  const close = () => navigate('/' + location.search);
  const openProfile = (profileId: string) => navigate('/p/' + profileId + location.search, {
    state: { fromCountryCode: code, fromCountryName: name },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Header = (
    <>
      <span className="text-3xl leading-none shrink-0" aria-hidden>{flag}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">{name}</div>
        <p className="text-[11px] text-white/30 uppercase tracking-wider">{code}</p>
      </div>
      <div
        className="shrink-0 flex items-center gap-2 text-sm tabular-nums leading-none"
        title={`${formatNumber(counts.likes)} likes · ${formatNumber(counts.dislikes)} dislikes`}
      >
        <span className="inline-flex items-baseline gap-1 text-positive font-semibold">
          <span className="text-[11px]">▲</span>
          {formatNumber(counts.likes)}
        </span>
        <span className="inline-flex items-baseline gap-1 text-negative font-semibold">
          <span className="text-[11px]">▼</span>
          {formatNumber(counts.dislikes)}
        </span>
      </div>
    </>
  );

  const NotFoundLabel = (
    <span className="text-sm font-semibold text-white/60 flex-1">{t.countryNotFoundLabel}</span>
  );

  const NotFoundView = (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.5 3.75-5.5 3.75-9S14.5 5.5 12 3m0 18c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3M3.6 9h16.8M3.6 15h16.8" />
        </svg>
      </div>
      <p className="text-base font-semibold text-white mb-1">{t.countryNotFoundTitle}</p>
      <p className="text-sm text-white/40 mb-5 max-w-xs">{t.countryNotFoundBody}</p>
      <button
        onClick={close}
        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
      >
        {t.countryNotFoundCta}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={close} />
        <div className="relative bg-surface border-t border-border rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {notFound ? NotFoundLabel : Header}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-3">
              {!notFound && <ShareCountryButton code={code} name={name} />}
              <button onClick={close} title={t.close} aria-label={t.close} className="text-white/40 hover:text-white/80 transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-14 space-y-4">
            {notFound ? NotFoundView : (
              <ProfilesList
                profiles={profiles}
                loading={profilesLoading}
                t={t}
                onOpen={openProfile}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center pointer-events-none">
      <div className="absolute bottom-0 left-0 right-0 h-[55vh] bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="bg-surface-light border border-border rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-4 flex flex-col max-h-[calc(100dvh-10rem)] mb-16 overflow-hidden pointer-events-auto">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
          {notFound ? NotFoundLabel : Header}
          <div className="flex items-center gap-1 shrink-0">
            {!notFound && <ShareCountryButton code={code} name={name} />}
            <button onClick={close} title={t.close} aria-label={t.close} className="text-white/40 hover:text-white/80 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {notFound ? NotFoundView : (
            <ProfilesList
              profiles={profiles}
              loading={profilesLoading}
              t={t}
              onOpen={openProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}
