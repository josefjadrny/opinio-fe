import type { Role } from '../types/profile';

export const ROLE_LABELS: Record<Role, string> = {
  politics: 'Politics',
  entertainment: 'Entertainment',
  sports: 'Sports',
  business: 'Business',
  media: 'Media',
  health: 'Health',
  science: 'Science',
  environment: 'Environment',
  tech: 'Tech',
  lifestyle: 'Lifestyle',
};

export const ROLE_COLORS: Record<Role, string> = {
  politics: 'bg-blue-600',
  entertainment: 'bg-purple-600',
  sports: 'bg-fuchsia-600',
  business: 'bg-yellow-600',
  media: 'bg-cyan-600',
  health: 'bg-rose-600',
  science: 'bg-indigo-600',
  environment: 'bg-emerald-600',
  tech: 'bg-slate-500',
  // Teal: the last hue near-free of the reserved bands (it sits beside media's
  // cyan; the chip always carries its name and its own glyph).
  lifestyle: 'bg-teal-600',
};

export const ALL_ROLES: Role[] = Object.keys(ROLE_LABELS) as Role[];
