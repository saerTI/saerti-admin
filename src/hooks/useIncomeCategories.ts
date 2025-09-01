// src/hooks/useIncomeCategories.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  IncomeCategory, 
  IncomeCategoryUsage, 
  CreateIncomeCategoryData, 
  UpdateIncomeCategoryData,
  IncomeCategoriesFilters,
  incomeCategoriesService 
} from '../services/incomeCategoriesService';

interface UseIncomeCategoriesReturn {
  // Estado
  categories: IncomeCategory[];
  loading: boolean;
  error: string | null;
  
  // Métodos CRUD
  fetchCategories: (filters?: IncomeCategoriesFilters) => Promise<void>;
  createCategory: (data: CreateIncomeCategoryData) => Promise<IncomeCategory | null>;
  updateCategory: (id: number, data: UpdateIncomeCategoryData) => Promise<IncomeCategory | null>;
  deleteCategory: (id: number) => Promise<boolean>;
  toggleCategoryStatus: (id: number, active: boolean) => Promise<boolean>;
  
  // Métodos de utilidad
  refreshCategories: () => Promise<void>;
  clearError: () => void;
}

interface UseActiveCategoriesReturn {
  activeCategories: IncomeCategory[];
  loading: boolean;
  error: string | null;
  fetchActiveCategories: () => Promise<void>;
  refreshActiveCategories: () => Promise<void>;
}

interface UseCategoriesUsageReturn {
  categoriesUsage: IncomeCategoryUsage[];
  loading: boolean;
  error: string | null;
  fetchCategoriesUsage: () => Promise<void>;
  refreshCategoriesUsage: () => Promise<void>;
}

/**
 * Hook principal para gestión de categorías de ingresos
 */
export const useIncomeCategories = (initialFilters?: IncomeCategoriesFilters): UseIncomeCategoriesReturn => {
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchCategories = useCallback(async (filters?: IncomeCategoriesFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await incomeCategoriesService.getAllCategories(filters);
      setCategories(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar categorías';
      setError(errorMessage);
      console.error('Error fetching income categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data: CreateIncomeCategoryData): Promise<IncomeCategory | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const newCategory = await incomeCategoriesService.createCategory(data);
      setCategories(prev => [newCategory, ...prev]);
      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear categoría';
      setError(errorMessage);
      console.error('Error creating income category:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: number, data: UpdateIncomeCategoryData): Promise<IncomeCategory | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedCategory = await incomeCategoriesService.updateCategory(id, data);
      setCategories(prev => prev.map(cat => cat.id === id ? updatedCategory : cat));
      return updatedCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar categoría';
      setError(errorMessage);
      console.error('Error updating income category:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await incomeCategoriesService.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar categoría';
      setError(errorMessage);
      console.error('Error deleting income category:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCategoryStatus = useCallback(async (id: number, active: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedCategory = await incomeCategoriesService.toggleCategoryStatus(id, active);
      setCategories(prev => prev.map(cat => cat.id === id ? updatedCategory : cat));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar estado de categoría';
      setError(errorMessage);
      console.error('Error toggling category status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    await fetchCategories(initialFilters);
  }, [fetchCategories, initialFilters]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchCategories(initialFilters);
  }, [fetchCategories, initialFilters]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    refreshCategories,
    clearError
  };
};

/**
 * Hook para obtener solo categorías activas (útil para selects/dropdowns)
 */
export const useActiveIncomeCategories = (): UseActiveCategoriesReturn => {
  const [activeCategories, setActiveCategories] = useState<IncomeCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await incomeCategoriesService.getActiveCategories();
      // Asegurar que siempre sea un array
      const validatedData = Array.isArray(data) ? data : [];
      setActiveCategories(validatedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar categorías activas';
      setError(errorMessage);
      console.error('❌ Error fetching active income categories:', err);
      // Mantener array vacío en caso de error
      setActiveCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshActiveCategories = useCallback(async () => {
    await fetchActiveCategories();
  }, [fetchActiveCategories]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchActiveCategories();
  }, [fetchActiveCategories]);

  return {
    activeCategories,
    loading,
    error,
    fetchActiveCategories,
    refreshActiveCategories
  };
};

/**
 * Hook para obtener estadísticas de uso de categorías
 */
export const useCategoriesUsage = (): UseCategoriesUsageReturn => {
  const [categoriesUsage, setCategoriesUsage] = useState<IncomeCategoryUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoriesUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await incomeCategoriesService.getCategoriesUsage();
      setCategoriesUsage(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas de categorías';
      setError(errorMessage);
      console.error('Error fetching categories usage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCategoriesUsage = useCallback(async () => {
    await fetchCategoriesUsage();
  }, [fetchCategoriesUsage]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchCategoriesUsage();
  }, [fetchCategoriesUsage]);

  return {
    categoriesUsage,
    loading,
    error,
    fetchCategoriesUsage,
    refreshCategoriesUsage
  };
};

/**
 * Hook simple para obtener una categoría específica por ID
 */
export const useIncomeCategory = (id: number | null) => {
  const [category, setCategory] = useState<IncomeCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async (categoryId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await incomeCategoriesService.getCategoryById(categoryId);
      setCategory(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar categoría';
      setError(errorMessage);
      console.error('Error fetching income category:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchCategory(id);
    } else {
      setCategory(null);
    }
  }, [id, fetchCategory]);

  return {
    category,
    loading,
    error,
    refetch: () => id && fetchCategory(id)
  };
};
