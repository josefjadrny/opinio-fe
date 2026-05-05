import { useDeleteProfile } from '../../hooks/useDeleteProfile';
import { useI18n } from '../../i18n/I18nContext';

interface DeleteProfileButtonProps {
  profileId: string;
  onDeleted: () => void;
}

export function DeleteProfileButton({ profileId, onDeleted }: DeleteProfileButtonProps) {
  const { t } = useI18n();
  const deleteMutation = useDeleteProfile();

  const handleClick = () => {
    if (deleteMutation.isPending) return;
    if (!window.confirm(t.deleteProfileConfirm)) return;
    deleteMutation.mutate(profileId, { onSuccess: onDeleted });
  };

  return (
    <button
      onClick={handleClick}
      disabled={deleteMutation.isPending}
      title={t.deleteProfile}
      aria-label={t.deleteProfile}
      className="text-white/40 hover:text-white/80 transition-colors p-1 disabled:opacity-50 disabled:cursor-wait"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
      </svg>
    </button>
  );
}
