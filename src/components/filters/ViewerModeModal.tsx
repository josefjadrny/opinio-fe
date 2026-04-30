import { ModalShell } from '../common/ModalShell';
import { ActionChip } from '../common/ActionChip';
import { GoogleLogo } from '../common/GoogleLogo';
import { useI18n } from '../../i18n/I18nContext';
import { loginWithGoogle } from '../../api/client';

interface ViewerModeModalProps {
  onClose: () => void;
}

const ViewerModeIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M2.697 16.126c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75M12 15.75h.008v.008H12v-.008z" />
  </svg>
);

export function ViewerModeModal({ onClose }: ViewerModeModalProps) {
  const { t } = useI18n();

  return (
    <ModalShell onClose={onClose} title={t.viewerMode} icon={<ViewerModeIcon />} maxWidth="max-w-sm">
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-white/70 leading-relaxed">{t.viewerModeBody}</p>
        <div className="flex justify-center pt-1">
          <ActionChip onClick={loginWithGoogle}>
            <GoogleLogo className="w-3.5 h-3.5" />
            <span>{t.viewerModeSignIn}</span>
          </ActionChip>
        </div>
      </div>
    </ModalShell>
  );
}
