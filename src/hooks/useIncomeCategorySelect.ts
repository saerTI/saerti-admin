// src/hooks/useIncomeCategorySelect.ts

import { useState, useEffect } from 'react';
import { IncomeCategory, incomeCategoriesService } from '../services/incomeCategoriesService';

export interface IncomeCategoryOption {
  value: string;
  label: string;
}

export const useIncomeCategorySelect = () => {
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<IncomeCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activeCategories = await incomeCategoriesService.getActiveCategories();
      setCategories(activeCategories);
      
      // Convert to select options with the same format as cost centers
      const options: IncomeCategoryOption[] = activeCategories.map(category => ({
        value: category.id.toString(),
        label: `${category.id.toString().padStart(3, '0')} - ${category.categoria}`
      }));
      
      setCategoryOptions(options);
    } catch (err) {
      console.error('Error fetching income categories:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar categorías de ingresos');
      setCategoryOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    categoryOptions,
    loading,
    error,
    refetch: fetchCategories
  };
};
