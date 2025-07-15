// src/types/CC/apiResponses.ts

/**
 * Tipos de respuesta consistentes para la API de órdenes de compra
 */

import { OrdenCompraPagination, OrdenCompraStats, OrdenCompraFilter } from './ordenCompra';

// ✅ TIPO BASE PARA RESPUESTAS DE LA API
export interface BaseApiResponse {
  success: boolean;
  message: string;
  status?: string;
  timestamp?: string;
  requestId?: string;
}

// ✅ RESPUESTA CON DATOS SIMPLES
export interface ApiDataResponse<T> extends BaseApiResponse {
  data: T;
}

// ✅ RESPUESTA CON PAGINACIÓN
export interface ApiPaginatedResponse<T> extends BaseApiResponse {
  data: T[];
  pagination: OrdenCompraPagination;
  stats?: OrdenCompraStats;
  filters?: OrdenCompraFilter;
}

// ✅ RESPUESTA DE BATCH CON TIPADO FLEXIBLE
export interface ApiBatchResponse extends BaseApiResponse {
  status: 'success' | 'partial_success' | 'error';
  data: {
    ids: number[];
    created: number;
    total: number;
    errors: Array<{
      index: number;
      item: {
        [key: string]: any;  // ✅ Flexibilidad para diferentes estructuras
        po_number?: string;
        name?: string;
        orderNumber?: string;
        amount?: number;
        categoria?: string;
        category?: string;
        error: string;
      };
    }>;
  };
}

