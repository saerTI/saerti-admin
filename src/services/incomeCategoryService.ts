// src/services/incomeCategoryService.ts
import apiService from './apiService';

export interface IncomeCategory {
  id?: number;
  income_type_id?: number;
  organization_id?: string;
  name: string;
  description: string;
  color: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const BASE_URL = ''; // apiService already adds /api prefix

export const incomeCategoryService = {
  async getByType(typeId: number): Promise<IncomeCategory[]> {
    const response = await apiService.get(`${BASE_URL}/income-types/${typeId}/categories`);
    return response.data;
  },

  async create(typeId: number, data: Partial<IncomeCategory>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/income-types/${typeId}/categories`, data);
    return response.data;
  },

  async update(id: number, data: Partial<IncomeCategory>): Promise<void> {
    await apiService.put(`${BASE_URL}/income-categories/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/income-categories/${id}`);
  },
};

export default incomeCategoryService;
