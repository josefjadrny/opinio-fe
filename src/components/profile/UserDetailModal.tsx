import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useI18n } from '../../i18n/I18nContext';
import { Avatar } from './Avatar';
import { CountryFlag } from '../common/CountryFlag';
import { RoleBadge } from '../common/RoleBadge';
import { VoteButtons } from '../voting/VoteButtons';
import { formatNumber } from '../../utils/formatNumber';
import type { UserProfileSummary } from '../../types/api';

interface UserDetailModalProps {
  userId: string;
}

const LOCALE_TO_BCP47: Record<string, string> = { en: 'en-US', cs: 'cs-CZ', es: 'es-ES' };

function formatJoinDate(iso: string, locale: string) {
  const tag = LOCALE_TO_BCP47[locale] ?? 'en-US';
  return new Date(iso).toLocaleDateString(tag, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ShareUserButton({ userId, displayName }: { userId: string; displayName: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function handleShare() {
    const url = `${window.location.origin}/u/${userId}`;
    const title = `@${displayName} - Opinio`;
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

function ProfileRow({ profile, onOpen }: { profile: UserProfileSummary; onOpen: () => void }) {
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
        <VoteButtons profileId={profile.id} likes={profile.likes} dislikes={profile.dislikes} />
      </div>
    </div>
  );
}

export function UserDetailModal({ userId }: UserDetailModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { t, locale } = useI18n();
  const { data: user, isLoading, error } = useUser(userId);

  const close = () => navigate('/' + location.search);
  const openProfile = (profileId: string) => navigate('/p/' + profileId + location.search, {
    state: { fromUserId: userId, fromUserName: user?.displayName ?? null },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notFound = !!error;
  const hasAvatar = !!user?.avatarUrl;

  const fromProfileState = location.state as { fromProfileId?: string; fromProfileName?: string } | null;
  const BackToProfile = fromProfileState?.fromProfileId ? (
    <Link
      to={`/p/${fromProfileState.fromProfileId}${location.search}`}
      title={fromProfileState.fromProfileName ? `← ${fromProfileState.fromProfileName}` : 'Back'}
      aria-label={fromProfileState.fromProfileName ? `Back to ${fromProfileState.fromProfileName}` : 'Back'}
      className="text-white/40 hover:text-white/80 transition-colors p-1 -ml-1 shrink-0"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </Link>
  ) : null;

  const StatsBlock = user && (
    <div
      className="shrink-0 flex flex-col items-end gap-0.5"
      title={`${t.userLikesCast} · ${t.userDislikesCast}`}
    >
      <div className="flex items-center gap-2 text-sm tabular-nums leading-none">
        <span className="inline-flex items-baseline gap-1 text-positive font-semibold">
          <span className="text-[11px]">▲</span>
          {formatNumber(user.totalLikesCast)}
        </span>
        <span className="inline-flex items-baseline gap-1 text-negative font-semibold">
          <span className="text-[11px]">▼</span>
          {formatNumber(user.totalDislikesCast)}
        </span>
      </div>
      <span className="text-[9px] uppercase tracking-[0.08em] font-semibold text-white/40 leading-none">
        {t.userVotesCast}
      </span>
    </div>
  );

  const Header = user && (
    <>
      <Avatar
        name={user.displayName}
        imageUrl={user.avatarUrl}
        className="w-11 h-11 shrink-0"
        isAnonymous={!hasAvatar}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="font-semibold text-white truncate">@{user.displayName}</span>
          {user.countryCode && <CountryFlag code={user.countryCode} />}
        </div>
        <p className="text-[11px] text-white/30">{t.userJoined.replace('{date}', formatJoinDate(user.createdAt, locale))}</p>
      </div>
      {StatsBlock}
    </>
  );

  const ProfilesList = user && (
    <>
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1 mb-2">
        {t.userReportedProfiles}{user.profiles.length > 0 ? ` (${user.profiles.length})` : ''}
      </p>
      {user.profiles.length === 0 ? (
        <p className="text-sm text-white/30 py-4 text-center">{t.userNoProfiles}</p>
      ) : (
        <div className="space-y-1">
          {user.profiles.map((p) => (
            <ProfileRow key={p.id} profile={p} onOpen={() => openProfile(p.id)} />
          ))}
        </div>
      )}
    </>
  );

  const NotFoundView = (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Avatar name="?" imageUrl={null} className="w-12 h-12" isAnonymous />
      </div>
      <p className="text-base font-semibold text-white mb-1">{t.userNotFoundTitle}</p>
      <p className="text-sm text-white/40 mb-5 max-w-xs">{t.userNotFoundBody}</p>
      <button
        onClick={close}
        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
      >
        {t.userNotFoundCta}
      </button>
    </div>
  );

  const LoadingView = (
    <div className="px-6 py-10 text-center text-sm text-white/40">{t.loading}</div>
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
              {BackToProfile}
              {user ? Header : <span className="text-sm font-semibold text-white/60">{notFound ? t.userNotFoundLabel : ''}</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-3">
              {user && <ShareUserButton userId={user.id} displayName={user.displayName} />}
              <button onClick={close} className="text-white/40 hover:text-white/80 transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-14 space-y-4">
            {isLoading && LoadingView}
            {notFound && NotFoundView}
            {user && ProfilesList}
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
          {BackToProfile}
          {user ? Header : <span className="text-sm font-semibold text-white/60 flex-1">{notFound ? t.userNotFoundLabel : isLoading ? t.loading : ''}</span>}
          <div className="flex items-center gap-1 shrink-0">
            {user && <ShareUserButton userId={user.id} displayName={user.displayName} />}
            <button onClick={close} className="text-white/40 hover:text-white/80 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {isLoading && LoadingView}
        {notFound && NotFoundView}
        {user && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {ProfilesList}
          </div>
        )}
      </div>
    </div>
  );
}
