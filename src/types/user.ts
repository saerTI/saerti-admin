// src/types/user.ts - Versión extendida con compatibilidad Clerk

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
  
  // Campos de perfil (ya existentes)
  avatar?: string;
  position?: string;
  location?: string;
  
  // Campos de dirección (ya existentes)
  country?: string;
  city?: string;
  postal_code?: string;
  address?: string;
  
  // ✅ NUEVOS: Campos adicionales para compatibilidad con Clerk
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  company?: string;
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
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  company?: string;
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
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  company?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  position?: string;
  location?: string;
  country?: string;
  city?: string;
  postal_code?: string;
  address?: string;
  // ✅ NUEVOS: Campos para actualizar perfil con Clerk
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  company?: string;
}

// Nuevas interfaces para actualizar información específica
export interface UpdateMetaData {
  name?: string;
  position?: string;
  location?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  company?: string;
}

export interface UpdateAddressData {
  address?: string;
  country?: string;
  city?: string;
  postal_code?: string;
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
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
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

// ✅ NUEVO: Helper para mapear usuario de Clerk a User local
export const mapClerkUserToLocal = (clerkUser: any): User => {
  return {
    id: parseInt(clerkUser.id) || 0,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 
          clerkUser.username || 
          'Usuario',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || '',
    avatar: clerkUser.imageUrl || '',
    phone: clerkUser.primaryPhoneNumber?.phoneNumber || '',
    role: (clerkUser.publicMetadata?.role as UserRole) || 'user',
    company: clerkUser.publicMetadata?.company as string || '',
    position: clerkUser.publicMetadata?.position as string || '',
    location: clerkUser.publicMetadata?.location as string || '',
    country: clerkUser.publicMetadata?.country as string || '',
    city: clerkUser.publicMetadata?.city as string || '',
    postal_code: clerkUser.publicMetadata?.postal_code as string || '',
    address: clerkUser.publicMetadata?.address as string || '',
    active: true,
    created_at: clerkUser.createdAt || new Date().toISOString(),
    updated_at: clerkUser.updatedAt || new Date().toISOString(),
  };
};