// src/services/authService.ts - Versión extendida

import api from './apiService';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  UpdateProfileData,
  UpdateMetaData,
  UpdateAddressData,
  ApiResponse 
} from '../types/user';

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
      const response = await api.get<ApiResponse<User>>('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>('/auth/profile', data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Update user meta information (name, position, location, avatar)
   */
  async updateMeta(data: UpdateMetaData): Promise<User> {
    try {
      const response = await api.patch<ApiResponse<User>>('/auth/profile/meta', data);
      return response.data;
    } catch (error) {
      console.error('Error updating user meta:', error);
      throw error;
    }
  },

  /**
   * Update user address information
   */
  async updateAddress(data: UpdateAddressData): Promise<User> {
    try {
      const response = await api.patch<ApiResponse<User>>('/auth/profile/address', data);
      return response.data;
    } catch (error) {
      console.error('Error updating user address:', error);
      throw error;
    }
  },

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post<ApiResponse<User>>('/auth/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  /**
   * Validate current token
   */
  async validateToken(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/validate');
      return response.data;
    } catch (error) {
      console.error('Error validating token:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage regardless of API response
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  /**
   * Clear authentication data
   */
  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }
};

// Export User type for backward compatibility with your existing code
export type { User } from '../types/user';

export default authService;