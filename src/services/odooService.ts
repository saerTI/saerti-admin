// src/services/odooService.ts
import axios, { AxiosError } from 'axios';

// Default configuration baseUrl
const odooConfig = {
  baseUrl: import.meta.env.VITE_ODOO_URL || '/odoo',
  db: import.meta.env.VITE_ODOO_DB || 'postgres',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  debug: import.meta.env.VITE_DEBUG === 'true',
};

// Create axios instance with proper configuration
const odooAxios = axios.create({
  baseURL: odooConfig.baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: odooConfig.apiTimeout
});

// Types
interface OdooCredentials {
  username: string;
  password: string;
}

interface OdooSession {
  uid: number;
  companyId: number;
  sessionId: string;
  context: Record<string, any>;
}

// Mock data function for development
const getMockCashFlowData = () => {
  return {
    summary: {
      totalIncome: 85000,
      totalExpense: 65000,
      netCashFlow: 20000,
      previousPeriodChange: 15.5,
    },
    items: [
      { id: 1, date: '2023-05-01', description: 'Client Payment - Project A', category: 'Sales', amount: 25000, type: 'income' },
      { id: 2, date: '2023-05-03', description: 'Materials Purchase', category: 'Materials', amount: 12000, type: 'expense' },
      { id: 3, date: '2023-05-05', description: 'Contractor Payment', category: 'Labor', amount: 15000, type: 'expense' },
      { id: 4, date: '2023-05-10', description: 'Client Payment - Project B', category: 'Sales', amount: 30000, type: 'income' },
      { id: 5, date: '2023-05-15', description: 'Equipment Rental', category: 'Equipment', amount: 8000, type: 'expense' },
      { id: 6, date: '2023-05-20', description: 'Client Payment - Project C', category: 'Sales', amount: 30000, type: 'income' },
      { id: 7, date: '2023-05-25', description: 'Utilities', category: 'Office', amount: 5000, type: 'expense' },
      { id: 8, date: '2023-05-28', description: 'Permit Fees', category: 'Permits', amount: 10000, type: 'expense' },
      { id: 9, date: '2023-05-30', description: 'Insurance Payment', category: 'Insurance', amount: 15000, type: 'expense' },
    ],
    chartData: [
      { name: 'Semana 1', income: 25000, expense: 12000, balance: 13000 },
      { name: 'Semana 2', income: 30000, expense: 15000, balance: 15000 },
      { name: 'Semana 3', income: 30000, expense: 8000, balance: 22000 },
      { name: 'Semana 4', income: 0, expense: 30000, balance: -30000 },
    ]
  };
};

class OdooAPI {
  private baseUrl: string;
  private db: string;
  private uid: number | null = null;
  private sessionId: string | null = null;
  private companyId: number | null = null;

  constructor(baseUrl = odooConfig.baseUrl, db = odooConfig.db) {
    this.baseUrl = baseUrl;
    this.db = db;
  }

  // Initialize from existing session
  initFromSession(session: OdooSession) {
    this.uid = session.uid;
    this.companyId = session.companyId;
    this.sessionId = session.sessionId;
    return this;
  }

