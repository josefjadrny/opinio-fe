import type { Profile } from '../types/profile';
import type {
  ProfilesResponse, CountryProfilesResponse,
  MeResponse, VoteResponse, ProfileFilters, VoteType,
  PersonBreakdownResponse,
} from '../types/api';
import {
  getAllProfiles, applyVotesToProfile, castVote,
  getVoteAllowance, addProfile as storageAddProfile,
} from './storage';

const SIDEBAR_SIZE = 15;
const TOOLTIP_SIZE = 4;

function delay(ms = 200 + Math.random() * 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function enrichProfiles(profiles: Profile[]): Profile[] {
  return profiles.map(applyVotesToProfile);
}

export async function getProfiles(filters: ProfileFilters): Promise<ProfilesResponse> {
  await delay();

  let profiles = enrichProfiles(getAllProfiles());

  if (filters.country) {
    profiles = profiles.filter((p) => p.countryCode === filters.country);
  }
  if (filters.roles?.length) {
    profiles = profiles.filter((p) => filters.roles!.includes(p.role));
  }

  const sorted = [...profiles].sort((a, b) => {
    if (filters.type === 'positive') return b.likes - a.likes;
    return b.dislikes - a.dislikes;
  });

  const topProfiles = sorted.slice(0, SIDEBAR_SIZE);

  return { profiles: topProfiles };
}

export async function getCountryProfiles(countryCode: string): Promise<CountryProfilesResponse> {
  await delay();

  const profiles = enrichProfiles(getAllProfiles())
    .filter((p) => p.countryCode === countryCode);

  const positive = [...profiles].sort((a, b) => b.likes - a.likes).slice(0, TOOLTIP_SIZE);
  const negative = [...profiles].sort((a, b) => b.dislikes - a.dislikes).slice(0, TOOLTIP_SIZE);
  const topVoted = [...profiles]
    .filter((p) => p.likes + p.dislikes > 0)
    .sort((a, b) => (b.likes + b.dislikes) - (a.likes + a.dislikes))
    .slice(0, 15);

  return { positive, negative, topVoted };
}

export async function vote(profileId: string, type: VoteType): Promise<VoteResponse> {
  await delay(100);

  const success = castVote(profileId, type);
  if (!success) {
    throw new Error('Vote not allowed');
  }

  const profile = enrichProfiles(getAllProfiles()).find((p) => p.id === profileId);
  if (!profile) throw new Error('Profile not found');

  return {
    profile,
    voteAllowance: getVoteAllowance(),
  };
}

export async function getMe(): Promise<MeResponse> {
  await delay(100);
  return {
    user: {
      id: 'mock-anonymous',
      displayName: 'Anonymous',
      provider: null,
      countryCode: null,
      avatarUrl: null,
      tier: 'anonymous',
      canChangeCountry: false,
      language: null,
      blockedUntil: null,
    },
    voteAllowance: getVoteAllowance(),
  };
}

export async function getPersonBreakdown(profileId: string): Promise<PersonBreakdownResponse> {
  await delay(150);

  const profile = getAllProfiles().find((p) => p.id === profileId);
  if (!profile) return { topLiking: [], topDisliking: [] };

  // Deterministic fake country breakdown seeded from profileId + likes/dislikes
  const seed = (s: number) => {
    const x = Math.sin(s + 1) * 10000;
    return x - Math.floor(x);
  };

  const POOL = ['US', 'BR', 'IN', 'DE', 'FR', 'GB', 'AR', 'MX', 'CN', 'JP',
                'KR', 'IT', 'ES', 'CA', 'AU', 'RU', 'TR', 'PL', 'NG', 'ZA'];

  // Shuffle pool differently for like vs dislike using profile id as seed
  const idNum = parseInt(profileId, 10) || 1;

  const likeCountries = [...POOL]
    .sort((a, b) => seed(idNum * 3 + a.charCodeAt(0)) - seed(idNum * 3 + b.charCodeAt(0)))
    .slice(0, 5)
    .map((countryCode, i) => ({
      countryCode,
      count: Math.round(profile.likes * seed(idNum + i + 10) * 0.4 + 10),
    }))
    .sort((a, b) => b.count - a.count);

  const dislikeCountries = [...POOL]
    .sort((a, b) => seed(idNum * 7 + a.charCodeAt(0)) - seed(idNum * 7 + b.charCodeAt(0)))
    .slice(0, 5)
    .map((countryCode, i) => ({
      countryCode,
      count: Math.round(profile.dislikes * seed(idNum + i + 20) * 0.4 + 10),
    }))
    .sort((a, b) => b.count - a.count);

  return { topLiking: likeCountries, topDisliking: dislikeCountries };
}

export async function addNewProfile(data: {
  name: string;
  role: string;
  imageUrl: string;
  countryCode: string;
  description: string;
  addedBy: string;
}): Promise<Profile> {
  await delay();
  const profile = storageAddProfile({ ...data, addedById: null } as Parameters<typeof storageAddProfile>[0]);
  return applyVotesToProfile(profile);
}
