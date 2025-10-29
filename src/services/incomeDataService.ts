// src/services/incomeDataService.ts
import apiService from './apiService';
import type { IncomeData, IncomeFilters, PaginationInfo } from '../types/income';

const BASE_URL = ''; // apiService already adds /api prefix

export const incomeDataService = {
  async getAll(filters?: IncomeFilters): Promise<{ data: IncomeData[]; pagination: PaginationInfo }> {
    const response = await apiService.get(`${BASE_URL}/incomes`, { params: filters });
    return {
      data: response.data,
      pagination: response.pagination
    };
  },

  async getById(id: number): Promise<IncomeData> {
    const response = await apiService.get(`${BASE_URL}/incomes/${id}`);
    return response.data;
  },

  async create(data: Partial<IncomeData>): Promise<{ id: number; warnings?: any[] }> {
    const response = await apiService.post(`${BASE_URL}/incomes`, data);
    return {
      id: response.data.id,
      warnings: response.warnings
    };
  },

  async update(id: number, data: Partial<IncomeData>): Promise<{ warnings?: any[] }> {
    const response = await apiService.put(`${BASE_URL}/incomes/${id}`, data);
    return { warnings: response.warnings };
  },

  async delete(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/incomes/${id}`);
  },

  async getStats(incomeTypeId?: number, dateFrom?: string, dateTo?: string): Promise<any[]> {
    const response = await apiService.get(`${BASE_URL}/incomes/stats`, {
      params: { income_type_id: incomeTypeId, date_from: dateFrom, date_to: dateTo }
    });
    return response.data;
  },

  async getByStatus(typeId: number): Promise<any[]> {
    const response = await apiService.get(`${BASE_URL}/income-types/${typeId}/incomes-by-status`);
    return response.data;
  },

  async bulkCreate(incomes: Partial<IncomeData>[]): Promise<any> {
    const response = await apiService.post(`${BASE_URL}/incomes/bulk`, { incomes });
    return response;
  }
};

export default incomeDataService;
