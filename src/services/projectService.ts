// src/services/projectService.ts
import api from './apiService';
import { Project, ProjectDetail, ProjectFilter, ProjectCreateData, ProjectsResponse } from '../types/project';

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
    return await api.get<ProjectDetail>(`/projects/${id}`);
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw new Error('Failed to fetch project details');
  }
};

// Create new project
export const createProject = async (data: ProjectCreateData): Promise<number> => {
  try {
    const response = await api.post<{ id: number }>('/projects', data);
    return response.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
};

// Update project
export const updateProject = async (id: number, data: Partial<ProjectCreateData>): Promise<boolean> => {
  try {
    await api.put(`/projects/${id}`, data);
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
    return true;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw new Error('Failed to delete project');
  }
};

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};