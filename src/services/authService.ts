// src/services/authService.ts
import api from './apiService';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  companyId?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  }
}

/**
 * Service for handling authentication operations
 */
export const authService = {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      
      // Store token in localStorage
      if (response.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', userData);
      
      // Store token in localStorage
      if (response.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Get the current user's profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<{ success: boolean, data: User }>('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.put<{ success: boolean, data: User }>('/auth/profile', data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
};

export default authService;