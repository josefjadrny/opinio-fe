import { useState } from 'react';
import { useDeleteProfile } from '../../hooks/useDeleteProfile';
import { useI18n } from '../../i18n/I18nContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface DeleteProfileButtonProps {
  profileId: string;
  voteCount: number;
  onDeleted: () => void;
}

const TrashIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
  </svg>
);

export function DeleteProfileButton({ profileId, voteCount, onDeleted }: DeleteProfileButtonProps) {
  const { t } = useI18n();
  const deleteMutation = useDeleteProfile();
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    deleteMutation.mutate(profileId, {
      onSuccess: () => {
        setOpen(false);
        onDeleted();
      },
    });
  };

  const message =
    voteCount === 0
      ? t.deleteProfileConfirm
      : voteCount === 1
        ? t.deleteProfileConfirmOneVote
        : t.deleteProfileConfirmManyVotes.replace('{count}', String(voteCount));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t.delete}
        aria-label={t.delete}
        className="text-white/40 hover:text-white/80 transition-colors p-1"
      >
        <TrashIcon />
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={t.deleteProfile}
        message={message}
        confirmLabel={deleteMutation.isPending ? t.deleting : t.deleteProfile}
        cancelLabel={t.cancel}
        variant="destructive"
        icon={<TrashIcon className="w-5 h-5 text-white/40" />}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
