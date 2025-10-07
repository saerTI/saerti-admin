// src/services/projectService.ts - Actualizado con costos multidimensionales
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

// ==========================================
// IMPORTAR SERVICIOS DE COSTOS MULTIDIMENSIONALES
// ==========================================
import multidimensionalCostsService, {
  CostFilter,
  MultidimensionalCost,
  CostsSummary,
  CostsDimensions,
  PaginatedCostsResponse
} from './multidimensionalCostsService';

import { factoringService } from './factoringService';

// ==========================================
// FUNCIONES EXISTENTES (mantener igual)
// ==========================================

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
    const endpoint = `/projects${queryString ? `?${queryString}` : ''}`;

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
    const response = await api.get<{success: boolean, data: ProjectDetail}>(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw new Error('Failed to fetch project details');
  }
};

// Create new project
export const createProject = async (data: ProjectCreateData): Promise<number> => {
  try {
    const backendData = {
      ...data,
      budget: data.budget || data.totalBudget,
    };

    // Format dates to YYYY-MM-DD format
    if (backendData.startDate) {
      backendData.startDate = new Date(backendData.startDate).toISOString().split('T')[0];
    }
    if (backendData.expectedEndDate) {
      backendData.expectedEndDate = new Date(backendData.expectedEndDate).toISOString().split('T')[0];
    }

    console.log('📤 Creating project with status:', data.status);
    console.log('📤 Full data being sent:', JSON.stringify(backendData, null, 2));

    const response = await api.post<{success: boolean, data: {id: number}}>(`/projects`, backendData);
    
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
    if (data.totalBudget !== undefined) {
      backendData.budget = data.totalBudget;
      delete backendData.totalBudget;  // Remove duplicate field
    }

    // Format dates to YYYY-MM-DD format
    if (backendData.startDate) {
      backendData.startDate = new Date(backendData.startDate).toISOString().split('T')[0];
    }
    if (backendData.expectedEndDate) {
      backendData.expectedEndDate = new Date(backendData.expectedEndDate).toISOString().split('T')[0];
    }

    await api.put(`/projects/${id}`, backendData);
    
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
    await api.delete(`/projects/${id}`);
    
    // Invalidar cachés relacionadas con este proyecto
    removeFromApiCache(`project-detail-${id}`);
    removeFromApiCache(/projects-list/);
    
    return true;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw new Error('Failed to delete project');
  }
};

// Update project status
export const updateProjectStatus = async (id: number, status: string): Promise<boolean> => {
  try {
    console.log('📤 Updating status to:', status);
    
    await api.put(`/projects/${id}/status`, { status });
    
    // Invalidar cachés relacionadas con este proyecto
    removeFromApiCache(`project-detail-${id}`);
    removeFromApiCache(/projects-list/);
    
    return true;
  } catch (error) {
    console.error(`Error updating project status ${id}:`, error);
    throw new Error('Failed to update project status');
  }
};

// Check code availability
export const checkCodeAvailability = async (code: string): Promise<CodeAvailabilityResponse> => {
  try {
    const response = await api.get<CodeAvailabilityResponse>(`/projects/check-code/${code}`);
    return response;
  } catch (error) {
    console.error(`Error checking code availability:`, error);
    throw new Error('Failed to check code availability');
  }
};

// ==========================================
// FUNCIONES DE MILESTONES (mantener igual)
// ==========================================

export const getProjectMilestones = async (projectId: number): Promise<Milestone[]> => {
  try {
    const response = await api.get<{success: boolean, data: Milestone[]}>(`/projects/${projectId}/milestones`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching milestones for project ${projectId}:`, error);
    throw new Error('Failed to fetch milestones');
  }
};

export const createMilestone = async (projectId: number, data: Omit<Milestone, 'id'>): Promise<number> => {
  try {
    const response = await api.post<{success: boolean, data: {id: number}}>(`/projects/${projectId}/milestones`, data);
    removeFromApiCache(`project-detail-${projectId}`);
    return response.data.id;
  } catch (error) {
    console.error(`Error creating milestone for project ${projectId}:`, error);
    throw new Error('Failed to create milestone');
  }
};

export const updateMilestone = async (id: number, data: MilestoneUpdateData): Promise<boolean> => {
  try {
    await api.put(`/milestones/${id}`, data);
    removeFromApiCache(/project-detail/);
    return true;
  } catch (error) {
    console.error(`Error updating milestone ${id}:`, error);
    throw new Error('Failed to update milestone');
  }
};

export const deleteMilestone = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/milestones/${id}`);
    removeFromApiCache(/project-detail/);
    return true;
  } catch (error) {
    console.error(`Error deleting milestone ${id}:`, error);
    throw new Error('Failed to delete milestone');
  }
};

