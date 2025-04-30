// src/services/apiService.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          const { token } = response.data;
          localStorage.setItem('auth_token', token);
          
          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth/signin';
      }
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
  
  post: async <T>(url: string, data = {}, config = {}) => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },
  
  put: async <T>(url: string, data = {}, config = {}) => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },
  
  delete: async <T>(url: string, config = {}) => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
  
  // To allow more control when needed
  request: apiClient
};

export default api;