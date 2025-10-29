// src/services/expenseTypeService.ts
import apiService from './apiService';
import type {
  ExpenseType,
  ExpenseCategory,
  ExpenseStatus,
  VisibleFields
} from '../types/expense';

const BASE_URL = ''; // apiService already adds /api prefix

// ============================================
// EXPENSE TYPES
// ============================================

export const expenseTypeService = {
  async getAll(onlyActive = true): Promise<ExpenseType[]> {
    const response = await apiService.get(`${BASE_URL}/expense-types`, {
      params: { only_active: onlyActive }
    });
    return response.data;
  },

  async getById(id: number): Promise<ExpenseType> {
    const response = await apiService.get(`${BASE_URL}/expense-types/${id}`);
    return response.data;
  },

  async getFields(id: number): Promise<VisibleFields> {
    const response = await apiService.get(`${BASE_URL}/expense-types/${id}/fields`);
    return response.data;
  },

  async create(data: Partial<ExpenseType>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/expense-types`, data);
    return response.data;
  },

  async update(id: number, data: Partial<ExpenseType>): Promise<void> {
    await apiService.put(`${BASE_URL}/expense-types/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/expense-types/${id}`);
  },

  // Categories
  async getCategories(typeId: number, onlyActive = true): Promise<ExpenseCategory[]> {
    const response = await apiService.get(`${BASE_URL}/expense-types/${typeId}/categories`, {
      params: { only_active: onlyActive }
    });
    return response.data;
  },

  async createCategory(typeId: number, data: Partial<ExpenseCategory>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/expense-types/${typeId}/categories`, data);
    return response.data;
  },

  async updateCategory(id: number, data: Partial<ExpenseCategory>): Promise<void> {
    await apiService.put(`${BASE_URL}/expense-categories/${id}`, data);
  },

  async deleteCategory(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/expense-categories/${id}`);
  },

  // Statuses
  async getStatuses(typeId: number, onlyActive = true): Promise<ExpenseStatus[]> {
    const response = await apiService.get(`${BASE_URL}/expense-types/${typeId}/statuses`, {
      params: { only_active: onlyActive }
    });
    return response.data;
  },

  async createStatus(typeId: number, data: Partial<ExpenseStatus>): Promise<{ id: number }> {
    const response = await apiService.post(`${BASE_URL}/expense-types/${typeId}/statuses`, data);
    return response.data;
  },

  async updateStatus(id: number, data: Partial<ExpenseStatus>): Promise<void> {
    await apiService.put(`${BASE_URL}/expense-statuses/${id}`, data);
  },

  async deleteStatus(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/expense-statuses/${id}`);
  }
};

export default expenseTypeService;
