import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  /** Tailwind background utility, e.g. 'bg-red-500' or from ROLE_COLORS */
  bgClass: string;
  /** 'pulse' adds bolder weight + tracking-wider + animate-pulse (used by NEW badge) */
  variant?: 'default' | 'pulse';
  className?: string;
  title?: string;
};

const VARIANT_CLASSES = {
  default: 'font-semibold tracking-wide',
  pulse: 'font-bold tracking-wider animate-pulse',
} as const;

export function Badge({ children, bgClass, variant = 'default', className = '', title }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 ${bgClass} text-white text-[11px] leading-none px-1.5 py-0.5 rounded-full uppercase ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
