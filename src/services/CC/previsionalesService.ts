// src/services/CC/previsionalesService.ts
import api from '../apiService';
import { 
  Previsional, 
  PrevisionalFilter, 
  PrevisionalCreateData, 
  PrevisionalUpdateData,
  PrevisionalesResponse
} from '../../types/CC/previsional';
import { removeFromApiCache } from '../../hooks/useApi';

// Get previsionales with optional filters
export const getPrevisionales = async (filters: PrevisionalFilter = {}): Promise<Previsional[]> => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(val => queryParams.append(`${key}[]`, val.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/previsionales${queryString ? `?${queryString}` : ''}`;

    // api.get already returns the data part of the axios response
    const response = await api.get<PrevisionalesResponse>(endpoint);
    
    // Return just the data array
    return response.data;
  } catch (error) {
    console.error('Error fetching previsionales:', error);
    throw new Error('Failed to fetch previsionales');
  }
};

// Get previsional by ID
export const getPrevisionalById = async (id: number): Promise<Previsional> => {
  try {
    interface ApiSingleResponse {
      success: boolean;
      data: Previsional;
    }
    
    // api.get already returns the data part of the axios response
    const response = await api.get<ApiSingleResponse>(`/api/previsionales/${id}`);
    
    // Return just the data object
    return response.data;
  } catch (error) {
    console.error(`Error fetching previsional ${id}:`, error);
    throw new Error('Failed to fetch previsional details');
  }
};

// Create new previsional
export const createPrevisional = async (data: PrevisionalCreateData): Promise<number> => {
  try {
    // Realizar ajustes de mapeo si son necesarios
    const backendData = {
      ...data,
      // Asegurarse de que los campos estén en el formato correcto
    };

    interface ApiCreateResponse {
      success: boolean;
      data: {
        id: number;
      };
    }
    
    // api.post already returns the data part of the axios response
    const response = await api.post<ApiCreateResponse>(`/api/previsionales`, backendData);
    
    // Invalidar cualquier caché de lista de previsionales
    removeFromApiCache(/previsionales-list/);
    
    // Return just the id
    return response.data.id;
  } catch (error) {
    console.error('Error creating previsional:', error);
    throw new Error('Failed to create previsional');
  }
};

// Update previsional
export const updatePrevisional = async (id: number, data: PrevisionalUpdateData): Promise<boolean> => {
  try {
    await api.put(`/api/previsionales/${id}`, data);
    
    // Invalidar cachés relacionadas con este previsional
    removeFromApiCache(`previsional-detail-${id}`);
    removeFromApiCache(/previsionales-list/);
    
    return true;
  } catch (error) {
    console.error(`Error updating previsional ${id}:`, error);
    throw new Error('Failed to update previsional');
  }
};

// Delete previsional
export const deletePrevisional = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/api/previsionales/${id}`);
    
    // Invalidar cachés relacionadas con este previsional
    removeFromApiCache(`previsional-detail-${id}`);
    removeFromApiCache(/previsionales-list/);
    
    return true;
  } catch (error) {
    console.error(`Error deleting previsional ${id}:`, error);
    throw new Error('Failed to delete previsional');
  }
};

// Update previsional status
export const updatePrevisionalStatus = async (id: number, status: string): Promise<boolean> => {
  try {
    await api.put(`/api/previsionales/${id}/state`, { state: status });
    
    // Invalidar cachés relacionadas con este previsional
    removeFromApiCache(`previsional-detail-${id}`);
    removeFromApiCache(/previsionales-list/);
    
    return true;
  } catch (error) {
    console.error(`Error updating previsional status ${id}:`, error);
    throw new Error('Failed to update previsional status');
  }
};

// Export types for individual use
export { 
  type Previsional,
  type PrevisionalFilter,
  type PrevisionalCreateData,
  type PrevisionalUpdateData,
  type PrevisionalesResponse
};

// Export as default object
export default {
  getPrevisionales,
  getPrevisionalById,
  createPrevisional,
  updatePrevisional,
  deletePrevisional,
  updatePrevisionalStatus
};