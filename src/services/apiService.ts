import axios, { AxiosError } from 'axios';

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

// Request interceptor - añadir token de Clerk
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Obtener instancia de Clerk desde window
      const clerk = (window as any).Clerk;
      
      if (clerk?.session) {
        // Obtener JWT token de Clerk
        const token = await clerk.session.getToken();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error getting Clerk token:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Intentar obtener un token fresco de Clerk
        const clerk = (window as any).Clerk;
        
        if (clerk?.session) {
          const token = await clerk.session.getToken({ skipCache: true });
          
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing Clerk token:', refreshError);
      }
      
      // Si no se pudo refrescar el token, redirigir al landing
      window.location.href = 'http://localhost:3000/sign-in?redirect_url=' + 
        encodeURIComponent('http://localhost:5173' + window.location.pathname);
    }
    
    return Promise.reject(error);
  }
);

// API helper methods
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
  
  // Direct access to axios instance if needed
  request: apiClient
};

export default api;