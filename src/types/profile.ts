export type Role =
  | 'politics'
  | 'entertainment'
  | 'sports'
  | 'business'
  | 'media'
  | 'health'
  | 'science'
  | 'tech';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  imageUrl: string | null;
  // Optional large content image (720p JPEG) shown on the detail page and
  // desktop hover preview. Separate from imageUrl, which is the 128×128 avatar.
  contentImageUrl: string | null;
  // True when the opinio carries a source link. The raw URL is never sent to the
  // client; it is reached only via GET /l/:id (see profileLinkUrl), which
  // redirects + counts the click. linkHost is just the destination hostname
  // (e.g. "reuters.com") for display so users see where the link goes.
  hasLink?: boolean;
  linkHost?: string | null;
  countryCode: string;
  description: string;
  // name/description above carry the translation for the requested UI language
  // when one exists. originalName/originalDescription are the untranslated text
  // (always present); sourceLang is the auto-detected original language. When no
  // translation applies, name === originalName and there's nothing to toggle.
  originalName?: string;
  originalDescription?: string;
  sourceLang?: string | null;
  addedBy: string;
  addedById: string | null;
  createdAt: string;
  likes: number;
  dislikes: number;
  // Lifetime votes received — only ever increment, never decremented by expiry.
  // Unlike likes/dislikes (active 24h window), these accumulate forever. May be
  // absent on lightweight payloads (e.g. realtime banner) — treat as 0.
  totalLikes?: number;
  totalDislikes?: number;
  label?: 'new' | 'rising' | 'falling';
}
