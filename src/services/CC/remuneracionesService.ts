// src/services/CC/remuneracionesService.ts
import { api } from '../apiService';
import { 
  Remuneracion, 
  RemuneracionCreateData, 
  RemuneracionUpdateData, 
  RemuneracionFilter
} from '../../types/CC/remuneracion';

// ✅ Interfaz actualizada para la nueva estructura de la API
interface ApiRemuneracion {
  id: number;
  employee_id: number;
  type: 'remuneracion' | 'anticipo';
  amount: number;
  net_salary?: number;
  advance_payment?: number;
  date: string;
  month_period: number;
  year_period: number;
  work_days?: number;
  payment_method?: 'transferencia' | 'cheque' | 'efectivo';
  status: 'pendiente' | 'aprobado' | 'pagado' | 'rechazado' | 'cancelado';
  payment_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Campos calculados/agregados por el modelo (JOIN con employees)
  period?: string; // Formato MM/YYYY calculado
  employee_name?: string;
  employee_rut?: string;
  employee_position?: string;
  
  // Campos del centro de costo (JOIN con cost_centers)
  cost_center_id?: number;
  cost_center_name?: string;
  cost_center_code?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface BatchCreateResponse {
  success: boolean;
  message: string;
  data: {
    ids: number[];
    created: number;
    errors: Array<{ index: number; item: any; error: string }>;
    total: number;
  };
}

/**
 * 🔧 FUNCIÓN ACTUALIZADA: Transformar datos de API a Frontend con nueva estructura
 */
const transformApiRemuneracion = (apiRem: ApiRemuneracion): Remuneracion => {
  return {
    id: apiRem.id,
    name: apiRem.employee_name || `Empleado ${apiRem.employee_id}`,
    
    // ✅ MAPEO CON NUEVA ESTRUCTURA
    employeeId: apiRem.employee_id,
    employeeName: apiRem.employee_name,
    employeeRut: apiRem.employee_rut,
    employeePosition: apiRem.employee_position,
    
    // Campos financieros - usar nuevos campos
    sueldoLiquido: apiRem.net_salary || 0,
    anticipo: apiRem.advance_payment || 0,
    amount: apiRem.amount || 0,
    
    // ✅ NUEVO: Mapear información del centro de costo
    projectId: apiRem.cost_center_id,
    projectCode: apiRem.cost_center_code,
    projectName: apiRem.cost_center_name,
    
    // Campos temporales - usar period calculado o construir desde month/year
    period: apiRem.period || `${apiRem.month_period.toString().padStart(2, '0')}/${apiRem.year_period}`,
    date: apiRem.date || '',
    state: apiRem.status || 'pendiente',
    
    // Información adicional
    area: undefined, // Ya no existe en la nueva estructura
    workDays: apiRem.work_days || 30,
    paymentMethod: apiRem.payment_method || 'transferencia',
    paymentDate: apiRem.payment_date,
    
    // Requerido
    companyId: 1
  };
};

/**
 * ✅ FUNCIÓN ACTUALIZADA: Obtener remuneraciones con nuevos filtros
 */
export const getRemuneraciones = async (filters: RemuneracionFilter = {}): Promise<Remuneracion[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.state) params.append('state', filters.state);
    if (filters.employeeId) params.append('employeeId', filters.employeeId.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.rut) params.append('rut', filters.rut);
    
    // Nuevo soporte para month/year
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.year) params.append('year', filters.year.toString());
    
    // Soporte legacy para period (MM/YYYY)
    if (filters.period && filters.period.length > 0) {
      filters.period.forEach(period => params.append('period', period));
    }
    
    const queryString = params.toString();
    const url = queryString ? `/remuneraciones?${queryString}` : '/remuneraciones';
    
    const response = await api.get<ApiResponse<ApiRemuneracion[]>>(url);
    
    if (response.success) {
      // 🔧 TRANSFORMACIÓN APLICADA CON NUEVA ESTRUCTURA
      const transformedData = response.data.map(transformApiRemuneracion);
      
      console.log('✅ Datos transformados con nueva estructura:', {
        original: response.data.length,
        transformed: transformedData.length,
        sample: transformedData[0] ? {
          employeeId: transformedData[0].employeeId,
          employeeName: transformedData[0].employeeName,
          employeeRut: transformedData[0].employeeRut,
          sueldoLiquido: transformedData[0].sueldoLiquido,
          anticipo: transformedData[0].anticipo,
          amount: transformedData[0].amount,
          period: transformedData[0].period,
          state: transformedData[0].state
        } : null,
        // Debug: Mostrar datos originales de la nueva API
        originalSample: response.data[0] ? {
          employee_id: response.data[0].employee_id,
          employee_name: response.data[0].employee_name,
          employee_rut: response.data[0].employee_rut,
          net_salary: response.data[0].net_salary,
          advance_payment: response.data[0].advance_payment,
          month_period: response.data[0].month_period,
          year_period: response.data[0].year_period,
          status: response.data[0].status
        } : null
      });
      
      return transformedData;
    } else {
      throw new Error(response.message || 'Error al obtener remuneraciones');
    }
  } catch (error) {
    console.error('Error fetching remuneraciones:', error);
    throw error;
  }
};