// ==========================================
// FUNCIONES DE CASH FLOW (mantener igual)
// ==========================================

export const createCashFlowLine = async (
  projectId: number,
  type: 'income' | 'expense', 
  data: CashFlowLineCreateData
): Promise<number> => {
  try {
    const response = await api.post<{success: boolean, data: {id: number}}>(`/projects/${projectId}/cashflow/${type}`, data);
    removeFromApiCache(`project-detail-${projectId}`);
    return response.data.id;
  } catch (error) {
    console.error(`Error creating ${type} for project ${projectId}:`, error);
    throw new Error(`Failed to create ${type} record`);
  }
};

export const updateCashFlowLine = async (
  lineId: number, 
  type: 'income' | 'expense',
  data: Partial<CashFlowLineCreateData>
): Promise<boolean> => {
  try {
    await api.put(`/cashflow/${type}/${lineId}`, data);
    removeFromApiCache(/project-detail/);
    return true;
  } catch (error) {
    console.error(`Error updating ${type} ${lineId}:`, error);
    throw new Error(`Failed to update ${type} record`);
  }
};

export const deleteCashFlowLine = async (lineId: number): Promise<boolean> => {
  try {
    await api.delete(`/cashflow/${lineId}`);
    removeFromApiCache(/project-detail/);
    return true;
  } catch (error) {
    console.error(`Error deleting cash flow line ${lineId}:`, error);
    throw new Error('Failed to delete cash flow record');
  }
};

// ==========================================
// NUEVAS FUNCIONES DE COSTOS MULTIDIMENSIONALES
// ==========================================

/**
 * Obtiene costos multidimensionales de un proyecto
 */
export const getProjectCosts = async (projectId: number, filters: CostFilter = {}): Promise<MultidimensionalCost[]> => {
  try {
    return await multidimensionalCostsService.getProjectCosts(projectId, filters);
  } catch (error) {
    console.error(`Error fetching costs for project ${projectId}:`, error);
    throw new Error('Failed to fetch project costs');
  }
};

/**
 * Obtiene resumen de costos de un proyecto
 */
export const getProjectCostsSummary = async (projectId: number): Promise<CostsSummary> => {
  try {
    return await multidimensionalCostsService.getProjectCostsSummary(projectId);
  } catch (error) {
    console.error(`Error fetching costs summary for project ${projectId}:`, error);
    throw new Error('Failed to fetch project costs summary');
  }
};

/**
 * Obtiene dimensiones de costos para un proyecto (para filtros)
 */
export const getProjectCostsDimensions = async (projectId: number): Promise<CostsDimensions> => {
  try {
    return await multidimensionalCostsService.getCostsDimensions({ cost_center_id: projectId });
  } catch (error) {
    console.error(`Error fetching costs dimensions for project ${projectId}:`, error);
    throw new Error('Failed to fetch project costs dimensions');
  }
};

/**
 * Explora costos del proyecto con filtros específicos
 */
export const exploreProjectCosts = async (projectId: number, filters: CostFilter = {}) => {
  try {
    const projectFilters = {
      ...filters,
      cost_center_id: projectId
    };
    
    return await multidimensionalCostsService.exploreCosts(projectFilters);
  } catch (error) {
    console.error(`Error exploring costs for project ${projectId}:`, error);
    throw new Error('Failed to explore project costs');
  }
};

export const getProjectCostsSpecific = async (projectId: number, filters: CostFilter = {}): Promise<PaginatedCostsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Agregar filtros a los query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/projects/${projectId}/costs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<PaginatedCostsResponse>(endpoint);
    
    return response;
  } catch (error) {
    console.error(`Error obteniendo costos específicos del proyecto ${projectId}:`, error);
    throw new Error('Error al obtener costos específicos del proyecto');
  }
};

/**
 * Obtiene dimensiones de costos específicas del proyecto
 */
export const getProjectCostsDimensionsSpecific = async (projectId: number): Promise<CostsDimensions> => {
  try {
    const response = await api.get<{ success: boolean; data: CostsDimensions }>(`/projects/${projectId}/costs/dimensions`);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo dimensiones de costos del proyecto ${projectId}:`, error);
    throw new Error('Error al obtener dimensiones de costos del proyecto');
  }
};

/**
 * Obtiene análisis detallado de costos del proyecto
 */
export const getProjectCostsAnalysis = async (projectId: number) => {
  try {
    const response = await api.get<any>(`/projects/${projectId}/costs/analysis`);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo análisis de costos del proyecto ${projectId}:`, error);
    throw new Error('Error al obtener análisis de costos del proyecto');
  }
};

/**
 * Obtiene resumen ejecutivo de costos del proyecto
 */
