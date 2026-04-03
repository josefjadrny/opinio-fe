export type Role =
  | 'politician'
  | 'actor'
  | 'musician'
  | 'athlete'
  | 'business_leader'
  | 'influencer'
  | 'journalist'
  | 'activist'
  | 'other';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  imageUrl: string;
  countryCode: string;
  description: string;
  addedBy: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  myVote: 'like' | 'dislike' | null;
}
