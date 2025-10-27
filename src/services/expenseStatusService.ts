// src/services/expenseStatusService.ts
import apiService from './apiService';

export interface ExpenseStatus {
  id?: number;
  expense_type_id?: number;
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

export const expenseStatusService = {
  async getByType(typeId: number): Promise<ExpenseStatus[]> {
    const response = await apiService.get(`${BASE_URL}/expense-types/${typeId}/statuses`);
    return response.data;
  },

  async create(typeId: number, data: Partial<ExpenseStatus>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/expense-types/${typeId}/statuses`, data);
    return response.data;
  },

  async update(id: number, data: Partial<ExpenseStatus>): Promise<void> {
    await apiService.put(`${BASE_URL}/expense-statuses/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/expense-statuses/${id}`);
  },
};

export default expenseStatusService;
