// src/utils/config.ts - Versión mejorada

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';
const isTest = import.meta.env.MODE === 'test';

// Environment-specific configuration
const config = {
  // ✅ MEJORADO: Exportar variables de entorno
  isDevelopment,
  isProduction,
  isTest,
  mode: import.meta.env.MODE,
  
  // API base URL - Corregido para apuntar al puerto correcto
  apiUrl: import.meta.env.VITE_API_URL || (isDevelopment 
    ? 'http://localhost:3001' 
    : ''),
  
  // Default timeout in milliseconds
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  
  // App information
  appName: 'ConstructFlow',
  appVersion: '1.0.0',
  
  // ✅ MEJORADO: Configuración de debugging
  debug: {
    enabled: isDevelopment,
    showFilterDebug: isDevelopment && import.meta.env.VITE_SHOW_FILTER_DEBUG !== 'false',
    showApiCalls: isDevelopment && import.meta.env.VITE_SHOW_API_CALLS === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || (isDevelopment ? 'debug' : 'error')
  },
  
  // Feature flags
  features: {
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    // ✅ MEJORADO: Más feature flags útiles
    enableFilterPanel: import.meta.env.VITE_ENABLE_FILTER_PANEL !== 'false',
    enableRealTimeUpdates: import.meta.env.VITE_ENABLE_REALTIME === 'true',
    enableAdvancedFilters: import.meta.env.VITE_ENABLE_ADVANCED_FILTERS === 'true'
  },

  // ✅ NUEVO: Configuración de paginación
  pagination: {
    defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '15', 10),
    pageSizeOptions: [10, 15, 25, 50, 100],
    maxPageSize: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE || '100', 10)
  },

  // ✅ NUEVO: Configuración de filtros
  filters: {
    debounceMs: parseInt(import.meta.env.VITE_FILTER_DEBOUNCE || '300', 10),
    maxFilters: parseInt(import.meta.env.VITE_MAX_FILTERS || '10', 10),
    persistFilters: import.meta.env.VITE_PERSIST_FILTERS !== 'false'
  },

  // ✅ NUEVO: URLs y rutas
  routes: {
    api: '/api',
    auth: '/auth',
    dashboard: '/dashboard',
    costCenters: '/centros-costo',
    fixedCosts: '/gastos/costos-fijos',
    purchaseOrders: '/cuentas/ordenes-compra'
  }
};

// ✅ MEJORADO: Función helper para logging
export const logger = {
  debug: (...args: any[]) => {
    if (config.debug.enabled && config.debug.logLevel === 'debug') {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (config.debug.enabled) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  }
};

// ✅ MEJORADO: Validación de configuración
const validateConfig = () => {
  if (!config.apiUrl && isProduction) {
    logger.error('API URL is required in production');
  }
  
  if (config.apiTimeout < 1000) {
    logger.warn('API timeout is very low:', config.apiTimeout);
  }
  
  logger.debug('Configuration loaded:', config);
};

// Validar configuración al importar
if (isDevelopment) {
  validateConfig();
}

export default config;