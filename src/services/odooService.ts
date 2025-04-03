// src/services/odooService.ts
import axios from 'axios';

// Default configuration baseUrl to work with proxy
const odooConfig = {
  baseUrl: import.meta.env.VITE_ODOO_URL || '/odoo',
  db: import.meta.env.VITE_ODOO_DB || 'postgres',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  debug: import.meta.env.VITE_DEBUG === 'true',
};

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
      const response = await axios.post(`${this.baseUrl}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [this.db, username, password, {}],
        },
        id: new Date().getTime(),
      }, {
        withCredentials: true
      });
  
      if (response.data.error) {
        throw new Error(response.data.error.message || 'Authentication failed');
      }
  
      const uid = response.data.result;
      if (!uid) {
        throw new Error('Authentication failed');
      }
  
      this.uid = uid;
      this.sessionId = `session_id=${response.headers['set-cookie']?.join(';').match(/session_id=([^;]+)/)?.[1] || ''}`;
  
      // Get company_id from user
      const userInfo = await this.callMethod('res.users', 'read', [[uid], ['company_id']]);
      const companyId = userInfo[0].company_id[0];
      this.companyId = companyId;
  
      return {
        uid,
        companyId,
        sessionId: this.sessionId,
        context: {},
      };
    } catch (error) {
      console.error('Odoo authentication error:', error);
      throw new Error('Authentication failed');
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/jsonrpc`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'common',
            method: 'version',
          },
          id: new Date().getTime(),
        },
        { 
          timeout: odooConfig.apiTimeout,
          withCredentials: true  // Add this
        }
      );
      
      return !!response.data.result;
    } catch (error) {
      console.error('Odoo connection check failed:', error);
      return false;
    }
  }

  // Call Odoo Method
  async callMethod(model: string, method: string, args: any[] = [], kwargs: Record<string, any> = {}): Promise<any> {
    if (!this.uid && method !== 'authenticate') {
      throw new Error('Not authenticated');
    }

    // Always include company_id in context for tenant isolation
    const context = {
      ...(kwargs.context || {}),
      company_id: this.companyId,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/jsonrpc`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [this.db, this.uid, kwargs.password || '', model, method, args, { ...kwargs, context }],
          },
          id: new Date().getTime(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: this.sessionId || '',
          },
          withCredentials: true
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
    return odooAPI.authenticate(username, password);
  },

  async logout(): Promise<void> {
    // Clear local storage and session cookies
    localStorage.removeItem('odooSession');
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
};