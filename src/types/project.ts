// src/types/project.ts

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  code?: string;
  clientId: number;
  client?: {
    name: string;
    id: number;
  };
  budget: number;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  members: { id: number; name: string }[];
  tasks: { id: number; name: string; status: string }[];
  milestones: { id: number; name: string; dueDate: string; completed: boolean }[];
}

export interface ProjectFilter {
  status?: string;
  clientId?: number;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  search?: string;
}

export interface ProjectCreateData {
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  budget: number;
  clientId: number;
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