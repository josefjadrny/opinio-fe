import type { RealtimeEvent } from '../types/api';
import { getAllProfiles } from './storage';

type Listener = (event: RealtimeEvent) => void;

let listeners: Listener[] = [];
let intervalId: ReturnType<typeof setInterval> | null = null;

function generateFakeEvent(): RealtimeEvent {
  const profiles = getAllProfiles();
  const profile = profiles[Math.floor(Math.random() * profiles.length)];
  const isLike = Math.random() > 0.45; // slight bias toward likes

  return {
    kind: 'vote',
    profileId: profile.id,
    data: {
      likes: isLike ? 1 : 0,
      dislikes: isLike ? 0 : 1,
    },
  };
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);

  if (!intervalId) {
    intervalId = setInterval(() => {
      const event = generateFakeEvent();
      listeners.forEach((l) => l(event));
    }, 2000 + Math.random() * 3000);
  }

  return () => {
    listeners = listeners.filter((l) => l !== listener);
    if (listeners.length === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
