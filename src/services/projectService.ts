import axios, { AxiosError } from 'axios';
import { authService } from './odooService';

// Base URL configuration from environment
const API_BASE_URL = import.meta.env.VITE_ODOO_URL || '/odoo';

// Create an axios instance with authentication support
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for maintaining session cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)
});

// Types for project data
export interface Project {
  id: number;
  name: string;
  code: string;
  client: {
    id: number;
    name: string;
  };
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date?: string | null;
  total_budget: number;
  currency?: {
    id: number;
    name: string;
    symbol: string;
  };
  state: string;
  progress: number;
  total_income: number;
  total_expense: number;
  balance: number;
  description?: string;
  company_id: number;
  tenant_id?: number;
}

export interface ProjectDetail extends Project {
  milestones: Milestone[];
  cash_flow: {
    income: CashFlowLine[];
    expense: CashFlowLine[];
  };
}

export interface Milestone {
  id: number;
  name: string;
  planned_date: string | null;
  actual_date: string | null;
  amount: number;
  is_completed: boolean;
  weight: number;
  notes: string;
}

export interface CashFlowLine {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
  planned_date: string | null;
  actual_date: string | null;
  amount: number;
  state: string;
  partner?: {
    id: number;
    name: string;
  } | null;
  notes: string;
}

export interface ProjectCreateData {
  name: string;
  code: string;
  client_id: number;
  start_date?: string;
  expected_end_date?: string;
  total_budget: number;
  currency_id?: number;
  description?: string;
}

export interface ProjectFilter {
  state?: string;
  client_id?: number;
}

// Helper function to extract data from JSON-RPC or direct API responses
const extractResponseData = (response: any): any => {
  // Check if this is a JSON-RPC response
  if (response.jsonrpc && response.result !== undefined) {
    // Return the result part of JSON-RPC response
    return response.result;
  }
  // Otherwise, return the response as is (assuming direct API response)
  return response;
};

