import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ModalShell } from './ModalShell';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  variant?: 'default' | 'destructive';
  icon?: ReactNode;
  isPending?: boolean;
}

const DefaultIcon = () => (
  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
  </svg>
);

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  icon,
  isPending,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmBtnClass = variant === 'destructive'
    ? 'bg-accent text-white hover:bg-accent/85'
    : 'bg-positive text-white hover:bg-positive/85';

  return createPortal(
    <ModalShell
      onClose={isPending ? () => {} : onClose}
      title={title}
      icon={icon ?? <DefaultIcon />}
      centered
    >
      <div className="px-6 py-5 text-sm text-white/70 leading-relaxed">{message}</div>
      <div className="flex gap-2 justify-end px-6 py-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-wait transition-colors ${confirmBtnClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>,
    document.body,
  );
}
