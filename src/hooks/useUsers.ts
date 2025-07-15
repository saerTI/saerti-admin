// src/hooks/useUsers.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  CreateUserData, 
  UpdateUserData, 
  UserFilters, 
  UserStats,
  PaginatedResponse 
} from '../types/user';
import { userService } from '../services/userService';

interface UseUsersState {
  users: User[];
  stats: UserStats | null;
  pagination: PaginatedResponse<User>['pagination'] | null;
  loading: boolean;
  error: string | null;
}

interface UseUsersReturn extends UseUsersState {
  // User CRUD operations
  fetchUsers: (filters?: UserFilters) => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<User>;
  updateUser: (id: number, userData: UpdateUserData) => Promise<User>;
  deleteUser: (id: number) => Promise<void>;
  toggleUserStatus: (id: number, active: boolean) => Promise<User>;
  
  // Statistics
  fetchStats: () => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  refreshUsers: () => Promise<void>;
}

export function useUsers(initialFilters?: UserFilters): UseUsersReturn {
  const [state, setState] = useState<UseUsersState>({
    users: [],
    stats: null,
    pagination: null,
    loading: false,
    error: null,
  });

  const [currentFilters, setCurrentFilters] = useState<UserFilters>(initialFilters || {});

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch users with filters
  const fetchUsers = useCallback(async (filters?: UserFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtersToUse = filters || currentFilters;
      setCurrentFilters(filtersToUse);
      
      const response = await userService.getUsers(filtersToUse);
      
      setState(prev => ({
        ...prev,
        users: response.data,
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al cargar usuarios';
      setError(errorMessage);
      setLoading(false);
    }
  }, [currentFilters]);

  // Create user
  const createUser = useCallback(async (userData: CreateUserData): Promise<User> => {
    try {
      setError(null);
      const newUser = await userService.createUser(userData);
      
      // Refresh users list
      await fetchUsers();
      
      return newUser;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al crear usuario';
      setError(errorMessage);
      throw error;
    }
  }, [fetchUsers]);

  // Update user
  const updateUser = useCallback(async (id: number, userData: UpdateUserData): Promise<User> => {
    try {
      setError(null);
      const updatedUser = await userService.updateUser(id, userData);
      
      // Update user in local state
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === id ? updatedUser : user
        ),
      }));
      
      return updatedUser;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar usuario';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      await userService.deleteUser(id);
      
      // Remove user from local state
      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => user.id !== id),
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar usuario';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Toggle user status
  const toggleUserStatus = useCallback(async (id: number, active: boolean): Promise<User> => {
    try {
      setError(null);
      const updatedUser = await userService.toggleUserStatus(id, active);
      
      // Update user in local state
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === id ? updatedUser : user
        ),
      }));
      
      return updatedUser;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al cambiar estado del usuario';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const stats = await userService.getUserStats();
      setState(prev => ({ ...prev, stats }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al cargar estadísticas';
      setError(errorMessage);
    }
  }, []);

  // Refresh users with current filters
  const refreshUsers = useCallback(async () => {
    await fetchUsers(currentFilters);
  }, [fetchUsers, currentFilters]);

  // Load initial data
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    // State
    users: state.users,
    stats: state.stats,
    pagination: state.pagination,
    loading: state.loading,
    error: state.error,
    
    // Actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    fetchStats,
    clearError,
    refreshUsers,
  };
}

export default useUsers;