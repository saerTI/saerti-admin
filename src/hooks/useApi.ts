// src/hooks/useApi.ts
import { useState, useCallback, useEffect } from 'react';
import { apiMiddleware, ApiErrorResponse, syncCompanyIds } from '../services/apiService';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiErrorResponse | null;
}

interface ApiHookOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiErrorResponse) => void;
  autoSyncCompanyIds?: boolean;
}

// Hook for making API requests with proper tenant context
export function useApi<T = any>(options: ApiHookOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const { currentTenant } = useTenant();
  const { user } = useAuth();

  // Sync company IDs between tenant and session whenever tenant changes
  useEffect(() => {
    if (options.autoSyncCompanyIds !== false && currentTenant) {
      syncCompanyIds();
    }
  }, [currentTenant, options.autoSyncCompanyIds]);

  // Function to make GET request
  const get = useCallback(async (url: string, params?: Record<string, string>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Add tenant company ID to headers
      const headers: Record<string, string> = {};
      if (currentTenant?.companyId) {
        headers['X-Company-ID'] = currentTenant.companyId.toString();
      }
      
      const response = await apiMiddleware(url, { 
        method: 'GET',
        params,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorData
        }));
        
        if (options.onError) {
          options.onError(errorData);
        }
        
        return null;
      }
      
      const data = await response.json();
      const result = data.data || data; // Handle both ApiSuccessResponse and direct data
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        data: result
      }));
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorResponse
      }));
      
      if (options.onError) {
        options.onError(errorResponse);
      }
      
      return null;
    }
  }, [currentTenant, options.onError, options.onSuccess]);

  // Function to make POST request
  const post = useCallback(async (url: string, data?: any, params?: Record<string, string>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Add tenant company ID to headers
      const headers: Record<string, string> = {};
      if (currentTenant?.companyId) {
        headers['X-Company-ID'] = currentTenant.companyId.toString();
      }
      
      const response = await apiMiddleware(url, { 
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
        params,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorData
        }));
        
        if (options.onError) {
          options.onError(errorData);
        }
        
        return null;
      }
      
      const responseData = await response.json();
      const result = responseData.data || responseData; // Handle both ApiSuccessResponse and direct data
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        data: result
      }));
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorResponse
      }));
      
      if (options.onError) {
        options.onError(errorResponse);
      }
      
      return null;
    }
  }, [currentTenant, options.onError, options.onSuccess]);

  // Function to make PUT request
  const put = useCallback(async (url: string, data?: any, params?: Record<string, string>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Add tenant company ID to headers
      const headers: Record<string, string> = {};
      if (currentTenant?.companyId) {
        headers['X-Company-ID'] = currentTenant.companyId.toString();
      }
      
      const response = await apiMiddleware(url, { 
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
        params,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorData
        }));
        
        if (options.onError) {
          options.onError(errorData);
        }
        
        return null;
      }
      
      const responseData = await response.json();
      const result = responseData.data || responseData; // Handle both ApiSuccessResponse and direct data
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        data: result
      }));
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorResponse
      }));
      
      if (options.onError) {
        options.onError(errorResponse);
      }
      
      return null;
    }
  }, [currentTenant, options.onError, options.onSuccess]);

  // Function to make PATCH request
  const patch = useCallback(async (url: string, data?: any, params?: Record<string, string>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Add tenant company ID to headers
      const headers: Record<string, string> = {};
      if (currentTenant?.companyId) {
        headers['X-Company-ID'] = currentTenant.companyId.toString();
      }
      
      const response = await apiMiddleware(url, { 
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
        params,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorData
        }));
        
        if (options.onError) {
          options.onError(errorData);
        }
        
        return null;
      }
      
      const responseData = await response.json();
      const result = responseData.data || responseData; // Handle both ApiSuccessResponse and direct data
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        data: result
      }));
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorResponse
      }));
      
      if (options.onError) {
        options.onError(errorResponse);
      }
      
      return null;
    }
  }, [currentTenant, options.onError, options.onSuccess]);

  // Function to make DELETE request
  const del = useCallback(async (url: string, params?: Record<string, string>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Add tenant company ID to headers
      const headers: Record<string, string> = {};
      if (currentTenant?.companyId) {
        headers['X-Company-ID'] = currentTenant.companyId.toString();
      }
      
      const response = await apiMiddleware(url, { 
        method: 'DELETE',
        params,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorData
        }));
        
        if (options.onError) {
          options.onError(errorData);
        }
        
        return null;
      }
      
      const responseData = await response.json();
      const result = responseData.data || responseData; // Handle both ApiSuccessResponse and direct data
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        data: result
      }));
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      
      const errorResponse: ApiErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorResponse
      }));
      
      if (options.onError) {
        options.onError(errorResponse);
      }
      
      return null;
    }
  }, [currentTenant, options.onError, options.onSuccess]);

  // Reset the state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    get,
    post,
    put,
    patch,
    delete: del, // 'delete' is a reserved word
    reset,
  };
}

export default useApi;