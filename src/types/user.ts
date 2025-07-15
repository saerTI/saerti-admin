// src/types/user.ts - Versión extendida

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Nuevos campos para MetaCard
  avatar?: string;
  position?: string;
  location?: string;
  // Nuevos campos para AddressCard
  country?: string;
  city?: string;
  postal_code?: string;
  address?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  position?: string;
  location?: string;
  country?: string;
  city?: string;
  postal_code?: string;
  address?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  active?: boolean;
  position?: string;
  location?: string;
  country?: string;
  city?: string;
  postal_code?: string;
  address?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  // Nuevos campos para perfil
  position?: string;
  location?: string;
  country?: string;
  city?: string;
  postal_code?: string;
  address?: string;
}

// Nuevas interfaces para actualizar información específica
export interface UpdateMetaData {
  name?: string;
  position?: string;
  location?: string;
  avatar?: string;
}

export interface UpdateAddressData {
  address?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  active?: boolean;
  page?: number;
  limit?: number;
}

export interface UserStats {
  byRole: Array<{
    role: UserRole;
    total: number;
    active: number;
    inactive: number;
  }>;
  general: {
    total_users: number;
    active_users: number;
    inactive_users: number;
    new_last_month: number;
  };
  recentUsers: Array<{
    id: number;
    name: string;
    email: string;
    role: UserRole;
    created_at: string;
  }>;
}

// Permisos basados en roles
export const ROLE_PERMISSIONS = {
  admin: {
    canManageUsers: true,
    canViewAllData: true,
    canModifyAllData: true,
    canDeleteData: true,
  },
  manager: {
    canManageUsers: false,
    canViewAllData: true,
    canModifyAllData: true,
    canDeleteData: false,
  },
  user: {
    canManageUsers: false,
    canViewAllData: false,
    canModifyAllData: false,
    canDeleteData: false,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.admin;

// Función helper para obtener el nombre del rol en español
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames = {
    admin: 'Administrador',
    manager: 'Gerente',
    user: 'Usuario',
  };
  return roleNames[role] || role;
};

// Función helper para validar email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};