// Service for project API operations
const projectApiService = {
  async getProjects(filters: ProjectFilter = {}): Promise<Project[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.state) {
        params.append('state', filters.state);
      }
      if (filters.client_id) {
        params.append('client_id', filters.client_id.toString());
      }

      // Make the API call
      const response = await apiClient.get(`/api/projects${params.toString() ? '?' + params.toString() : ''}`);
      console.log('Get projects response:', response.data);
      
      // Process the response
      const data = extractResponseData(response.data);
      
      if (data.status === 'success') {
        return data.data || [];
      } else {
        throw new Error(data.message || 'Failed to fetch projects');
      }
    } catch (error: unknown) {
      console.error('Error fetching projects:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Error response:', axiosError.response?.data);
      }
      throw new Error('No se pudieron cargar los proyectos');
    }
  },

  async getProjectById(id: number): Promise<ProjectDetail> {
    try {
      const response = await apiClient.get(`/api/projects/${id}`);
      console.log(`Get project ${id} response:`, response.data);
      
      // Process the response
      const data = extractResponseData(response.data);
      
      if (data.status === 'success') {
        return data.data;
      } else {
        throw new Error(data.message || 'Project not found');
      }
    } catch (error: unknown) {
      console.error(`Error fetching project with ID ${id}:`, error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Error response:', axiosError.response?.data);
      }
      throw new Error('No se pudo cargar el proyecto');
    }
  },

  async createProject(data: ProjectCreateData): Promise<number> {
    try {
      console.log('Creating project with data:', data);
      const response = await apiClient.post('/api/projects', JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Create project response:', response.data);
      
      // Process the response
      const result = extractResponseData(response.data);
      
      if (result.status === 'success') {
        return result.id;
      } else if (result.id) {
        // Some backends might just return the ID without a status
        return result.id;
      } else {
        throw new Error(result.message || 'Failed to create project');
      }
    } catch (error: unknown) {
      console.error('Error creating project:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Error response:', axiosError.response?.data);
      }
      throw new Error('No se pudo crear el proyecto');
    }
  },

  /**
   * Update an existing project
   */
  async updateProject(id: number, data: Partial<ProjectCreateData>): Promise<boolean> {
    try {
      const updateData = {
        id,
        ...data
      };
      
      console.log(`Updating project ${id} with data:`, updateData);
      const response = await apiClient.post('/api/projects', JSON.stringify(updateData), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Update project response:', response.data);
      
      // Process the response
      const result = extractResponseData(response.data);
      
      if (result.status === 'success') {
        return true;
      } else if (result.id) {
        // Some backends might just return the ID without a status
        return true;
      } else {
        throw new Error(result.message || 'Failed to update project');
      }
    } catch (error: unknown) {
      console.error(`Error updating project with ID ${id}:`, error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Error response:', axiosError.response?.data);
      }
      throw new Error('No se pudo actualizar el proyecto');
    }
  },

  async deleteProject(id: number): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/api/projects/${id}`);
      console.log(`Delete project ${id} response:`, response.data);
      
      // Process the response
      const data = extractResponseData(response.data);
      
      if (data.status === 'success') {
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete project');
      }
    } catch (error: unknown) {
      console.error(`Error deleting project with ID ${id}:`, error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Error response:', axiosError.response?.data);
      }
      throw new Error('No se pudo eliminar el proyecto');
    }
  },

  /**
   * Create a new milestone for a project
   */
  async createMilestone(data: {
    name: string;
    project_id: number;
    planned_date?: string;
    actual_date?: string;
    amount: number;
    is_completed?: boolean;
    weight?: number;
    notes?: string;
  }): Promise<number> {
    try {
      const response = await apiClient.post('/api/milestones', data);
      
      if (response.data.status === 'success') {
        return response.data.id;
      } else {
        throw new Error(response.data.message || 'Failed to create milestone');
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw new Error('No se pudo crear el hito');
    }
  },

  /**
   * Update a milestone
   */
  async updateMilestone(id: number, data: Partial<{
    name: string;
    project_id: number;
    planned_date?: string;
    actual_date?: string;
    amount: number;
    is_completed?: boolean;
    weight?: number;
    notes?: string;
  }>): Promise<boolean> {
    try {
      const updateData = {
        id,
        ...data
      };
      
      const response = await apiClient.post('/api/milestones', updateData);
      
      if (response.data.status === 'success') {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update milestone');
      }
    } catch (error) {
      console.error(`Error updating milestone with ID ${id}:`, error);
      throw new Error('No se pudo actualizar el hito');
    }
  },

  /**
   * Create a new cash flow line
   */
  async createCashFlowLine(data: {
    name: string;
    project_id: number;
    type: 'income' | 'expense';
    category_id: number;
    planned_date?: string;
    actual_date?: string;
    amount: number;
    state?: string;
    partner_id?: number;
    notes?: string;
  }): Promise<number> {
    try {
      const response = await apiClient.post('/api/cashflow/lines', data);
      
      if (response.data.status === 'success') {
        return response.data.id;
      } else {
        throw new Error(response.data.message || 'Failed to create cash flow line');
      }
    } catch (error) {
      console.error('Error creating cash flow line:', error);
      throw new Error('No se pudo crear el registro de flujo de caja');
    }
  },

  /**
   * Update a cash flow line
   */
  async updateCashFlowLine(id: number, data: Partial<{
    name: string;
    project_id: number;
    type: 'income' | 'expense';
    category_id: number;
    planned_date?: string;
    actual_date?: string;
    amount: number;
    state?: string;
    partner_id?: number;
    notes?: string;
  }>): Promise<boolean> {
    try {
      const updateData = {
        id,
        ...data
      };
      
      const response = await apiClient.post('/api/cashflow/lines', updateData);
      
      if (response.data.status === 'success') {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update cash flow line');
      }
    } catch (error) {
      console.error(`Error updating cash flow line with ID ${id}:`, error);
      throw new Error('No se pudo actualizar el registro de flujo de caja');
    }
  },

  /**
   * Delete a cash flow line
   */
  async deleteCashFlowLine(id: number): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/api/cashflow/lines/${id}`);
      
      if (response.data.status === 'success') {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete cash flow line');
      }
    } catch (error) {
      console.error(`Error deleting cash flow line with ID ${id}:`, error);
      throw new Error('No se pudo eliminar el registro de flujo de caja');
    }
  },

  /**
   * Get cash flow categories
   */
  async getCashFlowCategories(type?: 'income' | 'expense'): Promise<{ id: number; name: string; type: string; parent_id: number | null }[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (type) {
        params.append('type', type);
      }

      const response = await apiClient.get(`/api/cashflow/categories${params.toString() ? '?' + params.toString() : ''}`);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching cash flow categories:', error);
      throw new Error('No se pudieron cargar las categorías');
    }
  }
};

// Add a request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Get current session from auth service
    const session = authService.getSession();
    
    if (session?.sessionId) {
      // Don't manually set Cookie header as browsers block this
      // The withCredentials: true option will ensure cookies are sent automatically
      
      // If your server supports token-based auth, you could use something like:
      // config.headers['X-Session-Token'] = session.sessionId.replace('session_id=', '');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Automatically logout on authentication errors
      authService.logout();
      // Redirect to login page
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

export default projectApiService;