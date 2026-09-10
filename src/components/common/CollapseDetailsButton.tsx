import { useI18n } from '../../i18n/I18nContext';
import { IconTip } from './IconTip';

interface CollapseDetailsButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

// The header chevron every detail modal folds its body with - the opinio modal
// (desktop card and mobile sheet) and the country modal. All three fold for the
// same reason, that what the body covers is the map, and all three drive
// .details-fold, so they have to look and animate as one control: same icon,
// same 300ms rotation on the same easing as the fold itself, same labels.
// They were three identical copies, and the copies are what would drift.
//
// The caller owns the state (each modal persists its own localStorage key, so
// the opinio and country folds stay independent choices).
export function CollapseDetailsButton({ collapsed, onToggle }: CollapseDetailsButtonProps) {
  const { t } = useI18n();
  const label = collapsed ? t.showDetails : t.hideDetails;
  return (
    <IconTip label={label}>
      <button
        onClick={onToggle}
        aria-label={label}
        aria-expanded={!collapsed}
        className="text-white/40 hover:text-white/80 transition-colors p-1"
      >
        <svg
          className={`w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed ? '' : 'rotate-180'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </IconTip>
  );
}
