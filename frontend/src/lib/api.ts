const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.learnhub.com';

export class ApiClient {
  private static getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  static async login(email: string, password: string) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(name: string, email: string, password: string, role: 'user' | 'publisher' = 'user') {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  }

  static async logout() {
    return this.request('/api/v1/auth/logout', { method: 'GET' });
  }

  // Communities
  static async getCommunities(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/api/v1/communities?${query}`);
  }

  static async getCommunityCourses(communityId: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/api/v1/communities/${communityId}/courses?${query}`);
  }

  static async getCommunity(id: string) {
    return this.request(`/api/v1/communities/${id}`);
  }

  static async createCommunity(data: any) {
    return this.request('/api/v1/communities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Courses
  static async getCourses(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/api/v1/courses?${query}`);
  }

  static async getCourse(id: string) {
    return this.request(`/api/v1/courses/${id}`);
  }

  static async createCourse(data: any) {
    return this.request('/api/v1/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reviews
  static async getReviews(communityId: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return this.request(`/api/v1/communities/${communityId}/reviews?${query}`);
  }

  static async createReview(communityId: string, data: any) {
    return this.request(`/api/v1/communities/${communityId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Photo upload
  static async uploadCommunityPhoto(communityId: string, file: File) {
    const formData = new FormData();
    formData.append('photo', file);

    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/communities/${communityId}/photo`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}
