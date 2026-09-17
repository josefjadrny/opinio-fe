import { ModalShell } from '../common/ModalShell';
import { useI18n } from '../../i18n/I18nContext';
import { CommentIcon } from './CommentCount';
import { CommentList, CommentComposer } from './CommentThread';

// Mobile: the thread lives in its own sheet over the detail, not inside it. On
// real data the detail sheet is already at its 85vh cap with the breakdown
// below the fold, so an inline thread would be a third screen of scrolling and
// a composer at its end would sit under the keyboard. ModalShell's footer is
// pinned and keyboard-safe, which is exactly what the composer needs.
export function CommentsSheet({ profileId, count, onClose }: { profileId: string; count: number; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <ModalShell
      onClose={onClose}
      title={count > 0 ? `${t.comments} (${count})` : t.comments}
      icon={<CommentIcon className="w-5 h-5 text-white/70" />}
      maxWidth="max-w-md"
      desktopScrollable
      footer={<CommentComposer profileId={profileId} compact />}
    >
      <div className="px-6 py-1">
        <CommentList profileId={profileId} />
      </div>
    </ModalShell>
  );
}
