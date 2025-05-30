// src/types/project.ts

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string; // Mantenemos status como estaba
  state: string; // Añadido para solucionar el error de los PROJECT_STATUS_MAP
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  code: string;
  clientId: number;
  client: {
    id: number;
    name: string;
  };
  totalBudget: number;
  budget: number; // Mantenemos budget como estaba
  progress: number;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: number;
  name: string;
  plannedDate: string;
  actualDate?: string;
  isCompleted: boolean;
  amount: number;
  notes?: string;
}

export interface CashFlowCategory {
  id: number;
  name: string;
}

export interface CashFlowLine {
  id: number;
  name: string;
  category: CashFlowCategory;
  plannedDate: string;
  actualDate?: string;
  amount: number;
  state: 'forecast' | 'actual' | 'realized'; // Añadido 'realized' para compatibilidad
  notes?: string;
}

export interface CashFlow {
  income: CashFlowLine[];
  expense: CashFlowLine[];
}

export interface ProjectDetail extends Project {
  milestones: Milestone[];
  cashFlow: CashFlow;
}

export interface ProjectFilter {
  status?: string;
  clientId?: number;
  startDateFrom?: string;
  startDateTo?: string;
  search?: string;
}

// Actualizado para incluir tanto budget como totalBudget
export interface ProjectCreateData {
  name: string;
  description?: string;
  status: string;
  startDate: string;
  expectedEndDate?: string;
  budget?: number; // Opcional para compatibilidad
  totalBudget: number; // Para compatibilidad con ProjectForm
  clientId: number;
  code: string;
}

export interface ProjectsResponse {
  success: boolean;
  data: Project[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MilestoneUpdateData {
  name?: string;
  plannedDate?: string;
  actualDate?: string;
  isCompleted?: boolean;
  amount?: number;
  notes?: string;
}

export interface CashFlowLineCreateData {
  name: string;
  categoryId: number;
  plannedDate: string;
  actualDate?: string;
  amount: number;
  state: 'forecast' | 'actual' | 'realized';
  notes?: string;
}

export interface CodeAvailabilityResponse {
  available: boolean;
  message?: string;
}