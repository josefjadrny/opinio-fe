import { useI18n } from '../../i18n/I18nContext';

// Floating action button for creating an opinio on mobile. Replaces the header
// add button below md. Sits just above the bottom vote bar in the bottom-right
// corner. Rendered as a top-level sibling (not inside the scrolling feed) so its
// backdrop-filter samples the feed behind it - see App.tsx.
//
// The signature two-tone add-opinio mark (red speech bubble + green plus, same
// colours as the vote buttons) on a frosted-glass disc matching the vote bar.
interface AddOpinioFabProps {
  onClick: () => void;
}

export function AddOpinioFab({ onClick }: AddOpinioFabProps) {
  const { t } = useI18n();

  return (
    <button
      onClick={onClick}
      aria-label={t.addProfileTitle}
      className="fixed bottom-16 right-4 z-[70] flex items-center justify-center rounded-full w-16 h-16 bg-surface/50 backdrop-blur-md border border-white/10 shadow-lg shadow-black/50 transition-transform active:scale-90 focus:outline-none"
    >
      <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
        <path
          stroke="var(--color-negative)"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
        />
        <path
          stroke="var(--color-positive)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.75}
          d="M12 9v6M9 12h6"
        />
      </svg>
    </button>
  );
}
