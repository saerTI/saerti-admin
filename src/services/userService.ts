// src/services/userService.ts
import api from './apiService';
import { 
  User, 
  CreateUserData, 
  UpdateUserData, 
  ApiResponse, 
  PaginatedResponse, 
  UserFilters, 
  UserStats 
} from '../types/user';

/**
 * Service for managing users (admin operations)
 */
export const userService = {
  /**
   * Get all users with optional filters (Admin only)
   */
  async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.active !== undefined) params.append('active', filters.active.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = `/users${queryString ? `?${queryString}` : ''}`;
      
      return await api.get<PaginatedResponse<User>>(url);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(id: number): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  /**
   * Create a new user (Admin only)
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await api.post<ApiResponse<User>>('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update user (Admin only)
   */
  async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Delete user (Admin only)
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  /**
   * Toggle user status (Admin only)
   */
  async toggleUserStatus(id: number, active: boolean): Promise<User> {
    try {
      const response = await api.patch<ApiResponse<User>>(`/users/${id}/status`, { active });
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  /**
   * Get user statistics (Admin only)
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get<ApiResponse<UserStats>>('/users/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }
};

export default userService;