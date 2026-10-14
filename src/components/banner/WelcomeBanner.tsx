import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { markWelcomeSeen, useWelcomeSeen } from '../../utils/welcomeSeen';
import { LogoMark } from '../common/LogoMark';
import { WASH } from '../common/wash';

// The welcome, offered rather than imposed: a slim strip under the header for
// a signed-out first-time visitor, whose button opens the /welcome window.
// It replaced a window that opened by itself over the home page - Googlebot is
// a signed-out first-time visitor on every crawl, so it rendered the home page
// under that window every time, and a layer over the content on arrival is
// what Google's intrusive-interstitial guidance warns about.
//
// Same slot, fold and height variable as AndroidAppBanner, which waits until
// this one is done so the two never stack.
const REVEAL_DELAY_MS = 2_500;
const FOLD_MS = 360;

export function WelcomeBanner() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: me } = useMe();
  const seen = useWelcomeSeen();

  const isAnon = !!me && (!me.user || me.user.tier === 'anonymous');
  const wanted = isAnon && !seen && location.pathname !== '/welcome';

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);

  // Reveal a moment after arrival, so the page is usable before it asks.
  useEffect(() => {
    if (!wanted || mounted) return;
    const id = window.setTimeout(() => setMounted(true), REVEAL_DELAY_MS);
    return () => clearTimeout(id);
  }, [wanted, mounted]);

  // Open on the frame after mounting (the fold needs a collapsed state to
  // animate from). It folds away the moment it stops being wanted - dismissed
  // here, or the /welcome window opened or closed - and unmounts
  // once the fold has run.
  useEffect(() => {
    if (!mounted) return;
    if (wanted) {
      const id = requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(id);
    }
    const id = window.setTimeout(() => { setOpen(false); setMounted(false); }, FOLD_MS);
    return () => clearTimeout(id);
  }, [mounted, wanted]);
  const shown = open && wanted;

  // The strip pushes the header down; the mobile sheets position against it
  // through this variable (see AndroidAppBanner).
  useEffect(() => {
    const root = document.documentElement;
    if (!shown || !innerRef.current) return;
    root.style.setProperty('--app-banner-h', `${innerRef.current.getBoundingClientRect().height}px`);
    return () => { root.style.removeProperty('--app-banner-h'); };
  }, [shown]);

  if (!mounted) return null;

  // Only opens the window: closing it is what marks the welcome seen
  // (WelcomeRoute), and the strip stays hidden while it is open. Marking it
  // here instead let the viewer-mode prompt, which waits for the welcome, see
  // the flag before the route change and jump in over it.
  const howItWorks = () => navigate('/welcome' + location.search);

  return (
    <div className="app-banner shrink-0" data-open={shown}>
      <div>
        <div
          ref={innerRef}
          className="app-banner-inner user-header-wash border-b border-white/10 px-3 py-2"
          style={WASH}
        >
          <div className="mx-auto max-w-3xl flex items-center gap-3">
            <LogoMark className="w-9 h-9 shrink-0" />
            <p className="min-w-0 flex-1 line-clamp-2 text-sm md:text-base leading-tight font-semibold text-white/90">{t.welcomeBannerText}</p>
            <button
              type="button"
              onClick={howItWorks}
              className="shrink-0 rounded-full bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-70 cursor-pointer"
            >
              {t.welcomeBannerCta}
            </button>
            <button
              type="button"
              onClick={markWelcomeSeen}
              aria-label={t.appBannerDismiss}
              className="shrink-0 -mr-1 p-1.5 text-white/40 transition-colors hover:text-white/70 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
