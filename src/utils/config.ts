// src/utils/config.ts
const isDevelopment = import.meta.env.MODE === 'development';

// Environment-specific configuration
const config = {
  // API base URL - Corregido para apuntar al puerto correcto
  apiUrl: import.meta.env.VITE_API_URL || (isDevelopment 
    ? 'http://localhost:3001' 
    : ''),
  
  // Default timeout in milliseconds
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  
  // App information
  appName: 'ConstructFlow',
  appVersion: '1.0.0',
  
  // Feature flags
  features: {
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  }
};

export default config;