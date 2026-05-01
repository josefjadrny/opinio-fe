import type { Role } from '../types/profile';

export const ROLE_LABELS: Record<Role, string> = {
  politics: 'Politics',
  entertainment: 'Entertainment',
  sports: 'Sports',
  business: 'Business',
  media: 'Media',
  health: 'Health',
  science: 'Science',
};

export const ROLE_COLORS: Record<Role, string> = {
  politics: 'bg-blue-600',
  entertainment: 'bg-purple-600',
  sports: 'bg-green-600',
  business: 'bg-yellow-600',
  media: 'bg-cyan-600',
  health: 'bg-rose-600',
  science: 'bg-indigo-600',
};

export const ALL_ROLES: Role[] = Object.keys(ROLE_LABELS) as Role[];