export const getProjectCostsSummarySpecific = async (projectId: number): Promise<any> => {
  try {
    const response = await api.get<{ success: boolean; data: any }>(`/projects/${projectId}/costs/summary`);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo resumen de costos del proyecto ${projectId}:`, error);
    throw new Error('Error al obtener resumen de costos del proyecto');
  }
};

// ==========================================
// FUNCIONES AUXILIARES PARA UI
// ==========================================

/**
 * Obtiene costos y resumen de un proyecto para mostrar en UI
 */
export const getProjectCostsForUI = async (projectId: number, filters: CostFilter = {}) => {
  try {
    // Obtener costos y resumen en paralelo
    const [costsResponse, summary] = await Promise.all([
      getProjectCostsSpecific(projectId, { ...filters, limit: 50 }),
      getProjectCostsSummarySpecific(projectId)
    ]);
    
    return {
      costs: costsResponse.data,
      pagination: costsResponse.pagination,
      summary: summary.summary,
      project_info: summary.project_info,
      by_category: summary.by_category,
      by_period: summary.by_period,
      recent_costs: summary.recent_costs
    };
  } catch (error) {
    console.error(`Error obteniendo datos de costos para UI del proyecto ${projectId}:`, error);
    throw new Error('Error al obtener datos de costos para la interfaz');
  }
};

/**
 * Obtiene dimensiones y filtros disponibles para un proyecto
 */
export const getProjectFiltersData = async (projectId: number) => {
  try {
    const dimensions = await getProjectCostsDimensionsSpecific(projectId);

    // Transformar dimensiones a formato para filtros UI
    return {
      categories: dimensions.categories.map(cat => ({
        value: cat.id,
        label: cat.name,
        group: cat.group_name,
        cost_count: cat.cost_count
      })),
      suppliers: dimensions.suppliers.map(sup => ({
        value: sup.id,
        label: sup.name,
        cost_count: sup.cost_count
      })),
      employees: dimensions.employees.map(emp => ({
        value: emp.id,
        label: emp.name,
        position: emp.position,
        cost_count: emp.cost_count
      })),
      periods: dimensions.periods.map(per => ({
        value: per.period_key,
        label: `${per.period_key} (${per.cost_count} registros)`,
        year: per.period_year,
        month: per.period_month
      })),
      source_types: dimensions.source_types.map(src => ({
        value: src.source_type,
        label: src.source_type,
        cost_count: src.cost_count
      }))
    };
  } catch (error) {
    console.error(`Error obteniendo datos de filtros del proyecto ${projectId}:`, error);
    throw new Error('Error al obtener datos de filtros');
  }
};

/**
 * Calcula el progreso de un proyecto basado en Factoring / Presupuesto
 */
export const calculateProjectProgress = async (projectId: number, budget: number): Promise<number> => {
  try {
    // Obtener el total de factoring para este centro de costo
    const factoringTotal = await factoringService.getFactoringTotalAmounts({
      cost_center_id: projectId
    });

    // Si no hay presupuesto, retorna 0
    if (!budget || budget <= 0) {
      return 0;
    }

    // Calcular progreso como (Total Factoring / Presupuesto) * 100
    const progress = (factoringTotal.total_amount / budget) * 100;

    // Limitar entre 0 y 100
    return Math.min(Math.max(progress, 0), 100);
  } catch (error) {
    console.error(`Error calculando progreso del proyecto ${projectId}:`, error);
    return 0; // En caso de error, retorna 0
  }
};

/**
 * Obtiene proyectos con progreso calculado basado en Factoring
 */
export const getProjectsWithProgress = async (filters: ProjectFilter = {}): Promise<Project[]> => {
  try {
    const projects = await getProjects(filters);

    // Calcular progreso para cada proyecto
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const progress = await calculateProjectProgress(project.id, project.budget || project.totalBudget);
        return {
          ...project,
          progress
        };
      })
    );

    return projectsWithProgress;
  } catch (error) {
    console.error('Error obteniendo proyectos con progreso:', error);
    throw new Error('Failed to fetch projects with progress');
  }
};

// ==========================================
// EXPORTS
// ==========================================

// Export types (incluyendo los nuevos tipos de costos)
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
  type CodeAvailabilityResponse,
  // Export new cost-related types
  type CostFilter,
  type MultidimensionalCost,
  type CostsSummary,
  type CostsDimensions
};

// Export default object (incluyendo las nuevas funciones)
export default {
  // Existing functions
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
  deleteCashFlowLine,

  // New multidimensional costs functions
  getProjectCosts,
  getProjectCostsSummary,
  getProjectCostsDimensions,
  exploreProjectCosts,

  // Funciones auxiliares para UI
  getProjectCostsForUI,
  getProjectFiltersData,

  // Progress calculation functions
  calculateProjectProgress,
  getProjectsWithProgress
};