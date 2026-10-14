import { ModalShell } from '../common/ModalShell';
import { GoogleLogo } from '../common/GoogleLogo';
import { MicrosoftLogo } from '../common/MicrosoftLogo';
import { useI18n } from '../../i18n/I18nContext';
import { loginWithGoogle, loginWithMicrosoft } from '../../api/client';
import { SignInIcon } from './SignInIcon';

interface SignInModalProps {
  onClose: () => void;
}

export function SignInModal({ onClose }: SignInModalProps) {
  const { t } = useI18n();

  return (
    <ModalShell onClose={onClose} title={t.login} icon={<SignInIcon className="w-5 h-5" />}>
      <div className="px-6 py-5 space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">{t.signInPrompt}</p>
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-border hover:border-white/20 rounded-lg px-4 py-2.5 text-sm text-white/90 transition-colors"
          >
            <GoogleLogo className="w-4 h-4" />
            {t.loginWithGoogle}
          </button>
          <button
            type="button"
            onClick={loginWithMicrosoft}
            className="w-full flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-border hover:border-white/20 rounded-lg px-4 py-2.5 text-sm text-white/90 transition-colors"
          >
            <MicrosoftLogo className="w-4 h-4" />
            {t.loginWithMicrosoft}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
