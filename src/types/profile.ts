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
  countryCode: string;
  description: string;
  addedBy: string;
  addedById: string | null;
  createdAt: string;
  likes: number;
  dislikes: number;
  label?: 'new' | 'rising' | 'falling';
}
