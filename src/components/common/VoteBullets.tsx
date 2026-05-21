import { useI18n } from '../../i18n/I18nContext';

// The three core-mechanic bullets — vote / expire / refill — shared verbatim by
// WelcomeModal and AboutModal so the two headers stay in sync (same pattern as
// the shared TierCard). Icons follow the red/green stroke convention.
const bulletIconCls = 'w-4 h-4 mt-0.5 shrink-0';
const VoteIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={bulletIconCls}>
    <polyline points="5 11 12 4 19 11" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);
const ClockIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={bulletIconCls}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const RefillIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={bulletIconCls}>
    <path d="M21 12a9 9 0 1 1-3.4-7.06" />
    <polyline points="21 4 21 10 15 10" />
  </svg>
);

export function VoteBullets() {
  const { t } = useI18n();
  return (
    <ul className="space-y-3 text-sm text-white/70">
      <li className="flex gap-3">
        <VoteIcon />
        <span>{t.welcomeBulletVote}</span>
      </li>
      <li className="flex gap-3">
        <ClockIcon />
        <span>{t.welcomeBulletExpire}</span>
      </li>
      <li className="flex gap-3">
        <RefillIcon />
        <span>{t.welcomeBulletRefill}</span>
      </li>
    </ul>
  );
}
