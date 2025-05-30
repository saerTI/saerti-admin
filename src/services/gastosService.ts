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
  projectId?: number;
  projectName?: string;
  currencyId?: number;
  currencySymbol?: string;
  state: string;
  companyId: number;
  notes?: string;
}

export interface Cotizacion extends GastoBase {
  providerId: number;
  providerName: string;
  validUntil: string;
  isApproved: boolean;
}

export interface Previsional extends GastoBase {
  employeeId: number;
  employeeName: string;
  period: string;
  type: string;
  area?: string;
  centroCosto?: string;
}

export interface ServicioAlimentacionHospedaje extends GastoBase {
  providerId: number;
  providerName: string;
  startDate: string;
  endDate: string;
  numPeople: number;
  serviceType: string;
}

export interface LeasingPagoMaquinaria extends GastoBase {
  providerId: number;
  providerName: string;
  equipmentId?: number;
  equipmentName?: string;
  paymentType: 'leasing' | 'payment';
  startDate?: string;
  endDate?: string;
  contractNumber?: string;
}

export interface Subcontrato extends GastoBase {
  contractorId: number;
  contractorName: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  paymentType: 'credit' | 'cash';
  paymentTerms?: string;
}

export interface OrdenCompra extends GastoBase {
  providerId: number;
  providerName: string;
  orderNumber: string;
  paymentType: 'credit' | 'cash';
  deliveryDate?: string;
  paymentTerms?: string;
}

export interface ContratoNotarial extends GastoBase {
  notaryId: number;
  notaryName: string;
  contractType: string;
  documentNumber: string;
  signingDate: string;
}

export interface CostoFijo extends GastoBase {
  categoryId: number;
  categoryName: string;
  period: string;
  isRecurring: boolean;
  frequency?: string;
}

export interface CostoVariable extends GastoBase {
  categoryId: number;
  categoryName: string;
  unitAmount: number;
  quantity: number;
  unitName?: string;
}

export interface PagoRendicion extends GastoBase {
  employeeId: number;
  employeeName: string;
  expenseDate: string;
  approvalDate?: string;
  categoryId: number;
  categoryName: string;
}

export interface Impuesto extends GastoBase {
  taxType: string;
  period: string;
  dueDate: string;
  isPaid: boolean;
  paymentDate?: string;
}

export interface SeguroPoliza extends GastoBase {
  insuranceCompanyId: number;
  insuranceCompanyName: string;
  policyNumber: string;
  policyType: string;
  startDate: string;
  endDate: string;
  coverageAmount?: number;
}

export interface CertificacionCapacitacion extends GastoBase {
  providerId: number;
  providerName: string;
  certificationType: string;
  startDate?: string;
  endDate?: string;
  numParticipants?: number;
  isMandatory: boolean;
}

export interface EstudioAsesoria extends GastoBase {
  providerId: number;
  providerName: string;
  serviceType: string;
  startDate: string;
  endDate?: string;
  deliverable?: string;
}

export interface GastoImprevisto extends GastoBase {
  categoryId: number;
  categoryName: string;
  authorizationId?: number;
  authorizationName?: string;
  emergencyLevel?: 'low' | 'medium' | 'high';
}

// Filter interfaces
export interface GastoFilter {
  projectId?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  state?: string;
  category?: string;
  area?: string;
  centroCosto?: string;
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

  async createCotizacion(data: Omit<Cotizacion, 'id' | 'companyId'>): Promise<number> {
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
  async getExpenseCategories(type?: string): Promise<{ id: number; name: string; type: string; parentId: number | null }[]> {
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
      if (projectId) params.append('projectId', String(projectId));
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