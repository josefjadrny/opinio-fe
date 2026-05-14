import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '../profile/Avatar';
import { RoleBadge } from '../common/RoleBadge';
import { useRealtimeProfiles } from '../../hooks/useRealtimeProfiles';
import { useI18n } from '../../i18n/I18nContext';
import { getCountryFlag } from '../../utils/countries';

const FADE_IN_MS = 500;
const HOLD_MS = 6_000;
const FADE_OUT_MS = 500;
const GAP_MS = 3_000;

type Phase = 'in' | 'hold' | 'out' | 'gap';

export function HotBanner({ enabled }: { enabled: boolean }) {
  const { next, dequeue } = useRealtimeProfiles(enabled);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('in');

  useEffect(() => {
    if (!next) return;
    setPhase('in');
    const toHold = window.setTimeout(() => setPhase('hold'), FADE_IN_MS);
    const toOut = window.setTimeout(() => setPhase('out'), FADE_IN_MS + HOLD_MS);
    const toGap = window.setTimeout(() => setPhase('gap'), FADE_IN_MS + HOLD_MS + FADE_OUT_MS);
    const toNext = window.setTimeout(() => {
      dequeue();
    }, FADE_IN_MS + HOLD_MS + FADE_OUT_MS + GAP_MS);

    return () => {
      clearTimeout(toHold);
      clearTimeout(toOut);
      clearTimeout(toGap);
      clearTimeout(toNext);
    };
  }, [next, dequeue]);

  // During the 3s gap the banner must not exist in DOM — otherwise its
  // (invisible at opacity 0) hitbox would capture clicks and navigate to the
  // profile that just faded out.
  if (!enabled || !next || phase === 'gap') return null;

  const go = () => navigate('/p/' + next.id + location.search);
  const animation =
    phase === 'in'
      ? `hot-banner-in ${FADE_IN_MS}ms ease-out forwards`
      : phase === 'out'
        ? `hot-banner-out ${FADE_OUT_MS}ms ease-in forwards`
        : undefined;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 top-2 z-20 w-[min(700px,90vw)] pointer-events-none"
      data-testid="hot-banner-wrapper"
    >
      <div
        role="link"
        tabIndex={0}
        aria-label={`Open ${next.name}`}
        onClick={go}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }}
        data-testid="hot-banner"
        className="cursor-pointer bg-surface/85 backdrop-blur-md
                   border border-orange-500/70 rounded-2xl
                   flex items-center gap-3 px-4 py-3 select-none
                   hover:bg-surface/95 transition-colors pointer-events-auto"
        style={{
          animation,
          opacity: phase === 'hold' ? 1 : undefined,
          boxShadow: '0 0 0 1px rgba(249,115,22,0.35), 0 10px 30px -10px rgba(249,115,22,0.55), 0 18px 50px -20px rgba(0,0,0,0.6)',
        }}
      >
        <Avatar name={next.name} imageUrl={next.imageUrl} className="w-12 h-12" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase font-bold tracking-widest text-orange-400 mb-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5 align-middle animate-pulse" />
            {t.justReported}
          </div>
          <div className="flex items-center gap-2 mb-0.5">
            <RoleBadge role={next.role} />
            <span className="text-white text-sm font-semibold truncate">{next.name}</span>
          </div>
          <div className="text-white/60 text-xs line-clamp-2">{next.description}</div>
        </div>
        <span className="text-2xl shrink-0" title={next.countryCode}>{getCountryFlag(next.countryCode)}</span>
      </div>
    </div>
  );
}
