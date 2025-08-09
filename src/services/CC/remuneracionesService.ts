// src/services/CC/remuneracionesService.ts
import { api } from '../apiService';
import { 
  Remuneracion, 
  RemuneracionCreateData, 
  RemuneracionUpdateData, 
  RemuneracionFilter
} from '../../types/CC/remuneracion';

// ✅ Interfaz para datos que vienen de la API (nombres reales de la BD)
interface ApiRemuneracion {
  id: number;
  employee_id?: number;
  employee_name?: string;
  employee_tax_id?: string; // Campo real de la BD
  employee_rut?: string; // Alias del query
  employee_position?: string;
  net_salary?: number; // Campo real de la BD
  sueldo_liquido?: number; // Alias del query
  advance_payment?: number; // Campo real de la BD
  anticipo?: number; // Alias del query
  amount: number;
  area?: string;
  cost_center_id?: number;
  project_code?: string; // Alias del query (center_code)
  project_name?: string; // Alias del query (center_name)
  period: string;
  date: string;
  status: string; // Campo real de la BD
  state?: string; // Para compatibilidad
  work_days?: number;
  payment_method?: string;
  payment_date?: string;
  created_at?: string;
  updated_at?: string;
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
 * 🔧 FUNCIÓN CLAVE: Transformar datos de API a Frontend con mapeo correcto
 */
const transformApiRemuneracion = (apiRem: ApiRemuneracion): Remuneracion => {
  return {
    id: apiRem.id,
    name: apiRem.employee_name || `Empleado ${apiRem.id}`,
    
    // ✅ MAPEO CORRECTO: Usar los campos reales y sus alias
    employeeId: apiRem.employee_id || 0,
    employeeName: apiRem.employee_name,
    employeeRut: apiRem.employee_rut || apiRem.employee_tax_id, // Usar alias o campo real
    employeePosition: apiRem.employee_position,
    
    // Campos financieros - usar alias o campos reales
    sueldoLiquido: apiRem.sueldo_liquido || apiRem.net_salary || 0,
    anticipo: apiRem.anticipo || apiRem.advance_payment || 0,
    amount: apiRem.amount || 0,
    
    // Información de proyecto/centro de costo
    projectId: apiRem.cost_center_id,
    projectCode: apiRem.project_code,
    projectName: apiRem.project_name,
    
    // Campos temporales
    period: apiRem.period || '',
    date: apiRem.date || '',
    state: apiRem.state || apiRem.status || 'pending', // Mapear status a state
    
    // Información adicional
    area: apiRem.area,
    workDays: apiRem.work_days || 30,
    paymentMethod: apiRem.payment_method || 'transfer',
    paymentDate: apiRem.payment_date,
    
    // Requerido
    companyId: 1
  };
};

/**
 * ✅ FUNCIÓN PRINCIPAL: Obtener remuneraciones con transformación
 */
export const getRemuneraciones = async (filters: RemuneracionFilter = {}): Promise<Remuneracion[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.state) params.append('state', filters.state);
    if (filters.employeePosition) params.append('employeePosition', filters.employeePosition);
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.search) params.append('search', filters.search);
    if (filters.area) params.append('area', filters.area);
    if (filters.type) params.append('type', filters.type);
    if (filters.rut) params.append('rut', filters.rut);
    
    if (filters.period && filters.period.length > 0) {
      filters.period.forEach(period => params.append('period', period));
    }
    
    const queryString = params.toString();
    const url = queryString ? `/remuneraciones?${queryString}` : '/remuneraciones';
    
    const response = await api.get<ApiResponse<ApiRemuneracion[]>>(url);
    
    if (response.success) {
      // 🔧 TRANSFORMACIÓN APLICADA AQUÍ
      const transformedData = response.data.map(transformApiRemuneracion);
      
      console.log('✅ Datos transformados correctamente:', {
        original: response.data.length,
        transformed: transformedData.length,
        sample: transformedData[0] ? {
          employeeName: transformedData[0].employeeName,
          employeeRut: transformedData[0].employeeRut,
          sueldoLiquido: transformedData[0].sueldoLiquido,
          anticipo: transformedData[0].anticipo,
          amount: transformedData[0].amount
        } : null,
        // Debug: Mostrar datos originales también
        originalSample: response.data[0] ? {
          employee_name: response.data[0].employee_name,
          employee_rut: response.data[0].employee_rut,
          employee_tax_id: response.data[0].employee_tax_id,
          sueldo_liquido: response.data[0].sueldo_liquido,
          net_salary: response.data[0].net_salary,
          anticipo: response.data[0].anticipo,
          advance_payment: response.data[0].advance_payment
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
}
export default {
  getRemuneraciones,
  createRemuneracion,
  createRemuneracionesBatch,
  updateRemuneracion,
  deleteRemuneracion,
  getRemuneracionById
};