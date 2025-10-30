// saerti-admin/src/services/organizationService.ts
import { api } from './apiService';

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  createdAt?: number;
  userRole?: string;
  publicMetadata?: Record<string, any>;
}

export interface OrganizationMembership {
  id: string;
  name: string;
  role: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Obtener la organización actual del usuario autenticado
 */
export const getCurrentOrganization = async (): Promise<Organization> => {
  const response = await api.get<ApiResponse<Organization>>('/organizations/current');
  return response.data;
};

/**
 * Obtener todas las organizaciones del usuario
 */
export const getUserOrganizations = async (): Promise<OrganizationMembership[]> => {
  const response = await api.get<ApiResponse<OrganizationMembership[]>>('/organizations');
  return response.data;
};

/**
 * Cambiar la organización activa
 */
export const switchOrganization = async (organizationId: string): Promise<void> => {
  await api.post<ApiResponse<{ organizationId: string }>>('/organizations/switch', {
    organizationId
  });
};

export const organizationService = {
  getCurrentOrganization,
  getUserOrganizations,
  switchOrganization
};

export default organizationService;
