import type { Role } from '../types/profile';

export const ROLE_LABELS: Record<Role, string> = {
  politician: 'Politician',
  actor: 'Actor',
  musician: 'Musician',
  athlete: 'Athlete',
  business_leader: 'Business Leader',
  influencer: 'Influencer',
  journalist: 'Journalist',
  activist: 'Activist',
  other: 'Other',
};

export const ROLE_COLORS: Record<Role, string> = {
  politician: 'bg-blue-600',
  actor: 'bg-purple-600',
  musician: 'bg-pink-600',
  athlete: 'bg-green-600',
  business_leader: 'bg-yellow-600',
  influencer: 'bg-orange-600',
  journalist: 'bg-cyan-600',
  activist: 'bg-red-600',
  other: 'bg-gray-600',
};

export const ALL_ROLES: Role[] = Object.keys(ROLE_LABELS) as Role[];
