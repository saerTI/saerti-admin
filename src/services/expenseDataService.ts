// src/services/expenseDataService.ts
import apiService from './apiService';
import type { ExpenseData, ExpenseFilters, PaginationInfo } from '../types/expense';

const BASE_URL = ''; // apiService already adds /api prefix

export const expenseDataService = {
  async getAll(filters?: ExpenseFilters): Promise<{ data: ExpenseData[]; pagination: PaginationInfo }> {
    const response = await apiService.get(`${BASE_URL}/expenses`, { params: filters });
    return {
      data: response.data,
      pagination: response.pagination
    };
  },

  async getById(id: number): Promise<ExpenseData> {
    const response = await apiService.get(`${BASE_URL}/expenses/${id}`);
    return response.data;
  },

  async create(data: Partial<ExpenseData>): Promise<{ id: number; warnings?: any[] }> {
    const response = await apiService.post(`${BASE_URL}/expenses`, data);
    return {
      id: response.data.id,
      warnings: response.warnings
    };
  },

  async update(id: number, data: Partial<ExpenseData>): Promise<{ warnings?: any[] }> {
    const response = await apiService.put(`${BASE_URL}/expenses/${id}`, data);
    return { warnings: response.warnings };
  },

  async delete(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/expenses/${id}`);
  },

  async getStats(expenseTypeId?: number, dateFrom?: string, dateTo?: string): Promise<any[]> {
    const response = await apiService.get(`${BASE_URL}/expenses/stats`, {
      params: { expense_type_id: expenseTypeId, date_from: dateFrom, date_to: dateTo }
    });
    return response.data;
  },

  async getByStatus(typeId: number): Promise<any[]> {
    const response = await apiService.get(`${BASE_URL}/expense-types/${typeId}/expenses-by-status`);
    return response.data;
  },

  async bulkCreate(expenses: Partial<ExpenseData>[]): Promise<any> {
    const response = await apiService.post(`${BASE_URL}/expenses/bulk`, { expenses });
    return response;
  }
};

export default expenseDataService;
