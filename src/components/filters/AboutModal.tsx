import { useNavigate, useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { type TierTone } from '../common/TierCard';
import { BrandHero } from '../common/BrandHero';
import { Plans } from '../common/Plans';
import { VoteBullets } from '../common/VoteBullets';
import { Principles } from '../common/Principles';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useBillingRedirect } from '../../hooks/useBillingRedirect';
import { createCheckoutSession } from '../../api/client';
import { useSignIn } from '../auth/SignInContext';
import { isTwa } from '../../utils/twa';
import { FlagImg } from '../common/CountryFlag';

interface AboutModalProps {
  onClose: () => void;
}

const AboutIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
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
  // Inside the Play TWA the Stripe purchase is suppressed (Play Billing policy):
  // the plans stay visible for information, but the Supporter card isn't clickable.
  const onSupporterClick = isTwa()
    ? undefined
    : isAlreadySupporter
      ? undefined
      : isAnonymous
        ? promptSignIn
        : handleCheckout;

  return (
    <ModalShell onClose={onClose} title={t.about} icon={<AboutIcon />} maxWidth="max-w-md" desktopScrollable>
      <div className="px-6 pt-6 pb-4 space-y-6">
        {/* Hero — centered brand + tagline */}
        <BrandHero />

        {/* Principle bullets — shared with WelcomeModal so both headers match */}
        <VoteBullets />

        {/* Tier comparison — interactive: sign-in / Stripe Checkout + price tag */}
        <Plans
          activeTier={activeTier}
          onRegisteredClick={onRegisteredClick}
          onSupporterClick={onSupporterClick}
          supporterDisabled={checkoutLoading}
          showSupporterPrice={!isAlreadySupporter}
        />

        {/* Principles — shared with WelcomeModal */}
        <Principles />

        {/* EU origin / Made in CZ / Hosted in DE — moved above Terms so we lead with the proud signal */}
        <div className="!mb-2 text-center text-xs text-white/75 font-medium">
          <span className="inline-flex items-center gap-1"><FlagImg code="EU" /> {t.aboutEuOrigin}</span>
          <span className="mx-1.5 text-white/30">·</span>
          <span className="inline-flex items-center gap-1"><FlagImg code="CZ" /> {t.aboutMadeInCzechia}</span>
          <span className="mx-1.5 text-white/30">·</span>
          <span className="inline-flex items-center gap-1"><FlagImg code="DE" /> {t.aboutHostedInGermany}</span>
        </div>

        {/* Facebook — subtle brand-blue link; drives followers + a crawlable sameAs signal */}
        <div className="!mt-3 flex justify-center">
          <a
            href="https://www.facebook.com/opinio.live"
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={t.followFacebook}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-[#1877F2] transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {t.followFacebook}
          </a>
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