// ✅ RESPUESTA DE ERROR ESTRUCTURADA
export interface ApiErrorResponse extends BaseApiResponse {
  success: false;
  error: {
    code: string;
    field?: string;
    details?: any;
  };
  validationErrors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// ✅ RESPUESTA DE DIAGNÓSTICO
export interface ApiDiagnosticsResponse extends BaseApiResponse {
  diagnostics: {
    timestamp: string;
    server: {
      environment: string;
      nodeVersion: string;
      uptime: number;
      memory: any;
    };
    database: {
      connected: boolean;
      schema?: any;
      sampleData?: any;
      errors: string[];
    };
    validation: {
      sampleOrder?: any;
      errors: string[];
    };
  };
  status: 'healthy' | 'warning' | 'error';
  recommendations: string[];
}

// ✅ TYPE GUARDS PARA VERIFICAR TIPOS DE RESPUESTA
export function isApiDataResponse<T>(response: any): response is ApiDataResponse<T> {
  return response && 
         typeof response === 'object' && 
         'data' in response && 
         !('pagination' in response) &&
         !Array.isArray(response.data);
}

export function isApiBatchResponse(response: any): response is ApiBatchResponse {
  return response && 
         typeof response === 'object' && 
         'data' in response && 
         'ids' in response.data && 
         'created' in response.data &&
         'errors' in response.data;
}

export function isApiPaginatedResponse<T>(response: any): response is ApiPaginatedResponse<T> {
  return response && 
         typeof response === 'object' && 
         'data' in response && 
         'pagination' in response &&
         Array.isArray(response.data);
}

export function isApiErrorResponse(response: any): response is ApiErrorResponse {
  return response && 
         typeof response === 'object' && 
         response.success === false &&
         'error' in response;
}

export function isApiDiagnosticsResponse(response: any): response is ApiDiagnosticsResponse {
  return response && 
         typeof response === 'object' && 
         'diagnostics' in response &&
         'status' in response;
}

// ✅ UTILITIES PARA EXTRAER DATOS DE FORMA SEGURA
export function extractApiData<T>(response: any, defaultValue: T): T {
  if (isApiDataResponse<T>(response)) {
    return response.data;
  }
  return defaultValue;
}

export function extractApiArray<T>(response: any, defaultValue: T[] = []): T[] {
  if (isApiPaginatedResponse<T>(response)) {
    return response.data;
  }
  if (isApiDataResponse<T[]>(response) && Array.isArray(response.data)) {
    return response.data;
  }
  return defaultValue;
}

export function extractApiPagination(response: any): OrdenCompraPagination | null {
  if (isApiPaginatedResponse(response)) {
    return response.pagination;
  }
  return null;
}

export function extractApiStats(response: any): OrdenCompraStats | null {
  if (isApiPaginatedResponse(response) && response.stats) {
    return response.stats;
  }
  return null;
}

// ✅ HELPER PARA MANEJAR ERRORES DE RESPUESTA
export function getApiErrorMessage(error: any, defaultMessage: string = 'Error desconocido'): string {
  // Error de respuesta de axios
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Error de respuesta de API estructurado
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  
  // Error directo de axios
  if (error?.message) {
    return error.message;
  }
  
  // Error de respuesta API directa
  if (typeof error === 'object' && error.message) {
    return error.message;
  }
  
  return defaultMessage;
}

export function getApiErrorCode(error: any): string | null {
  if (error?.response?.data?.error?.code) {
    return error.response.data.error.code;
  }
  if (error?.code) {
    return error.code;
  }
  return null;
}

export function getApiValidationErrors(error: any): Array<{field: string, message: string}> {
  if (error?.response?.data?.validationErrors) {
    return error.response.data.validationErrors;
  }
  return [];
}

// ✅ HELPER PARA VALIDAR RESPUESTA EXITOSA
export function isSuccessResponse(response: any): boolean {
  return response && 
         (response.success === true || 
          response.status === 'success' || 
          response.status === 'partial_success');
}

export function isPartialSuccessResponse(response: any): boolean {
  return response && response.status === 'partial_success';
}

export function isErrorResponse(response: any): boolean {
  return response && 
         (response.success === false || 
          response.status === 'error');
}

// ✅ HELPER PARA CREAR RESPUESTAS MOCK/DEFAULT
export function createMockApiDataResponse<T>(data: T, message: string = 'Success'): ApiDataResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

export function createMockApiPaginatedResponse<T>(
  data: T[], 
  pagination?: Partial<OrdenCompraPagination>,
  stats?: OrdenCompraStats
): ApiPaginatedResponse<T> {
  const defaultPagination: OrdenCompraPagination = {
    current_page: 1,
    per_page: 25,
    total: data.length,
    total_pages: 1,
    has_next: false,
    has_prev: false,
    ...pagination
  };

  return {
    success: true,
    message: 'Success',
    data,
    pagination: defaultPagination,
    stats,
    timestamp: new Date().toISOString()
  };
}

export function createMockApiErrorResponse(
  message: string = 'Error occurred',
  code: string = 'UNKNOWN_ERROR',
  field?: string
): ApiErrorResponse {
  return {
    success: false,
    message,
    error: {
      code,
      field
    },
    timestamp: new Date().toISOString()
  };
}

// ✅ CONSTANTES PARA CÓDIGOS DE ERROR COMUNES
export const API_ERROR_CODES = {
  // Errores de validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Errores de datos
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // Errores del sistema
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Errores de autenticación/autorización
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Errores de negocio
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED'
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// ✅ HELPER PARA LOGGING ESTRUCTURADO
export function logApiResponse(response: any, context: string = 'API_CALL'): void {
  const timestamp = new Date().toISOString();
  
  if (isSuccessResponse(response)) {
    console.log(`✅ [${context}] ${timestamp}`, {
      success: true,
      message: response.message,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : undefined
    });
  } else if (isErrorResponse(response)) {
    console.error(`❌ [${context}] ${timestamp}`, {
      success: false,
      message: response.message,
      errorCode: getApiErrorCode(response),
      validationErrors: getApiValidationErrors(response)
    });
  } else {
    console.warn(`⚠️ [${context}] ${timestamp}`, {
      unknown: true,
      response: response
    });
  }
}

export function logApiError(error: any, context: string = 'API_ERROR'): void {
  const timestamp = new Date().toISOString();
  
  console.error(`❌ [${context}] ${timestamp}`, {
    message: getApiErrorMessage(error),
    code: getApiErrorCode(error),
    validationErrors: getApiValidationErrors(error),
    status: error?.response?.status,
    statusText: error?.response?.statusText,
    url: error?.config?.url,
    method: error?.config?.method
  });
}

// ✅ TIPOS PARA CONFIGURACIÓN DE REQUESTS
export interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  validateStatus?: (status: number) => boolean;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

export interface ApiBatchRequestConfig extends ApiRequestConfig {
  batchSize?: number;
  maxConcurrency?: number;
  onProgress?: (completed: number, total: number) => void;
  onBatchComplete?: (batchIndex: number, results: any[]) => void;
}

// ✅ HELPER PARA CONFIGURACIÓN DE REQUESTS
export function createApiRequestConfig(
  overrides: Partial<ApiRequestConfig> = {}
): ApiRequestConfig {
  return {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    validateStatus: (status) => status >= 200 && status < 300,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    ...overrides
  };
}

export function createApiBatchRequestConfig(
  overrides: Partial<ApiBatchRequestConfig> = {}
): ApiBatchRequestConfig {
  return {
    ...createApiRequestConfig(overrides),
    batchSize: 100,
    maxConcurrency: 5,
    ...overrides
  };
}

// ✅ UTILITY PARA RETRY DE REQUESTS
export async function retryApiRequest<T>(
  requestFn: () => Promise<T>,
  config: { retries: number; delay: number } = { retries: 3, delay: 1000 }
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt === config.retries) {
        break; // No more retries
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, config.delay * (attempt + 1)));
      
