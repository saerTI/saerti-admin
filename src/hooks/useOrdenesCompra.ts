// src/hooks/useOrdenesCompra.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  OrdenCompra, 
  OrdenCompraCreateData, 
  OrdenCompraFilter, 
  OrdenCompraApiResponse,
  OrdenCompraBatchCreateResponse,
  OrdenCompraPagination,
  OrdenCompraStats
} from '../types/CC/ordenCompra';
import {
  getOrdenesCompra,
  getOrdenCompraById,
  createOrdenCompra,
  createOrdenCompraBatch,
  updateOrdenCompra,
  deleteOrdenCompra,
  getOrdenesCompraStats,
  updateOrdenCompraState
} from '../services/CC/ordenesCompraService';
import { handleConsolidatedExcelUpload, ProcessingStats } from '../utils/ordenCompraUtils';

interface UseOrdenesCompraState {
  ordenes: OrdenCompra[];
  loading: boolean;
  error: string | null;
  pagination: OrdenCompraPagination | null;
  stats: OrdenCompraStats | null;
}

interface UseOrdenesCompraOptions {
  initialFilters?: OrdenCompraFilter;
  autoLoad?: boolean;
  pageSize?: number;
}

export const useOrdenesCompra = (options: UseOrdenesCompraOptions = {}) => {
  const { 
    initialFilters = {}, 
    autoLoad = true, 
    pageSize = 25 
  } = options;

  // Estado principal
  const [state, setState] = useState<UseOrdenesCompraState>({
    ordenes: [],
    loading: false,
    error: null,
    pagination: null,
    stats: null
  });

  // Estado de filtros y paginación
  const [filters, setFilters] = useState<OrdenCompraFilter>(initialFilters);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Función para cargar órdenes de compra
  const loadOrdenesCompra = useCallback(async (
    page: number = currentPage,
    filterParams: OrdenCompraFilter = filters
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔄 Cargando órdenes de compra...', {
        page,
        pageSize,
        filters: filterParams
      });

      const response: OrdenCompraApiResponse = await getOrdenesCompra(
        filterParams,
        page,
        pageSize
      );

      console.log('✅ Órdenes de compra cargadas:', {
        count: response.data.length,
        total: response.pagination.total,
        page: response.pagination.current_page
      });

      setState(prev => ({
        ...prev,
        ordenes: response.data,
        pagination: response.pagination,
        stats: response.stats,
        loading: false,
        error: null
      }));

      setCurrentPage(page);
    } catch (error: any) {
      console.error('❌ Error al cargar órdenes de compra:', error);
      setState(prev => ({
        ...prev,
        ordenes: [],
        loading: false,
        error: error.message || 'Error al cargar órdenes de compra'
      }));
    }
  }, [currentPage, filters, pageSize]);

  // Función para refrescar datos
  const refresh = useCallback(() => {
    loadOrdenesCompra(currentPage, filters);
  }, [loadOrdenesCompra, currentPage, filters]);

  // Función para cambiar filtros
  const updateFilters = useCallback((newFilters: Partial<OrdenCompraFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1); // Reset to first page when filters change
    loadOrdenesCompra(1, updatedFilters);
  }, [filters, loadOrdenesCompra]);

  // Función para cambiar página
  const changePage = useCallback((page: number) => {
    if (page !== currentPage) {
      loadOrdenesCompra(page, filters);
    }
  }, [currentPage, filters, loadOrdenesCompra]);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    setCurrentPage(1);
    loadOrdenesCompra(1, emptyFilters);
  }, [loadOrdenesCompra]);

  // Cargar datos inicialmente
  useEffect(() => {
    if (autoLoad) {
      loadOrdenesCompra(1, initialFilters);
    }
  }, [autoLoad]); // Solo se ejecuta al montar el componente

  return {
    // Estado
    ordenes: state.ordenes,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    stats: state.stats,
    
    // Filtros y paginación
    filters,
    currentPage,
    
    // Funciones de control
    loadOrdenesCompra,
    refresh,
    updateFilters,
    changePage,
    clearFilters,
    
    // Información derivada
    hasData: state.ordenes.length > 0,
    isEmpty: state.ordenes.length === 0 && !state.loading,
    hasError: !!state.error,
    totalItems: state.pagination?.total || 0,
    totalPages: state.pagination?.total_pages || 0,
    hasNextPage: state.pagination?.has_next || false,
    hasPrevPage: state.pagination?.has_prev || false
  };
};

