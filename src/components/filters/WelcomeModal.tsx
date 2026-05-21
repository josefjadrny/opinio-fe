import { ModalShell } from '../common/ModalShell';
import { BrandHero } from '../common/BrandHero';
import { Plans } from '../common/Plans';
import { VoteBullets } from '../common/VoteBullets';
import { Principles } from '../common/Principles';
import { useI18n } from '../../i18n/I18nContext';

interface WelcomeModalProps {
  onClose: () => void;
}

// Header icon — waving-hand-ish: red speech-bubble outline with a green spark,
// matches the cs/red + g/green stroke convention used by the other modals
// (SettingsIcon, ViewerModeIcon, AboutIcon).
const WelcomeIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path
      stroke="#e94560"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
    />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" />
  </svg>
);

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const { t } = useI18n();

  // Header carries the welcome title; the centered hero below leads with the
  // brand wordmark + tagline, then bullets, then tier grid, then footer CTA.
  // Tier cards are display-only (no onClick) per the spec — Anonymous is
  // highlighted as the current tier so first-time anons see where they sit.
  return (
    <ModalShell
      onClose={onClose}
      title={t.welcomeTitle}
      icon={<WelcomeIcon />}
      maxWidth="max-w-md"
      desktopScrollable
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-accent text-white hover:bg-accent/90 rounded-lg py-3 text-sm font-medium transition-colors"
        >
          {t.welcomeCta}
        </button>
      }
    >
      <div className="px-6 pt-6 pb-4 space-y-6">
        {/* Hero — brand wordmark + tagline */}
        <BrandHero />

        {/* Principle bullets — what to expect, in one glance */}
        <VoteBullets />

        {/* Plans — display-only, anonymous highlighted as the current tier */}
        <Plans activeTier="muted" />

        {/* Principles — shared with AboutModal */}
        <Principles />
      </div>
    </ModalShell>
  );
}
