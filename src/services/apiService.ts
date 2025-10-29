// saerti-admin/src/services/apiService.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ✅ FUNCIÓN PARA OBTENER TOKEN DIRECTAMENTE DESDE CLERK
let getTokenFunction: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (getter: () => Promise<string | null>) => {
  getTokenFunction = getter;
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // ✅ Obtener token fresco desde Clerk
      if (getTokenFunction) {
        const token = await getTokenFunction();
        
        console.log('[API Request]', {
          url: config.url,
          method: config.method,
          params: config.params,
          cost_center_id: config.params?.cost_center_id,
          hasToken: !!token,
          tokenPrefix: token ? token.substring(0, 30) + '...' : 'NO TOKEN'
        });

        // Log especial si hay cost_center_id
        if (config.params?.cost_center_id) {
          console.log('🎯 [API] FILTRANDO POR CENTRO DE COSTO:', config.params.cost_center_id);
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.error('[API] ❌ NO SE PUDO OBTENER TOKEN DE CLERK');
        }
      } else {
        console.error('[API] ❌ getTokenFunction NO ESTÁ CONFIGURADA');
      }
    } catch (error) {
      console.error('[API] ❌ Error obteniendo token:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('[API] ❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Response] ✅', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  async (error: AxiosError) => {
    console.error('[API Response] ❌', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      console.error('[API] 🚨 401 UNAUTHORIZED - Token inválido o expirado');
      
      // Redirigir al sign-in de tu app Next.js
      const redirectUrl = encodeURIComponent(window.location.href);
      window.location.href = `http://localhost:3000/sign-in?redirect_url=${redirectUrl}`;
    }
    
    return Promise.reject(error);
  }
);

export const api = {
  get: async <T>(url: string, config = {}) => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },
  post: async <T>(url: string, data = {}, config: any = {}) => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },
  postFormData: async <T>(url: string, formData: FormData, config: any = {}) => {
    const response = await apiClient.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
    return response.data;
  },
  put: async <T>(url: string, data = {}, config: any = {}) => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },
  patch: async <T>(url: string, data = {}, config: any = {}) => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },
  delete: async <T>(url: string, config: any = {}) => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
  request: apiClient
};

export default api;