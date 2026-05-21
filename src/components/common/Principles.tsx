import { useI18n } from '../../i18n/I18nContext';

// The "Our principles" block — shared by AboutModal and WelcomeModal (same
// pattern as the shared TierCard / VoteBullets). Icons follow the green/red/
// green rhythm of the VoteBullets above the plans.
const principleIconCls = 'w-4 h-4 mt-0.5 shrink-0';
const ClockIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`${principleIconCls} text-positive`}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const ShieldIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`${principleIconCls} text-accent`}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
// Lucide message-circle — speech bubble, reads as "voice" more directly than the </> code glyph did.
const VoiceIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`${principleIconCls} text-positive`}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export function Principles() {
  const { t } = useI18n();
  return (
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
  );
}
