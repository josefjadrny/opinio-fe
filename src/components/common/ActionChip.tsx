import type { ReactNode } from 'react';

type ActionChipProps = {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
};

export function ActionChip({ children, onClick, disabled, title, className = '' }: ActionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-md px-2 py-1 text-xs text-white/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait ${className}`}
    >
      {children}
    </button>
  );
}
