import {
  ApiResponse,
  Community,
  Course,
  Review,
  User,
  Post,
  AuthResponse,
  LoginInput,
  RegisterInput,
  CreateCommunityInput,
  CreateCourseInput,
  CreatePostInput,
  CreateReviewInput,
  UpdateUserDetailsInput,
  UpdatePasswordInput,
  ResetPasswordInput,
  PaginationParams,
  CommunityQueryParams,
  Lesson,
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Throttle authStateChange dispatch to avoid event storms when many requests
// return 401 in quick succession (for example during app startup). This
// prevents multiple components from receiving back-to-back events and
// re-triggering authentication checks which can lead to request floods
// and server-side rate limiting (429).
let lastAuthDispatch = 0;
const AUTH_DISPATCH_COOLDOWN_MS = 1000; // 1 second

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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

    // Add Authorization header if token exists in localStorage
    const token = localStorage.getItem('authToken');
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
      if (response.status === 401) {
        const now = Date.now();
        if (now - lastAuthDispatch > AUTH_DISPATCH_COOLDOWN_MS) {
          lastAuthDispatch = now;
          window.dispatchEvent(new Event('authStateChange'));
        }
      }
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
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    // Store token in localStorage for subsequent requests
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  }

  static async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    // Store token in localStorage for subsequent requests
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  }

  static async logout(): Promise<{ success: boolean }> {
    await this.request('/auth/logout');
    // Remove token from localStorage on logout
    localStorage.removeItem('authToken');
    return { success: true };
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
    const response = await this.request<AuthResponse>('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    // Store token in localStorage if provided
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  }

  static async forgotPassword(email: string): Promise<{ success: boolean }> {
    return this.request('/auth/forgotpassword', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(`/auth/resetpassword/${input.resetToken}`, {
      method: 'PUT',
      body: JSON.stringify({ password: input.password }),
    });
    // Store token in localStorage if provided
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
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
  // The backend returns a signed URL from Supabase Storage.
  static async uploadCommunityPhoto(id: string, photo: File): Promise<ApiResponse<Community>> {
    const formData = new FormData();
    formData.append('file', photo);

    const res = await this.request<ApiResponse<Community>>(`/communities/${id}/photo`, {
      method: 'PUT',
      body: formData,
    });

    return res;
  }

  // Generic file upload to /api/v1/uploads. Returns the backend response which
  // includes the file URL and metadata (filename, mimeType, size).
  static async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await this.request(`/uploads`, {
      method: 'POST',
      body: formData,
    });

    // Backend returns { success: true, data: { url, filename, size, mimeType } }
    return res;
  }

  // User Profile Photo Upload
  static async uploadUserPhoto(photo: File): Promise<{ success: boolean; data: { photo: string; photoUrl: string } }> {
    const formData = new FormData();
    formData.append('file', photo);
    return this.request('/users/photo', {
      method: 'POST',
      body: formData,
    });
  }

  // Delete authenticated user's profile photo
  static async deleteUserPhoto(): Promise<{ success: boolean; data: { photo: string | null; photoUrl: string | null } }> {
    return this.request('/users/photo', {
      method: 'DELETE'
    });
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
    // If a communityId is provided, use the nested route so the backend
    // can infer the community from the URL (this route also enforces
    // that the user is authorized to add courses to that community).
    const { communityId, ...payload } = input as any;
    if (communityId) {
      return this.request(`/communities/${communityId}/courses`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    // Fallback: post to top-level /courses (include community in body if present)
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

  static async getMyEnrollments(params?: PaginationParams): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/enrollments/my-enrollments?${query}`);
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

  // Posts / Timeline Methods
  static async getCommunityPosts(
    communityId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<Post[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/communities/${communityId}/posts?${query}`);
  }

  static async createPost(
    communityId: string,
    input: CreatePostInput
  ): Promise<ApiResponse<Post>> {
    return this.request(`/communities/${communityId}/posts`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  static async deletePost(communityId: string, postId: string): Promise<ApiResponse<void>> {
    return this.request(`/communities/${communityId}/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Enrollment Methods

  static async enrollCommunity(communityId: string): Promise<ApiResponse<any>> {
    return this.request(`/communities/${communityId}/enroll`, {
      method: 'POST',
    });
  }

  static async unenrollCommunity(communityId: string): Promise<ApiResponse<any>> {
    return this.request(`/communities/${communityId}/enroll`, {
      method: 'DELETE',
    });
  }

  static async getCommunityEnrollments(communityId: string, params?: PaginationParams): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/communities/${communityId}/enrolled?${query}`);
  }

  static async getEnrollmentStatus(communityId: string): Promise<ApiResponse<{ enrolled: boolean }>> {
    return this.request(`/communities/${communityId}/enrollment-status`);
  }

  static async unenrollUserFromCommunity(communityId: string, userId: string): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    query.set('userId', userId);
    return this.request(`/communities/${communityId}/enroll?${query}`, {
      method: 'DELETE',
    });
  }

  // Course enrollment methods (mirror community conventions)
  static async enrollCourse(courseId: string): Promise<ApiResponse<any>> {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'POST'
    });
  }

  static async unenrollCourse(courseId: string): Promise<ApiResponse<any>> {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'DELETE'
    });
  }

  static async getCourseEnrollments(courseId: string, params?: PaginationParams): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/courses/${courseId}/enrolled?${query}`);
  }

  static async getCourseEnrollmentStatus(courseId: string): Promise<ApiResponse<{ enrolled: boolean }>> {
    return this.request(`/courses/${courseId}/enrollment-status`);
  }

  static async unenrollUserFromCourse(courseId: string, userId: string): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    query.set('userId', userId);
    return this.request(`/courses/${courseId}/enroll?${query}`, {
      method: 'DELETE'
    });
  }

  // Course Content and Progress Methods
  static async getCourseContent(courseId: string): Promise<ApiResponse<Course>> {
    return this.request(`/courses/${courseId}/content`);
  }

  static async getLesson(courseId: string, lessonId: string): Promise<ApiResponse<Lesson>> {
    return this.request(`/courses/${courseId}/lessons/${lessonId}`);
  }

  static async updateLessonProgress(
    courseId: string,
    lessonId: string,
    progress: { lastPositionSeconds: number; completed?: boolean }
  ): Promise<ApiResponse<any>> {
    return this.request(`/courses/${courseId}/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }

  static async getCourseProgress(courseId: string): Promise<ApiResponse<any>> {
    return this.request(`/courses/${courseId}/progress`);
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
