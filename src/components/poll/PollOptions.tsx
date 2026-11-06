import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Profile } from '../../types/profile';
import { useMe } from '../../hooks/useMe';
import { useVote } from '../../hooks/useVote';
import { useTurnstile } from '../../hooks/useTurnstile';
import { useCountdown } from '../../hooks/useCountdown';
import { useI18n } from '../../i18n/I18nContext';
import { plural } from '../../i18n/pollStrings';
import { useSignIn } from '../auth/SignInContext';
import { OptionAvatar } from './OptionAvatar';
import { formatNumber } from '../../utils/formatNumber';
import { PollSummary } from './PollSummary';

// The tick on my answer: a disc in the answer's colour.
function MineBadge({ color, className = '' }: { color: string; className?: string }) {
  return (
    <span aria-hidden className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ring-2 ring-surface-light ${className}`} style={{ background: color }}>
      <svg className="w-2.5 h-2.5 text-black/75" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

// "in 23 hours" / "in 12 minutes" for the anonymous next-vote time.
function useRelativeIn(iso: string | null): string | null {
  const { locale } = useI18n();
  const { remainingMs } = useCountdown(iso);
  if (remainingMs == null) return null;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minutes = Math.ceil(remainingMs / 60_000);
  return minutes >= 60 ? rtf.format(Math.round(minutes / 60), 'hour') : rtf.format(minutes, 'minute');
}

interface PollOptionsProps {
  /** Size of an answer's round picture: the poll picture's size on that page. */
  pictureClass?: string;
  profile: Profile;
  /** The page's "see original" toggle: show the answers as the author wrote them. */
  showingOriginal?: boolean;
  /** Votes + countries figures under the answers. The desktop window shows
   *  them over its country list instead. */
  summary?: boolean;
}

// The poll's answers, which are also its vote buttons (POLLS-DESIGN.md
// section 8): results are visible to everyone, always - tapping an answer
// votes. Registered voters can change their vote; anonymous votes are final
// and limited to one per 24h, with Turnstile run on the press.
export function PollOptions({ profile, showingOriginal = false, pictureClass = 'w-10 h-10', summary = true }: PollOptionsProps) {
  const { t, p, locale } = useI18n();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const voteMutation = useVote();
  const { containerRef, getToken } = useTurnstile();
  const { promptSignIn } = useSignIn();
  const [changing, setChanging] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegistered = !!me?.user && me.user.tier !== 'anonymous';
  const hasCountry = me === undefined || !!me.user.countryCode;
  const canVoteNow = isRegistered || (me?.voteAllowance.canVote ?? true);
  const myVote = profile.myVote ?? null;
  const voted = myVote !== null;
  const nextIn = useRelativeIn(!isRegistered && !canVoteNow ? me?.voteAllowance.nextVoteAt ?? null : null);

  const results = profile.results;
  // One set of numbers: everyone who voted. Votes keep a signed-in flag in the
  // database, but no view splits by it - a "signed-in only" switch read as
  // "the main numbers may be fake".
  const counts = new Map(results?.options.map((o) => [o.optionId, o.n]) ?? []);
  const total = results ? results.total : profile.voteCount;

  // Which taps vote: not voted yet and allowed, or a registered voter in
  // "change vote" mode. Everyone else sees the same bars, read-only.
  const tappable = hasCountry && !verifying && !voteMutation.isPending
    && (voted ? isRegistered && changing : canVoteNow);

  const handleTap = async (optionId: string) => {
    setError(null);
    if (!hasCountry) return;
    if (!isRegistered && !canVoteNow && !voted) { promptSignIn(); return; }
    if (!tappable) return;
    if (voted && optionId === myVote) { setChanging(false); return; }
    let turnstileToken: string | undefined;
    if (!isRegistered) {
      try {
        setVerifying(true);
        turnstileToken = await getToken();
      } catch {
        setError(p.voteFailed);
        return;
      } finally {
        setVerifying(false);
      }
    }
    voteMutation.mutate(
      { profileId: profile.id, optionId, turnstileToken },
      {
        onSuccess: () => setChanging(false),
        onError: (err) => {
          const msg = (err as Error).message;
          if (msg === 'anon_limit' || msg === 'already_voted') {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
          }
          setError(msg === 'already_voted' ? p.alreadyVoted : msg === 'anon_limit' ? p.signInToKeepVoting : p.voteFailed);
        },
      },
    );
  };

  // Most votes first, the author's order breaking ties - but ranked once, when
  // the poll opens with its results, and then held. Re-sorting on every 30s
  // refresh or after a vote moved rows under the finger mid-tap. Colours belong
  // to the answer, so the ranking never repaints one.
  const rankKey = `${profile.id}:${results ? 1 : 0}:${profile.options.map((o) => o.id).join(',')}`;
  const [ranked, setRanked] = useState<{ key: string; ids: string[] } | null>(null);
  if (ranked?.key !== rankKey) {
    setRanked({
      key: rankKey,
      ids: [...profile.options]
        .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.position - b.position)
        .map((o) => o.id),
    });
  }
  const byId = new Map(profile.options.map((o) => [o.id, o]));
  const orderedOptions = ranked?.key === rankKey
    ? ranked.ids.map((id) => byId.get(id)!).filter(Boolean)
    : profile.options;
  const withPictures = profile.options.some((x) => x.imageUrl);
  const leader = total > 0 ? Math.max(...profile.options.map((o) => counts.get(o.id) ?? 0)) : -1;

  return (
    <div>
      <div className="space-y-2" role="list">
        {orderedOptions.map((o, i) => {
          const n = counts.get(o.id) ?? 0;
          const pct = total > 0 ? Math.round((n / total) * 100) : 0;
          const mine = o.id === myVote;
          const leading = n > 0 && n === leader;
          const color = o.color;
          const pending = voteMutation.isPending && voteMutation.variables?.optionId === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="listitem"
              onClick={() => handleTap(o.id)}
              disabled={!tappable && !(!isRegistered && !canVoteNow && !voted)}
              aria-pressed={mine}
              aria-label={`${showingOriginal ? o.originalText : o.text}: ${pct}%, ${plural(p.votes, locale, n, formatNumber)}${mine ? `, ${p.yourVote}` : ''}`}
              className={`group relative w-full rounded-2xl text-left px-3 transition-[background-color,box-shadow,transform] duration-200 ${
                withPictures ? 'py-2' : 'py-3'
              } ${mine ? '' : 'bg-white/[0.035] ring-1 ring-white/[0.07]'} ${
                tappable ? 'cursor-pointer hover:bg-white/[0.07] hover:ring-white/20 active:scale-[0.99]' : 'cursor-default'
              } ${pending ? 'animate-pulse' : ''}`}
              // My answer wears its own colour: a ring and a faint wash of it.
              style={mine ? { boxShadow: `inset 0 0 0 2px ${color}`, background: `color-mix(in srgb, ${color} 12%, transparent)` } : undefined}
            >
              <span className="flex items-center gap-3">
                {withPictures && (
                  <span className="relative shrink-0">
                    <OptionAvatar color={color} imageUrl={o.imageUrl} className={pictureClass} />
                    {mine && <MineBadge color={color} className="absolute -right-1 -bottom-1" />}
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2.5">
                    {!withPictures && (mine
                      ? <MineBadge color={color} />
                      : <span aria-hidden className="w-2.5 h-2.5 mx-[3px] rounded-full shrink-0" style={{ background: color }} />)}
                    <span className="flex-1 min-w-0 text-base font-medium text-white leading-snug break-words">
                      {showingOriginal ? o.originalText : o.text}
                    </span>
                    <span className="shrink-0 text-[13px] tabular-nums text-text-secondary">{formatNumber(n)}</span>
                    <span className={`shrink-0 min-w-[3rem] text-right text-[17px] tabular-nums leading-none ${leading ? 'font-bold text-white' : 'font-semibold text-white/85'}`}>{pct}%</span>
                  </span>
                  {/* The answer's share: a track with its colour grown from the left. */}
                  <span aria-hidden className="mt-2 block h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <span
                      className="block h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${pct}%`, background: color, transformOrigin: 'left', animation: 'bar-fill 0.6s ease-out both', animationDelay: `${i * 60}ms` }}
                    />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Turnstile renders here only when Cloudflare wants an interaction. */}
      <div ref={containerRef} className="flex justify-center empty:hidden mt-2" />

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-secondary empty:hidden">
        {!hasCountry ? (
          <span>{isRegistered ? t.noCountryWarningRegistered : t.noCountryWarning}</span>
        ) : verifying ? (
          <span>{p.verifying}</span>
        ) : error ? (
          <span className="text-negative-soft">{error}</span>
        ) : voted ? (
          isRegistered ? (
            <button
              type="button"
              onClick={() => setChanging((v) => !v)}
              className="font-medium text-white/80 hover:text-white underline underline-offset-2 decoration-white/30"
            >
              {changing ? p.keepVote : p.changeVote}
            </button>
          ) : null
        ) : canVoteNow ? (
          // Registered voters need no line here: the answers are the buttons.
          !isRegistered && (
            <span>
              {p.anonHint}{' '}
              <button type="button" onClick={promptSignIn} className="font-medium text-white/85 hover:text-white underline underline-offset-2 decoration-white/30">
                {p.signInForMore}
              </button>
            </span>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={promptSignIn}
              className="rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {p.signInToKeepVoting}
            </button>
            {nextIn && <span>{p.nextVoteIn.replace('{time}', nextIn)}</span>}
          </>
        )}
      </div>

      {summary && (
        <div className="mt-4">
          <PollSummary profile={profile} />
        </div>
      )}
    </div>
  );
}
