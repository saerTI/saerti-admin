// src/services/expenseCategoryService.ts
import apiService from './apiService';

export interface ExpenseCategory {
  id?: number;
  expense_type_id?: number;
  organization_id?: string;
  name: string;
  description: string;
  color: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const BASE_URL = ''; // apiService already adds /api prefix

export const expenseCategoryService = {
  async getByType(typeId: number): Promise<ExpenseCategory[]> {
    const response = await apiService.get(`${BASE_URL}/expense-types/${typeId}/categories`);
    return response.data;
  },

  async create(typeId: number, data: Partial<ExpenseCategory>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/expense-types/${typeId}/categories`, data);
    return response.data;
  },

  async update(id: number, data: Partial<ExpenseCategory>): Promise<void> {
    await apiService.put(`${BASE_URL}/expense-categories/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/expense-categories/${id}`);
  },
};

export default expenseCategoryService;
