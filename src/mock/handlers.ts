import type { Profile } from '../types/profile';
import type {
  ProfilesResponse, CountryProfilesResponse,
  MeResponse, VoteResponse, ProfileFilters, VoteType,
} from '../types/api';
import {
  getAllProfiles, applyVotesToProfile, castVote,
  getVoteAllowance, addProfile as storageAddProfile,
} from './storage';

const RECENTLY_ADDED_HOURS = 24;
const SIDEBAR_SIZE = 15;
const TOOLTIP_SIZE = 3;

function delay(ms = 200 + Math.random() * 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function enrichProfiles(profiles: Profile[]): Profile[] {
  return profiles.map(applyVotesToProfile);
}

function isRecentlyAdded(profile: Profile): boolean {
  const hoursAgo = (Date.now() - new Date(profile.createdAt).getTime()) / 3600000;
  return hoursAgo <= RECENTLY_ADDED_HOURS;
}

export async function getProfiles(filters: ProfileFilters): Promise<ProfilesResponse> {
  await delay();

  let profiles = enrichProfiles(getAllProfiles());

  if (filters.country) {
    profiles = profiles.filter((p) => p.countryCode === filters.country);
  }
  if (filters.role) {
    profiles = profiles.filter((p) => p.role === filters.role);
  }

  const sorted = [...profiles].sort((a, b) => {
    if (filters.type === 'positive') return b.likes - a.likes;
    return b.dislikes - a.dislikes;
  });

  const topProfiles = sorted.slice(0, SIDEBAR_SIZE);

  const recentlyAdded = profiles
    .filter((p) => isRecentlyAdded(p) && !topProfiles.some((tp) => tp.id === p.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return { profiles: topProfiles, recentlyAdded };
}

export async function getCountryProfiles(countryCode: string): Promise<CountryProfilesResponse> {
  await delay();

  const profiles = enrichProfiles(getAllProfiles())
    .filter((p) => p.countryCode === countryCode);

  const positive = [...profiles].sort((a, b) => b.likes - a.likes).slice(0, TOOLTIP_SIZE);
  const negative = [...profiles].sort((a, b) => b.dislikes - a.dislikes).slice(0, TOOLTIP_SIZE);

  return { positive, negative };
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
  return { voteAllowance: getVoteAllowance() };
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
  const profile = storageAddProfile(data as Parameters<typeof storageAddProfile>[0]);
  return applyVotesToProfile(profile);
}
