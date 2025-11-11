// Base Response Interface
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Community Interfaces
export interface Community {
  _id: string;
  name: string;
  description: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: {
    type: string;
    coordinates: [number, number];
    formattedAddress: string;
    street: string;
    city: string;
    state: string;
    zipcode: string;
    country: string;
  };
  topics?: string[];
  hasMentorship?: boolean;
  hasLiveEvents?: boolean;
  isPaid?: boolean;
  photo?: string;
  averageRating?: number;
  averageCost?: number;
  user: string;
  // Optional populated courses array (present when backend populates or frontend joins data)
  courses?: Course[];
  createdAt: string;
}

export interface CreateCommunityInput {
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
}

// Course Interfaces
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

export interface CreateCourseInput {
  title: string;
  description: string;
  weeks: string;
  membership: number;
  minimumSkill: 'beginner' | 'intermediate' | 'advanced';
  scholarshipsAvailable: boolean;
  communityId: string;
}

// Review Interfaces
export interface Review {
  _id: string;
  title: string;
  text: string;
  rating: number;
  community: string | Community;
  user: string;
  createdAt: string;
}

export interface CreateReviewInput {
  title: string;
  text: string;
  rating: number;
}

// User Interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'publisher' | 'admin';
  createdAt: string;
}

// Auth Interfaces
export interface AuthResponse {
  success: boolean;
  token: string;
  data: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'publisher';
}

export interface UpdateUserDetailsInput {
  name?: string;
  email?: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordInput {
  resetToken: string;
  password: string;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CommunityQueryParams extends PaginationParams {
  location?: string;
  distance?: number;
  averageCost?: number;
  averageRating?: number;
  user?: string;
}
