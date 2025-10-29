// src/services/incomeDashboardService.ts
// Servicio para consumir API de dashboard de ingresos

import { api } from './apiService';
import type {
  DashboardSummary,
  TypeSummary,
  CategorySummary,
  CashFlowPeriod,
  TrendsData,
  DashboardFilters
} from '../types/dashboard';

export const incomeDashboardService = {
  /**
   * Obtener resumen completo del dashboard
   */
  getSummary: async (filters?: DashboardFilters): Promise<DashboardSummary> => {
    const response = await api.get<{ success: boolean; data: DashboardSummary }>('/incomes/dashboard/summary', { params: filters });
    return response.data;
  },

  /**
   * Obtener distribución por tipo
   */
  getByType: async (filters?: Partial<DashboardFilters>): Promise<TypeSummary[]> => {
    const response = await api.get<{ success: boolean; data: TypeSummary[] }>('/incomes/dashboard/by-type', { params: filters });
    return response.data;
  },

  /**
   * Obtener distribución por categoría
   */
  getByCategory: async (filters?: Partial<DashboardFilters>): Promise<CategorySummary[]> => {
    const response = await api.get<{ success: boolean; data: CategorySummary[] }>('/incomes/dashboard/by-category', { params: filters });
    return response.data;
  },

  /**
   * Obtener flujo de caja por período
   */
  getCashFlow: async (
    period: 'week' | 'month' | 'quarter' | 'year',
    filters?: Partial<DashboardFilters>
  ): Promise<CashFlowPeriod[]> => {
    const response = await api.get<{ success: boolean; data: CashFlowPeriod[] }>('/incomes/dashboard/cash-flow', {
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
    const response = await api.get<{ success: boolean; data: TrendsData }>('/incomes/dashboard/trends', { params: filters });
    return response.data;
  },

  /**
   * Obtener distribución por categoría y período
   */
  getCategoryByPeriod: async (
    period: 'week' | 'month' | 'quarter' | 'year',
    filters?: Partial<DashboardFilters>
  ): Promise<any[]> => {
    const response = await api.get<{ success: boolean; data: any[] }>('/incomes/dashboard/category-by-period', {
      params: {
        ...filters,
        period
      }
    });
    return response.data;
  }
};
