import api from '../apiService';
import { 
  Remuneracion, 
  RemuneracionFilter, 
  RemuneracionCreateData, 
  RemuneracionUpdateData,
  RemuneracionesResponse
} from '../../types/CC/remuneracion';
import { removeFromApiCache } from '../../hooks/useApi';

// Interface for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Convierte campos de snake_case a camelCase para la interfaz Remuneracion
 */
const transformRemuneracionData = (data: any): Remuneracion => {
  return {
    id: data.id,
    name: data.name || data.employee_name || '',
    date: data.date || '',
    amount: data.amount || 0,
    state: data.state || 'pending',
    companyId: data.company_id || 1,
    projectId: data.project_id || undefined,
    projectName: data.project_name || '',
    projectCode: data.project_code || '',
    employeeId: data.employee_id || 0,
    employeeName: data.employee_name || '',
    employeeRut: data.employee_rut || '',
    employeePosition: data.employee_position || '',
    area: data.area || '',
    period: data.period || '',
    workDays: data.work_days || 30,
    sueldoLiquido: data.sueldo_liquido || 0,
    anticipo: data.anticipo || 0,
    paymentMethod: data.payment_method || 'Transferencia',
    paymentDate: data.payment_date || '',
    notes: data.notes || ''
  };
};

/**
 * Transforma un array de remuneraciones de snake_case a camelCase
 */
const transformRemuneracionList = (dataList: any[]): Remuneracion[] => {
  if (!Array.isArray(dataList)) {
    console.error('transformRemuneracionList: input is not an array', dataList);
    return [];
  }
  return dataList.map(item => transformRemuneracionData(item));
};

// Get remuneraciones with optional filters
export const getRemuneraciones = async (filters: RemuneracionFilter = {}): Promise<Remuneracion[]> => {
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
    const endpoint = `/api/remuneraciones${queryString ? `?${queryString}` : ''}`;

    // Obtener datos con tipo correcto
    const response = await api.get<RemuneracionesResponse>(endpoint);
    
    // Verificar respuesta
    if (!response || typeof response.success !== 'boolean') {
      console.error('Invalid API response format:', response);
      throw new Error('Formato de respuesta inválido del servidor');
    }
    
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener remuneraciones');
    }
    
    // Transformar los datos de snake_case a camelCase
    const transformedData = transformRemuneracionList(response.data || []);
    
    // Return transformed data
    return transformedData;
  } catch (error) {
    console.error('Error fetching remuneraciones:', error);
    throw new Error('Failed to fetch remuneraciones');
  }
};

// Get remuneracion by ID
export const getRemuneracionById = async (id: number): Promise<Remuneracion> => {
  try {
    // Definir el tipo de la respuesta correctamente
    type ApiSingleResponse = ApiResponse<any>; // Cambio para manejar cualquier formato
    
    // api.get already returns the data part of the axios response
    const response = await api.get<ApiSingleResponse>(`/api/remuneraciones/${id}`);
    
    // Verificar respuesta
    if (!response || typeof response.success !== 'boolean') {
      console.error('Invalid API response format:', response);
      throw new Error('Formato de respuesta inválido del servidor');
    }
    
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener detalles de remuneración');
    }
    
    // Transformar los datos de snake_case a camelCase
    const transformedData = transformRemuneracionData(response.data);
    
    // Return transformed data
    return transformedData;
  } catch (error) {
    console.error(`Error fetching remuneracion ${id}:`, error);
    throw new Error('Failed to fetch remuneracion details');
  }
};

// Create new remuneracion
export const createRemuneracion = async (data: RemuneracionCreateData): Promise<number> => {
  try {
    console.log('Enviando datos a API:', data);
    
    // Asegurarse de que la fecha tenga el formato correcto para la API
    const apiData = {
      ...data,
      // Si fecha no tiene formato YYYY-MM-DD, convertirla
      fecha: data.fecha && !data.fecha.match(/^\d{4}-\d{2}-\d{2}$/) 
        ? formatDateForAPI(data.fecha)
        : data.fecha
    };
    
    // api.post debe usar la ruta correcta
    const response = await api.post<ApiResponse<{id: number}>>('/api/remuneraciones', apiData);
    
    console.log('Respuesta de API:', response);
    
    // Verificar si la respuesta tiene el formato esperado
    if (!response || !response.success) {
      console.error('Formato de respuesta inválido:', response);
      throw new Error(response.message || 'Error al crear remuneración');
    }
    
    // Devolver el ID creado
    return response.data.id;
  } catch (error) {
    console.error('Error creating remuneracion:', error);
    throw new Error('Failed to create remuneracion');
  }
};

