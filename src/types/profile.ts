export type Role =
  | 'politics'
  | 'entertainment'
  | 'sports'
  | 'business'
  | 'media'
  | 'health'
  | 'science';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  imageUrl: string | null;
  countryCode: string;
  description: string;
  addedBy: string;
  addedById: string | null;
  createdAt: string;
  likes: number;
  dislikes: number;
  myVote: 'like' | 'dislike' | null;
}
