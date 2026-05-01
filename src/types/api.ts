import type { Profile } from './profile';

export interface ProfilesResponse {
  profiles: Profile[];
  recentlyAdded: Profile[];
}

export interface CountryProfilesResponse {
  positive: Profile[];
  negative: Profile[];
}

export interface VoteAllowance {
  like: {
    remaining: number;
    nextAt: string | null;
  };
  dislike: {
    remaining: number;
    nextAt: string | null;
  };
}

export interface MeUser {
  id: string;
  displayName: string;
  provider: string | null;
  countryCode: string | null;
  avatarUrl: string | null;
  tier: 'anonymous' | 'registered' | 'supporter' | 'admin';
  canChangeCountry: boolean;
  language: string | null;
  blockedUntil: string | null;
}

export interface MeResponse {
  user: MeUser;
  voteAllowance: VoteAllowance;
}

export interface VoteResponse {
  profile: Profile;
  voteAllowance: VoteAllowance;
}

export interface ProfileFilters {
  type: 'positive' | 'negative';
  country?: string;
  roles?: string[];
}

export type VoteType = 'like' | 'dislike';

export interface CountryBreakdown {
  countryCode: string;
  count: number;
}

export interface PersonBreakdownResponse {
  topLiking: CountryBreakdown[];
  topDisliking: CountryBreakdown[];
}

export interface TopVoter {
  id: string;
  displayName: string;
  countryCode: string | null;
  totalVotesCast: number;
}

export interface TopVotersResponse {
  topVoters: TopVoter[];
}

export interface OnFireUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  activeProfiles: number;
  totalVotes: number;
}

export interface OnFireResponse {
  onFire: OnFireUser[];
}

export interface UserProfileSummary {
  id: string;
  name: string;
  role: import('./profile').Role;
  imageUrl: string | null;
  countryCode: string;
  description: string;
  createdAt: string;
  likes: number;
  dislikes: number;
}

export interface UserDetailResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  createdAt: string;
  totalLikesCast: number;
  totalDislikesCast: number;
  profiles: UserProfileSummary[];
}

export type SupportTicketStatus = 'new' | 'investigating' | 'waiting' | 'done';
export type SupportTicketCategory = 'bug' | 'feature' | 'subscription' | 'account' | 'other';

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  adminReply: string | null;
  adminNote?: string | null;
  userDisplayName?: string;
  userCountryCode?: string | null;
  userTier?: string | null;
  userAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RealtimeEvent {
  kind: 'vote' | 'new_profile';
  profileId: string;
  data: Partial<Profile>;
}
