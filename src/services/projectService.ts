// src/services/projectService.ts - SIN MAPEOS, TODO EN ESPAÑOL
import api from './apiService';
import { 
  Project, 
  ProjectDetail, 
  ProjectFilter, 
  ProjectCreateData, 
  ProjectsResponse,
  Milestone,
  MilestoneUpdateData,
  CashFlowLineCreateData,
  CashFlowLine,
  CashFlow,
  CodeAvailabilityResponse
} from '../types/project';
import { removeFromApiCache } from '../hooks/useApi';

// Get projects with optional filters
export const getProjects = async (filters: ProjectFilter = {}): Promise<Project[]> => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/projects${queryString ? `?${queryString}` : ''}`;

    const res = await api.get<ProjectsResponse>(endpoint);
    return res.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
};

// Get project by ID
export const getProjectById = async (id: number): Promise<ProjectDetail> => {
  try {
    const response = await api.get<{success: boolean, data: ProjectDetail}>(`/api/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw new Error('Failed to fetch project details');
  }
};

// Create new project - ✅ SIN MAPEO, valores directos en español
export const createProject = async (data: ProjectCreateData): Promise<number> => {
  try {
    const backendData = {
      ...data,
      budget: data.budget || data.totalBudget,
    };

    console.log('📤 Creating project with status:', data.status);
    console.log('📤 Full data being sent:', JSON.stringify(backendData, null, 2));

    const response = await api.post<{success: boolean, data: {id: number}}>(`/api/projects`, backendData);
    
    // Invalidar cualquier caché de lista de proyectos
    removeFromApiCache(/projects-list/);
    
    return response.data.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
};

// Update project
export const updateProject = async (id: number, data: Partial<ProjectCreateData>): Promise<boolean> => {
  try {
    const backendData: any = { ...data };
    if (data.totalBudget !== undefined && !data.budget) {
      backendData.budget = data.totalBudget;
    }

    await api.put(`/api/projects/${id}`, backendData);
    
    // Invalidar cachés relacionadas con este proyecto
    removeFromApiCache(`project-detail-${id}`);
    removeFromApiCache(/projects-list/);
    
    return true;
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    throw new Error('Failed to update project');
  }
};

// Delete project
export const deleteProject = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/api/projects/${id}`);
    
    // Invalidar cachés relacionadas con este proyecto
    removeFromApiCache(`project-detail-${id}`);
    removeFromApiCache(/projects-list/);
    
    return true;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw new Error('Failed to delete project');
  }
};

// Update project status - ✅ SIN MAPEO
export const updateProjectStatus = async (id: number, status: string): Promise<boolean> => {
  try {
    console.log('📤 Updating status to:', status);
    
    await api.put(`/api/projects/${id}/status`, { status });
    
    // Invalidar cachés relacionadas con este proyecto
    removeFromApiCache(`project-detail-${id}`);
    removeFromApiCache(/projects-list/);
    
    return true;
  } catch (error) {
    console.error(`Error updating project status ${id}:`, error);
    throw new Error('Failed to update project status');
  }
};

// Función para verificar disponibilidad de código de proyecto
export const checkCodeAvailability = async (code: string): Promise<CodeAvailabilityResponse> => {
  try {
    const response = await api.get<CodeAvailabilityResponse>(`/api/projects/check-code/${code}`);
    return response;
  } catch (error) {
    console.error(`Error checking code availability:`, error);
    throw new Error('Failed to check code availability');
  }
};

// ===== MILESTONES =====

// Get milestones for a project
export const getProjectMilestones = async (projectId: number): Promise<Milestone[]> => {
  try {
    const response = await api.get<{success: boolean, data: Milestone[]}>(`/api/projects/${projectId}/milestones`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching milestones for project ${projectId}:`, error);
    throw new Error('Failed to fetch milestones');
  }
};

// Create milestone
export const createMilestone = async (projectId: number, data: Omit<Milestone, 'id'>): Promise<number> => {
  try {
    const response = await api.post<{success: boolean, data: {id: number}}>(`/api/projects/${projectId}/milestones`, data);
    
    // Invalidar cachés relacionadas con este proyecto
    removeFromApiCache(`project-detail-${projectId}`);
    
    return response.data.id;
  } catch (error) {
    console.error(`Error creating milestone for project ${projectId}:`, error);
    throw new Error('Failed to create milestone');
  }
};

// Update milestone
export const updateMilestone = async (id: number, data: MilestoneUpdateData): Promise<boolean> => {
  try {
    await api.put(`/api/milestones/${id}`, data);
    
    // Como no tenemos el projectId en este contexto, invalidamos el cache por patrón
    removeFromApiCache(/project-detail/);
    
    return true;
  } catch (error) {
    console.error(`Error updating milestone ${id}:`, error);
    throw new Error('Failed to update milestone');
  }
};

// Delete milestone
export const deleteMilestone = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/api/milestones/${id}`);
    
    // Como no tenemos el projectId en este contexto, invalidamos el cache por patrón
    removeFromApiCache(/project-detail/);
    
    return true;
  } catch (error) {
    console.error(`Error deleting milestone ${id}:`, error);
    throw new Error('Failed to delete milestone');
  }
};

// ===== CASH FLOW =====

// Create cash flow line (income or expense)
export const createCashFlowLine = async (
  projectId: number,
  type: 'income' | 'expense', 
  data: CashFlowLineCreateData
): Promise<number> => {
  try {
    const response = await api.post<{success: boolean, data: {id: number}}>(`/api/projects/${projectId}/cashflow/${type}`, data);
    
    // Invalidar cachés relacionadas con este proyecto
    removeFromApiCache(`project-detail-${projectId}`);
    
    return response.data.id;
  } catch (error) {
    console.error(`Error creating ${type} for project ${projectId}:`, error);
    throw new Error(`Failed to create ${type} record`);
  }
};

// Update cash flow line
export const updateCashFlowLine = async (
  lineId: number, 
  type: 'income' | 'expense',
  data: Partial<CashFlowLineCreateData>
): Promise<boolean> => {
  try {
    await api.put(`/api/cashflow/${type}/${lineId}`, data);
    
    // Como no tenemos el projectId en este contexto, invalidamos el cache por patrón
    removeFromApiCache(/project-detail/);
    
    return true;
  } catch (error) {
    console.error(`Error updating ${type} ${lineId}:`, error);
    throw new Error(`Failed to update ${type} record`);
  }
};

// Delete cash flow line
export const deleteCashFlowLine = async (lineId: number): Promise<boolean> => {
  try {
    await api.delete(`/api/cashflow/${lineId}`);
    
    // Como no tenemos el projectId en este contexto, invalidamos el cache por patrón
    removeFromApiCache(/project-detail/);
    
    return true;
  } catch (error) {
    console.error(`Error deleting cash flow line ${lineId}:`, error);
    throw new Error('Failed to delete cash flow record');
  }
};

// Exportamos todo para uso individual
export { 
  type Project,
  type ProjectDetail,
  type Milestone,
  type CashFlowLine,
  type CashFlow,
  type ProjectFilter,
  type ProjectCreateData,
  type MilestoneUpdateData,
  type CashFlowLineCreateData,
  type CodeAvailabilityResponse
};

// Exportamos como objeto por defecto
export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  checkCodeAvailability,
  getProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  createCashFlowLine,
  updateCashFlowLine,
  deleteCashFlowLine
};