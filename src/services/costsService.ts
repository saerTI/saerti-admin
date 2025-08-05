// src/services/costsService.ts - Actualizado para usar backend real
import api from './apiService';
import { OrdenCompra as ImportedOrdenCompra } from '../types/CC/ordenCompra';

// Re-export the OrdenCompra type from the new types file
export type OrdenCompra = ImportedOrdenCompra;

// Updated GastoFilter interface to include new filter options
export interface GastoFilter {
  // Existing filters
  projectId?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  state?: string;
  
  // New filters for orden de compra
  grupoCuenta?: string;
  paymentType?: string;
  cuentaContable?: string;
  centroCostoId?: number;
  estadoPago?: string;
  tieneFactura?: boolean;
  providerId?: number;
  search?: string;
  orderNumber?: string;
  
  // Pagination and sorting
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// **AÑADIR TIPO COTIZACION PARA COMPATIBILIDAD**
export interface Cotizacion {
  id: number;
  name: string;
  supplierName?: string;
  date: string;
  state: string;
  projectName?: string;
  amount?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// **NUEVOS TIPOS PARA LA VISTA CONSOLIDADA**
export interface CostsData {
  totalExpenses: number;
  pendingExpenses: number;
  recentExpenses: CostItem[];
  byPeriodData: CostsByPeriod[];
  byCategoryData: CostsByCategory[];
  emptyCategoriesData: CostsByCategory[]; // ← NUEVO
}

export interface CostItem {
  cost_id: number;
  transaction_type: string;
  description: string;
  amount: number;
  date: string;
  period_year: number;
  period_month: number;
  status: string;
  cost_center_name: string;
  category_name: string;
  supplier_name?: string;
  employee_name?: string;
  source_type: string;
  period_key: string;
}

export interface CostsByPeriod {
  category: string;
  path: string;
  amounts: Record<string, number>;
}

export interface CostsByCategory {
  category_id: number;        // ← REQUERIDO
  title: string;
  amount: number;
  count: number;
  path: string;
  has_data: boolean;          // ← REQUERIDO
  category_code?: string;
  category_group?: string;
}

export interface CostsFilters {
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  year: string;
  projectId?: string;
  costCenterId?: string;
  categoryId?: string;
  status?: string;
}

// **SERVICIO ACTUALIZADO QUE USA BACKEND REAL**
export const costsApiService = {
  /**
   * Obtener datos consolidados de costos desde la vista multidimensional
   */
  async getCostsData(filters: CostsFilters): Promise<CostsData> {
    try {
      const params = new URLSearchParams();
      
      // Añadir filtros a los parámetros
      if (filters.periodType) params.append('period_type', filters.periodType);
      if (filters.year) params.append('year', filters.year);
      if (filters.projectId && filters.projectId !== 'all') {
        params.append('cost_center_id', filters.projectId);
      }
      if (filters.costCenterId && filters.costCenterId !== 'all') {
        params.append('cost_center_id', filters.costCenterId);
      }
      if (filters.categoryId && filters.categoryId !== 'all') {
        params.append('category_id', filters.categoryId);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      // **LLAMADA AL ENDPOINT MULTIDIMENSIONAL**
      const response = await api.get<{
        success: boolean;
        data: {
          summary: {
            total_expenses: number;
            pending_count: number;
          };
          items: CostItem[];
          by_category: Array<{
            category_id?: number;      // ← Añadido como opcional desde backend
            category_name: string;
            total_amount: number;
            cost_count: number;
          }>;
        };
      }>(`/costs/explore?${params.toString()}`);

      if (!response.success) {
        throw new Error('Error al obtener datos de costos');
      }

      // **TRANSFORMAR DATOS PARA LA VISTA**
      const { summary, items, by_category } = response.data;

      // Transformar categorías para las cards - CORREGIDO
      const byCategoryData: CostsByCategory[] = by_category.map((cat, index) => ({
        category_id: cat.category_id || index + 1,  // ← AGREGADO: usar ID del backend o un fallback
        title: cat.category_name || 'Sin Categoría',
        amount: parseFloat(cat.total_amount.toString()) || 0,
        count: cat.cost_count || 0,
        path: `/costs/category/${encodeURIComponent(cat.category_name || 'sin-categoria')}`,
        has_data: (cat.cost_count || 0) > 0        // ← AGREGADO: has_data basado en si tiene registros
      }));

      // Items recientes (últimos 10)
      const recentExpenses = items.slice(0, 10);

      return {
        totalExpenses: parseFloat(summary.total_expenses.toString()) || 0,
        pendingExpenses: summary.pending_count || 0,
        recentExpenses,
        byPeriodData: [], // Se calculará después con los períodos
        byCategoryData,
        emptyCategoriesData: []  // ← AGREGADO: inicializar como array vacío
      };

    } catch (error) {
      console.error('Error fetching costs data:', error);
      throw new Error('Error al cargar datos de costos');
    }
  },

  /**
   * Obtener datos por período para la tabla financiera
   */
  async getCostsByPeriod(filters: CostsFilters): Promise<CostsByPeriod[]> {
    try {
      console.log('🔄 getCostsByPeriod called with filters:', filters);
      
      const params = new URLSearchParams();
      
      // Añadir filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          // Mapear nombres de filtros al formato del backend
          const backendKey = key === 'costCenterId' ? 'cost_center_id' : 
                           key === 'categoryId' ? 'category_id' : key;
          params.append(backendKey, value.toString());
        }
      });

      console.log('📡 API call: /costs/by-period?' + params.toString());

      // Llamada específica para datos por período
      const response = await api.get<{
        success: boolean;
        data: Array<{
          category_name: string;
          period_key: string;
          total_amount: number;
        }>;
      }>(`/costs/by-period?${params.toString()}`);

      console.log('📡 Backend response:', response);

      if (!response.success) {
        throw new Error('Error al obtener datos por período');
      }

      if (!response.data || response.data.length === 0) {
        console.log('⚠️ No period data returned from backend');
        return [];
      }

      console.log(`📊 Backend returned ${response.data.length} period-category combinations`);

      // **AGRUPAR POR CATEGORÍA Y PERÍODO**
      const groupedData: Record<string, Record<string, number>> = {};
      
      response.data.forEach(item => {
        const category = item.category_name || 'Sin Categoría';
        const periodKey = item.period_key;
        const amount = parseFloat(item.total_amount.toString()) || 0;

        console.log(`📊 Processing: ${category} -> ${periodKey} = ${amount}`);

        if (!groupedData[category]) {
          groupedData[category] = {};
        }
        
        groupedData[category][periodKey] = amount;
      });

      console.log('📊 Grouped data:', groupedData);

      // Convertir a formato esperado por FinancialTable
      const result = Object.entries(groupedData).map(([category, amounts]) => ({
        category,
        path: `/costs/category/${encodeURIComponent(category)}`,
        amounts
      }));

      console.log('📊 Final transformed result:', result);
      return result;

    } catch (error) {
      console.error('Error fetching costs by period:', error);
      // Fallback: devolver array vacío si falla
      return [];
    }
  },

