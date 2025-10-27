// src/services/incomeTypeService.ts
import apiService from './apiService';
import type {
  IncomeType,
  IncomeCategory,
  IncomeStatus,
  VisibleFields
} from '../types/income';

const BASE_URL = ''; // apiService already adds /api prefix

// ============================================
// INCOME TYPES
// ============================================

export const incomeTypeService = {
  async getAll(onlyActive = true): Promise<IncomeType[]> {
    const response = await apiService.get(`${BASE_URL}/income-types`, {
      params: { only_active: onlyActive }
    });
    return response.data;
  },

  async getById(id: number): Promise<IncomeType> {
    const response = await apiService.get(`${BASE_URL}/income-types/${id}`);
    return response.data;
  },

  async getFields(id: number): Promise<VisibleFields> {
    const response = await apiService.get(`${BASE_URL}/income-types/${id}/fields`);
    return response.data;
  },

  async create(data: Partial<IncomeType>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/income-types`, data);
    return response.data;
  },

  async update(id: number, data: Partial<IncomeType>): Promise<void> {
    await apiService.put(`${BASE_URL}/income-types/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/income-types/${id}`);
  },

  // Categories
  async getCategories(typeId: number, onlyActive = true): Promise<IncomeCategory[]> {
    const response = await apiService.get(`${BASE_URL}/income-types/${typeId}/categories`, {
      params: { only_active: onlyActive }
    });
    return response.data;
  },

  async createCategory(typeId: number, data: Partial<IncomeCategory>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/income-types/${typeId}/categories`, data);
    return response.data;
  },

  async updateCategory(id: number, data: Partial<IncomeCategory>): Promise<void> {
    await apiService.put(`${BASE_URL}/income-categories/${id}`, data);
  },

  async deleteCategory(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/income-categories/${id}`);
  },

  // Statuses
  async getStatuses(typeId: number, onlyActive = true): Promise<IncomeStatus[]> {
    const response = await apiService.get(`${BASE_URL}/income-types/${typeId}/statuses`, {
      params: { only_active: onlyActive }
    });
    return response.data;
  },

  async createStatus(typeId: number, data: Partial<IncomeStatus>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/income-types/${typeId}/statuses`, data);
    return response.data;
  },

  async updateStatus(id: number, data: Partial<IncomeStatus>): Promise<void> {
    await apiService.put(`${BASE_URL}/income-statuses/${id}`, data);
  },

  async deleteStatus(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/income-statuses/${id}`);
  }
};

export default incomeTypeService;
