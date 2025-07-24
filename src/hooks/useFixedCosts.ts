// src/hooks/useFixedCosts.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FixedCost,
  FixedCostFilter,
  FixedCostsResponse,
  FixedCostStats,
  FixedCostPagination,
  FIXED_COST_PAGINATION_CONFIG
} from '../types/CC/fixedCosts';
import * as fixedCostsService from '../services/CC/fixedCostsService';

// ✅ Interfaz para las opciones del hook
interface UseFixedCostsOptions {
  initialFilters?: FixedCostFilter;
  pageSize?: number;
  autoLoad?: boolean;
  enablePolling?: boolean;
  pollingInterval?: number;
}

// ✅ Estado del hook
interface UseFixedCostsState {
  fixedCosts: FixedCost[];
  loading: boolean;
  error: string | null;
  pagination: FixedCostPagination | null;
  stats: FixedCostStats | null;
  filters: FixedCostFilter;
  hasData: boolean;
  isEmpty: boolean;
}

// ✅ Valor de retorno del hook
interface UseFixedCostsReturn extends UseFixedCostsState {
  // ✅ Funciones de control
  refresh: () => Promise<void>;
  updateFilters: (newFilters: FixedCostFilter) => void;
  clearFilters: () => void;
  changePage: (page: number) => void;
  
  // ✅ Funciones de datos
  getFixedCostById: (id: number) => Promise<FixedCost | null>;
  invalidateCache: () => void;
}

/**
 * ✅ Hook principal para gestionar costos fijos
 */
