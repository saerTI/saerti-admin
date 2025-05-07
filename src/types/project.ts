// src/types/project.ts

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string; // Mantenemos status como estaba
  state: string; // Añadido para solucionar el error de los PROJECT_STATUS_MAP
  start_date: string;
  expected_end_date?: string;
  actual_end_date?: string;
  code: string;
  client_id: number;
  client: {
    id: number;
    name: string;
  };
  total_budget: number;
  budget: number; // Mantenemos budget como estaba
  progress: number;
  balance: number;
  total_income: number;
  total_expense: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: number;
  name: string;
  planned_date: string;
  actual_date?: string;
  is_completed: boolean;
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
  planned_date: string;
  actual_date?: string;
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
  cash_flow: CashFlow;
}

export interface ProjectFilter {
  status?: string;
  client_id?: number;
  start_date_from?: string;
  start_date_to?: string;
  search?: string;
}

// Actualizado para incluir tanto budget como total_budget
export interface ProjectCreateData {
  name: string;
  description?: string;
  status: string;
  start_date: string;
  expected_end_date?: string;
  budget?: number; // Opcional para compatibilidad
  total_budget: number; // Para compatibilidad con ProjectForm
  client_id: number;
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
  planned_date?: string;
  actual_date?: string;
  is_completed?: boolean;
  amount?: number;
  notes?: string;
}

export interface CashFlowLineCreateData {
  name: string;
  category_id: number;
  planned_date: string;
  actual_date?: string;
  amount: number;
  state: 'forecast' | 'actual' | 'realized';
  notes?: string;
}

export interface CodeAvailabilityResponse {
  available: boolean;
  message?: string;
}