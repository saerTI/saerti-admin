// src/services/factoringService.ts
import api from './apiService';
import {
  Factoring,
  FactoringEntity,
  CreateFactoringRequest,
  UpdateFactoringRequest,
  FactoringFilter,
  FactoringTotalResponse
} from '@/types/factoring';

export const factoringService = {
  /**
   * Obtener todos los factorings con filtros opcionales
   */
  async getFactorings(filters?: FactoringFilter): Promise<Factoring[]> {
    try {
      const params = new URLSearchParams();
      
      // Aseguramos que cada filtro se añada correctamente
      if (filters?.status) {
        console.log('Añadiendo filtro status:', filters.status);
        params.append('status', filters.status);
      }
      if (filters?.factoring_entities_id) {
        console.log('Añadiendo filtro factoring_entities_id:', filters.factoring_entities_id);
        params.append('factoring_entities_id', filters.factoring_entities_id.toString());
      }
      if (filters?.cost_center_id) {
        console.log('Añadiendo filtro cost_center_id:', filters.cost_center_id);
        params.append('cost_center_id', filters.cost_center_id.toString());
      }
      if (filters?.date_from) {
        console.log('Añadiendo filtro date_from:', filters.date_from);
        params.append('date_from', filters.date_from);
      }
      if (filters?.date_to) {
        console.log('Añadiendo filtro date_to:', filters.date_to);
        params.append('date_to', filters.date_to);
      }

      const queryString = params.toString();
      const url = queryString ? `/factoring?${queryString}` : '/factoring';
      console.log('URL de consulta final:', url);
      
      const response = await api.get<{
        success: boolean;
        data: Factoring[];
        message?: string;
      }>(url);
      
      if (!response.success) {
        throw new Error('Error al obtener los factorings');
      }

      console.log('Datos recibidos del backend:', response.data.length, 'registros');
      return response.data;
    } catch (error) {
      console.error('Error fetching factorings:', error);
      throw error;
    }
  },

  /**
   * Obtener un factoring por ID
   */
  async getFactoring(id: number): Promise<Factoring> {
    try {
      const response = await api.get<{
        success: boolean;
        data: Factoring;
        message?: string;
      }>(`/factoring/${id}`);
      
      if (!response.success) {
        throw new Error('Error al obtener el factoring');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching factoring:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo factoring
   */
  async createFactoring(factoringData: CreateFactoringRequest): Promise<Factoring> {
    try {
      const response = await api.post<{
        success: boolean;
        data: Factoring;
        message?: string;
      }>('/factoring', factoringData);
      
      if (!response.success) {
        throw new Error('Error al crear el factoring');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating factoring:', error);
      throw error;
    }
  },

  /**
   * Actualizar un factoring existente
   */
  async updateFactoring(id: number, factoringData: Partial<CreateFactoringRequest>): Promise<Factoring> {
    try {
      const response = await api.put<{
        success: boolean;
        data: Factoring;
        message?: string;
      }>(`/factoring/${id}`, factoringData);
      
      if (!response.success) {
        throw new Error('Error al actualizar el factoring');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating factoring:', error);
      throw error;
    }
  },

  /**
   * Eliminar un factoring
   */
  async deleteFactoring(id: number): Promise<void> {
    try {
      const response = await api.delete<{
        success: boolean;
        message?: string;
      }>(`/factoring/${id}`);
      
      if (!response.success) {
        throw new Error('Error al eliminar el factoring');
      }
    } catch (error) {
      console.error('Error deleting factoring:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las entidades de factoring
   */
  async getFactoringEntities(): Promise<FactoringEntity[]> {
    try {
      const response = await api.get<{
        success: boolean;
        data: FactoringEntity[];
        message?: string;
      }>('/factoring-entities');
      
      if (!response.success) {
        throw new Error('Error al obtener las entidades de factoring');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching factoring entities:', error);
      throw error;
    }
  },
  
  /**
   * Obtener los montos totales de factorings con filtros opcionales
   */
  async getFactoringTotalAmounts(filters?: FactoringFilter): Promise<{
    total_amount: number;
    total_pendiente: number;
    total_giradoynopagado: number;
    total_giradoypagado: number;
  }> {
    try {
      const params = new URLSearchParams();
      
      // Aseguramos que cada filtro se añada correctamente
      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.factoring_entities_id) {
        params.append('factoring_entities_id', filters.factoring_entities_id.toString());
      }
      if (filters?.cost_center_id) {
        params.append('cost_center_id', filters.cost_center_id.toString());
      }
      if (filters?.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters?.date_to) {
        params.append('date_to', filters.date_to);
      }

      const queryString = params.toString();
      const url = queryString ? `/factoring-total?${queryString}` : '/factoring-total';
      console.log('URL para consulta de montos totales:', url);
      
      const response = await api.get<FactoringTotalResponse>(url);
      
      if (!response.success) {
        throw new Error('Error al obtener los montos totales de factorings');
      }

      console.log('Montos totales recibidos del backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching factoring total amounts:', error);
      throw error;
    }
  },

  /**
   * Crear una nueva entidad de factoring
   */
  async createFactoringEntity(name: string): Promise<FactoringEntity> {
    try {
      const response = await api.post<{
        success: boolean;
        data: FactoringEntity;
        message?: string;
      }>('/factoring-entities', { name });
      
      if (!response.success) {
        throw new Error('Error al crear la entidad de factoring');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating factoring entity:', error);
      throw error;
    }
  }
};

export default factoringService;