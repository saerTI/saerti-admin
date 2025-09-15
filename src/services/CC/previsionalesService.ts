// saer-frontend/src/services/CC/previsionalesService.ts

import api from '../apiService';
import {
  Previsional,
  PrevisionalImportItem,
  ImportResponse,
  NewPrevisionalData,
  UpdatePrevisionalData,
  PrevisionalStatus
} from '../../types/CC/previsional';
import { ApiPaginatedResponse } from '../../types/CC/apiResponses';

// CORRECCIÓN: Ajustar la URL base para que coincida con las rutas del backend
const BASE_URL = '/previsionales';

// Tipos para los filtros de la API
interface PrevisionalFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  cost_center_id?: number;
  month_period?: number;
  year_period?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

/**
 * Servicio para gestionar los pagos previsionales
 */
export const previsionalesService = {
  /**
   * Obtiene la lista de previsionales con filtros y paginación
   */
  async getPrevisionales(filters: PrevisionalFilters = { page: 1, limit: 20 }): Promise<ApiPaginatedResponse<Previsional>> {
    try {
      const response = await api.get<ApiPaginatedResponse<Previsional>>(BASE_URL, { params: filters });
      // CORRECCIÓN: 'response' ya es el objeto ApiPaginatedResponse que necesitamos.
      return response;
    } catch (error) {
      console.error('Error fetching previsionales:', error);
      throw error;
    }
  },

  /**
   * Obtiene un registro previsional por su ID
   */
  async getPrevisionalById(id: number): Promise<Previsional> {
    const response = await api.get<{ data: Previsional }>(`${BASE_URL}/${id}`);
    // Esta estructura parece esperar un objeto { data: ... }, así que la mantenemos.
    return response.data;
  },

  /**
   * Crea un nuevo registro previsional
   */
  async createPrevisional(data: NewPrevisionalData): Promise<Previsional> {
    const response = await api.post<{ data: Previsional }>(BASE_URL, data);
    return response.data;
  },

  /**
   * Actualiza un registro previsional existente
   */
  async updatePrevisional(id: number, data: UpdatePrevisionalData): Promise<Previsional> {
    const response = await api.put<{ data: Previsional }>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un registro previsional
   */
  async deletePrevisional(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Actualiza el estado de un registro previsional
   */
  async updatePrevisionalStatus(id: number, status: PrevisionalStatus): Promise<Previsional> {
    const response = await api.patch<{ data: Previsional }>(`${BASE_URL}/${id}/status`, { status });
    return response.data;
  },

  /**
   * Importación masiva de previsionales
   */
  async importPrevisionales(previsionales: PrevisionalImportItem[]): Promise<ImportResponse> {
    try {
      console.log(`📤 Enviando importación masiva de ${previsionales.length} registros.`);
      
      const payload = { previsionales };
      const response = await api.post<ImportResponse>(`${BASE_URL}/import`, payload);
      
      // CORRECCIÓN: 'response' ya es el objeto ImportResponse, no tiene una propiedad '.data'.
      console.log('✅ Importación procesada por el servidor:', response);
      return response;

    } catch (error: any) {
      console.error('❌ Error en la solicitud de importación masiva:', error);
      throw new Error(
        error.response?.data?.message || 'Error desconocido al importar los registros.'
      );
    }
  }
};