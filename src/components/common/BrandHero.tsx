import { useI18n } from '../../i18n/I18nContext';

// Brand wordmark, tagline and what Opinio is in one sentence - shared by
// AboutModal and WelcomeModal.
export function BrandHero() {
  const { p, t } = useI18n();
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center gap-2.5">
        <img src="/favicon.svg" alt="" className="w-9 h-9" />
        <span className="text-2xl font-bold text-accent tracking-tight">{t.appName}</span>
      </div>
      <p className="text-[15px] font-semibold text-white leading-snug">{p.aboutTagline}</p>
      <p className="text-sm text-white/70 leading-relaxed">{p.aboutExplain}</p>
    </div>
  );
}
