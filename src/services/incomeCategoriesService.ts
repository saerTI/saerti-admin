// src/services/incomeCategoriesService.ts
import { api } from './apiService';

export interface IncomeCategory {
  id: number;
  categoria: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncomeCategoryUsage extends IncomeCategory {
  income_count: number;
  total_amount: number;
}

export interface CreateIncomeCategoryData {
  categoria: string;
  active?: boolean;
}

export interface UpdateIncomeCategoryData {
  categoria?: string;
  active?: boolean;
}

export interface IncomeCategoriesFilters {
  search?: string;
  active?: boolean;
}

class IncomeCategoriesService {
  private readonly baseUrl = '/income-categories';

  /**
   * Get all income categories with optional filters
   */
  async getAllCategories(filters?: IncomeCategoriesFilters): Promise<IncomeCategory[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.search) {
        params.append('search', filters.search);
      }
      
      if (filters?.active !== undefined) {
        params.append('active', filters.active.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
      
      const response = await api.get<any>(url);
      
      // El backend devuelve un objeto con la estructura: { success: boolean, data: IncomeCategory[], message: string }
      const categories = response?.data || response;
      
      // Asegurar que siempre devolvamos un array
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('Error fetching income categories:', error);
      throw error;
    }
  }

  /**
   * Get only active income categories
   */
  async getActiveCategories(): Promise<IncomeCategory[]> {
    try {
      const response = await api.get<any>(`${this.baseUrl}/active`);
      
      // El backend devuelve un objeto con la estructura: { success: boolean, data: IncomeCategory[], message: string }
      const categories = response?.data || response;
      
      // Asegurar que siempre devolvamos un array
      const result = Array.isArray(categories) ? categories : [];
      return result;
    } catch (error) {
      console.error('❌ Error fetching active income categories:', error);
      throw error;
    }
  }

  /**
   * Get categories with usage statistics
   */
  async getCategoriesUsage(): Promise<IncomeCategoryUsage[]> {
    try {
      const response = await api.get<any>(`${this.baseUrl}/usage`);
      
      // El backend devuelve un objeto con la estructura: { success: boolean, data: IncomeCategoryUsage[], message: string }
      const categories = response?.data || response;
      
      // Asegurar que siempre devolvamos un array
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('Error fetching categories usage:', error);
      throw error;
    }
  }

  /**
   * Get income category by ID
   */
  async getCategoryById(id: number): Promise<IncomeCategory> {
    try {
      const response = await api.get<any>(`${this.baseUrl}/${id}`);
      
      // El backend devuelve un objeto con la estructura: { success: boolean, data: IncomeCategory, message: string }
      return response?.data || response;
    } catch (error) {
      console.error(`Error fetching income category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new income category
   */
  async createCategory(categoryData: CreateIncomeCategoryData): Promise<IncomeCategory> {
    try {
      const response = await api.post<any>(this.baseUrl, categoryData);
      
      // El backend devuelve un objeto con la estructura: { success: boolean, data: IncomeCategory, message: string }
      return response?.data || response;
    } catch (error) {
      console.error('Error creating income category:', error);
      throw error;
    }
  }

  /**
   * Update income category
   */
  async updateCategory(id: number, updateData: UpdateIncomeCategoryData): Promise<IncomeCategory> {
    try {
      const response = await api.put<any>(`${this.baseUrl}/${id}`, updateData);
      
      // El backend devuelve un objeto con la estructura: { success: boolean, data: IncomeCategory, message: string }
      return response?.data || response;
    } catch (error) {
      console.error(`Error updating income category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete/deactivate income category
   */
  async deleteCategory(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete<any>(`${this.baseUrl}/${id}`);
      
      // El backend devuelve un objeto con la estructura: { success: boolean, data?: any, message: string }
      return response?.data || response;
    } catch (error) {
      console.error(`Error deleting income category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Toggle category active status
   */
  async toggleCategoryStatus(id: number, active: boolean): Promise<IncomeCategory> {
    try {
      return await this.updateCategory(id, { active });
    } catch (error) {
      console.error(`Error toggling category ${id} status:`, error);
      throw error;
    }
  }
}

export const incomeCategoriesService = new IncomeCategoriesService();
