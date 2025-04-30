import axios, { AxiosError } from 'axios';
import { authService } from './authService'; 
import api from './apiService';

// Base URL configuration from environment
const API_BASE_URL = import.meta.env.VITE_ODOO_URL || '/odoo';

// Create an axios instance with authentication support
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for maintaining session cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)
});

// Types for gastos data
export interface GastoBase {
  id: number;
  name: string;
  date: string;
  amount: number;
  project_id?: number;
  project_name?: string;
  currency_id?: number;
  currency_symbol?: string;
  state: string;
  company_id: number;
  notes?: string;
}

export interface Cotizacion extends GastoBase {
  provider_id: number;
  provider_name: string;
  valid_until: string;
  is_approved: boolean;
}

export interface Previsional extends GastoBase {
  employee_id: number;
  employee_name: string;
  period: string;
  type: string;
}

export interface ServicioAlimentacionHospedaje extends GastoBase {
  provider_id: number;
  provider_name: string;
  start_date: string;
  end_date: string;
  num_people: number;
  service_type: string;
}

export interface LeasingPagoMaquinaria extends GastoBase {
  provider_id: number;
  provider_name: string;
  equipment_id?: number;
  equipment_name?: string;
  payment_type: 'leasing' | 'payment';
  start_date?: string;
  end_date?: string;
  contract_number?: string;
}

export interface Subcontrato extends GastoBase {
  contractor_id: number;
  contractor_name: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  payment_type: 'credit' | 'cash';
  payment_terms?: string;
}

export interface OrdenCompra extends GastoBase {
  provider_id: number;
  provider_name: string;
  order_number: string;
  payment_type: 'credit' | 'cash';
  delivery_date?: string;
  payment_terms?: string;
}

export interface ContratoNotarial extends GastoBase {
  notary_id: number;
  notary_name: string;
  contract_type: string;
  document_number: string;
  signing_date: string;
}

export interface CostoFijo extends GastoBase {
  category_id: number;
  category_name: string;
  period: string;
  is_recurring: boolean;
  frequency?: string;
}

export interface CostoVariable extends GastoBase {
  category_id: number;
  category_name: string;
  unit_amount: number;
  quantity: number;
  unit_name?: string;
}

export interface PagoRendicion extends GastoBase {
  employee_id: number;
  employee_name: string;
  expense_date: string;
  approval_date?: string;
  category_id: number;
  category_name: string;
}

export interface Impuesto extends GastoBase {
  tax_type: string;
  period: string;
  due_date: string;
  is_paid: boolean;
  payment_date?: string;
}

export interface SeguroPoliza extends GastoBase {
  insurance_company_id: number;
  insurance_company_name: string;
  policy_number: string;
  policy_type: string;
  start_date: string;
  end_date: string;
  coverage_amount?: number;
}

export interface CertificacionCapacitacion extends GastoBase {
  provider_id: number;
  provider_name: string;
  certification_type: string;
  start_date?: string;
  end_date?: string;
  num_participants?: number;
  is_mandatory: boolean;
}

export interface EstudioAsesoria extends GastoBase {
  provider_id: number;
  provider_name: string;
  service_type: string;
  start_date: string;
  end_date?: string;
  deliverable?: string;
}

export interface GastoImprevisto extends GastoBase {
  category_id: number;
  category_name: string;
  authorization_id?: number;
  authorization_name?: string;
  emergency_level?: 'low' | 'medium' | 'high';
}

// Filter interfaces
export interface GastoFilter {
  project_id?: number;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  state?: string;
  category?: string;
}

// Helper function to extract data from JSON-RPC or direct API responses
const extractResponseData = (response: any): any => {
  // Check if this is a JSON-RPC response
  if (response.jsonrpc && response.result !== undefined) {
    // Return the result part of JSON-RPC response
    return response.result;
  }
  // Otherwise, return the response as is (assuming direct API response)
  return response;
};

