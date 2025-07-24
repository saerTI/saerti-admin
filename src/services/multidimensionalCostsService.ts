// src/services/multidimensionalCostsService.ts
import api from './apiService';

// ==========================================
// INTERFACES DE TIPOS
// ==========================================

export interface CostFilter {
  cost_center_id?: number;
  transaction_type?: 'ingreso' | 'gasto';
  category_group?: string;
  category_id?: number;
  employee_id?: number;
  supplier_id?: number;
  period_year?: number;
  period_month?: number;
  period_key?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  source_type?: 'orden_compra' | 'nomina' | 'factura' | 'manual';
  page?: number;
  limit?: number;
  sort?: string;
}

export interface MultidimensionalCost {
  cost_id: number;
  description: string;
  amount: number;
  date: string;
  transaction_type: 'ingreso' | 'gasto';
  
  // Información del centro de costo
  cost_center_id: number;
  cost_center_code: string;
  cost_center_name: string;
  cost_center_type: 'proyecto' | 'departamento' | 'cliente';
  
  // Información de categoría
  category_id: number;
  category_name: string;
  category_group: string;
  
  // Información de empleado (si aplica)
  employee_id?: number;
  employee_name?: string;
  employee_position?: string;
  employee_department?: string;
  
  // Información de proveedor (si aplica)
  supplier_id?: number;
  supplier_name?: string;
  supplier_tax_id?: string;
  
  // Información temporal
  period_year: number;
  period_month: number;
  period_key: string;
  
  // Metadata
  source_type: 'orden_compra' | 'nomina' | 'factura' | 'manual';
  source_id: number;
  created_at: string;
  updated_at: string;
}

export interface CostDimension {
  id: number;
  name: string;
  code?: string;
  cost_count: number;
  total_amount: number;
}

// ==========================================
// INTERFACES ESPECÍFICAS POR DIMENSIÓN
// ==========================================

export interface CostCenterDimension {
  id: number;
  code: string;
  name: string;
  type: string;
  client: string;
  cost_count: number;
  total_amount: number;
}

export interface CategoryDimension {
  id: number;
  code: string;
  name: string;
  type: string;
  group_name: string; // ✅ Campo específico de categorías
  cost_count: number;
  total_amount: number;
}

export interface EmployeeDimension {
  id: number;
  tax_id: string;
  name: string;
  position: string; // ✅ Campo específico de empleados
  department: string;
  cost_count: number;
  total_amount: number;
}

export interface SupplierDimension {
  id: number;
  tax_id: string;
  name: string;
  cost_count: number;
  total_amount: number;
}

export interface PeriodDimension {
  period_year: number;
  period_month: number;
  period_key: string;
  cost_count: number;
  total_amount: number;
}

export interface SourceTypeDimension {
  source_type: string;
  cost_count: number;
  total_amount: number;
}

export interface CostsDimensions {
  cost_centers: CostCenterDimension[];
  categories: CategoryDimension[];
  employees: EmployeeDimension[];
  suppliers: SupplierDimension[];
  periods: PeriodDimension[];
  source_types: SourceTypeDimension[];
  totals: {
    total_costs: number;
    total_amount: number;
  };
}

export interface CostsSummary {
  total_amount: number;
  total_income: number;
  total_expenses: number;
  net_result: number;
  costs_count: number;
  by_category: Array<{
    category_name: string;
    category_group: string;
    amount: number;
    percentage: number;
  }>;
  by_period: Array<{
    period_key: string;
    period_year: number;
    period_month: number;
    amount: number;
  }>;
}

export interface PaginatedCostsResponse {
  success: boolean;
  data: MultidimensionalCost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  applied_filters: CostFilter;
  metadata: {
    total_results: number;
    filters_applied: number;
    query_time: string;
  };
}

// ==========================================
// SERVICIOS PRINCIPALES
// ==========================================

/**
 * Explora costos con filtros multidimensionales
 */
export const exploreCosts = async (filters: CostFilter = {}): Promise<PaginatedCostsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Agregar filtros a los query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/costs/explore${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<PaginatedCostsResponse>(endpoint);
    
    return response;
  } catch (error) {
    console.error('Error explorando costos:', error);
    throw new Error('Error al explorar costos multidimensionales');
  }
};

/**
 * Obtiene todas las dimensiones disponibles para filtros
 */
