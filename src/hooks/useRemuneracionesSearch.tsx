import { useState, useEffect, useCallback } from 'react';
import { Remuneracion, RemuneracionFilter, RemuneracionesResponse } from '../types/CC/remuneracion';
import { getRemuneraciones } from '../services/CC/remuneracionesService'; // ✅ USAR ESTE SERVICIO
import { api } from '../services/apiService';

interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface StatsInfo {
  total: number;
  pending: number;
  paid: number;
  total_remuneraciones: number;
  total_anticipos: number;
}

interface SearchFilters {
  search: string;
  state: string;
  type: string;
  period: string;
  area: string;
  rut: string;
  employeePosition: string;
}

// 🔥 NUEVA INTERFAZ PARA OPCIONES INICIALES
interface UseRemuneracionesSearchOptions {
  initialPageSize?: number;
  autoLoad?: boolean;
}

/**
 * Hook personalizado para manejar búsqueda, filtros y paginación de remuneraciones
 * ✅ CORREGIDO: Ahora acepta opciones iniciales
 */
export function useRemuneracionesSearch(options?: UseRemuneracionesSearchOptions) {
  // 🔥 USAR OPCIONES INICIALES
  const { initialPageSize = 50, autoLoad = true } = options || {};

  // Estado de datos
  const [remuneraciones, setRemuneraciones] = useState<Remuneracion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado de paginación - 🔥 USAR initialPageSize
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    per_page: initialPageSize, // 🔥 USAR EL VALOR INICIAL
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  
  // Estado de filtros
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    state: '',
    type: '',
    period: '',
    area: '',
    rut: '',
    employeePosition: ''
  });
  
  // Estado de estadísticas
  const [stats, setStats] = useState<StatsInfo>({
    total: 0,
    pending: 0,
    paid: 0,
    total_remuneraciones: 0,
    total_anticipos: 0
  });

  // ✅ FUNCIÓN CORREGIDA: Ahora usa el servicio con transformación
  const fetchRemuneraciones = useCallback(async (
    newFilters: Partial<SearchFilters> = {}, 
    newPagination: { page?: number; limit?: number } = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Combinar filtros actuales con nuevos
      const searchFilters = { ...filters, ...newFilters };
      
      // Calcular offset basado en página
      const page = newPagination.page || pagination.current_page;
      const limit = newPagination.limit || pagination.per_page;
      const offset = (page - 1) * limit;

      // 🔧 CAMBIO CRÍTICO: Ahora hacemos dos llamadas separadas
      // 1. Llamada para obtener datos transformados
      // 2. Llamada para obtener metadatos (paginación, stats)
      
      // Construir filtros para el servicio
      const serviceFilters: RemuneracionFilter = {
        search: searchFilters.search || undefined,
        state: searchFilters.state || undefined,
        employeePosition: searchFilters.employeePosition || undefined,
        area: searchFilters.area || undefined,
        rut: searchFilters.rut || undefined,
        type: searchFilters.type || undefined,
      };

      // ✅ USAR EL SERVICIO CON TRANSFORMACIÓN
      const transformedRemuneraciones = await getRemuneraciones(serviceFilters);
      
      // 🔥 SIMULAR PAGINACIÓN LOCAL SI EL BACKEND NO LA PROPORCIONA
      const totalItems = transformedRemuneraciones.length;
      const totalPages = Math.ceil(totalItems / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = transformedRemuneraciones.slice(startIndex, endIndex);
      
      // 🔧 Llamada separada para metadatos (paginación y stats) - OPCIONAL
      const params = new URLSearchParams();
      if (searchFilters.search) params.append('search', searchFilters.search);
      if (searchFilters.state) params.append('state', searchFilters.state);
      if (searchFilters.employeePosition) params.append('employeePosition', searchFilters.employeePosition);
      if (searchFilters.area) params.append('area', searchFilters.area);
      if (searchFilters.rut) params.append('rut', searchFilters.rut);
      if (searchFilters.type) params.append('type', searchFilters.type);
      
      // Agregar paginación
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      try {
        const metadataResponse = await api.get<{
          success: boolean;
          data: any[];
          pagination?: PaginationInfo;
          stats?: StatsInfo;
          message?: string;
        }>(`/remuneraciones?${params.toString()}`);
        
        if (metadataResponse.success) {
          // ✅ Usar datos paginados localmente
          setRemuneraciones(paginatedData);
          
          // 🔥 SIEMPRE ESTABLECER PAGINACIÓN CORRECTA
          const finalPagination: PaginationInfo = {
            current_page: page,
            per_page: limit,
            total: totalItems,
            total_pages: Math.max(1, totalPages), // 🔥 MÍNIMO 1 PÁGINA
            has_next: page < totalPages,
            has_prev: page > 1
          };
          
          // Usar paginación del backend si viene, sino usar la calculada
          if (metadataResponse.pagination && metadataResponse.pagination.total_pages) {
            setPagination(metadataResponse.pagination);
          } else {
            setPagination(finalPagination);
          }
          
          // Actualizar estadísticas
          if (metadataResponse.stats) {
            setStats(metadataResponse.stats);
          } else {
            // Calcular estadísticas usando TODOS los datos (no solo la página actual)
            const localStats = calculateLocalStats(transformedRemuneraciones);
            setStats(localStats);
          }
          
          setFilters(searchFilters);
        } else {
          throw new Error(metadataResponse.message || 'Error al cargar remuneraciones');
        }
      } catch (apiError) {
        // 🔥 SI FALLA LA LLAMADA AL API, USAR SOLO DATOS LOCALES
        console.warn('API metadata call failed, using local pagination:', apiError);
        
        setRemuneraciones(paginatedData);
        
        setPagination({
          current_page: page,
          per_page: limit,
          total: totalItems,
          total_pages: Math.max(1, totalPages), // 🔥 MÍNIMO 1 PÁGINA
          has_next: page < totalPages,
          has_prev: page > 1
        });
        
        const localStats = calculateLocalStats(transformedRemuneraciones);
        setStats(localStats);
        
        setFilters(searchFilters);
      }
    } catch (err) {
      console.error('Error fetching remuneraciones:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current_page, pagination.per_page]);

  // Función para buscar por texto (con debounce)
  const searchByText = useCallback((searchText: string) => {
    setFilters(prev => ({ ...prev, search: searchText }));
    fetchRemuneraciones({ search: searchText }, { page: 1 });
  }, [fetchRemuneraciones]);

  // Función para cambiar filtros
  const updateFilter = useCallback((filterName: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    fetchRemuneraciones(newFilters, { page: 1 });
  }, [filters, fetchRemuneraciones]);

  // Función para cambiar página
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.total_pages) {
      fetchRemuneraciones({}, { page });
    }
  }, [pagination.total_pages, fetchRemuneraciones]);

  // Funciones de navegación
  const nextPage = useCallback(() => {
    if (pagination.has_next) {
      goToPage(pagination.current_page + 1);
    }
  }, [pagination.has_next, pagination.current_page, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.has_prev) {
      goToPage(pagination.current_page - 1);
    }
  }, [pagination.has_prev, pagination.current_page, goToPage]);

  // Función para cambiar cantidad de elementos por página
  const changePerPage = useCallback((perPage: number) => {
    setPagination(prev => ({ ...prev, per_page: perPage }));
    fetchRemuneraciones({}, { page: 1, limit: perPage });
  }, [fetchRemuneraciones]);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    const emptyFilters: SearchFilters = {
      search: '',
      state: '',
      type: '',
      period: '',
      area: '',
      rut: '',
      employeePosition: ''
    };
    setFilters(emptyFilters);
    fetchRemuneraciones(emptyFilters, { page: 1 });
  }, [fetchRemuneraciones]);

  // Función para refrescar datos
  const refresh = useCallback(() => {
    fetchRemuneraciones();
  }, [fetchRemuneraciones]);

  // 🔥 CARGAR DATOS INICIALES SOLO SI autoLoad ES TRUE
  useEffect(() => {
    if (autoLoad) {
      fetchRemuneraciones();
    }
  }, []); // 🔥 Dependencias vacías para que solo se ejecute una vez

  return {
    // Datos
    remuneraciones,
    loading,
    error,
    pagination,
    filters,
    stats,
    
    // Funciones de búsqueda
    searchByText,
    updateFilter,
    clearFilters,
    
    // Funciones de paginación
    goToPage,
    nextPage,
    prevPage,
    changePerPage,
    
    // Utilidades
    refresh
  };
}

// Función helper para calcular estadísticas localmente si no vienen del backend
function calculateLocalStats(remuneraciones: Remuneracion[]): StatsInfo {
  return {
    total: remuneraciones.length,
    pending: remuneraciones.filter(r => r.state === 'pending').length,
    paid: remuneraciones.filter(r => r.state === 'paid').length,
    total_remuneraciones: remuneraciones
      .filter(r => (r.sueldoLiquido && r.sueldoLiquido > 0))
      .reduce((sum, r) => sum + (r.sueldoLiquido || 0), 0),
    total_anticipos: remuneraciones
      .filter(r => (r.anticipo && r.anticipo > 0))
      .reduce((sum, r) => sum + (r.anticipo || 0), 0)
  };
}