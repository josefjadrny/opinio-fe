import type { ReactNode } from 'react';

type Tone = 'neutral' | 'red';

type ActionChipProps = {
  children: ReactNode;
  onClick: () => void;
  tone?: Tone;
  disabled?: boolean;
  title?: string;
  className?: string;
};

const TONE_CLASSES: Record<Tone, string> = {
  neutral:
    'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/80 hover:text-white',
  red:
    'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 text-red-300 hover:text-red-200',
};

export function ActionChip({
  children,
  onClick,
  tone = 'neutral',
  disabled,
  title,
  className = '',
}: ActionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 border rounded-md px-2 py-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-wait ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
