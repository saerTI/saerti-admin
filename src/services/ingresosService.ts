// src/services/ingresosService.ts
import { api } from './apiService';
import {
  Ingreso,
  IngresoFilter,
  IngresoCreateData,
  IngresoUpdateData,
  IngresoListResponse,
  IngresoResponse,
  IngresoMutationResponse,
  IngresoBatchResponse,
  IngresoStatsResponse,
  IngresoDeleteResponse,
  IngresosByCostCenterOptions,
  IngresoState
} from '../types/CC/ingreso';

/**
 * Servicio para gestión de ingresos
 */
class IngresosServiceClass {
  private baseUrl = '/ingresos';

  /**
   * Obtiene lista paginada de ingresos con filtros
   */
  async getIngresos(filters: IngresoFilter = {}): Promise<IngresoListResponse> {
    try {
      console.log('📥 Fetching ingresos with filters:', filters);
      
      const params = new URLSearchParams();
      
      // Agregar filtros como parámetros de consulta
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
      
      const response = await api.get<IngresoListResponse>(url);
      console.log('✅ Ingresos fetched successfully:', response.data?.length || 0, 'items');
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching ingresos:', error);
      throw new Error('Error al obtener la lista de ingresos');
    }
  }

  /**
   * Obtiene un ingreso por ID
   */
  async getIngresoById(id: number): Promise<IngresoResponse> {
    try {
      console.log('🔍 Fetching ingreso by ID:', id);
      
      const response = await api.get<IngresoResponse>(`${this.baseUrl}/${id}`);
      console.log('✅ Ingreso fetched successfully:', response.data?.id);
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching ingreso by ID:', error);
      throw new Error(`Error al obtener el ingreso con ID ${id}`);
    }
  }

  /**
   * Crea un nuevo ingreso
   */
  async createIngreso(data: IngresoCreateData): Promise<IngresoMutationResponse> {
    try {
      console.log('📤 Creating new ingreso:', data);
      
      const response = await api.post<IngresoMutationResponse>(this.baseUrl, data);
      console.log('✅ Ingreso created successfully:', response.data?.id);
      
      return response;
    } catch (error) {
      console.error('❌ Error creating ingreso:', error);
      throw new Error('Error al crear el ingreso');
    }
  }

  /**
   * Crea múltiples ingresos en lote
   */
  async createIngresosBatch(data: IngresoCreateData[]): Promise<IngresoBatchResponse> {
    try {
      console.log('📤 Creating batch ingresos:', data.length, 'items');
      
      const response = await api.post<IngresoBatchResponse>(`${this.baseUrl}/batch`, data);
      console.log('✅ Batch ingresos created successfully:', response.data?.summary);
      
      return response;
    } catch (error) {
      console.error('❌ Error creating batch ingresos:', error);
      throw new Error('Error al crear los ingresos en lote');
    }
  }

  /**
   * Actualiza un ingreso existente
   */
  async updateIngreso(id: number, data: IngresoUpdateData): Promise<IngresoMutationResponse> {
    try {
      console.log('📝 Updating ingreso:', id, data);
      
      const response = await api.put<IngresoMutationResponse>(`${this.baseUrl}/${id}`, data);
      console.log('✅ Ingreso updated successfully:', response.data?.id);
      
      return response;
    } catch (error) {
      console.error('❌ Error updating ingreso:', error);
      throw new Error(`Error al actualizar el ingreso con ID ${id}`);
    }
  }

  /**
   * Actualiza solo el estado de un ingreso
   */
  async updateIngresoStatus(id: number, state: IngresoState): Promise<IngresoMutationResponse> {
    try {
      console.log('🔄 Updating ingreso status:', id, 'to', state);
      
      const response = await api.put<IngresoMutationResponse>(`${this.baseUrl}/${id}/state`, { state });
      console.log('✅ Ingreso status updated successfully');
      
      return response;
    } catch (error) {
      console.error('❌ Error updating ingreso status:', error);
      throw new Error(`Error al actualizar el estado del ingreso con ID ${id}`);
    }
  }