// Service for gastos API operations
const gastosApiService = {
  // Generic error handler
  handleError(error: unknown, errorMessage: string): never {
    console.error(errorMessage, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error response:', axiosError.response?.data);
    }
    throw new Error(errorMessage);
  },

  // Cotizaciones
  async getCotizaciones(filters: GastoFilter = {}): Promise<Cotizacion[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });

      const response = await apiClient.get(`/api/gastos/cotizaciones${params.toString() ? '?' + params.toString() : ''}`);
      const data = extractResponseData(response.data);
      
      if (data.status === 'success') {
        return data.data || [];
      } else {
        throw new Error(data.message || 'Failed to fetch cotizaciones');
      }
    } catch (error) {
      return this.handleError(error, 'No se pudieron cargar las cotizaciones');
    }
  },

  async getCotizacionById(id: number): Promise<Cotizacion> {
    try {
      const response = await apiClient.get(`/api/gastos/cotizaciones/${id}`);
      const data = extractResponseData(response.data);
      
      if (data.status === 'success') {
        return data.data;
      } else {
        throw new Error(data.message || 'Cotización not found');
      }
    } catch (error) {
      return this.handleError(error, 'No se pudo cargar la cotización');
    }
  },

  async createCotizacion(data: Omit<Cotizacion, 'id' | 'company_id'>): Promise<number> {
    try {
      const response = await apiClient.post('/api/gastos/cotizaciones', JSON.stringify(data));
      const result = extractResponseData(response.data);
      
      if (result.status === 'success') {
        return result.id;
      } else if (result.id) {
        return result.id;
      } else {
        throw new Error(result.message || 'Failed to create cotización');
      }
    } catch (error) {
      return this.handleError(error, 'No se pudo crear la cotización');
    }
  },

  async updateCotizacion(id: number, data: Partial<Cotizacion>): Promise<boolean> {
    try {
      const updateData = {
        id,
        ...data
      };
      
      const response = await apiClient.post('/api/gastos/cotizaciones', JSON.stringify(updateData));
      const result = extractResponseData(response.data);
      
      if (result.status === 'success' || result.id) {
        return true;
      } else {
        throw new Error(result.message || 'Failed to update cotización');
      }
    } catch (error) {
      return this.handleError(error, 'No se pudo actualizar la cotización');
    }
  },

  async deleteCotizacion(id: number): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/api/gastos/cotizaciones/${id}`);
      const data = extractResponseData(response.data);
      
      if (data.status === 'success') {
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete cotización');
      }
    } catch (error) {
      return this.handleError(error, 'No se pudo eliminar la cotización');
    }
  },

  // Implement similar methods for each type of gasto
  // Previsionales
  async getPrevisionales(filters: GastoFilter = {}): Promise<Previsional[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });

      const response = await apiClient.get(`/api/gastos/previsionales${params.toString() ? '?' + params.toString() : ''}`);
      const data = extractResponseData(response.data);
      
      if (data.status === 'success') {
        return data.data || [];
      } else {
        throw new Error(data.message || 'Failed to fetch previsionales');
      }
    } catch (error) {
      return this.handleError(error, 'No se pudieron cargar los previsionales');
    }
  },

  // Similarly implement methods for other expense types
  // ...

  // Generic method to get expense categories
  async getExpenseCategories(type?: string): Promise<{ id: number; name: string; type: string; parent_id: number | null }[]> {
    try {
      const params = new URLSearchParams();
      if (type) {
        params.append('type', type);
      }

      const response = await apiClient.get(`/api/gastos/categories${params.toString() ? '?' + params.toString() : ''}`);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch expense categories');
      }
    } catch (error) {
      return this.handleError(error, 'No se pudieron cargar las categorías de gastos');
    }
  },

  // Method to get expense stats for dashboard
  async getExpenseStats(projectId?: number, period?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', String(projectId));
      if (period) params.append('period', period);

      const response = await apiClient.get(`/api/gastos/stats${params.toString() ? '?' + params.toString() : ''}`);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch expense statistics');
      }
    } catch (error) {
      return this.handleError(error, 'No se pudieron cargar las estadísticas de gastos');
    }
  }
};

// Add a request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Instead of using Odoo session, use your auth token
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Automatically logout on authentication errors
      authService.logout();
      // Redirect to login page
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

export default gastosApiService;