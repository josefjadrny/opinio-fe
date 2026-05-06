import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  /** Tailwind background utility, e.g. 'bg-red-500' or from ROLE_COLORS */
  bgClass: string;
  /** Tailwind text color utility; defaults to text-white */
  textClass?: string;
  /** 'pulse' adds bolder weight + tracking-wider + slow fade glow (used by NEW badge) */
  variant?: 'default' | 'pulse';
  className?: string;
  title?: string;
};

const VARIANT_CLASSES = {
  default: 'font-semibold tracking-wide',
  pulse: 'font-bold tracking-wider animate-new-glow',
} as const;

export function Badge({ children, bgClass, textClass = 'text-white', variant = 'default', className = '', title }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 ${bgClass} ${textClass} text-[11px] leading-none px-1.5 py-0.5 rounded-full uppercase ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
