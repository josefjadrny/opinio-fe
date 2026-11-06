import type { Profile, Role } from './profile';

export interface ProfilesResponse {
  profiles: Profile[];
}

/** A country's leading answer on one poll. Null when nobody there voted. */
export type PollLeading = { optionId: string; text: string; n: number; pct: number; tie: boolean } | null;

/** One poll voted on from a country, with that country's answer next to the world's. */
export interface CountryPollItem {
  poll: Profile;
  country: { total: number; today: number; leading: PollLeading; options: { optionId: string; n: number }[] };
  world: { total: number; leading: PollLeading };
}

export interface CountryPollsResponse {
  items: CountryPollItem[];
}

/** Votes cast FROM a country: last 24h and lifetime. */
export interface CountryActivity {
  code: string;
  today: number;
  total: number;
}

// Search typeahead ("whisperer"). Users + opinios come from the API; country
// suggestions are matched client-side (translated names + /api/countries totals).
export interface SuggestUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  totalReceived: number;
}

export interface SearchSuggestResponse {
  users: SuggestUser[];
  profiles: Profile[];
}

/** Registered: always canVote. Anonymous: 1 vote per rolling 24h (and a
 *  per-IP cap); nextVoteAt says when the next one opens. */
export interface VoteAllowance {
  canVote: boolean;
  nextVoteAt: string | null;
}

export interface MeUser {
  id: string;
  displayName: string;
  provider: string | null;
  countryCode: string | null;
  avatarUrl: string | null;
  bio: string | null;
  tier: 'anonymous' | 'registered' | 'supporter' | 'admin';
  canChangeCountry: boolean;
  countryChangeAvailableAt: string | null;
  language: string | null;
  blockedUntil: string | null;
}

export interface MeResponse {
  user: MeUser;
  voteAllowance: VoteAllowance;
  /** Unseen lines in the bell, capped at 100 (shown as "99+"). 0 for anonymous. */
  unseenNotifications?: number;
}

// One line in the notifications panel. Phase 1 writes only `milestone`; the
// other kinds come with later phases and the FE skips any kind it does not know.
export type NotificationKind = 'milestone' | 'vote' | 'comment' | 'mention' | 'support';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  /** Microsecond UTC ISO - compared as a string with shownAt, never parsed for that. */
  updatedAt: string;
  seen: boolean;
  clicked: boolean;
  actors: { id: string; handle: string; avatarUrl: string | null; countryCode: string | null }[];
  moreCount: number;
  milestone: number | null;
  /** Null on a `support` line - it belongs to a ticket, not an opinio. */
  profile: { id: string; name: string; role: Role; imageUrl: string | null; isMine: boolean } | null;
  commentId: string | null;
  /** `support` lines only. event/status are as of the line's last update. */
  ticket?: {
    id: string;
    title: string;
    category: SupportTicketCategory;
    event: 'created' | 'message' | 'status';
    status: SupportTicketStatus;
    /** The recipient wrote the ticket (else they are support). */
    isMine: boolean;
  } | null;
}

export interface NotificationsResponse {
  /** The server's time of the first page's query: the bound /seen and /click take. */
  shownAt: string;
  items: NotificationItem[];
  nextCursor: string | null;
}

export interface VoteResponse {
  results: import('./profile').PollResults;
  myVote: string;
  voteAllowance: VoteAllowance;
}

export type PollSort = 'trending' | 'new' | 'top';

export interface ProfileFilters {
  sort: PollSort;
  /** "Voted from": only polls with votes from this country. */
  country?: string;
  roles?: string[];
  search?: string;
  limit?: number;
}

/** One voter country's answers on one poll. */
export interface PollCountry {
  code: string;
  total: number;
  options: { optionId: string; n: number }[];
}

// A comment on an opinio. `mentions` carries the handles referenced in the
// body so the FE can link them; the BE stores mentions by user id and renders
// the current handle at read time (handles are renamable).
export interface Comment {
  id: string;
  /** The thread root this replies to; null on a root. Never a reply's id -
   *  the BE re-points a reply-to-a-reply at its root, so threads are one level. */
  parentId: string | null;
  body: string;
  createdAt: string;
  user: {
    id: string;
    handle: string;
    avatarUrl: string | null;
    countryCode: string | null;
  };
  mentions: { userId: string; handle: string }[];
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
}

export interface MentionUser {
  id: string;
  handle: string;
  avatarUrl: string | null;
  countryCode: string | null;
}

export interface UserProfileSummary {
  id: string;
  name: string;
  role: import('./profile').Role;
  imageUrl: string | null;
  voteCount: number;
  commentCount: number;
}

/** One thing the user did, newest first. `comment` is set for kind 'comment'. */
export interface UserActivityItem {
  kind: 'post' | 'comment' | 'vote';
  at: string;
  profile: UserProfileSummary;
  comment: { id: string; body: string; mentions: Comment['mentions'] } | null;
}

export interface UserDetailResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  bio: string | null;
  createdAt: string;
  pollsAsked: number;
  pollsAnswered: number;
  /** Votes on all the polls this user asked. */
  votesReceived: number;
  /** Countries whose people answered this user's polls. */
  countriesReached: number;
  profileCount: number;
  activity: UserActivityItem[];
}

export type SupportTicketStatus = 'new' | 'investigating' | 'waiting' | 'done';
export type SupportTicketCategory = 'bug' | 'feature' | 'subscription' | 'account' | 'other';

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  /** The latest support message - kept for older clients; the thread is `messages`. */
  adminReply: string | null;
  messageCount: number;
  lastActivityAt: string;
  /** Who wrote last: support (true) or the ticket's author. */
  lastFromStaff: boolean;
  /** The newest message of either side; null before the first answer. */
  lastMessage: string | null;
  /** The viewer has an unclicked bell line for this ticket. */
  unread: boolean;
  adminNote?: string | null;
  userId?: string;
  userDisplayName?: string;
  userCountryCode?: string | null;
  userTier?: string | null;
  userAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  body: string;
  /** Support's message - shown as "Opinio support", never an admin's handle. */
  fromStaff: boolean;
  createdAt: string;
  /** Admin view only: which admin wrote it. */
  staffHandle?: string | null;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

export type ReporterTier = 'anonymous' | 'registered' | 'supporter' | 'admin';

export interface ProfileReport {
  reason: string;
  reporterName: string | null;
  reporterTier: ReporterTier | null;
  createdAt: string;
}

export interface ProfileReportGroup {
  profileId: string;
  profileName: string;
  role: Role;
  reportCount: number;
  lastReportedAt: string;
  reports: ProfileReport[];
}


// A well-known person (GET /api/persons). `role` is the profile category.
export interface Person {
  id: number;
  name: string;
  role: string;
  countryCode: string | null;
  born?: string;
  photo?: { url: string; credit: string; license: string; source: string };
}

// A news item as the live banner reads it (GET /api/news/:id?lang=): title and
// body in the requested language, the person whose photo is its picture.
export interface NewsItem {
  id: string;
  title: string;
  body: string;
  originalTitle: string;
  originalBody: string;
  sourceLang: string | null;
  role: Role;
  countryCode: string;
  sourceName: string;
  sourceUrl: string;
  createdAt: string;
  // id and photoUrl are null until the person is added; the banner shows
  // the country flag then.
  person: {
    id: number | null; name: string; photoUrl: string | null;
    photoCredit?: string | null; photoLicense?: string | null; photoSource?: string | null;
  };
}
