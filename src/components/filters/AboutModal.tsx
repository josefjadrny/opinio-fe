import { useNavigate, useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { TierCard, type TierTone } from '../common/TierCard';
import { VoteBullets } from '../common/VoteBullets';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useBillingRedirect } from '../../hooks/useBillingRedirect';
import { createCheckoutSession } from '../../api/client';
import { useSignIn } from '../auth/SignInContext';

interface AboutModalProps {
  onClose: () => void;
}

const AboutIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
  </svg>
);

// Lucide-style stroked principle icons — small, accent-tinted, fixed size for alignment.
const principleIconCls = 'w-4 h-4 mt-0.5 shrink-0 text-positive';
const ClockIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={principleIconCls}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const ShieldIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={principleIconCls}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
// Lucide message-circle — speech bubble, reads as "voice" more directly than the </> code glyph did.
const VoiceIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={principleIconCls}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export function AboutModal({ onClose }: AboutModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: me } = useMe();
  const { promptSignIn } = useSignIn();
  const { loading: checkoutLoading, handleClick: handleCheckout } = useBillingRedirect(createCheckoutSession);
  const tier = me?.user?.tier;
  const isAnonymous = !tier || tier === 'anonymous';
  const isAlreadySupporter = tier === 'supporter' || tier === 'admin';
  // admin shares Supporter's 5/hr cap, so it lights up the Supporter card.
  const activeTier: TierTone = isAnonymous
    ? 'muted'
    : tier === 'registered'
      ? 'accent'
      : 'positive';
  // Anonymous → sign-in opens; signed-in users already cleared the registered bar.
  const onRegisteredClick = isAnonymous ? promptSignIn : undefined;
  // Anonymous → sign in first; registered → Stripe Checkout; supporter/admin → no action.
  const onSupporterClick = isAlreadySupporter
    ? undefined
    : isAnonymous
      ? promptSignIn
      : handleCheckout;

  return (
    <ModalShell onClose={onClose} title={t.about} icon={<AboutIcon />} maxWidth="max-w-md">
      <div className="px-6 pt-6 pb-4 space-y-6">
        {/* Hero — centered brand + tagline */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <img src="/favicon.svg" alt="" className="w-9 h-9" />
            <span className="text-2xl font-bold text-accent tracking-tight">{t.appName}</span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{t.brandTagline}</p>
        </div>

        {/* Principle bullets — shared with WelcomeModal so both headers match */}
        <VoteBullets />

        {/* Tier comparison — 3-column grid */}
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-2">{t.aboutTiersTitle}</p>
          <div className="grid grid-cols-3 gap-2">
            <TierCard label={t.aboutTierAnonymous} count={1} unit={t.aboutVotesPerHour} tone="muted" active={activeTier === 'muted'} />
            <TierCard
              label={t.aboutTierRegistered}
              count={3}
              unit={t.aboutVotesPerHour}
              promo={t.aboutTierRegisteredPromo}
              tone="accent"
              active={activeTier === 'accent'}
              onClick={onRegisteredClick}
            />
            <div className="relative">
              <TierCard
                label={t.aboutTierSupporter}
                count={5}
                unit={t.aboutVotesPerHour}
                promo={t.aboutTierSupporterPromo}
                trailingIcon={<span aria-hidden className="text-[11px] leading-none">❤️</span>}
                tone="positive"
                active={activeTier === 'positive'}
                onClick={onSupporterClick}
                disabled={checkoutLoading}
              />
              {/* Price tag — top-right corner overhang, mirroring the active-tier
                  badge position but only shown when the user is NOT a supporter
                  (mutually exclusive with the active badge, so they never collide).
                  Doesn't add to card height because it's absolutely positioned. */}
              {!isAlreadySupporter && (
                <span className="pointer-events-none absolute -top-[7px] -right-1 whitespace-nowrap rounded-full bg-amber-400 text-amber-950 text-[12px] font-bold px-2 py-0.5 shadow leading-none">
                  {t.aboutSupporterPriceNote}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Principles — with proper icons */}
        <div>
          <p className="text-sm font-semibold text-white mb-3">{t.aboutPrinciplesTitle}</p>
          <ul className="space-y-3 text-sm text-white/65">
            <li className="flex gap-3">
              <ClockIcon />
              <span>
                <span className="text-white/90 font-medium">{t.aboutPrincipleTimeTitle}.</span>{' '}{t.aboutPrincipleTimeBody}
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldIcon />
              <span>
                <span className="text-white/90 font-medium">{t.aboutPrinciplePrivacyTitle}.</span>{' '}{t.aboutPrinciplePrivacyBody}
              </span>
            </li>
            <li className="flex gap-3">
              <VoiceIcon />
              <span>
                <span className="text-white/90 font-medium">{t.aboutPrincipleVoiceTitle}.</span>{' '}{t.aboutPrincipleVoiceBody}.
              </span>
            </li>
          </ul>
        </div>

        {/* EU origin / Made in CZ / Hosted in DE — moved above Terms so we lead with the proud signal */}
        <div className="!mb-2 text-center text-xs text-white/75 font-medium">
          <span>🇪🇺 {t.aboutEuOrigin}</span>
          <span className="mx-1.5 text-white/30">·</span>
          <span>🇨🇿 {t.aboutMadeInCzechia}</span>
          <span className="mx-1.5 text-white/30">·</span>
          <span>🇩🇪 {t.aboutHostedInGermany}</span>
        </div>

        {/* Terms · Privacy — bottom links, full text-sm body size (not fine-print) */}
        <div className="!mt-2 flex items-center justify-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => navigate('/terms' + location.search)}
            className="text-accent hover:text-accent/80 transition-colors"
          >
            {t.terms}
          </button>
          <span className="text-white/25">·</span>
          <button
            type="button"
            onClick={() => navigate('/privacy' + location.search)}
            className="text-accent hover:text-accent/80 transition-colors"
          >
            {t.privacy}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

