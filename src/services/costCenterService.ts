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
    const response = await api.get<CostCenter[]>('/cost-centers');
    return response;
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
    const response = await api.get<CostCenter>(`/cost-centers/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching cost center:', error);
    throw error;
  }
};
