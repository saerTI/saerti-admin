// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User, LoginCredentials, RegisterData, UpdateProfileData, UpdateMetaData, UpdateAddressData } from '../types/user';

// Define the Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Authentication methods
  login: (email: string, password: string) => Promise<boolean>;
  loginWithCredentials: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile management
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updateMeta: (data: UpdateMetaData) => Promise<void>;
  updateAddress: (data: UpdateAddressData) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utility methods
  clearError: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => false,
  loginWithCredentials: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  updateMeta: async () => {},
  updateAddress: async () => {},
  uploadAvatar: async () => {},
  refreshUser: async () => {},
  clearError: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check if user is already logged in
  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.validateToken();
        setUser(userData);
      }
    } catch (err) {
      console.error('Error checking authentication:', err);
      // Clear invalid token
      authService.clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Login function (mantener tu interfaz original)
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      const userData = response.data.user;
      setUser(userData);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Error al iniciar sesión';
      
      // Extract error message from response
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  // Login with credentials object (para compatibilidad con nuevos componentes)
  const loginWithCredentials = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      const userData = response.data.user;
      setUser(userData);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.response?.data?.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw err; // Re-throw para que el componente que llama pueda manejarlo
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      const newUser = response.data.user;
      setUser(newUser);
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err?.response?.data?.message || 'Error al registrar usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  // Update profile function
  const updateProfile = async (data: UpdateProfileData): Promise<void> => {
    setError(null);
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (err: any) {
      console.error('Update profile error:', err);
      const errorMessage = err?.response?.data?.message || 'Error al actualizar perfil';
      setError(errorMessage);
      throw err;
    }
  };

  // Update user meta information
  const updateMeta = async (data: UpdateMetaData): Promise<void> => {
    setError(null);
    try {
      const updatedUser = await authService.updateMeta(data);
      setUser(updatedUser);
    } catch (err: any) {
      console.error('Update meta error:', err);
      const errorMessage = err?.response?.data?.message || 'Error al actualizar información del perfil';
      setError(errorMessage);
      throw err;
    }
  };

  // Update user address information
  const updateAddress = async (data: UpdateAddressData): Promise<void> => {
    setError(null);
    try {
      const updatedUser = await authService.updateAddress(data);
      setUser(updatedUser);
    } catch (err: any) {
      console.error('Update address error:', err);
      const errorMessage = err?.response?.data?.message || 'Error al actualizar dirección';
      setError(errorMessage);
      throw err;
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File): Promise<void> => {
    setError(null);
    try {
      const updatedUser = await authService.uploadAvatar(file);
      setUser(updatedUser);
    } catch (err: any) {
      console.error('Upload avatar error:', err);
      const errorMessage = err?.response?.data?.message || 'Error al subir avatar';
      setError(errorMessage);
      throw err;
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      if (user) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  // Create context value object
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    
    // Authentication methods
    login, // Tu método original
    loginWithCredentials, // Nuevo método para compatibilidad
    register,
    logout,
    
    // Profile management
    updateProfile,
    updateMeta,
    updateAddress,
    uploadAvatar,
    refreshUser,
    
    // Utility methods
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the context
export default AuthContext;