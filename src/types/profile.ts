export type Role =
  | 'politics'
  | 'culture'
  | 'sports'
  | 'business'
  | 'media'
  | 'health'
  | 'tech';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  imageUrl: string | null;
  countryCode: string;
  description: string;
  addedBy: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  myVote: 'like' | 'dislike' | null;
}