  /**
   * Elimina un ingreso
   */
  async deleteIngreso(id: number): Promise<IngresoDeleteResponse> {
    try {
      console.log('🗑️ Deleting ingreso:', id);
      
      const response = await api.delete<IngresoDeleteResponse>(`${this.baseUrl}/${id}`);
      console.log('✅ Ingreso deleted successfully');
      
      return response;
    } catch (error) {
      console.error('❌ Error deleting ingreso:', error);
      throw new Error(`Error al eliminar el ingreso con ID ${id}`);
    }
  }

  /**
   * Obtiene ingresos por centro de costo
   */
  async getIngresosByCostCenter(
    costCenterId: number, 
    options: IngresosByCostCenterOptions = {}
  ): Promise<Ingreso[]> {
    try {
      console.log('🏢 Fetching ingresos by cost center:', costCenterId, options);
      
      const params = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? 
        `${this.baseUrl}/cost-center/${costCenterId}?${queryString}` : 
        `${this.baseUrl}/cost-center/${costCenterId}`;
      
      const response = await api.get<{ success: boolean; data: Ingreso[] }>(url);
      console.log('✅ Ingresos by cost center fetched successfully:', response.data?.length || 0);
      
      return response.data || [];
    } catch (error) {
      console.error('❌ Error fetching ingresos by cost center:', error);
      throw new Error(`Error al obtener ingresos del centro de costo ${costCenterId}`);
    }
  }

  /**
   * Obtiene estadísticas de ingresos
   */
  async getIngresoStats(filters: IngresoFilter = {}): Promise<IngresoStatsResponse> {
    try {
      console.log('📊 Fetching ingreso stats with filters:', filters);
      
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? 
        `${this.baseUrl}/stats?${queryString}` : 
        `${this.baseUrl}/stats`;
      
      const response = await api.get<IngresoStatsResponse>(url);
      console.log('✅ Ingreso stats fetched successfully');
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching ingreso stats:', error);
      throw new Error('Error al obtener estadísticas de ingresos');
    }
  }

  /**
   * Exporta ingresos a CSV
   */
  async exportToCSV(filters: IngresoFilter = {}): Promise<Blob> {
    try {
      console.log('📄 Exporting ingresos to CSV with filters:', filters);
      
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      params.append('format', 'csv');
      
      const queryString = params.toString();
      const url = `${this.baseUrl}/export?${queryString}`;
      
      // Usar el cliente axios directamente para el blob
      const response = await api.request({
        url,
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Accept': 'text/csv',
        },
      });
      
      console.log('✅ CSV export completed');
      
      return response.data;
    } catch (error) {
      console.error('❌ Error exporting to CSV:', error);
      throw new Error('Error al exportar ingresos a CSV');
    }
  }

  /**
   * Busca clientes para autocompletado
   */
  async searchClients(query: string): Promise<Array<{
    client_name: string;
    client_tax_id: string;
  }>> {
    try {
      console.log('🔍 Searching clients:', query);
      
      const params = new URLSearchParams({
        search: query,
        limit: '10',
        fields: 'client_name,client_tax_id'
      });
      
      const response = await api.get<{
        success: boolean;
        data: Array<{ client_name: string; client_tax_id: string }>;
      }>(`${this.baseUrl}/search/clients?${params.toString()}`);
      
      console.log('✅ Clients search completed:', response.data?.length || 0);
      
      return response.data || [];
    } catch (error) {
      console.error('❌ Error searching clients:', error);
      throw new Error('Error al buscar clientes');
    }
  }

  /**
   * Valida número de documento
   */
  async validateDocumentNumber(documentNumber: string, excludeId?: number): Promise<{
    isValid: boolean;
    exists: boolean;
    message?: string;
  }> {
    try {
      console.log('✅ Validating document number:', documentNumber);
      
      const params = new URLSearchParams({
        document_number: documentNumber
      });
      
      if (excludeId) {
        params.append('exclude_id', excludeId.toString());
      }
      
      const response = await api.get<{
        success: boolean;
        data: { isValid: boolean; exists: boolean; message?: string };
      }>(`${this.baseUrl}/validate/document?${params.toString()}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error validating document number:', error);
      return {
        isValid: false,
        exists: false,
        message: 'Error al validar número de documento'
      };
    }
  }
}

// Crear instancia del servicio
const ingresosApiService = new IngresosServiceClass();

// Exportar la instancia por defecto y la clase
export default ingresosApiService;
export { IngresosServiceClass as IngresosService };