// src/services/costCenterService.ts

import { api } from './apiService';

export interface CostCenter {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

/**
 * Get all active cost centers
 */
export const getCostCenters = async (): Promise<CostCenter[]> => {
  try {
    const response = await api.get<{ success: boolean; data: CostCenter[] }>('/cost-centers');
    return response.data;
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    throw error;
  }
};

/**
 * Get cost center by ID
 */
export const getCostCenterById = async (id: number): Promise<CostCenter> => {
  try {
    const response = await api.get<{ success: boolean; data: CostCenter }>(`/cost-centers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cost center:', error);
    throw error;
  }
};

/**
 * Create a new cost center
 */
export const createCostCenter = async (data: Omit<CostCenter, 'id'>): Promise<CostCenter> => {
  try {
    const response = await api.post<{ success: boolean; data: CostCenter }>('/cost-centers', data);
    return response.data;
  } catch (error) {
    console.error('Error creating cost center:', error);
    throw error;
  }
};

/**
 * Update an existing cost center
 */
export const updateCostCenter = async (id: number, data: Omit<CostCenter, 'id'>): Promise<CostCenter> => {
  try {
    const response = await api.put<{ success: boolean; data: CostCenter }>(`/cost-centers/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating cost center:', error);
    throw error;
  }
};

/**
 * Delete a cost center
 */
export const deleteCostCenter = async (id: number): Promise<void> => {
  try {
    await api.delete(`/cost-centers/${id}`);
  } catch (error) {
    console.error('Error deleting cost center:', error);
    throw error;
  }
};
