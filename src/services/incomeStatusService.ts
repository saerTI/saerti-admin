// src/services/incomeStatusService.ts
import apiService from './apiService';

export interface IncomeStatus {
  id?: number;
  income_type_id?: number;
  organization_id?: string;
  name: string;
  description: string;
  color: string;
  is_final: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const BASE_URL = ''; // apiService already adds /api prefix

export const incomeStatusService = {
  async getByType(typeId: number): Promise<IncomeStatus[]> {
    const response = await apiService.get(`${BASE_URL}/income-types/${typeId}/statuses`);
    return response.data;
  },

  async create(typeId: number, data: Partial<IncomeStatus>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/income-types/${typeId}/statuses`, data);
    return response.data;
  },

  async update(id: number, data: Partial<IncomeStatus>): Promise<void> {
    await apiService.put(`${BASE_URL}/income-statuses/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/income-statuses/${id}`);
  },
};

export default incomeStatusService;
