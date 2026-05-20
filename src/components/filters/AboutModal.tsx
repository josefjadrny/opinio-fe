import { Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useBillingRedirect } from '../../hooks/useBillingRedirect';
import { createCheckoutSession } from '../../api/client';
import { useSignIn } from '../auth/SignInContext';

interface AboutModalProps {
  onClose: () => void;
}

function withVoteIcons(text: string): React.ReactNode[] {
  return text.split(/(▲|▼)/).map((part, i) => {
    if (part === '▲') return <span key={i} className="text-positive font-medium">▲</span>;
    if (part === '▼') return <span key={i} className="text-negative font-medium">▼</span>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

const AboutIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
  </svg>
);

type TierTone = 'muted' | 'accent' | 'positive';

const TIER_TONES: Record<TierTone, { border: string; bg: string; hoverBg: string; label: string; count: string; activeRing: string; activeBg: string; activeBadge: string }> = {
  muted:    { border: 'border-white/10',    bg: 'bg-white/[0.03]',    hoverBg: 'hover:bg-white/[0.08]',    label: 'text-white/50',  count: 'text-white/90', activeRing: 'ring-white/40',    activeBg: 'bg-white/[0.08]',    activeBadge: 'bg-white/70 text-black' },
  accent:   { border: 'border-accent/30',   bg: 'bg-accent/[0.06]',   hoverBg: 'hover:bg-accent/[0.12]',   label: 'text-accent',    count: 'text-white',     activeRing: 'ring-accent/60',   activeBg: 'bg-accent/[0.15]',   activeBadge: 'bg-accent text-white' },
  positive: { border: 'border-positive/30', bg: 'bg-positive/[0.06]', hoverBg: 'hover:bg-positive/[0.12]', label: 'text-positive',  count: 'text-white',     activeRing: 'ring-positive/60', activeBg: 'bg-positive/[0.15]', activeBadge: 'bg-positive text-white' },
};

function TierCard({ label, count, unit, subline, trailingIcon, tone, active, onClick, disabled }: {
  label: string;
  count: number;
  unit: string;
  subline?: string;
  trailingIcon?: React.ReactNode;
  tone: TierTone;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const c = TIER_TONES[tone];
  const clickable = !!onClick && !active;
  const baseCls = `relative rounded-lg border ${c.border} ${active ? `${c.activeBg} ring-2 ${c.activeRing}` : c.bg} p-2.5 text-center transition-colors`;
  const body = (
    <>
      {active && (
        <span aria-label="Your current tier" className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow ${c.activeBadge}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      <p className={`text-[10px] uppercase tracking-wider font-medium ${c.label} flex items-center justify-center gap-1`}>
        <span>{label}</span>
        {trailingIcon}
      </p>
      <p className={`text-2xl font-bold leading-none mt-1.5 ${c.count}`}>{count}</p>
      <p className="text-[10px] text-white/40 mt-1">{unit}</p>
      {subline && <p className="text-[10px] text-white/55 mt-0.5 font-medium">{subline}</p>}
    </>
  );
  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${baseCls} ${c.hoverBg} cursor-pointer disabled:opacity-60 disabled:cursor-wait`}
      >
        {body}
      </button>
    );
  }
  return <div className={baseCls}>{body}</div>;
}

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
          <p className="text-sm font-semibold text-white leading-snug">{t.aboutHero}</p>
          <p className="text-xs text-white/55 leading-relaxed">{t.aboutFreshness}</p>
        </div>

        {/* Tier comparison — 3-column grid */}
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-2">{t.aboutTiersTitle}</p>
          <div className="grid grid-cols-3 gap-2">
            <TierCard label={t.aboutTierAnonymous} count={1} unit={t.aboutVotesPerHour} tone="muted" active={activeTier === 'muted'} />
            <TierCard
              label={t.aboutTierRegistered}
              count={3}
              unit={t.aboutVotesPerHour}
              tone="accent"
              active={activeTier === 'accent'}
              onClick={onRegisteredClick}
            />
            <TierCard
              label={t.aboutTierSupporter}
              count={5}
              unit={t.aboutVotesPerHour}
              subline={isAlreadySupporter ? undefined : t.aboutSupporterPriceNote}
              trailingIcon={<span aria-hidden className="text-[11px] leading-none">❤️</span>}
              tone="positive"
              active={activeTier === 'positive'}
              onClick={onSupporterClick}
              disabled={checkoutLoading}
            />
          </div>
          <p className="text-xs text-white/35 mt-3 leading-snug">{withVoteIcons(t.aboutVoteExpiry)}</p>
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
                <span className="text-white/90 font-medium">{t.aboutPrinciplePrivacyTitle}.</span>{' '}{t.aboutPrinciplePrivacyBody}{' '}
                {t.aboutPrinciplePrivacyContactPrefix}{' '}
                <button
                  type="button"
                  onClick={() => navigate('/support' + location.search)}
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  {t.aboutPrinciplePrivacyContactLink}
                </button>
                .
              </span>
            </li>
            <li className="flex gap-3">
              <VoiceIcon />
              <span>
                <span className="text-white/90 font-medium">{t.aboutPrincipleVoiceTitle}.</span>{' '}{t.aboutPrincipleVoiceBody}{' '}
                <span className="text-white/40">({t.aboutPrincipleVoiceForDevs}</span>{': '}
                <a
                  href="https://github.com/josefjadrny/opinio-fe"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  {t.aboutFrontendRepo}
                </a>
                <span className="text-white/40">{' · '}</span>
                <a
                  href="https://github.com/josefjadrny/opinio-api"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  {t.aboutBackendRepo}
                </a>
                <span className="text-white/40">)</span>
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

        {/* Terms · Privacy — fine-print bottom row */}
        <div className="!mt-2 flex items-center justify-center gap-2 text-xs">
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

