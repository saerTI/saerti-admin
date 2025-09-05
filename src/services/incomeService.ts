// src/services/incomeService.ts
import api from './apiService';
import { 
  Income, 
  IncomeDetail, 
  IncomeFilter, 
  IncomeStats, 
  IncomeData, 
  IncomeFilters, 
  IncomeItem, 
  IncomesByPeriod, 
  IncomesByClient, 
  IncomesByCenter 
} from '@/types/income';

// Servicio de API para Ingresos
export const incomeApiService = {
  /**
   * Obtener datos consolidados de ingresos
   */
  async getIncomeData(filters: IncomeFilters): Promise<IncomeData> {
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
      if (filters.clientId && filters.clientId !== 'all') {
        params.append('client_id', filters.clientId);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      // Llamada al endpoint de ingresos
      const response = await api.get<{
        success: boolean;
        data: {
          summary: {
            total_incomes: number;
            pending_count: number;
          };
          items: IncomeItem[];
          by_client: Array<{
            client_tax_id: string;
            client_name: string;
            total_amount: number;
            income_count: number;
          }>;
          by_center: Array<{
            center_id?: number;
            center_name: string;
            center_code?: string;
            total_amount: number;
            income_count: number;
          }>;
        };
      }>(`/ingresos/explore?${params.toString()}`);

      if (!response.success) {
        throw new Error('Error al obtener datos de ingresos');
      }

      const { summary, items, by_client, by_center } = response.data;

      // Transformar datos por cliente
      const byClientData: IncomesByClient[] = by_client.map((client, index) => ({
        client_id: client.client_tax_id || index.toString(),
        client_name: client.client_name || 'Sin Cliente',
        client_tax_id: client.client_tax_id || '',
        amount: parseFloat(client.total_amount.toString()) || 0,
        count: client.income_count || 0,
        path: `/ingresos/client/${encodeURIComponent(client.client_tax_id || 'sin-cliente')}`,
        has_data: (client.income_count || 0) > 0
      }));

      // Transformar datos por centro de costo
      const byCenterData: IncomesByCenter[] = by_center.map((center, index) => ({
        center_id: center.center_id || index + 1,
        center_name: center.center_name || 'Sin Centro',
        center_code: center.center_code || '',
        amount: parseFloat(center.total_amount.toString()) || 0,
        count: center.income_count || 0,
        path: `/ingresos/center/${center.center_id || index + 1}`,
        has_data: (center.income_count || 0) > 0
      }));

      // Items recientes (últimos 10)
      const recentIncomes = items.slice(0, 10);

      return {
        totalIncomes: parseFloat(summary.total_incomes.toString()) || 0,
        pendingIncomes: summary.pending_count || 0,
        recentIncomes,
        byPeriodData: [], // Se calculará después con los períodos
        byClientData,
        byCenterData
      };

    } catch (error) {
      console.error('Error fetching income data:', error);
      throw new Error('Error al cargar datos de ingresos');
    }
  },

  /**
   * Obtener datos por período para la tabla financiera
   */
  async getIncomesByPeriod(filters: IncomeFilters): Promise<IncomesByPeriod[]> {
    try {
      console.log('🔄 getIncomesByPeriod called with filters:', filters);
      
      const params = new URLSearchParams();
      
      // Añadir filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          const backendKey = key === 'costCenterId' ? 'cost_center_id' : 
                           key === 'clientId' ? 'client_id' : key;
          params.append(backendKey, value.toString());
        }
      });

      console.log('📡 API call: /ingresos/by-period?' + params.toString());

      // Llamada específica para datos por período
      const response = await api.get<{
        success: boolean;
        data: Array<{
          client_name: string;
          client_tax_id: string;
          period_key: string;
          total_amount: number;
        }>;
      }>(`/ingresos/by-period?${params.toString()}`);

      console.log('📡 Backend response:', response);

      if (!response.success) {
        throw new Error('Error al obtener datos por período');
      }

      if (!response.data || response.data.length === 0) {
        console.log('⚠️ No period data returned from backend');
        return [];
      }

      console.log(`📊 Backend returned ${response.data.length} period-client combinations`);

      // Agrupar por cliente y período
      const groupedData: Record<string, Record<string, number>> = {};
      
      response.data.forEach(item => {
        const client = item.client_name || 'Sin Cliente';
        const periodKey = item.period_key;
        const amount = parseFloat(item.total_amount.toString()) || 0;

        console.log(`📊 Processing: ${client} -> ${periodKey} = ${amount}`);

        if (!groupedData[client]) {
          groupedData[client] = {};
        }
        
        groupedData[client][periodKey] = amount;
      });

      console.log('📊 Grouped data:', groupedData);

      // Convertir a formato esperado por FinancialTable
      const result = Object.entries(groupedData).map(([client, amounts]) => ({
        client,
        path: `/ingresos/client/${encodeURIComponent(client)}`,
        amounts
      }));

      console.log('📊 Final transformed result:', result);
      return result;

    } catch (error) {
      console.error('Error fetching incomes by period:', error);
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
    clients: Array<{value: string, label: string}>;
    statuses: Array<{value: string, label: string}>;
  }> {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          cost_centers: Array<{
            id: number;
            name: string;
            code?: string;
            type?: string;
          }>;
          clients: Array<{
            tax_id: string;
            name: string;
          }>;
          statuses: Array<{
            value: string;
            label: string;
          }>;
        };
      }>('/ingresos/dimensions');

      if (!response.success) {
        throw new Error('Error al obtener opciones de filtros');
      }

      const { cost_centers, clients, statuses } = response.data;

      return {
        projects: cost_centers.map(cc => ({
          value: cc.id.toString(),
          label: cc.name
        })),
        costCenters: cost_centers.map(cc => ({
          value: cc.id.toString(),
          label: `${cc.code ? cc.code + ' - ' : ''}${cc.name}${cc.type ? ` (${cc.type})` : ''}`
        })),
        clients: clients.map(client => ({
          value: client.tax_id,
          label: `${client.name} (${client.tax_id})`
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
        clients: [
          { value: '12345678-9', label: 'Cliente A (12345678-9)' },
          { value: '98765432-1', label: 'Cliente B (98765432-1)' }
        ],
        statuses: [
          { value: 'borrador', label: 'Borrador' },
          { value: 'activo', label: 'Activo' },
          { value: 'facturado', label: 'Facturado' },
          { value: 'pagado', label: 'Pagado' },
          { value: 'cancelado', label: 'Cancelado' }
        ]
      };
    }
  },

  /**
   * Obtener lista de ingresos con filtros
   */
  async getIncomes(filters: IncomeFilter = {}): Promise<{
    data: Income[];
    pagination: any;
    stats: IncomeStats;
  }> {
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
        data: Income[];
        pagination: any;
        stats: IncomeStats;
      }>(`/ingresos?${params.toString()}`);

      if (!response.success) {
        throw new Error('Error al obtener ingresos');
      }

      return {
        data: response.data,
        pagination: response.pagination,
        stats: response.stats
      };
    } catch (error) {
      console.error('Error fetching ingresos:', error);
      throw new Error('Error al cargar ingresos');
    }
  },

  /**
   * Obtener ingreso por ID
   */
  async getIncomeById(id: number): Promise<IncomeDetail | null> {
    try {
      console.log('🔍 Fetching income by ID:', id);
      const response = await api.get<{
        success: boolean; 
        data: IncomeDetail
      }>(`/ingresos/${id}`);
      
      console.log('🔍 Income fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching income ${id}:`, error);
      throw new Error('Failed to fetch income details');
    }
  },

  /**
   * Crear nuevo ingreso
   */
  async createIncome(data: Partial<Income>): Promise<Income> {
    try {
      const response = await api.post<{
        success: boolean;
        data: Income;
      }>('/ingresos', data);

      if (!response.success) {
        throw new Error('Error al crear ingreso');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating income:', error);
      throw new Error('Error al crear ingreso');
    }
  },

  /**
   * Crear múltiples ingresos en lote
   */
  async createIncomesBatch(data: Partial<Income>[]): Promise<{
    created: number[];
    updated: number[];
    errors: any[];
    summary: {
      total_processed: number;
      successful: number;
      failed: number;
      created_count: number;
      updated_count: number;
    };
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        data: {
          created: number[];
          updated: number[];
          errors: any[];
          summary: {
            total_processed: number;
            successful: number;
            failed: number;
            created_count: number;
            updated_count: number;
          };
        };
      }>('/ingresos/batch', data);

      if (!response.success) {
        throw new Error('Error al crear ingresos en lote');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating incomes batch:', error);
      throw new Error('Error al crear ingresos en lote');
    }
  },

  /**
   * Actualizar ingreso
   */
  async updateIncome(id: number, data: Partial<Income>): Promise<Income> {
    try {
      const response = await api.put<{
        success: boolean;
        data: Income;
      }>(`/ingresos/${id}`, data);

      if (!response.success) {
        throw new Error('Error al actualizar ingreso');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating income:', error);
      throw new Error('Error al actualizar ingreso');
    }
  },

  /**
   * Actualizar solo el estado de un ingreso
   */
  async updateIncomeStatus(id: number, state: string): Promise<Income> {
    try {
      const response = await api.put<{
        success: boolean;
        data: Income;
      }>(`/ingresos/${id}/state`, { state });

      if (!response.success) {
        throw new Error('Error al actualizar estado del ingreso');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating income status:', error);
      throw new Error('Error al actualizar estado del ingreso');
    }
  },

  /**
   * Eliminar ingreso
   */
  async deleteIncome(id: number): Promise<boolean> {
    try {
      const response = await api.delete<{
        success: boolean;
      }>(`/ingresos/${id}`);

      return response.success;
    } catch (error) {
      console.error(`Error deleting income ${id}:`, error);
      return false;
    }
  },

  /**
   * Exportar ingresos
   */
  async exportIncomes(filters: IncomeFilter = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      // Usar el método request directamente para obtener blob
      const response = await api.request({
        url: `/ingresos/export?${params.toString()}`,
        method: 'GET',
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting incomes:', error);
      throw new Error('Error al exportar ingresos');
    }
  },

  /**
   * Obtener estadísticas de ingresos
   */
  async getIncomeStats(filters: IncomeFilter = {}): Promise<IncomeStats> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get<{
        success: boolean;
        data: IncomeStats;
      }>(`/ingresos/stats?${params.toString()}`);

      if (!response.success) {
        throw new Error('Error al obtener estadísticas de ingresos');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching income stats:', error);
      throw new Error('Error al cargar estadísticas de ingresos');
    }
  }
};

// Export default para compatibilidad
export default incomeApiService;