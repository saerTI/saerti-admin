import { Empleado, EmpleadoFilter } from '../../types/CC/empleados';
import { api } from '../apiService';

interface ApiEmpleado {
    id: number;
    tax_id?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    emergency_phone?: string;
    position?: string;
    department?: string;
    hire_date?: string;
    termination_date?: string;
    default_cost_center_id?: number;
    cost_center_name?: string;
    salary_base?: number;
    active?: boolean;
    created_at?: string;
    updated_at?: string;
}

interface PaginatedApiResponse<T> {
    items: T[];
    pagination: {
        current_page: number;
        total_pages: number;
        total: number;
        per_page: number;
        has_next: boolean;
        has_prev: boolean;
    };
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


export const getEmpleados = async (filters: EmpleadoFilter = {}) => {
    try {
        const params = new URLSearchParams();
        // Siempre enviar los parámetros de paginación
        params.append('page', (filters.page || 1).toString());
        params.append('per_page', (filters.per_page || 15).toString());
        
        // Filtros opcionales
        if (filters.search) params.append('search', filters.search);
        if (filters.active) params.append('active', filters.active);
        if (filters.department) params.append('department', filters.department);
        if (filters.position) params.append('position', filters.position);
        if (filters.cost_center) params.append('cost_center', filters.cost_center);

        const queryString = params.toString();
        const url = queryString ? `/empleados?${queryString}` : '/empleados';

        const response = await api.get<ApiResponse<PaginatedApiResponse<ApiEmpleado>>>(url);
        console.log('API Response:', response); // Para debug

        if (response.success && response.data) {
            const responseData = response.data;
            console.log('Response Data:', responseData); // Para debug

            // Verificar si la respuesta tiene la estructura esperada con items y pagination
            if (responseData.items && responseData.pagination) {
                return {
                    items: responseData.items.map(emp => ({
                        id: emp.id,
                        tax_id: emp.tax_id,
                        full_name: emp.full_name,
                        first_name: emp.first_name,
                        last_name: emp.last_name,
                        email: emp.email,
                        phone: emp.phone,
                        emergency_phone: emp.emergency_phone,
                        position: emp.position,
                        department: emp.department,
                        hire_date: emp.hire_date,
                        termination_date: emp.termination_date,
                        default_cost_center_id: emp.default_cost_center_id,
                        cost_center_name: emp.cost_center_name,
                        salary_base: emp.salary_base,
                        active: emp.active,
                        created_at: emp.created_at,
                        updated_at: emp.updated_at,
                    })),
                    pagination: responseData.pagination
                };
            } 
            // Fallback: si la respuesta no tiene la estructura esperada
            else {
                console.warn('Response data structure unexpected:', responseData);
                return {
                    items: [],
                    pagination: {
                        current_page: 1,
                        total_pages: 1,
                        total: 0,
                        per_page: 15,
                        has_next: false,
                        has_prev: false
                    }
                };
            }
        } else {
            console.error('API response unsuccessful or no data:', response);
            throw new Error('Error al obtener empleados del servidor');
        }
        
    } catch (error) {
        console.error('Error fetching Empleados:', error);
        throw error;
    }
}

export const getEmpleadoById = async (id: number): Promise<Empleado> => {
    try {
        const response = await api.get<ApiResponse<ApiEmpleado>>(`/empleados/${id}`);
        if (response.success) {
            const emp = response.data;
            return {
                id: emp.id,
                tax_id: emp.tax_id,
                full_name: emp.full_name,
                first_name: emp.first_name,
                last_name: emp.last_name,
                email: emp.email,
                phone: emp.phone,
                emergency_phone: emp.emergency_phone,
                position: emp.position,
                department: emp.department,
                hire_date: emp.hire_date,
                termination_date: emp.termination_date,
                default_cost_center_id: emp.default_cost_center_id,
                cost_center_name: emp.cost_center_name,
                salary_base: emp.salary_base,
                active: emp.active,
                created_at: emp.created_at,
                updated_at: emp.updated_at,
            };
        } else {
            throw new Error(response.message || 'Failed to fetch empleado');
        }
    } catch (error) {
        console.error('Error fetching empleado by ID:', error);
        throw error;
    }
}

export const createEmpleado = async (data: Partial<Empleado>): Promise<number> => {
    try {
        console.log('Creating empleado with data:', data); // Debug log
        const response = await api.post<ApiResponse<{ id: number }>>('/empleados', data);
        if (response.success) {
            return response.data.id;
        } else {
            throw new Error(response.message || 'Failed to create empleado');
        }
    } catch (error: any) {
        console.error('Error creating empleado:', error);
        
        // Handle axios error with response
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        
        throw error;
    }
}

export const updateEmpleado = async (id: number, data: Partial<Empleado>): Promise<void> => {
    try {
        const response = await api.put<ApiResponse<null>>(`/empleados/${id}`, data);
        if (!response.success) {
            throw new Error(response.message || 'Failed to update empleado');
        }
    } catch (error) {
        console.error('Error updating empleado:', error);
        throw error;
    }
}

export const deleteEmpleado = async (id: number): Promise<void> => {
    try {
        const response = await api.delete<ApiResponse<null>>(`/empleados/${id}`);
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete empleado');
        }
    } catch (error) {
        console.error('Error deleting empleado:', error);
        throw error;
    }
}

export default {
    getEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
};