      console.warn(`⚠️ API request failed, retrying (${attempt + 1}/${config.retries})...`, {
        error: getApiErrorMessage(error),
        nextRetryIn: config.delay * (attempt + 2)
      });
    }
  }
  
  throw lastError;
}

// ✅ UTILITY PARA BATCH PROCESSING
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  config: ApiBatchRequestConfig = {}
): Promise<{
  results: R[];
  errors: Array<{ index: number; item: T; error: any }>;
  summary: { total: number; successful: number; failed: number };
}> {
  const finalConfig = createApiBatchRequestConfig(config);
  const results: R[] = [];
  const errors: Array<{ index: number; item: T; error: any }> = [];
  
  // Process in batches
  for (let i = 0; i < items.length; i += finalConfig.batchSize!) {
    const batch = items.slice(i, i + finalConfig.batchSize!);
    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = i + batchIndex;
      try {
        const result = await processor(item, globalIndex);
        results[globalIndex] = result;
        return { success: true, index: globalIndex, result };
      } catch (error) {
        errors.push({ index: globalIndex, item, error });
        return { success: false, index: globalIndex, error };
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Report progress
    if (finalConfig.onProgress) {
      finalConfig.onProgress(Math.min(i + finalConfig.batchSize!, items.length), items.length);
    }
    
    if (finalConfig.onBatchComplete) {
      finalConfig.onBatchComplete(Math.floor(i / finalConfig.batchSize!), batchResults);
    }
  }
  
  return {
    results: results.filter(r => r !== undefined),
    errors,
    summary: {
      total: items.length,
      successful: results.filter(r => r !== undefined).length,
      failed: errors.length
    }
  };
}

// ✅ EXPORT DEFAULT CON TODAS LAS UTILITIES
export default {
  // Type guards
  isApiDataResponse,
  isApiBatchResponse,
  isApiPaginatedResponse,
  isApiErrorResponse,
  isApiDiagnosticsResponse,
  
  // Data extractors
  extractApiData,
  extractApiArray,
  extractApiPagination,
  extractApiStats,
  
  // Error handlers
  getApiErrorMessage,
  getApiErrorCode,
  getApiValidationErrors,
  
  // Response validators
  isSuccessResponse,
  isPartialSuccessResponse,
  isErrorResponse,
  
  // Mock creators
  createMockApiDataResponse,
  createMockApiPaginatedResponse,
  createMockApiErrorResponse,
  
  // Logging utilities
  logApiResponse,
  logApiError,
  
  // Request configuration
  createApiRequestConfig,
  createApiBatchRequestConfig,
  
  // Processing utilities
  retryApiRequest,
  processBatch,
  
  // Constants
  API_ERROR_CODES
};