export interface Community {
  _id: string;
  name: string;
  description: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  topics?: string[];
  hasMentorship?: boolean;
  hasLiveEvents?: boolean;
  isPaid?: boolean;
  photo?: string;
  averageRating?: number;
  createdAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  weeks: string;
  membership: number;
  minimumSkill: 'beginner' | 'intermediate' | 'advanced';
  scholarshipsAvailable: boolean;
  community: string | Community;
  user: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  title: string;
  text: string;
  rating: number;
  community: string | Community;
  user: string;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'publisher' | 'admin';
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  data?: User;
}
