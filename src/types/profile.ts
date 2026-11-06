export type Role =
  | 'politics'
  | 'entertainment'
  | 'sports'
  | 'business'
  | 'media'
  | 'health'
  | 'science'
  | 'environment'
  | 'tech'
  | 'lifestyle';

// One answer of a poll. `text` is in the requested UI language when a
// translation exists; originalText is what the author typed.
export interface PollOption {
  id: string;
  position: number;
  text: string;
  originalText: string;
  /** One of the picker's nine (utils/pollColors.ts). */
  color: string;
  /** Optional small round picture. */
  imageUrl: string | null;
}

// Per-option totals of one poll: all voters, and signed-in voters only.
export interface PollResults {
  total: number;
  registeredTotal: number;
  /** Distinct voter countries. */
  countries: number;
  options: { optionId: string; n: number; registered: number }[];
}

// A poll. The type keeps its old name (Profile, /p/:id, profiles table): what
// people share is a poll, the code identifiers stayed - POLLS-DESIGN.md.
export interface Profile {
  id: string;
  /** The question. */
  name: string;
  role: Role;
  /** 128x128 thumbnail of the poll's image (lists). */
  imageUrl: string | null;
  /** The poll's image (720p JPEG) on the poll page. */
  contentImageUrl: string | null;
  // True when the poll carries a source link. The raw URL is never sent to the
  // client; it is reached only via GET /l/:id (see profileLinkUrl), which
  // redirects + counts the click. linkHost is the destination hostname.
  hasLink?: boolean;
  linkHost?: string | null;
  /** Optional context; '' when the author gave none. */
  description: string;
  // name/description carry the translation for the requested UI language when
  // one exists; original* is the untranslated text, sourceLang its language.
  originalName?: string;
  originalDescription?: string;
  sourceLang?: string | null;
  addedBy: string;
  addedById: string | null;
  createdAt: string;
  /** Lifetime votes. */
  voteCount: number;
  /** Votes in the last 24h (Trending). May be absent on realtime payloads. */
  votes24h?: number;
  options: PollOption[];
  /** Detail and vote responses only. */
  results?: PollResults;
  /** The caller's own option id on this poll (detail only), null = not voted. */
  myVote?: string | null;
  // Lifetime comment count. ABSENT means the comment UI stays off; 0 means
  // "none" and the UI is live.
  commentCount?: number;
  // The news story the poll is about: asked from the story, or linked by the
  // API's news link job. Null/absent = none.
  newsId?: string | null;
}
