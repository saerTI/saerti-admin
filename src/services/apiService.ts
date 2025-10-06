// ========================================
// PASO 4: saerti-admin/src/services/apiService.ts (ACTUALIZAR)
// ========================================
import axios, { AxiosError } from 'axios';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
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

// ✅ AHORA USAR @clerk/clerk-react en vez de window.Clerk
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = sessionStorage.getItem('clerk_token');
      
      console.log('[API Request]', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 30) + '...' : 'NO TOKEN'
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.error('[API] ❌ NO HAY TOKEN EN SESSIONSTORAGE');
        console.log('[API] SessionStorage keys:', Object.keys(sessionStorage));
      }
    } catch (error) {
      console.error('[API] ❌ Error en interceptor:', error);
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
      sessionStorage.removeItem('clerk_token');
      
      const redirectUrl = encodeURIComponent(window.location.href);
      console.log('[API] Redirigiendo a login...', redirectUrl);
      
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