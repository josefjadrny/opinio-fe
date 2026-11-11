import type {
  ProfilesResponse, MeResponse, VoteResponse, ProfileFilters, PollCountry,
  CountryActivity, CountryPollsResponse,
  SupportTicket, SupportTicketDetail, SupportMessage, UserDetailResponse, ProfileReportGroup, Person,
} from '../types/api';
import type { Profile } from '../types/profile';

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

// apiFetch tags thrown errors with the HTTP status. For id-shaped endpoints a
// 404 (no such row) and a 400 (malformed id, e.g. /p/dhehdh) both mean "this
// isn't here" and will never succeed on retry - treat them as a terminal
// not-found. Other statuses (5xx, network) may be a transient blip.
export function isNotFound(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === 404 || status === 400;
}

export function getProfiles(filters: ProfileFilters, lang?: string): Promise<ProfilesResponse> {
  const params = new URLSearchParams({ sort: filters.sort });
  if (filters.country) params.set('country', filters.country);
  if (filters.roles?.length) params.set('roles', filters.roles.join(','));
  if (filters.search) params.set('q', filters.search);
  if (filters.limit != null) params.set('limit', String(filters.limit));
  if (lang) params.set('lang', lang);
  return apiFetch(`/api/profiles?${params}`);
}

export function getSearchSuggest(q: string, lang?: string): Promise<import('../types/api').SearchSuggestResponse> {
  const params = new URLSearchParams({ q });
  if (lang) params.set('lang', lang);
  return apiFetch(`/api/search/suggest?${params}`);
}

// Anonymous votes carry a Turnstile token; registered votes need none.
export function vote(profileId: string, optionId: string, turnstileToken?: string): Promise<VoteResponse> {
  return apiFetch(`/api/profiles/${profileId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionId, turnstileToken }),
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

export function updateMe(fields: { countryCode?: string; displayName?: string; bio?: string; language?: string; showVotes?: boolean }): Promise<{ ok: boolean }> {
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

// Per-opinio content image: raw upload (any of JPEG / PNG / WebP up to 10 MB).
// The server resizes to 720p JPEG and moderates with Rekognition in prod.
export function uploadContentImage(file: File): Promise<{ url: string; key: string; thumbUrl: string; thumbKey: string }> {
  const form = new FormData();
  form.append('file', file, file.name || 'image');
  return apiFetch('/api/images/content', { method: 'POST', body: form });
}

// An answer's picture: same checks as the content image, only the 128px
// square is kept.
export function uploadOptionImage(file: File): Promise<{ thumbUrl: string; thumbKey: string }> {
  const form = new FormData();
  form.append('file', file, file.name || 'image');
  return apiFetch('/api/images/content?thumb=only', { method: 'POST', body: form });
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
  description: string;
  options: { text: string; color: string; imageUrl?: string; imageKey?: string }[];
  imageUrl?: string;
  imageKey?: string;
  contentImageUrl?: string;
  contentImageKey?: string;
  link?: string;
}): Promise<import('../types/profile').Profile> {
  return apiFetch('/api/profiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getProfile(profileId: string, lang?: string): Promise<import('../types/profile').Profile> {
  const qs = lang ? `?lang=${lang}` : '';
  return apiFetch(`/api/profiles/${profileId}${qs}`);
}

// Outbound source-link URL for an opinio. Points at the API redirect endpoint
// (counts the click + keeps the raw URL behind our domain) rather than the raw
// link, which the client never receives. Used as an <a href> opened in a new tab.
export function profileLinkUrl(profileId: string): string {
  return `${API_URL}/l/${profileId}`;
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

export function getComments(profileId: string): Promise<import('../types/api').CommentsResponse> {
  return apiFetch(`/api/profiles/${profileId}/comments`);
}

export function searchUsers(q: string): Promise<{ users: import('../types/api').MentionUser[] }> {
  return apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
}

export function postComment(profileId: string, body: string, parentId?: string | null): Promise<import('../types/api').Comment> {
  return apiFetch(`/api/profiles/${profileId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, parentId: parentId ?? null }),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status });
  }
}

export function getNotifications(cursor: string | null, lang?: string): Promise<import('../types/api').NotificationsResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (lang) params.set('lang', lang);
  return apiFetch(`/api/notifications?${params}`);
}

