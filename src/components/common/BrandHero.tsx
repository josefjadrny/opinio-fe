import { useI18n } from '../../i18n/I18nContext';

// Centered brand wordmark + tagline — shared by AboutModal and WelcomeModal.
export function BrandHero() {
  const { t } = useI18n();
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center gap-2.5">
        <img src="/favicon.svg" alt="" className="w-9 h-9" />
        <span className="text-2xl font-bold text-accent tracking-tight">{t.appName}</span>
      </div>
      <p className="text-sm font-semibold text-white leading-snug">{t.brandTagline}</p>
    </div>
  );
}
