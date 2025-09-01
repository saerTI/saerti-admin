// src/hooks/useIngresos.ts
import { useState, useEffect, useCallback } from 'react';
import ingresosApiService from '../services/ingresosService';
import {
  Ingreso,
  IngresoFilter,
  IngresoCreateData,
  IngresoUpdateData,
  IngresoListResponse,
  IngresoStats,
  IngresoState,
  IngresoPagination
} from '../types/CC/ingreso';

/**
 * Estado del hook de ingresos
 */
interface UseIngresosState {
  ingresos: Ingreso[];
  stats: IngresoStats | null;
  pagination: IngresoPagination | null;
  loading: boolean;
  error: string | null;
  selectedIngreso: Ingreso | null;
}

/**
 * Opciones para el hook de ingresos
 */
interface UseIngresosOptions {
  autoFetch?: boolean;
  initialFilters?: IngresoFilter;
}

/**
 * Hook personalizado para gestión de ingresos
 */
export function useIngresos(options: UseIngresosOptions = {}) {
  const { autoFetch = true, initialFilters = {} } = options;

  // Estado principal
  const [state, setState] = useState<UseIngresosState>({
    ingresos: [],
    stats: null,
    pagination: null,
    loading: false,
    error: null,
    selectedIngreso: null,
  });

  // Filtros actuales
  const [filters, setFilters] = useState<IngresoFilter>(initialFilters);

  /**
   * Actualiza el estado de manera segura
   */
  const updateState = useCallback((updates: Partial<UseIngresosState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Carga la lista de ingresos
   */
  const fetchIngresos = useCallback(async (newFilters?: IngresoFilter) => {
    try {
      updateState({ loading: true, error: null });

      const currentFilters = newFilters || filters;
      const response: IngresoListResponse = await ingresosApiService.getIngresos(currentFilters);

      updateState({
        ingresos: response.data || [],
        stats: response.stats || null,
        pagination: response.pagination || null,
        loading: false,
      });

      if (newFilters) {
        setFilters(currentFilters);
      }

    } catch (error) {
      console.error('Error fetching ingresos:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar ingresos',
        ingresos: [],
        stats: null,
        pagination: null,
      });
    }
  }, [filters, updateState]);

  /**
   * Carga un ingreso específico por ID
   */
  const fetchIngresoById = useCallback(async (id: number) => {
    try {
      updateState({ loading: true, error: null });

      const response = await ingresosApiService.getIngresoById(id);
      
      updateState({
        selectedIngreso: response.data || null,
        loading: false,
      });

      return response.data;

    } catch (error) {
      console.error('Error fetching ingreso by ID:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar ingreso',
        selectedIngreso: null,
      });
      return null;
    }
  }, [updateState]);

  /**
   * Crea un nuevo ingreso
   */
  const createIngreso = useCallback(async (data: IngresoCreateData) => {
    try {
      updateState({ loading: true, error: null });

      const response = await ingresosApiService.createIngreso(data);
      
      // Recargar la lista después de crear
      await fetchIngresos();

      updateState({ loading: false });
      return response.data;

    } catch (error) {
      console.error('Error creating ingreso:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al crear ingreso',
      });
      throw error;
    }
  }, [fetchIngresos, updateState]);

  /**
   * Crea múltiples ingresos en lote
   */
  const createIngresosBatch = useCallback(async (data: IngresoCreateData[]) => {
    try {
      updateState({ loading: true, error: null });

      const response = await ingresosApiService.createIngresosBatch(data);
      
      // Recargar la lista después del batch
      await fetchIngresos();

      updateState({ loading: false });
      return response;

    } catch (error) {
      console.error('Error creating batch ingresos:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al crear ingresos en lote',
      });
      throw error;
    }
  }, [fetchIngresos, updateState]);

  /**
   * Actualiza un ingreso existente
   */
  const updateIngreso = useCallback(async (id: number, data: IngresoUpdateData) => {
    try {
      updateState({ loading: true, error: null });

      const response = await ingresosApiService.updateIngreso(id, data);
      
      // Actualizar el ingreso en la lista local
      setState(prev => ({
        ...prev,
        ingresos: prev.ingresos.map(ingreso => 
          ingreso.id === id ? response.data : ingreso
        ),
        selectedIngreso: prev.selectedIngreso?.id === id ? response.data : prev.selectedIngreso,
        loading: false,
      }));

      return response.data;

    } catch (error) {
      console.error('Error updating ingreso:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar ingreso',
      });
      throw error;
    }
  }, [updateState]);

  /**
   * Actualiza el estado de un ingreso
   */
  const updateIngresoStatus = useCallback(async (id: number, newState: IngresoState) => {
    try {
      updateState({ loading: true, error: null });

      const response = await ingresosApiService.updateIngresoStatus(id, newState);
      
      // Actualizar el estado en la lista local
      setState(prev => ({
        ...prev,
        ingresos: prev.ingresos.map(ingreso => 
          ingreso.id === id ? { ...ingreso, state: newState } : ingreso
        ),
        selectedIngreso: prev.selectedIngreso?.id === id ? 
          { ...prev.selectedIngreso, state: newState } : prev.selectedIngreso,
        loading: false,
      }));

      return response.data;

    } catch (error) {
      console.error('Error updating ingreso status:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar estado',
      });
      throw error;
    }
  }, [updateState]);

  /**
   * Elimina un ingreso
   */
  const deleteIngreso = useCallback(async (id: number) => {
    try {
      updateState({ loading: true, error: null });

      await ingresosApiService.deleteIngreso(id);
      
      // Remover el ingreso de la lista local
      setState(prev => ({
        ...prev,
        ingresos: prev.ingresos.filter(ingreso => ingreso.id !== id),
        selectedIngreso: prev.selectedIngreso?.id === id ? null : prev.selectedIngreso,
        loading: false,
      }));

      return true;

    } catch (error) {
      console.error('Error deleting ingreso:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar ingreso',
      });
      throw error;
    }
  }, [updateState]);

  /**
   * Exporta ingresos a CSV
   */
  const exportToCSV = useCallback(async (exportFilters?: IngresoFilter) => {
    try {
      updateState({ loading: true, error: null });

      const blob = await ingresosApiService.exportToCSV(exportFilters || filters);
      
      // Crear y descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ingresos_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      updateState({ loading: false });

    } catch (error) {
      console.error('Error exporting to CSV:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al exportar a CSV',
      });
      throw error;
    }
  }, [filters, updateState]);

  /**
   * Aplica nuevos filtros
   */
  const applyFilters = useCallback((newFilters: IngresoFilter) => {
    setFilters(newFilters);
    fetchIngresos(newFilters);
  }, [fetchIngresos]);

  /**
   * Limpia filtros
   */
  const clearFilters = useCallback(() => {
    const emptyFilters: IngresoFilter = {};
    setFilters(emptyFilters);
    fetchIngresos(emptyFilters);
  }, [fetchIngresos]);

  /**
   * Refresca los datos
   */
  const refresh = useCallback(() => {
    fetchIngresos();
  }, [fetchIngresos]);

  /**
   * Limpia errores
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Limpia el ingreso seleccionado
   */
  const clearSelectedIngreso = useCallback(() => {
    updateState({ selectedIngreso: null });
  }, [updateState]);

  // Auto-fetch inicial
  useEffect(() => {
    if (autoFetch) {
      fetchIngresos();
    }
  }, []); // Solo ejecutar una vez al montar

  return {
    // Estado
    ...state,
    filters,

    // Acciones
    fetchIngresos,
    fetchIngresoById,
    createIngreso,
    createIngresosBatch,
    updateIngreso,
    updateIngresoStatus,
    deleteIngreso,
    exportToCSV,
    applyFilters,
    clearFilters,
    refresh,
    clearError,
    clearSelectedIngreso,

    // Utilidades
    hasData: state.ingresos.length > 0,
    isEmpty: state.ingresos.length === 0 && !state.loading,
    hasError: !!state.error,
    hasSelection: !!state.selectedIngreso,
  };
}

/**
 * Hook simplificado para estadísticas de ingresos
 */
export function useIngresoStats(filters: IngresoFilter = {}) {
  const [stats, setStats] = useState<IngresoStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (newFilters?: IngresoFilter) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = newFilters || filters;
      const response = await ingresosApiService.getIngresoStats(currentFilters);

      setStats(response.data);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching ingreso stats:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      setStats(null);
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    clearError: () => setError(null),
  };
}