export const getCostsDimensions = async (baseFilters: Partial<CostFilter> = {}): Promise<CostsDimensions> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Agregar filtros base para contexto
    Object.entries(baseFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/costs/dimensions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<{ success: boolean; data: CostsDimensions }>(endpoint);
    
    return response.data;
  } catch (error) {
    console.error('Error obteniendo dimensiones:', error);
    throw new Error('Error al obtener dimensiones de costos');
  }
};

/**
 * Obtiene costos específicos de un proyecto
 */
export const getProjectCosts = async (projectId: number, filters: CostFilter = {}): Promise<MultidimensionalCost[]> => {
  try {
    const projectFilters = {
      ...filters,
      cost_center_id: projectId,
      limit: 1000 // Obtener muchos datos para el proyecto
    };
    
    const response = await exploreCosts(projectFilters);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo costos del proyecto ${projectId}:`, error);
    throw new Error('Error al obtener costos del proyecto');
  }
};

/**
 * Obtiene resumen de costos de un proyecto
 */
export const getProjectCostsSummary = async (projectId: number): Promise<CostsSummary> => {
  try {
    // Obtener las dimensiones filtradas por el proyecto
    const dimensions = await getCostsDimensions({ cost_center_id: projectId });
    
    // Obtener costos detallados para calcular métricas
    const costsResponse = await exploreCosts({ 
      cost_center_id: projectId, 
      limit: 1000 
    });
    
    const costs = costsResponse.data;
    
    // Calcular resumen
    const totalIncome = costs
      .filter(c => c.transaction_type === 'ingreso')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const totalExpenses = costs
      .filter(c => c.transaction_type === 'gasto')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const totalAmount = totalIncome + totalExpenses;
    
    // Agrupar por categoría
    const categoryMap = new Map<string, { amount: number; group: string }>();
    costs.forEach(cost => {
      const key = cost.category_name;
      const existing = categoryMap.get(key) || { amount: 0, group: cost.category_group };
      categoryMap.set(key, {
        amount: existing.amount + cost.amount,
        group: cost.category_group
      });
    });
    
    const by_category = Array.from(categoryMap.entries()).map(([name, data]) => ({
      category_name: name,
      category_group: data.group,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
    }));
    
    // Agrupar por período
    const periodMap = new Map<string, number>();
    costs.forEach(cost => {
      const key = cost.period_key;
      periodMap.set(key, (periodMap.get(key) || 0) + cost.amount);
    });
    
    const by_period = Array.from(periodMap.entries()).map(([period_key, amount]) => {
      const [year, month] = period_key.split('-');
      return {
        period_key,
        period_year: parseInt(year),
        period_month: parseInt(month),
        amount
      };
    }).sort((a, b) => a.period_key.localeCompare(b.period_key));
    
    return {
      total_amount: totalAmount,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_result: totalIncome - totalExpenses,
      costs_count: costs.length,
      by_category: by_category.sort((a, b) => b.amount - a.amount),
      by_period
    };
  } catch (error) {
    console.error(`Error obteniendo resumen de costos del proyecto ${projectId}:`, error);
    throw new Error('Error al obtener resumen de costos del proyecto');
  }
};

/**
 * Análisis detallado de un centro de costo
 */
export const drillDownCostCenter = async (costCenterId: number) => {
  try {
    const response = await api.get<any>(`/costs/drill-down/cost-center/${costCenterId}`);
    return response.data;
  } catch (error) {
    console.error(`Error en drill-down del centro de costo ${costCenterId}:`, error);
    throw new Error('Error al obtener análisis detallado del centro de costo');
  }
};

/**
 * Análisis detallado de una categoría
 */
export const drillDownCategory = async (categoryId: number) => {
  try {
    const response = await api.get<any>(`/costs/drill-down/category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error en drill-down de la categoría ${categoryId}:`, error);
    throw new Error('Error al obtener análisis detallado de la categoría');
  }
};

/**
 * Resumen ejecutivo multidimensional
 */
export const getExecutiveSummary = async (filters: CostFilter = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/costs/executive-summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<any>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo resumen ejecutivo:', error);
    throw new Error('Error al obtener resumen ejecutivo');
  }
};

/**
 * Estadísticas rápidas para dashboard
 */
export const getQuickStats = async (filters: CostFilter = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/costs/quick-stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<any>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas rápidas:', error);
    throw new Error('Error al obtener estadísticas rápidas');
  }
};

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {
  exploreCosts,
  getCostsDimensions,
  getProjectCosts,
  getProjectCostsSummary,
  drillDownCostCenter,
  drillDownCategory,
  getExecutiveSummary,
  getQuickStats
};