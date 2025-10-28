// src/services/expenseDashboardService.ts
// Servicio para consumir API de dashboard de egresos

import { api } from './apiService';
import type {
  DashboardSummary,
  TypeSummary,
  CategorySummary,
  CashFlowPeriod,
  TrendsData,
  DashboardFilters
} from '../types/dashboard';

export const expenseDashboardService = {
  /**
   * Obtener resumen completo del dashboard
   */
  getSummary: async (filters?: DashboardFilters): Promise<DashboardSummary> => {
    const response = await api.get<{ success: boolean; data: DashboardSummary }>('/expenses/dashboard/summary', { params: filters });
    return response.data;
  },

  /**
   * Obtener distribución por tipo
   */
  getByType: async (filters?: Partial<DashboardFilters>): Promise<TypeSummary[]> => {
    const response = await api.get<{ success: boolean; data: TypeSummary[] }>('/expenses/dashboard/by-type', { params: filters });
    return response.data;
  },

  /**
   * Obtener distribución por categoría
   */
  getByCategory: async (filters?: Partial<DashboardFilters>): Promise<CategorySummary[]> => {
    const response = await api.get<{ success: boolean; data: CategorySummary[] }>('/expenses/dashboard/by-category', { params: filters });
    return response.data;
  },

  /**
   * Obtener flujo de caja por período
   */
  getCashFlow: async (
    period: 'week' | 'month' | 'quarter' | 'year',
    filters?: Partial<DashboardFilters>
  ): Promise<CashFlowPeriod[]> => {
    const response = await api.get<{ success: boolean; data: CashFlowPeriod[] }>('/expenses/dashboard/cash-flow', {
      params: {
        ...filters,
        period
      }
    });
    return response.data;
  },

  /**
   * Obtener tendencias y comparativas
   */
  getTrends: async (filters?: Partial<DashboardFilters>): Promise<TrendsData> => {
    const response = await api.get<{ success: boolean; data: TrendsData }>('/expenses/dashboard/trends', { params: filters });
    return response.data;
  },

  /**
   * Obtener distribución por categoría y período
   */
  getCategoryByPeriod: async (
    period: 'week' | 'month' | 'quarter' | 'year',
    filters?: Partial<DashboardFilters>
  ): Promise<any[]> => {
    const response = await api.get<{ success: boolean; data: any[] }>('/expenses/dashboard/category-by-period', {
      params: {
        ...filters,
        period
      }
    });
    return response.data;
  }
};
