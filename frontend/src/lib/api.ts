import {
  ApiResponse,
  Community,
  Course,
  Review,
  User,
  AuthResponse,
  LoginInput,
  RegisterInput,
  CreateCommunityInput,
  CreateCourseInput,
  CreateReviewInput,
  UpdateUserDetailsInput,
  UpdatePasswordInput,
  ResetPasswordInput,
  PaginationParams,
  CommunityQueryParams
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class ApiClient {
  private static getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const defaultHeaders: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Only set Content-Type for non-FormData requests
    if (options.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const headers: HeadersInit = {
      ...defaultHeaders,
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      const errorMessage = errorBody.error || errorBody.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status);
    }

    // Handle responses that might not have a body (e.g., 204 No Content)
    if (response.status === 204) {
      return Promise.resolve({ success: true } as T);
    }
    
    return response.json();
  }

  // Auth Methods
  static async login(input: LoginInput): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  static async register(input: RegisterInput): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  static async logout(): Promise<{ success: boolean }> {
    return this.request('/auth/logout');
  }

  static async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  static async updateUserDetails(input: UpdateUserDetailsInput): Promise<ApiResponse<User>> {
    return this.request('/auth/updatedetails', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  static async updatePassword(input: UpdatePasswordInput): Promise<AuthResponse> {
    return this.request('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  static async forgotPassword(email: string): Promise<{ success: boolean }> {
    return this.request('/auth/forgotpassword', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
    return this.request(`/auth/resetpassword/${input.resetToken}`, {
      method: 'PUT',
      body: JSON.stringify({ password: input.password }),
    });
  }

  // Communities Methods
  static async getCommunities(params?: CommunityQueryParams): Promise<ApiResponse<Community[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.set(key, value.toString());
        }
      });
    }
    return this.request(`/communities?${query}`);
  }

  static async getCommunity(id: string): Promise<ApiResponse<Community>> {
    return this.request(`/communities/${id}`);
  }

  static async createCommunity(input: CreateCommunityInput): Promise<ApiResponse<Community>> {
    return this.request('/communities', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  static async updateCommunity(id: string, input: Partial<CreateCommunityInput>): Promise<ApiResponse<Community>> {
    return this.request(`/communities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  static async deleteCommunity(id: string): Promise<ApiResponse<void>> {
    return this.request(`/communities/${id}`, {
      method: 'DELETE',
    });
  }

  // Upload a community photo and return a public URL to access it.
  // The backend returns the stored filename; we construct a public URL based
  // on the API base URL and the server's `/uploads` static path.
  static async uploadCommunityPhoto(id: string, photo: File): Promise<ApiResponse<Community>> {
    const formData = new FormData();
    formData.append('file', photo);

    const res = await this.request<ApiResponse<Community>>(`/communities/${id}/photo`, {
      method: 'PUT',
      body: formData,
    });

    return res;
  }

  // Courses Methods
  static async getCourses(params?: PaginationParams): Promise<ApiResponse<Course[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/courses?${query}`);
  }

  static async getCourse(id: string): Promise<ApiResponse<Course>> {
    return this.request(`/courses/${id}`);
  }

  static async createCourse(input: CreateCourseInput): Promise<ApiResponse<Course>> {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  static async updateCourse(id: string, input: Partial<CreateCourseInput>): Promise<ApiResponse<Course>> {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  static async deleteCourse(id: string): Promise<ApiResponse<void>> {
    return this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  static async getCommunityCourses(
    communityId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<Course[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/communities/${communityId}/courses?${query}`);
  }

  // Reviews Methods
  static async getReviews(
    communityId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<Review[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/communities/${communityId}/reviews?${query}`);
  }

  static async createReview(
    communityId: string,
    input: CreateReviewInput
  ): Promise<ApiResponse<Review>> {
    return this.request(`/communities/${communityId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  static async updateReview(
    reviewId: string,
    input: Partial<CreateReviewInput>
  ): Promise<ApiResponse<Review>> {
    return this.request(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  static async deleteReview(reviewId: string): Promise<ApiResponse<void>> {
    return this.request(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  // Admin User Management Methods
  static async getUsers(params?: PaginationParams): Promise<ApiResponse<User[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/users?${query}`);
  }

  static async createUser(input: { name: string; email: string; password: string; role: string; }): Promise<ApiResponse<User>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  static async updateUser(id: string, input: { name?: string; email?: string; }): Promise<ApiResponse<User>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}
