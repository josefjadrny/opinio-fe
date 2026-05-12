import type {
  ProfilesResponse, CountryProfilesResponse, MeResponse,
  VoteResponse, ProfileFilters, VoteType, PersonBreakdownResponse,
  SupportTicket, UserDetailResponse,
} from '../types/api';

const API_URL = import.meta.env.OPINIO_API_URL as string;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isJson = init?.body != null && !(init.body instanceof FormData);
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(isJson ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status });
  }
  return res.json();
}

export function getProfiles(filters: ProfileFilters): Promise<ProfilesResponse> {
  const params = new URLSearchParams({ type: filters.type });
  if (filters.country) params.set('country', filters.country);
  if (filters.roles?.length) params.set('roles', filters.roles.join(','));
  if (filters.limit != null) params.set('limit', String(filters.limit));
  return apiFetch(`/api/profiles?${params}`);
}

export function getCountryProfiles(countryCode: string): Promise<CountryProfilesResponse> {
  return apiFetch(`/api/profiles/country/${countryCode}`);
}

export function vote(profileId: string, type: VoteType): Promise<VoteResponse> {
  return apiFetch(`/api/profiles/${profileId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}

export function getMe(): Promise<MeResponse> {
  return apiFetch('/api/me');
}

export function loginWithGoogle(): void {
  window.location.href = `${API_URL}/auth/google`;
}

export function loginWithMicrosoft(): void {
  window.location.href = `${API_URL}/auth/microsoft`;
}

export function logout(): Promise<{ ok: boolean }> {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function updateMe(fields: { countryCode?: string; displayName?: string; language?: string }): Promise<{ ok: boolean }> {
  return apiFetch('/api/me', {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

export function uploadImage(blob: Blob): Promise<{ url: string; key: string }> {
  const form = new FormData();
  form.append('file', blob, 'photo.jpg');
  return apiFetch('/api/images', { method: 'POST', body: form });
}

export function uploadAvatar(blob: Blob): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', blob, 'avatar.jpg');
  return apiFetch('/api/me/avatar', { method: 'POST', body: form });
}

export function resetAvatar(): Promise<{ ok: boolean }> {
  return apiFetch('/api/me/avatar', { method: 'DELETE' });
}

export function addNewProfile(data: {
  name: string;
  role: string;
  countryCode: string;
  description: string;
  imageUrl: string;
  imageKey?: string;
  addedBy: string;
}): Promise<import('../types/profile').Profile> {
  return apiFetch('/api/profiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getProfile(profileId: string): Promise<import('../types/profile').Profile> {
  return apiFetch(`/api/profiles/${profileId}`);
}

export async function deleteProfile(profileId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/profiles/${profileId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status });
  }
}

export function getPersonBreakdown(profileId: string): Promise<PersonBreakdownResponse> {
  return apiFetch(`/api/profiles/${profileId}/breakdown`);
}

export function getUser(userId: string): Promise<UserDetailResponse> {
  return apiFetch(`/api/users/${userId}`);
}

export interface CountryCounts {
  code: string;
  likes: number;
  dislikes: number;
}

export function getCountries(): Promise<{ countries: CountryCounts[] }> {
  return apiFetch('/api/countries');
}

export function getTopVoters(country?: string): Promise<import('../types/api').TopVotersResponse> {
  const params = new URLSearchParams();
  if (country) params.set('country', country);
  const qs = params.toString();
  return apiFetch(`/api/stats/top-voters${qs ? `?${qs}` : ''}`);
}

export function getOnFireUsers(country?: string): Promise<import('../types/api').OnFireResponse> {
  const params = new URLSearchParams();
  if (country) params.set('country', country);
  const qs = params.toString();
  return apiFetch(`/api/stats/on-fire${qs ? `?${qs}` : ''}`);
}

export function getSupportTickets(): Promise<SupportTicket[]> {
  return apiFetch('/api/support');
}

export function createSupportTicket(data: { title: string; description: string; category: string }): Promise<SupportTicket> {
  return apiFetch('/api/support', { method: 'POST', body: JSON.stringify(data) });
}

export function updateSupportStatus(id: string, status: string): Promise<{ ok: boolean; status: string }> {
  return apiFetch(`/api/support/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function updateSupportReply(id: string, adminReply: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/support/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ adminReply }) });
}

export function updateSupportNote(id: string, adminNote: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/support/${id}/note`, { method: 'PATCH', body: JSON.stringify({ adminNote }) });
}

export function createCheckoutSession(): Promise<{ url: string }> {
  return apiFetch('/api/billing/checkout', { method: 'POST', body: JSON.stringify({}) });
}

export function createPortalSession(): Promise<{ url: string }> {
  return apiFetch('/api/billing/portal', { method: 'POST', body: JSON.stringify({}) });
}

// TODO: wire to wss://${API_URL}/ws once BE WebSocket is implemented
export { subscribe as subscribeRealtime } from '../mock/realtime';