/**
 * Crea múltiples remuneraciones en un solo pedido
 * @param data Array de datos para crear remuneraciones
 * @returns Array con los IDs de las remuneraciones creadas
 */
export const createRemuneracionesBatch = async (data: RemuneracionCreateData[]): Promise<number[]> => {
  try {
    console.log(`Enviando lote de ${data.length} remuneraciones a API`);
    
    // api.post con tipo de respuesta esperada
    const response = await api.post<ApiResponse<{ids: number[]}>>('/api/remuneraciones/batch', data);
    
    if (!response || !response.success) {
      console.error('Formato de respuesta inválido:', response);
      throw new Error(response.message || 'Error al crear remuneraciones en lote');
    }
    
    console.log('Respuesta de API batch:', response);
    
    // Devolver los IDs creados
    return response.data.ids;
  } catch (error) {
    console.error('Error creating remuneraciones batch:', error);
    throw new Error('Failed to create remuneraciones batch');
  }
};

// Función auxiliar para formatear fechas
function formatDateForAPI(dateStr: string): string {
  // Si tiene formato MM/YYYY
  if (/^\d{2}\/\d{4}$/.test(dateStr)) {
    const [month, year] = dateStr.split('/');
    return `${year}-${month}-01`;
  }
  
  // Devolver tal cual si no se puede analizar
  return dateStr;
}

// Update remuneracion
export const updateRemuneracion = async (id: number, data: RemuneracionUpdateData): Promise<boolean> => {
  try {
    // Prepare the data for API - Convert date format if needed
    const apiData = {
      ...data,
      // If fecha doesn't match the YYYY-MM-DD format, convert it
      fecha: data.fecha && !data.fecha.match(/^\d{4}-\d{2}-\d{2}$/) 
        ? formatDateForAPI(data.fecha)
        : data.fecha
    };
    
    const response = await api.put<ApiResponse<any>>(`/api/remuneraciones/${id}`, apiData);
    
    // Verificar respuesta
    if (!response || typeof response.success !== 'boolean') {
      console.error('Invalid API response format:', response);
      throw new Error('Formato de respuesta inválido del servidor');
    }
    
    if (!response.success) {
      throw new Error(response.message || 'Error al actualizar remuneración');
    }
    
    // Invalidar cachés relacionadas con esta remuneracion
    removeFromApiCache(`remuneracion-detail-${id}`);
    removeFromApiCache(/remuneraciones-list/);
    
    return true;
  } catch (error) {
    console.error(`Error updating remuneracion ${id}:`, error);
    throw new Error('Failed to update remuneracion');
  }
};

// Delete remuneracion
export const deleteRemuneracion = async (id: number): Promise<boolean> => {
  try {
    const response = await api.delete<ApiResponse<any>>(`/api/remuneraciones/${id}`);
    
    // Verificar respuesta
    if (!response || typeof response.success !== 'boolean') {
      console.error('Invalid API response format:', response);
      throw new Error('Formato de respuesta inválido del servidor');
    }
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar remuneración');
    }
    
    // Invalidar cachés relacionadas con esta remuneracion
    removeFromApiCache(`remuneracion-detail-${id}`);
    removeFromApiCache(/remuneraciones-list/);
    
    return true;
  } catch (error) {
    console.error(`Error deleting remuneracion ${id}:`, error);
    throw new Error('Failed to delete remuneracion');
  }
};

// Update remuneracion status
export const updateRemuneracionStatus = async (id: number, status: string): Promise<boolean> => {
  try {
    // Use put instead of patch since patch doesn't exist in your api object
    const response = await api.put<ApiResponse<any>>(`/api/remuneraciones/${id}/state`, { state: status });
    
    // Verificar respuesta
    if (!response || typeof response.success !== 'boolean') {
      console.error('Invalid API response format:', response);
      throw new Error('Formato de respuesta inválido del servidor');
    }
    
    if (!response.success) {
      throw new Error(response.message || 'Error al actualizar estado de remuneración');
    }
    
    // Invalidar cachés relacionadas con esta remuneracion
    removeFromApiCache(`remuneracion-detail-${id}`);
    removeFromApiCache(/remuneraciones-list/);
    
    return true;
  } catch (error) {
    console.error(`Error updating remuneracion status ${id}:`, error);
    throw new Error('Failed to update remuneracion status');
  }
};

// Export types for individual use
export {
  type Remuneracion,
  type RemuneracionFilter,
  type RemuneracionCreateData,
  type RemuneracionUpdateData,
  type RemuneracionesResponse
};

// Export as default object
export default {
  getRemuneraciones,
  getRemuneracionById,
  createRemuneracion,
  createRemuneracionesBatch,
  updateRemuneracion,
  deleteRemuneracion,
  updateRemuneracionStatus
};