  /**
   * Obtener opciones dinámicas para filtros
   */
  async getFilterOptions(): Promise<{
    projects: Array<{value: string, label: string}>;
    costCenters: Array<{value: string, label: string}>;
    categories: Array<{value: string, label: string}>;
    statuses: Array<{value: string, label: string}>;
  }> {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          cost_centers: Array<{
            id: number;
            name: string;
            type?: string;
          }>;
          categories: Array<{
            id: number;
            name: string;
            group_name?: string;
          }>;
          statuses: Array<{
            value: string;
            label: string;
          }>;
        };
      }>('/costs/dimensions');

      if (!response.success) {
        throw new Error('Error al obtener opciones de filtros');
      }

      const { cost_centers, categories, statuses } = response.data;

      return {
        projects: cost_centers.map(cc => ({
          value: cc.id.toString(),
          label: cc.name
        })),
        costCenters: cost_centers.map(cc => ({
          value: cc.id.toString(),
          label: `${cc.name}${cc.type ? ` (${cc.type})` : ''}`
        })),
        categories: categories.map(cat => ({
          value: cat.id.toString(),
          label: cat.group_name ? `${cat.group_name}: ${cat.name}` : cat.name
        })),
        statuses: statuses.map(status => ({
          value: status.value,
          label: status.label
        }))
      };

    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Fallback con opciones por defecto
      return {
        projects: [
          { value: 'proyecto-a', label: 'Proyecto A' },
          { value: 'proyecto-b', label: 'Proyecto B' }
        ],
        costCenters: [
          { value: 'cc-1', label: 'Centro 1' },
          { value: 'cc-2', label: 'Centro 2' }
        ],
        categories: [
          { value: 'cat-1', label: 'Remuneraciones' },
          { value: 'cat-2', label: 'Materiales' }
        ],
        statuses: [
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'aprobado', label: 'Aprobado' }
        ]
      };
    }
  },

  // **MÉTODOS EXISTENTES ACTUALIZADOS (orden de compra específica)**
  async getOrdenesCompra(filters: GastoFilter = {}): Promise<OrdenCompra[]> {
    try {
      const params = new URLSearchParams();
      
      // Convertir filtros a parámetros de query
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get<{
        success: boolean;
        data: OrdenCompra[];
      }>(`/purchase-orders?${params.toString()}`);

      if (!response.success) {
        throw new Error('Error al obtener órdenes de compra');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching órdenes de compra:', error);
      throw new Error('Error al cargar órdenes de compra');
    }
  },

  async getOrdenCompraById(id: number): Promise<OrdenCompra | null> {
    try {
      const response = await api.get<{
        success: boolean;
        data: OrdenCompra;
      }>(`/purchase-orders/${id}`);

      if (!response.success) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching orden de compra ${id}:`, error);
      return null;
    }
  },

  async createOrdenCompra(data: Partial<OrdenCompra>): Promise<OrdenCompra> {
    try {
      const response = await api.post<{
        success: boolean;
        data: OrdenCompra;
      }>('/purchase-orders', data);

      if (!response.success) {
        throw new Error('Error al crear orden de compra');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating orden de compra:', error);
      throw new Error('Error al crear orden de compra');
    }
  },

  async updateOrdenCompra(id: number, data: Partial<OrdenCompra>): Promise<OrdenCompra> {
    try {
      const response = await api.put<{
        success: boolean;
        data: OrdenCompra;
      }>(`/purchase-orders/${id}`, data);

      if (!response.success) {
        throw new Error('Error al actualizar orden de compra');
      }

      return response.data;
    } catch (error) {
      console.error(`Error updating orden de compra ${id}:`, error);
      throw new Error('Error al actualizar orden de compra');
    }
  },

  async deleteOrdenCompra(id: number): Promise<boolean> {
    try {
      const response = await api.delete<{
        success: boolean;
      }>(`/purchase-orders/${id}`);

      return response.success;
    } catch (error) {
      console.error(`Error deleting orden de compra ${id}:`, error);
      return false;
    }
  },

  async exportOrdenesCompra(filters: GastoFilter = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      // Usar el método request directamente para obtener blob
      const response = await api.request({
        url: `/purchase-orders/export?${params.toString()}`,
        method: 'GET',
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting órdenes de compra:', error);
      throw new Error('Error al exportar órdenes de compra');
    }
  },

  // **MÉTODOS PARA COTIZACIONES (COMPATIBILIDAD)**
  async getCotizaciones(filters: GastoFilter = {}): Promise<Cotizacion[]> {
    try {
      const params = new URLSearchParams();
      
      // Convertir filtros a parámetros de query
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get<{
        success: boolean;
        data: Cotizacion[];
      }>(`/cotizaciones?${params.toString()}`);

      if (!response.success) {
        throw new Error('Error al obtener cotizaciones');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
      throw new Error('Error al cargar cotizaciones');
    }
  },

  async deleteCotizacion(id: number): Promise<boolean> {
    try {
      const response = await api.delete<{
        success: boolean;
      }>(`/cotizaciones/${id}`);

      return response.success;
    } catch (error) {
      console.error(`Error deleting cotizacion ${id}:`, error);
      return false;
    }
  },

  // **MÉTODO DE DEBUG**
  async getDebugData(): Promise<any> {
    try {
      const response = await api.get<{
        success: boolean;
        debug_data: any;
        analysis: any;
        recommendations: string[];
      }>('/costs/debug');

      if (!response.success) {
        throw new Error('Error al obtener datos de debug');
      }

      return response;
    } catch (error) {
      console.error('Error fetching debug data:', error);
      throw new Error('Error al cargar datos de debug');
    }
  }
};

// **EXPORT gastosApiService PARA COMPATIBILIDAD**
export const gastosApiService = costsApiService;

// Export default for backward compatibility
export default costsApiService;