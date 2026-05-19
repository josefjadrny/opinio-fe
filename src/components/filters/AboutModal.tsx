import { Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { ActionChip } from '../common/ActionChip';
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

// Monochrome silhouette matching the user's reference (freeiconspng #13662):
// bowl-shaped cup, donut handle, three steam wisps, thin saucer below. Single
// solid fill via currentColor so it inherits the chip's text color on dark UI.
const CoffeeIcon = () => (
  <svg aria-hidden xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="inline-block w-4 h-4 -translate-y-px ml-0.5">
    {/* Steam wisps — light cream */}
    <path d="M7.6 1.5c-.5 1 .3 1.7.3 2.4s-.8 1.2-.3 2.1" fill="none" stroke="#EADBC2" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 1.5c-.5 1 .3 1.7.3 2.4s-.8 1.2-.3 2.1" fill="none" stroke="#EADBC2" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.4 1.5c-.5 1 .3 1.7.3 2.4s-.8 1.2-.3 2.1" fill="none" stroke="#EADBC2" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    {/* Cup top rim — full cream ellipse (back of cup opening) */}
    <ellipse cx="9.25" cy="8" rx="6.75" ry="1.1" fill="#E8D5B0" />
    {/* Coffee liquid surface — dark espresso ellipse inside the rim */}
    <ellipse cx="9.25" cy="8" rx="5.5" ry="0.7" fill="#3E2A1F" />
    {/* Crema highlight — small lighter ellipse on coffee surface */}
    <ellipse cx="8" cy="7.8" rx="1.8" ry="0.25" fill="#6F4E37" opacity="0.8" />
    {/* Cup body (covers everything below the rim) */}
    <path d="M2.5 8h13.5v6.5a4 4 0 0 1-4 4H6.5a4 4 0 0 1-4-4V8z" fill="#E8D5B0" />
    {/* Handle (donut on the right side) */}
    <path d="M16 9.3h1.6a3 3 0 0 1 0 6H16v-1.7h1.6a1.3 1.3 0 0 0 0-2.6H16V9.3z" fill="#E8D5B0" />
    {/* Saucer — slightly darker stone tone for separation */}
    <ellipse cx="9.5" cy="20.8" rx="8" ry="0.9" fill="#B89A6E" />
  </svg>
);

function withCoffeeIcon(text: string): React.ReactNode[] {
  return text.split(/(\{coffee\})/).map((part, i) =>
    part === '{coffee}' ? <CoffeeIcon key={i} /> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function AboutModal({ onClose }: AboutModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ModalShell onClose={onClose} title={t.about} icon={<AboutIcon />} maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-5">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Opinio" className="w-10 h-10" />
          <span className="text-2xl font-bold text-accent tracking-tight">{t.appName}</span>
        </div>

        {/* Hero + freshness */}
        <div>
          <p className="text-sm font-semibold text-white leading-relaxed mb-2">{t.aboutHero}</p>
          <p className="text-sm text-white/60 leading-relaxed">{t.aboutFreshness}</p>
        </div>

        <div className="border-t border-border" />

        {/* Tiers */}
        <div>
          <p className="text-sm font-semibold text-white mb-2">{t.aboutTiersTitle}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{t.aboutTierAnonymous}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/50">1 {t.aboutVotesPerHour}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{t.aboutTierRegistered}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent shrink-0">3 {t.aboutVotesPerHour}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm text-white/60 min-w-0">
                <span className="shrink-0">{t.aboutTierSupporter}</span>
                <SupporterCta />
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-positive/20 text-positive shrink-0">5 {t.aboutVotesPerHour}</span>
            </div>
          </div>
          <p className="text-xs text-white/30 mt-3">{withVoteIcons(t.aboutVoteExpiry)}</p>
        </div>

        <div className="border-t border-border" />

        {/* Principles */}
        <div>
          <p className="text-sm font-semibold text-white mb-2">{t.aboutPrinciplesTitle}</p>
          <ul className="space-y-2 text-sm text-white/60">
            <li className="flex gap-2">
              <span className="text-positive shrink-0 text-[10px] leading-relaxed">▶</span>
              <span>
                <span className="text-white/80">{t.aboutPrincipleTimeTitle}.</span>{' '}{t.aboutPrincipleTimeBody}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-positive shrink-0 text-[10px] leading-relaxed">▶</span>
              <span>
                <span className="text-white/80">{t.aboutPrinciplePrivacyTitle}.</span>{' '}{t.aboutPrinciplePrivacyBody}{' '}
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
            <li className="flex gap-2">
              <span className="text-positive shrink-0 text-[10px] leading-relaxed">▶</span>
              <span>
                <span className="text-white/80">{t.aboutPrincipleVoiceTitle}.</span>{' '}{t.aboutPrincipleVoiceBody}{' '}
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

        <div className="border-t border-border" />

        {/* Footer */}
        <div className="space-y-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-white/40">
            <span>🇪🇺 {t.aboutEuOrigin}</span>
            <span>·</span>
            <span>🇨🇿 {t.aboutMadeInCzechia}</span>
            <span>·</span>
            <span>🇩🇪 {t.aboutHostedInGermany}</span>
          </div>
          <div className="flex items-center gap-2">
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
      </div>
    </ModalShell>
  );
}

function SupporterCta() {
  const { t } = useI18n();
  const { data: me } = useMe();
  const tier = me?.user?.tier;
  const isAlreadySupporter = tier === 'supporter' || tier === 'admin';
  const isAnonymous = !tier || tier === 'anonymous';
  const { loading, handleClick: handleCheckout } = useBillingRedirect(createCheckoutSession);
  const { promptSignIn } = useSignIn();

  if (isAlreadySupporter) {
    return (
      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-white/10 text-white/40 border border-white/10 shrink-0">
        {t.aboutSupporterPriceNote}
      </span>
    );
  }

  return (
    <ActionChip onClick={isAnonymous ? promptSignIn : handleCheckout} disabled={loading} className="shrink-0">
      <span>{withCoffeeIcon(t.buyUsCoffee)} · {t.aboutSupporterPriceNote}</span>
    </ActionChip>
  );
}
