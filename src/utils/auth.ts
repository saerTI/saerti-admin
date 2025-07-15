// src/utils/auth.ts
import { User, UserRole, Permission, ROLE_PERMISSIONS } from '../types/user';

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role][permission];
}

/**
 * Check if a user has any of the specified roles
 */
export function hasRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if a user is admin
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, ['admin']);
}

/**
 * Check if a user is admin or manager
 */
export function isAdminOrManager(user: User | null): boolean {
  return hasRole(user, ['admin', 'manager']);
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(user: User | null): boolean {
  return hasPermission(user, 'canManageUsers');
}

/**
 * Check if a user can view all data
 */
export function canViewAllData(user: User | null): boolean {
  return hasPermission(user, 'canViewAllData');
}

/**
 * Check if a user can modify all data
 */
export function canModifyAllData(user: User | null): boolean {
  return hasPermission(user, 'canModifyAllData');
}

/**
 * Check if a user can delete data
 */
export function canDeleteData(user: User | null): boolean {
  return hasPermission(user, 'canDeleteData');
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Usuario';
  return user.name || user.email;
}

/**
 * Get role display name in Spanish
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'Administrador',
    manager: 'Manager', 
    user: 'Usuario',
  };
  return roleNames[role];
}

/**
 * Get role color for UI
 */
export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return roleColors[role];
}

/**
 * Check if user can edit another user
 */
export function canEditUser(currentUser: User | null, targetUser: User): boolean {
  if (!currentUser) return false;
  
  // Admin can edit anyone except themselves in some cases
  if (isAdmin(currentUser)) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can delete another user
 */
export function canDeleteUser(currentUser: User | null, targetUser: User): boolean {
  if (!currentUser) return false;
  
  // Can't delete yourself
  if (currentUser.id === targetUser.id) return false;
  
  // Only admin can delete users
  if (!isAdmin(currentUser)) return false;
  
  return true;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Get relative time string
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Hoy';
  } else if (diffInDays === 1) {
    return 'Ayer';
  } else if (diffInDays < 7) {
    return `Hace ${diffInDays} días`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `Hace ${years} año${years > 1 ? 's' : ''}`;
  }
}