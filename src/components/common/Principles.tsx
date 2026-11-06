import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nContext';

// "Our principles" - three blocks shared by AboutModal and WelcomeModal. What
// sets Opinio apart, so they stay prominent: no ads, no tracking, results
// nobody tunes. Two-tone icons like every app icon (red shape, green accent).
const ICON = 'w-6 h-6 shrink-0';

const TimeIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={ICON}>
    <circle cx="12" cy="12" r="9" stroke="#ef4444" />
    <path d="M12 7v5l3 2" stroke="#22c55e" />
  </svg>
);
const PrivacyIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={ICON}>
    <path d="M12 21s7.5-3.6 7.5-9.4V5.4L12 2.8 4.5 5.4v6.2C4.5 17.4 12 21 12 21z" stroke="#ef4444" />
    <path d="M9 12l2 2 4-4" stroke="#22c55e" />
  </svg>
);
const OpinionIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={ICON}>
    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" stroke="#ef4444" />
    <path d="M8.5 11.5l2.5 2.5 4.5-4.5" stroke="#22c55e" />
  </svg>
);

function Block({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    // Phone: a row (icon left). From sm: three columns, icon on top.
    <li className="flex gap-3 sm:flex-col sm:gap-2 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] p-3">
      {icon}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-white leading-snug">{title}</p>
        <p className="mt-1 text-xs text-white/65 leading-relaxed">{body}</p>
      </div>
    </li>
  );
}

export function Principles() {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-sm font-semibold text-white mb-3">{t.aboutPrinciplesTitle}</p>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Block icon={<TimeIcon />} title={t.aboutPrincipleTimeTitle} body={t.aboutPrincipleTimeBody} />
        <Block icon={<PrivacyIcon />} title={t.aboutPrinciplePrivacyTitle} body={t.aboutPrinciplePrivacyBody} />
        <Block icon={<OpinionIcon />} title={t.aboutPrincipleVoiceTitle} body={t.aboutPrincipleVoiceBody} />
      </ul>
    </div>
  );
}
