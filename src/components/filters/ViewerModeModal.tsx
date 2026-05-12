import { useNavigate, useLocation } from 'react-router-dom';
import { ModalShell } from '../common/ModalShell';
import { ActionChip } from '../common/ActionChip';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useSignIn } from '../auth/SignInContext';
import { SignInIcon } from '../auth/SignInIcon';

interface ViewerModeModalProps {
  onClose: () => void;
}

const ViewerModeIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
    <path stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" d="M2.697 16.126c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
    <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75M12 15.75h.008v.008H12v-.008z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export function ViewerModeModal({ onClose }: ViewerModeModalProps) {
  const { t } = useI18n();
  const { data: me } = useMe();
  const { promptSignIn } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegistered = !!me?.user && me.user.tier !== 'anonymous';

  return (
    <ModalShell onClose={onClose} title={t.viewerMode} icon={<ViewerModeIcon />} maxWidth="max-w-sm">
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-white/70 leading-relaxed">
          {isRegistered ? t.viewerModeNoCountryBody : t.viewerModeBody}
        </p>
        <div className="flex justify-center pt-1">
          {isRegistered ? (
            <ActionChip onClick={() => { onClose(); navigate('/settings' + location.search); }}>
              <SettingsIcon />
              <span>{t.viewerModeSetCountry}</span>
            </ActionChip>
          ) : (
            <ActionChip onClick={() => { onClose(); promptSignIn(); }}>
              <SignInIcon className="w-3.5 h-3.5" />
              <span>{t.viewerModeSignIn}</span>
            </ActionChip>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