/**
 * Crear nueva remuneración
 */
export const createRemuneracion = async (data: RemuneracionCreateData): Promise<number> => {
  try {
    const response = await api.post<ApiResponse<{ id: number }>>('/remuneraciones', data);
    
    if (response.success) {
      return response.data.id;
    } else {
      throw new Error(response.message || 'Error al crear remuneración');
    }
  } catch (error) {
    console.error('Error creating remuneración:', error);
    throw error;
  }
};

/**
 * Crear múltiples remuneraciones
 */
export const createRemuneracionesBatch = async (data: RemuneracionCreateData[]): Promise<number[]> => {
  try {
    const response = await api.post<BatchCreateResponse>('/remuneraciones/batch', data);
    
    if (response.success) {
      return response.data.ids;
    } else {
      throw new Error(response.message || 'Error al crear remuneraciones en lote');
    }
  } catch (error) {
    console.error('Error creating remuneraciones batch:', error);
    throw error;
  }
};

/**
 * Actualizar remuneración
 */
export const updateRemuneracion = async (id: number, data: RemuneracionUpdateData): Promise<Remuneracion> => {
  try {
    const response = await api.put<ApiResponse<ApiRemuneracion>>(`/remuneraciones/${id}`, data);
    
    if (response.success) {
      return transformApiRemuneracion(response.data);
    } else {
      throw new Error(response.message || 'Error al actualizar remuneración');
    }
  } catch (error) {
    console.error('Error updating remuneración:', error);
    throw error;
  }
};

/**
 * Eliminar remuneración
 */
export const deleteRemuneracion = async (id: number): Promise<void> => {
  try {
    const response = await api.delete<ApiResponse<null>>(`/remuneraciones/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar remuneración');
    }
  } catch (error) {
    console.error('Error deleting remuneración:', error);
    throw error;
  }
};

export const getRemuneracionById = async (id: number): Promise<Remuneracion> => {
  try {
    const response = await api.get<ApiResponse<ApiRemuneracion>>(`/remuneraciones/${id}`);
    
    if (response.success) {
      return transformApiRemuneracion(response.data);
    } else {
      throw new Error(response.message || 'Error al obtener remuneración por ID');
    }
  } catch (error) {
    console.error('Error fetching remuneración by ID:', error);
    throw error;
  }
};

/**
 * ✅ NUEVA FUNCIÓN: Actualizar estado de una remuneración
 */
export const updateRemuneracionState = async (
  id: number, 
  state: 'pendiente' | 'aprobado' | 'pagado' | 'rechazado' | 'cancelado'
): Promise<Remuneracion> => {
  try {
    const response = await api.put<ApiResponse<ApiRemuneracion>>(`/remuneraciones/${id}/state`, { state });
    
    if (response.success) {
      return transformApiRemuneracion(response.data);
    } else {
      throw new Error(response.message || 'Error al actualizar estado de remuneración');
    }
  } catch (error) {
    console.error('Error updating remuneración state:', error);
    throw error;
  }
};

/**
 * ✅ NUEVA FUNCIÓN: Obtener remuneraciones por empleado
 */
export const getRemuneracionesByEmployee = async (employeeId: number): Promise<Remuneracion[]> => {
  return getRemuneraciones({ employeeId });
};

/**
 * ✅ NUEVA FUNCIÓN: Obtener remuneraciones por período
 */
export const getRemuneracionesByPeriod = async (month: number, year: number): Promise<Remuneracion[]> => {
  return getRemuneraciones({ month, year });
};

// Interfaces para importación masiva
export interface RemuneracionImportItem {
  rut: string;
  nombre: string;
  tipo: string;
  monto: number;
  mes: number;
  año: number;
  cargo?: string;
  departamento?: string;
  sueldoBase?: number;
  sueldoLiquido?: number;
  anticipo?: number;
  diasTrabajados?: number;
  metodoPago?: string;
  estado?: string;
  fechaPago?: string;
  notas?: string;
}

export interface ImportResponse {
  success: boolean;
  message: string;
  results: {
    total: number;
    success: number;
    failed: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
    createdEmployees: Array<{
      id: number;
      rut: string;
      nombre: string;
    }>;
  };
}

/**
 * Importación masiva de remuneraciones con creación automática de empleados
 */
export const importRemuneraciones = async (remuneraciones: RemuneracionImportItem[]): Promise<ImportResponse> => {
  try {
    console.log(`📤 Enviando importación masiva de ${remuneraciones.length} registros de remuneración.`);
    
    const payload = { remuneraciones };
    const response = await api.post<ImportResponse>(`/remuneraciones/import`, payload);
    
    console.log('✅ Importación procesada por el servidor:', response);
    return response;

  } catch (error: any) {
    console.error('❌ Error en la solicitud de importación masiva:', error);
    throw new Error(
      error.response?.data?.message || 'Error desconocido al importar las remuneraciones.'
    );
  }
};

export default {
  getRemuneraciones,
  createRemuneracion,
  createRemuneracionesBatch,
  updateRemuneracion,
  deleteRemuneracion,
  getRemuneracionById,
  updateRemuneracionState,
  getRemuneracionesByEmployee,
  getRemuneracionesByPeriod,
  importRemuneraciones
};