// Hook para manejar una orden de compra individual
export const useOrdenCompra = (id?: number) => {
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrden = useCallback(async (ordenId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const ordenData = await getOrdenCompraById(ordenId);
      setOrden(ordenData);
    } catch (error: any) {
      console.error('Error al cargar orden de compra:', error);
      setError(error.message || 'Error al cargar orden de compra');
      setOrden(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadOrden(id);
    }
  }, [id, loadOrden]);

  return {
    orden,
    loading,
    error,
    loadOrden,
    refresh: () => id && loadOrden(id)
  };
};

// Hook para operaciones CRUD
export const useOrdenCompraOperations = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Crear orden de compra con soporte para upsert
  const createOrden = useCallback(async (data: OrdenCompraCreateData): Promise<{
    id: number;
    isUpdate?: boolean;
  } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createOrdenCompra(data);
      console.log(`✅ Orden de compra ${result.isUpdate ? 'actualizada' : 'creada'} con ID:`, result.id);
      
      return result;
    } catch (error: any) {
      console.error('❌ Error al crear/actualizar orden de compra:', error);
      setError(error.message || 'Error al procesar orden de compra');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear múltiples órdenes con soporte para upsert
  const createOrdenesBatch = useCallback(async (
    ordenes: OrdenCompraCreateData[]
  ): Promise<OrdenCompraBatchCreateResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Iniciando creación en lote de', ordenes.length, 'órdenes...');
      const result = await createOrdenCompraBatch(ordenes);
      
      // ✅ LOG MEJORADO CON INFORMACIÓN DE UPSERTS
      console.log('✅ Batch completado:', {
        total: result.data.total,
        created: result.data.created,
        updated: result.data.updated || 0,
        processed: result.data.processed || 0,
        errors: result.data.errors.length,
        successRate: result.data.total > 0 ? 
          ((result.data.created + (result.data.updated || 0)) / result.data.total * 100).toFixed(1) + '%' : 
          '0%'
      });
      
      return result;
    } catch (error: any) {
      console.error('❌ Error en creación en lote:', error);
      setError(error.message || 'Error al crear órdenes en lote');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar orden de compra
  const updateOrden = useCallback(async (data: OrdenCompraCreateData & { id: number }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await updateOrdenCompra(data);
      console.log('✅ Orden de compra actualizada');
      return success;
    } catch (error: any) {
      console.error('❌ Error al actualizar orden de compra:', error);
      setError(error.message || 'Error al actualizar orden de compra');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar orden de compra
  const deleteOrden = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteOrdenCompra(id);
      console.log('✅ Orden de compra eliminada');
      return true;
    } catch (error: any) {
      console.error('❌ Error al eliminar orden de compra:', error);
      setError(error.message || 'Error al eliminar orden de compra');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar estado de orden
  const updateEstado = useCallback(async (id: number, state: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await updateOrdenCompraState(id, state);
      console.log('✅ Estado de orden actualizado a:', state);
      return success;
    } catch (error: any) {
      console.error('❌ Error al actualizar estado:', error);
      setError(error.message || 'Error al actualizar estado');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ NUEVO: Función para procesar archivos consolidados
  const processConsolidatedFiles = useCallback(async (
    mainFile: File,
    detailFile: File
  ): Promise<{
    success: boolean;
    results?: ProcessingStats;
    ordenes?: OrdenCompra[];
    error?: string;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Procesando archivos consolidados...');
      
      const ordenes = await handleConsolidatedExcelUpload(mainFile, detailFile);
      
      // ✅ CALCULAR ESTADÍSTICAS
      const created = ordenes.filter(o => !(o as any).isUpdate).length;
      const updated = ordenes.filter(o => (o as any).isUpdate).length;
      
      const results: ProcessingStats = {
        total: ordenes.length,
        created,
        updated,
        errors: 0,
        processed: ordenes.length,
        successRate: 100
      };
      
      console.log('✅ Archivos procesados exitosamente:', results);
      
      return {
        success: true,
        results,
        ordenes
      };
    } catch (error: any) {
      console.error('❌ Error procesando archivos:', error);
      const errorMessage = error.message || 'Error al procesar archivos consolidados';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createOrden,
    createOrdenesBatch,
    updateOrden,
    deleteOrden,
    updateEstado,
    processConsolidatedFiles, // ✅ NUEVO
    clearError: () => setError(null)
  };
};

// Hook para estadísticas
export const useOrdenesCompraStats = (filters: OrdenCompraFilter = {}) => {
  const [stats, setStats] = useState<OrdenCompraStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (filterParams: OrdenCompraFilter = filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const statsData = await getOrdenesCompraStats(filterParams);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
      setError(error.message || 'Error al cargar estadísticas');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStats(filters);
  }, [filters, loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
    refresh: () => loadStats(filters)
  };
};

export default useOrdenesCompra;