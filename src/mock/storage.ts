import type { Profile } from '../types/profile';
import type { VoteAllowance } from '../types/api';
import { SEED_PROFILES } from './data';

const STORAGE_KEY = 'pulse_data';
const VOTE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const VOTE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

interface VoteRecord {
  profileId: string;
  type: 'like' | 'dislike';
  timestamp: number;
}

interface StoredData {
  profiles: Profile[];
  votes: VoteRecord[];
  addedProfiles: Profile[];
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { profiles: [], votes: [], addedProfiles: [] };
}

function save(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function now() {
  return Date.now();
}

function activeVotes(votes: VoteRecord[]): VoteRecord[] {
  const cutoff = now() - VOTE_TTL_MS;
  return votes.filter((v) => v.timestamp > cutoff);
}

export function getAllProfiles(): Profile[] {
  const data = load();
  return [...SEED_PROFILES, ...data.addedProfiles];
}

export function getVoteCounts(profileId: string): { likes: number; dislikes: number } {
  const data = load();
  const votes = activeVotes(data.votes);
  return {
    likes: votes.filter((v) => v.profileId === profileId && v.type === 'like').length,
    dislikes: votes.filter((v) => v.profileId === profileId && v.type === 'dislike').length,
  };
}

export function getMyVote(profileId: string): 'like' | 'dislike' | null {
  const data = load();
  const votes = activeVotes(data.votes);
  const myVote = votes.find((v) => v.profileId === profileId);
  return myVote?.type ?? null;
}

export function castVote(profileId: string, type: 'like' | 'dislike'): boolean {
  const data = load();
  data.votes = activeVotes(data.votes);

  // Check if already voted on this profile
  if (data.votes.some((v) => v.profileId === profileId)) {
    return false;
  }

  // Check cooldown
  const allowance = getVoteAllowance();
  if (type === 'like' && allowance.like.remaining <= 0) return false;
  if (type === 'dislike' && allowance.dislike.remaining <= 0) return false;

  data.votes.push({ profileId, type, timestamp: now() });
  save(data);
  return true;
}

export function getVoteAllowance(): VoteAllowance {
  const data = load();
  const votes = activeVotes(data.votes);
  const cutoff = now() - VOTE_COOLDOWN_MS;

  const recentLikes = votes.filter((v) => v.type === 'like' && v.timestamp > cutoff);
  const recentDislikes = votes.filter((v) => v.type === 'dislike' && v.timestamp > cutoff);

  const oldestLike = recentLikes.length > 0
    ? Math.min(...recentLikes.map((v) => v.timestamp))
    : null;
  const oldestDislike = recentDislikes.length > 0
    ? Math.min(...recentDislikes.map((v) => v.timestamp))
    : null;

  return {
    like: {
      remaining: Math.max(0, 1 - recentLikes.length),
      nextAt: oldestLike ? new Date(oldestLike + VOTE_COOLDOWN_MS).toISOString() : null,
    },
    dislike: {
      remaining: Math.max(0, 1 - recentDislikes.length),
      nextAt: oldestDislike ? new Date(oldestDislike + VOTE_COOLDOWN_MS).toISOString() : null,
    },
  };
}

export function addProfile(profile: Omit<Profile, 'id' | 'createdAt' | 'likes' | 'dislikes' | 'myVote'>): Profile {
  const data = load();
  const newProfile: Profile = {
    ...profile,
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0,
    myVote: null,
  };
  data.addedProfiles.push(newProfile);
  save(data);
  return newProfile;
}

export function applyVotesToProfile(profile: Profile): Profile {
  const extra = getVoteCounts(profile.id);
  return {
    ...profile,
    likes: profile.likes + extra.likes,
    dislikes: profile.dislikes + extra.dislikes,
    myVote: getMyVote(profile.id),
  };
}