export const useFixedCosts = (options: UseFixedCostsOptions = {}): UseFixedCostsReturn => {
  const {
    initialFilters = {},
    pageSize = FIXED_COST_PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    autoLoad = true,
    enablePolling = false,
    pollingInterval = 30000
  } = options;

  // ✅ Estados principales
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<FixedCostPagination | null>(null);
  const [stats, setStats] = useState<FixedCostStats | null>(null);
  const [filters, setFilters] = useState<FixedCostFilter>(initialFilters);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ✅ Referencias para evitar memory leaks
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Estados calculados
  const hasData = fixedCosts.length > 0;
  const isEmpty = !loading && !hasData && !error;

  /**
   * ✅ Función principal para cargar datos
   */
  const loadFixedCosts = useCallback(async (
    page: number = currentPage,
    currentFilters: FixedCostFilter = filters,
    showLoading: boolean = true
  ): Promise<void> => {
    try {
      // ✅ Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // ✅ Crear nuevo AbortController
      abortControllerRef.current = new AbortController();

      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log('🔄 Loading fixed costs...', { page, pageSize, filters: currentFilters });

      // ✅ Hacer la petición
      const response: FixedCostsResponse = await fixedCostsService.getFixedCosts(
        currentFilters,
        page,
        pageSize
      );

      // ✅ Verificar si el componente sigue montado
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.log('✅ Fixed costs loaded:', {
        count: response.data.length,
        total: response.pagination.total,
        page: response.pagination.current_page
      });

      // ✅ Actualizar estados
      setFixedCosts(response.data);
      setPagination(response.pagination);
      setStats(response.stats);
      setCurrentPage(page);

    } catch (err) {
      // ✅ Ignorar errores de cancelación
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Error al cargar costos fijos';
      console.error('❌ Error loading fixed costs:', err);
      setError(errorMessage);
      
      // ✅ Limpiar datos en caso de error
      setFixedCosts([]);
      setPagination(null);
      setStats(null);
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [currentPage, filters, pageSize]);

  /**
   * ✅ Función pública para refrescar datos
   */
  const refresh = useCallback(async (): Promise<void> => {
    await loadFixedCosts(currentPage, filters, true);
  }, [loadFixedCosts, currentPage, filters]);

  /**
   * ✅ Actualizar filtros y resetear a página 1
   */
  const updateFilters = useCallback((newFilters: FixedCostFilter): void => {
    console.log('🔄 Updating filters:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  /**
   * ✅ Limpiar todos los filtros
   */
  const clearFilters = useCallback((): void => {
    console.log('🧹 Clearing filters');
    setFilters({});
    setCurrentPage(1);
  }, []);

  /**
   * ✅ Cambiar de página
   */
  const changePage = useCallback((page: number): void => {
    if (page !== currentPage) {
      console.log('📄 Changing to page:', page);
      setCurrentPage(page);
    }
  }, [currentPage]);

  /**
   * ✅ Obtener costo fijo por ID (con cache)
   */
  const getFixedCostById = useCallback(async (id: number): Promise<FixedCost | null> => {
    try {
      // ✅ Buscar primero en cache local
      const cached = fixedCosts.find(fc => fc.id === id);
      if (cached) {
        console.log('✅ Fixed cost found in cache:', id);
        return cached;
      }

      // ✅ Si no está en cache, hacer petición
      console.log('🔄 Fetching fixed cost from API:', id);
      const fixedCost = await fixedCostsService.getFixedCostById(id);
      
      return fixedCost;
    } catch (err) {
      console.error('❌ Error getting fixed cost by ID:', err);
      return null;
    }
  }, [fixedCosts]);

  /**
   * ✅ Invalidar cache (útil después de operaciones CRUD)
   */
  const invalidateCache = useCallback((): void => {
    console.log('🔄 Invalidating cache');
    loadFixedCosts(currentPage, filters, false);
  }, [loadFixedCosts, currentPage, filters]);

  /**
   * ✅ Efecto para cargar datos cuando cambian filtros o página
   */
  useEffect(() => {
    if (autoLoad) {
      loadFixedCosts(currentPage, filters, true);
    }
  }, [filters, currentPage]); // ✅ Solo dependencias esenciales

  /**
   * ✅ Efecto para polling (opcional)
   */
  useEffect(() => {
    if (enablePolling && pollingInterval > 0) {
      const startPolling = () => {
        pollingTimeoutRef.current = setTimeout(() => {
          loadFixedCosts(currentPage, filters, false);
          startPolling(); // ✅ Recursivo
        }, pollingInterval);
      };

      startPolling();

      return () => {
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
      };
    }
  }, [enablePolling, pollingInterval, loadFixedCosts, currentPage, filters]);

  /**
   * ✅ Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      // ✅ Cancelar requests pendientes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // ✅ Limpiar polling
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Retornar estado y funciones
  return {
    // Estado
    fixedCosts,
    loading,
    error,
    pagination,
    stats,
    filters,
    hasData,
    isEmpty,
    
    // Funciones
    refresh,
    updateFilters,
    clearFilters,
    changePage,
    getFixedCostById,
    invalidateCache
  };
};

/**
 * ✅ Hook especializado para operaciones CRUD
 */
export const useFixedCostOperations = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const createFixedCost = useCallback(async (data: any): Promise<number | null> => {
    try {
      setLoading(true);
      const response = await fixedCostsService.createFixedCost(data);
      return response.id;
    } catch (error) {
      console.error('❌ Error creating fixed cost:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFixedCost = useCallback(async (data: any): Promise<boolean> => {
    try {
      setLoading(true);
      await fixedCostsService.updateFixedCost(data);
      return true;
    } catch (error) {
      console.error('❌ Error updating fixed cost:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFixedCost = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      return await fixedCostsService.deleteFixedCost(id);
    } catch (error) {
      console.error('❌ Error deleting fixed cost:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePaidQuotas = useCallback(async (id: number, paidQuotas: number): Promise<boolean> => {
    try {
      setLoading(true);
      return await fixedCostsService.updatePaidQuotas(id, paidQuotas);
    } catch (error) {
      console.error('❌ Error updating paid quotas:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createFixedCost,
    updateFixedCost,
    deleteFixedCost,
    updatePaidQuotas,
    loading
  };
};

// ✅ Hook para estadísticas
export const useFixedCostsStats = (filters: FixedCostFilter = {}) => {
  const [stats, setStats] = useState<FixedCostStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fixedCostsService.getFixedCostsStats(filters);
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, refresh: loadStats };
};