export function markNotificationsSeen(shownAt: string): Promise<{ unseenNotifications: number }> {
  return apiFetch('/api/notifications/seen', { method: 'POST', body: JSON.stringify({ shownAt }) });
}

export function clickNotification(id: string, shownAt: string): Promise<{ clearedIds: string[]; unseenNotifications: number }> {
  return apiFetch(`/api/notifications/${id}/click`, { method: 'POST', body: JSON.stringify({ shownAt }) });
}

export function getUser(userId: string, lang?: string): Promise<UserDetailResponse> {
  const qs = lang ? `?lang=${lang}` : '';
  return apiFetch(`/api/users/${userId}${qs}`);
}

// Votes cast FROM each country (last 24h + lifetime): the home map.
export function getCountries(): Promise<{ countries: CountryActivity[] }> {
  return apiFetch('/api/countries');
}

// One poll's answers per voter country (uncapped): the poll map and its
// Countries tab. registered = signed-in voters only.
export function getProfileCountries(profileId: string, registered = false): Promise<{ countries: PollCountry[] }> {
  return apiFetch(`/api/profiles/${profileId}/countries${registered ? '?registered=1' : ''}`);
}

// One poll seen from one country, with the world's answers next to it.
export function getPollCountry(profileId: string, code: string, lang: string): Promise<import('../types/api').PollCountryResponse> {
  return apiFetch(`/api/profiles/${profileId}/countries/${code}?lang=${lang}`);
}

// Polls people from one country voted on, with that country's answer next to
// the world's. top = most votes from there today (then lifetime), recent =
// latest vote first.
export function getCountryPolls(code: string, sort: 'top' | 'recent', limit: number, lang: string, offset = 0): Promise<CountryPollsResponse> {
  return apiFetch(`/api/countries/${code}/polls?sort=${sort}&limit=${limit}&offset=${offset}&lang=${lang}`);
}

// One well-known person by id.
export function getPerson(id: number): Promise<Person> {
  return apiFetch(`/api/persons/${id}`);
}

export interface StatsSummary { votes: number; polls: number; countries: number; voters: number }
export function getStatsSummary(): Promise<StatsSummary> {
  return apiFetch('/api/stats/summary');
}

export interface DividedItem { poll: Profile; first: { optionId: string; pct: number }; second: { optionId: string; pct: number } }
export function getStatsDivided(lang: string): Promise<{ items: DividedItem[] }> {
  return apiFetch(`/api/stats/divided?lang=${lang}`);
}

export interface StatsPerson { id: string; displayName: string; avatarUrl: string | null; countryCode: string | null; value: number; polls: number }
export function getStatsPeople(board: 'askers' | 'answerers'): Promise<{ people: StatsPerson[] }> {
  return apiFetch(`/api/stats/people?board=${board}`);
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

export function getSupportTicket(id: string): Promise<SupportTicketDetail> {
  return apiFetch(`/api/support/${id}`);
}

export function postSupportMessage(id: string, body: string): Promise<{ message: SupportMessage; status: SupportTicket['status'] }> {
  return apiFetch(`/api/support/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
}

export function markSupportRead(id: string): Promise<{ status: SupportTicket['status']; unseenNotifications: number }> {
  return apiFetch(`/api/support/${id}/read`, { method: 'POST' });
}

export function updateSupportNote(id: string, adminNote: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/support/${id}/note`, { method: 'PATCH', body: JSON.stringify({ adminNote }) });
}

export function reportProfile(profileId: string, reason: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/profiles/${profileId}/report`, { method: 'POST', body: JSON.stringify({ reason }) });
}

export function getReports(): Promise<ProfileReportGroup[]> {
  return apiFetch('/api/reports');
}

export function validateReportedProfile(profileId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/reports/${profileId}/validate`, { method: 'POST', body: JSON.stringify({}) });
}

export function createCheckoutSession(): Promise<{ url: string }> {
  return apiFetch('/api/billing/checkout', { method: 'POST', body: JSON.stringify({}) });
}

export function createPortalSession(): Promise<{ url: string }> {
  return apiFetch('/api/billing/portal', { method: 'POST', body: JSON.stringify({}) });
}