  // Set company ID (for multi-tenant)
  setCompanyId(companyId: number) {
    this.companyId = companyId;
    return this;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
  
  // Authentication
  async authenticate(username: string, password: string): Promise<OdooSession> {
    try {
      // Use the CORS-enabled endpoint for authentication
      const response = await odooAxios.post(`/jsonrpc-cors`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [this.db, username, password, {}],
        },
        id: new Date().getTime(),
      });

      if (response.data.error) {
        throw new Error(response.data.error.message || 'Authentication failed');
      }

      const uid = response.data.result;
      if (!uid) {
        throw new Error('Authentication failed: Invalid credentials');
      }

      console.log('Authentication successful, uid:', uid);
      this.uid = uid;
      
      // Save password temporarily for subsequent requests (don't store permanently)
      const tempPassword = password;
      
      // Get company_id from user - use the password in this request
      try {
        const userInfo = await this.callMethod('res.users', 'read', [[uid], ['company_id']], 
          { password: tempPassword }); // Pass password in kwargs
        
        const companyId = userInfo[0].company_id[0];
        this.companyId = companyId;
        
        console.log('Got company ID:', companyId);
      
        // Extract session ID from cookies if available
        const sessionId = `session_id=${response.headers['set-cookie']?.join(';').match(/session_id=([^;]+)/)?.[1] || ''}`;
        this.sessionId = sessionId;

        // Return session object
        return {
          uid,
          companyId,
          sessionId: this.sessionId,
          context: {},
        };
      } catch (error) {
        console.error('Failed to get user info after authentication:', error);
        throw new Error('Authentication succeeded but failed to get user info');
      }
    } catch (error) {
      console.error('Odoo authentication error:', error);
      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/jsonrpc-cors`;
      console.log('Checking connection to:', url);
      
      // Add request debugging
      const requestData = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'version',
        },
        id: new Date().getTime(),
      };
      console.log('Request data:', requestData);
      
      const response = await odooAxios.post(
        `/jsonrpc-cors`,
        requestData,
        {
          // Add request debugging
          onUploadProgress: (p) => console.log(`Upload progress: ${p.loaded}/${p.total}`),
          headers: {
            'X-Debug-Info': 'Checking connection'
          }
        }
      );
      
      console.log('Response received:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data:', response.data);
      
      return !!response.data.result;
    } catch (error) {
      console.error('Odoo connection check failed:', error);
      
      // Type guard for Axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', axiosError.response.data);
          console.error('Error response status:', axiosError.response.status);
          console.error('Error response headers:', axiosError.response.headers);
        } else if (axiosError.request) {
          // The request was made but no response was received
          console.error('Error request:', axiosError.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error message:', axiosError.message);
        }
      } else {
        // Not an Axios error
        console.error('Unknown error:', error);
      }
      
      return false;
    }
  }

  // Call Odoo Method
  async callMethod(model: string, method: string, args: any[] = [], kwargs: Record<string, any> = {}): Promise<any> {
    if (!this.uid && method !== 'authenticate') {
      throw new Error('Not authenticated');
    }

    // Extract password from kwargs if provided
    const password = kwargs.password || '';
    
    // Remove password from kwargs to avoid sending it twice
    const { password: _, ...cleanKwargs } = kwargs;

    // Always include company_id in context for tenant isolation
    const context = {
      ...(cleanKwargs.context || {}),
      company_id: this.companyId,
    };

    try {
      console.log(`Calling ${model}.${method} with uid:`, this.uid);
      
      const response = await odooAxios.post(
        `/jsonrpc-cors`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [this.db, this.uid, password, model, method, args, { ...cleanKwargs, context }],
          },
          id: new Date().getTime(),
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error.message || 'Method execution failed');
      }

      return response.data.result;
    } catch (error) {
      console.error(`Odoo method execution error (${model}.${method}):`, error);
      throw error;
    }
  }

  // Helper methods
  async search(model: string, domain: any[] = [], options: Record<string, any> = {}): Promise<number[]> {
    return this.callMethod(model, 'search', [domain], options);
  }

  async read(model: string, ids: number[], fields: string[] = []): Promise<any[]> {
    if (ids.length === 0) return [];
    return this.callMethod(model, 'read', [ids, fields]);
  }

  async searchRead(
    model: string,
    domain: any[] = [],
    fields: string[] = [],
    options: Record<string, any> = {}
  ): Promise<any[]> {
    return this.callMethod(model, 'search_read', [domain, fields], options);
  }

  async create(model: string, values: Record<string, any>): Promise<number> {
    return this.callMethod(model, 'create', [values]);
  }

  async write(model: string, ids: number[], values: Record<string, any>): Promise<boolean> {
    if (ids.length === 0) return true;
    return this.callMethod(model, 'write', [ids, values]);
  }

  async unlink(model: string, ids: number[]): Promise<boolean> {
    if (ids.length === 0) return true;
    return this.callMethod(model, 'unlink', [ids]);
  }

  // Cash Flow specific methods
  async getCashFlowData(startDate: string, endDate: string): Promise<any> {
    try {
      // This assumes you have a custom model in Odoo for cash flow
      return await this.callMethod('cash.flow', 'get_cash_flow_data', [[startDate, endDate]]);
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      // Return mock data for development until the Odoo model is ready
      return getMockCashFlowData();
    }
  }

  async getCashFlowSummary(): Promise<any> {
    try {
      // Get summary data for dashboard
      return await this.callMethod('cash.flow', 'get_summary_data', [[]]);
    } catch (error) {
      console.error('Error fetching cash flow summary:', error);
      // Return mock data for development
      return getMockCashFlowData().summary;
    }
  }

  async importCashFlowFromExcel(fileData: string): Promise<any> {
    // Import cash flow data from Excel
    return this.callMethod('cash.flow', 'import_from_excel', [[fileData]]);
  }

  // Additional cash flow methods
  async getCashFlowCategories(): Promise<any[]> {
    try {
      return await this.searchRead(
        'cash.flow.category',  // Replace with your actual model
        [],
        ['id', 'name', 'type']
      );
    } catch (error) {
      console.error('Error fetching cash flow categories:', error);
      // Return mock categories
      return [
        { id: 1, name: 'Sales', type: 'income' },
        { id: 2, name: 'Materials', type: 'expense' },
        { id: 3, name: 'Labor', type: 'expense' },
        { id: 4, name: 'Equipment', type: 'expense' },
        { id: 5, name: 'Office', type: 'expense' },
        { id: 6, name: 'Permits', type: 'expense' },
        { id: 7, name: 'Insurance', type: 'expense' },
      ];
    }
  }

  // Generate cash flow report
  async generateCashFlowReport(startDate: string, endDate: string, options: Record<string, any> = {}): Promise<any> {
    try {
      return await this.callMethod('cash.flow', 'generate_report', [[startDate, endDate]], options);
    } catch (error) {
      console.error('Error generating cash flow report:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const odooAPI = new OdooAPI();
export default odooAPI;

// Auth service for login/logout
export const authService = {
  async login(credentials: OdooCredentials): Promise<OdooSession> {
    const { username, password } = credentials;
    
    // Store the password temporarily in sessionStorage (will be cleared on page close)
    // This allows for making authenticated requests without storing password permanently
    sessionStorage.setItem('odoo_temp_pwd', password);
    
    const session = await odooAPI.authenticate(username, password);
    return session;
  },

  async logout(): Promise<void> {
    // Clear all storage
    localStorage.removeItem('odooSession');
    sessionStorage.removeItem('odoo_temp_pwd');
    // For a real implementation, you might want to call a logout endpoint
  },

  isAuthenticated(): boolean {
    const session = localStorage.getItem('odooSession');
    return !!session;
  },

  getSession(): OdooSession | null {
    const session = localStorage.getItem('odooSession');
    if (!session) return null;
    try {
      return JSON.parse(session) as OdooSession;
    } catch (e) {
      return null;
    }
  },

  saveSession(session: OdooSession): void {
    localStorage.setItem('odooSession', JSON.stringify(session));
  },
  
  // Add this helper method to get temporary password
  getTempPassword(): string {
    return sessionStorage.getItem('odoo_temp_pwd') || '';
  }
};