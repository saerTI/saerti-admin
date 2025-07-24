// src/services/CC/fixedCostsService.ts

import { api } from '../apiService';
import { FixedCostsResponse, FixedCostFilter, FixedCost, FixedCostStats } from '../../types/CC/fixedCosts';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  stats?: FixedCostStats;
}

/**
 * Obtener costos fijos con filtros
 */
export const getFixedCosts = async (
  filters: FixedCostFilter = {},
  page: number = 1,
  pageSize: number = 25
): Promise<FixedCostsResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Agregar paginación
    params.append('limit', pageSize.toString());
    params.append('offset', ((page - 1) * pageSize).toString());
    
    // Agregar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/costos-fijos?${queryString}` : '/costos-fijos';
    
    const response = await api.get<ApiResponse<FixedCost[]>>(url);
    
    if (response.success) {
      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination || {
          current_page: 1,
          per_page: pageSize,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        },
        stats: response.stats || {
          total: 0,
          totalCosts: 0,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          draft: 0,
          active: 0,
          suspended: 0,
          completed: 0,
          cancelled: 0,
          avgQuotaValue: 0
        },
        filters: filters
      };
    } else {
      throw new Error(response.message || 'Error al obtener costos fijos');
    }
  } catch (error) {
    console.error('Error fetching costos fijos:', error);
    throw error;
  }
};

/**
 * Obtener costo fijo por ID
 */
export const getFixedCostById = async (id: number): Promise<FixedCost> => {
  try {
    const response = await api.get<ApiResponse<FixedCost>>(`/costos-fijos/${id}`);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Error al obtener costo fijo');
    }
  } catch (error) {
    console.error('Error fetching costo fijo by ID:', error);
    throw error;
  }
};

/**
 * Crear nuevo costo fijo
 */
export const createFixedCost = async (data: any): Promise<{ id: number }> => {
  try {
    const response = await api.post<ApiResponse<{ id: number }>>('/costos-fijos', data);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Error al crear costo fijo');
    }
  } catch (error) {
    console.error('Error creating costo fijo:', error);
    throw error;
  }
};

/**
 * Actualizar costo fijo
 */
export const updateFixedCost = async (data: any): Promise<FixedCost> => {
  try {
    const response = await api.put<ApiResponse<FixedCost>>(`/costos-fijos/${data.id}`, data);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Error al actualizar costo fijo');
    }
  } catch (error) {
    console.error('Error updating costo fijo:', error);
    throw error;
  }
};

/**
 * Eliminar costo fijo
 */
export const deleteFixedCost = async (id: number): Promise<boolean> => {
  try {
    const response = await api.delete<ApiResponse<boolean>>(`/costos-fijos/${id}`);
    
    if (response.success) {
      return true;
    } else {
      throw new Error(response.message || 'Error al eliminar costo fijo');
    }
  } catch (error) {
    console.error('Error deleting costo fijo:', error);
    throw error;
  }
};

/**
 * Actualizar cuotas pagadas
 */
export const updatePaidQuotas = async (id: number, paidQuotas: number): Promise<boolean> => {
  try {
    const response = await api.put<ApiResponse<boolean>>(
      `/costos-fijos/${id}/paid-quotas`, 
      { paid_quotas: paidQuotas }
    );
    
    if (response.success) {
      return true;
    } else {
      throw new Error(response.message || 'Error al actualizar cuotas pagadas');
    }
  } catch (error) {
    console.error('Error updating paid quotas:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas
 */
export const getFixedCostsStats = async (filters: FixedCostFilter = {}): Promise<FixedCostStats> => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/costos-fijos/stats?${queryString}` : '/costos-fijos/stats';
    
    const response = await api.get<ApiResponse<FixedCostStats>>(url);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Error al obtener estadísticas');
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};