// src/services/cashFlowService.ts
import api from './apiService';
import { DateRange, CashFlowData, CashFlowSummaryData } from '../types/cashFlow';

// Get cash flow data
export const fetchCashFlowData = async (dateRange: DateRange): Promise<CashFlowData> => {
  try {
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    return await api.get<CashFlowData>(`/cash-flow?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching cash flow data:', error);
    throw new Error('Failed to load cash flow data');
  }
};

// Get cash flow summary
export const fetchCashFlowSummary = async (): Promise<CashFlowSummaryData> => {
  try {
    return await api.get<CashFlowSummaryData>('/cash-flow/summary');
  } catch (error) {
    console.error('Error fetching cash flow summary:', error);
    throw new Error('Failed to load cash flow summary');
  }
};

// Get cash flow categories
export const fetchCashFlowCategories = async (): Promise<any[]> => {
  try {
    return await api.get<any[]>('/cash-flow/categories');
  } catch (error) {
    console.error('Error fetching cash flow categories:', error);
    throw new Error('Failed to load categories');
  }
};

// Create cash flow item
export const createCashFlowItem = async (data: any): Promise<number> => {
  try {
    const response = await api.post<{ id: number }>('/cash-flow/items', data);
    return response.id;
  } catch (error) {
    console.error('Error creating cash flow item:', error);
    throw new Error('Failed to create cash flow item');
  }
};

// Update cash flow item
export const updateCashFlowItem = async (id: number, data: any): Promise<boolean> => {
  try {
    await api.put(`/cash-flow/items/${id}`, data);
    return true;
  } catch (error) {
    console.error(`Error updating cash flow item ${id}:`, error);
    throw new Error('Failed to update cash flow item');
  }
};

// Generate cash flow report
export const generateCashFlowReport = async (
  dateRange: DateRange,
  options = {}
): Promise<any> => {
  try {
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      ...options as Record<string, string>
    });
    
    return await api.get<any>(`/cash-flow/report?${params.toString()}`);
  } catch (error) {
    console.error('Error generating cash flow report:', error);
    throw new Error('Failed to generate report');
  }
};

export default {
  fetchCashFlowData,
  fetchCashFlowSummary,
  fetchCashFlowCategories,
  createCashFlowItem,
  updateCashFlowItem,
  generateCashFlowReport
};