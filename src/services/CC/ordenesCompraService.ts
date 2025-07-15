// src/services/CC/ordenesCompraService.ts
import { api } from '../apiService';
import { 
  OrdenCompra, 
  OrdenCompraCreateData, 
  OrdenCompraUpdateData, 
  OrdenCompraFilter,
  OrdenCompraApiResponse,
  OrdenCompraBatchCreateResponse,
  ESTADO_MAPPING,
  transformApiOrdenCompra,
  transformToApiOrdenCompraCreateData,
  ApiDataResponse
} from '../../types/CC/ordenCompra';

// Interfaz para datos que vienen de la API (snake_case)
interface ApiOrdenCompra {
  id: number;
  name: string;
  order_number: string;
  description?: string;
  cost_center_id?: number;
  cuenta_categoria_id?: number;
  provider_name: string;
  amount: number;
  date: string;
  payment_type: 'credit' | 'cash';
  state: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  center_code?: string;
  center_name?: string;
  categoria_name?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  stats?: {
    total: number;
    pendientes: number;
    aprobadas: number;
    recibidas: number;
    credito: number;
    contado: number;
    monto_total: number;
    monto_promedio: number;
  };
}

interface BatchCreateResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    ids: number[];
    created: number;
    errors: Array<{ 
      index: number; 
      item: {
        name: string;
        orderNumber: string;
        amount: number;
        categoria: string;
        error: string;
        po_number?: string;
        category?: string;
        poNumber?: string;
        description?: string;
        total?: number;
        supplierName?: string;
        [key: string]: any;
      }; 
    }>;
    total: number;
  };
}

/**
 * Obtener órdenes de compra con transformación
 */
export const getOrdenesCompra = async (
  filters: OrdenCompraFilter = {},
  page: number = 1,
  perPage: number = 25
): Promise<OrdenCompraApiResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Agregar paginación
    params.append('limit', perPage.toString());
    params.append('offset', ((page - 1) * perPage).toString());
    
    // Agregar filtros
    if (filters.state) params.append('state', filters.state);
    if (filters.paymentType) params.append('paymentType', filters.paymentType);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('fechaDesde', filters.startDate);
    if (filters.endDate) params.append('fechaHasta', filters.endDate);
    if (filters.centroCostoId) params.append('costCenterId', filters.centroCostoId.toString());
    if (filters.categoriaId) params.append('categoriaId', filters.categoriaId.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/ordenes-compra?${queryString}` : '/ordenes-compra';
    
    const response = await api.get<ApiResponse<ApiOrdenCompra[]>>(url);
    
    if (response.success) {
      // Transformar datos usando la función centralizada
      const transformedData = response.data.map(transformApiOrdenCompra);
      
      console.log('✅ Órdenes de compra transformadas correctamente:', {
        original: response.data.length,
        transformed: transformedData.length,
        sample: transformedData[0] ? {
          name: transformedData[0].name,
          orderNumber: transformedData[0].orderNumber,
          supplierName: transformedData[0].supplierName,
          amount: transformedData[0].amount,
          state: transformedData[0].state
        } : null
      });
      
      // Mapear estadísticas si existen
      const mappedStats = response.stats ? {
        totalOrdenes: response.stats.total,
        montoTotal: response.stats.monto_total,
        
        // Estados en español
        borrador: response.stats.pendientes || 0,
        activo: response.stats.aprobadas || 0,
        en_progreso: 0,
        suspendido: 0,
        completado: response.stats.recibidas || 0,
        cancelado: 0,
        
        // Estados en inglés para compatibilidad
        pending: response.stats.pendientes || 0,
        approved: response.stats.aprobadas || 0,
        received: response.stats.recibidas || 0,
        paid: response.stats.recibidas || 0,
        delivered: response.stats.recibidas || 0,
        cancelled: 0,
        
        // Tipos de pago
        creditCount: response.stats.credito || 0,
        cashCount: response.stats.contado || 0,
        
        // Estadísticas adicionales
        monto_promedio: response.stats.monto_promedio,
        
        // Agrupaciones
        porGrupo: {}
      } : {
        totalOrdenes: 0,
        montoTotal: 0,
        borrador: 0,
        activo: 0,
        en_progreso: 0,
        suspendido: 0,
        completado: 0,
        cancelado: 0,
        pending: 0,
        approved: 0,
        received: 0,
        paid: 0,
        delivered: 0,
        cancelled: 0,
        creditCount: 0,
        cashCount: 0,
        porGrupo: {}
      };
      
      // Mapear paginación
      const mappedPagination = response.pagination ? {
        current_page: response.pagination.current_page,
        per_page: response.pagination.per_page,
        total: response.pagination.total,
        total_pages: response.pagination.total_pages,
        has_next: response.pagination.has_next,
        has_prev: response.pagination.has_prev
      } : {
        current_page: 1,
        per_page: perPage,
        total: transformedData.length,
        total_pages: 1,
        has_next: false,
        has_prev: false
      };
      
      return {
        data: transformedData,
        pagination: mappedPagination,
        stats: mappedStats
      };
    } else {
      throw new Error(response.message || 'Error al obtener órdenes de compra');
    }
  } catch (error) {
    console.error('Error fetching órdenes de compra:', error);
    throw error;
  }
};

/**
 * Obtener orden de compra por ID
 */
export const getOrdenCompraById = async (id: number): Promise<OrdenCompra> => {
  try {
    const response = await api.get<ApiResponse<ApiOrdenCompra>>(`/ordenes-compra/${id}`);
    
    if (response.success) {
      return transformApiOrdenCompra(response.data);
    } else {
      throw new Error(response.message || 'Error al obtener orden de compra');
    }
  } catch (error) {
    console.error('Error fetching orden de compra by ID:', error);
    throw error;
  }
};

/**
 * Crear nueva orden de compra
 */
export const createOrdenCompra = async (data: OrdenCompraCreateData): Promise<{
  id: number;
  isUpdate?: boolean;
}> => {
  try {
    console.log('📤 Creando orden individual:', data);
    
    // Validaciones
    if (!data.orderNumber?.trim()) {
      throw new Error('Número de orden es requerido');
    }
    
    if (!data.supplierName?.trim()) {
      throw new Error('Nombre del proveedor es requerido');
    }
    
    if (!data.amount || data.amount <= 0) {
      throw new Error('Monto debe ser mayor a cero');
    }
    
    // Usar el transformador centralizado
    const apiData = transformToApiOrdenCompraCreateData(data);
    
    console.log('📤 Datos transformados para API:', apiData);
    
    const response = await api.post<ApiDataResponse<{ id: number; isUpdate?: boolean }>>('/ordenes-compra', apiData);
    
    if (response.success) {
      return {
        id: response.data.id,
        isUpdate: response.data.isUpdate || false
      };
    } else {
      throw new Error(response.message || 'Error al crear orden de compra');
    }
  } catch (error: any) {
    console.error('❌ Error creating orden de compra:', error);
    throw error;
  }
};

/**
 * Actualizar orden de compra
 */
export const updateOrdenCompra = async (data: OrdenCompraUpdateData): Promise<boolean> => {
  try {
    // Validar que tenemos los campos requeridos
    if (!data.id) {
      throw new Error('ID de orden de compra es requerido');
    }
    
    // Crear un objeto con los datos completos necesarios para la transformación
    const completeData: OrdenCompraCreateData = {
      name: data.name || '',
      orderNumber: data.orderNumber || '',
      supplierName: data.supplierName || '',
      amount: data.amount || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      paymentType: data.paymentType || 'credit',
      state: data.state || 'draft',
      ...data // Sobrescribir con los datos reales
    };
    
    // Usar el transformador centralizado
    const apiData = transformToApiOrdenCompraCreateData(completeData);
    
    const response = await api.put<ApiResponse<null>>(`/ordenes-compra/${data.id}`, apiData);
    
    if (response.success) {
      return true;
    } else {
      throw new Error(response.message || 'Error al actualizar orden de compra');
    }
  } catch (error) {
    console.error('Error updating orden de compra:', error);
    throw error;
  }
};

/**
 * Eliminar orden de compra
 */
export const deleteOrdenCompra = async (id: number): Promise<void> => {
  try {
    const response = await api.delete<ApiResponse<null>>(`/ordenes-compra/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar orden de compra');
    }
  } catch (error) {
    console.error('Error deleting orden de compra:', error);
    throw error;
  }
};

/**
 * Crear múltiples órdenes de compra en lote
 */
export const createOrdenCompraBatch = async (
  ordenes: OrdenCompraCreateData[]
): Promise<OrdenCompraBatchCreateResponse> => {
  try {
    console.log('🚀 Enviando batch de', ordenes.length, 'órdenes de compra...');
    console.log('📤 Datos a enviar (sample):', ordenes.slice(0, 2));
    
    if (!ordenes || ordenes.length === 0) {
      throw new Error('No hay órdenes de compra para crear');
    }

    // Transformar todas las órdenes usando el transformador centralizado
    const apiOrdenes = ordenes.map((orden, index) => {
      const orderNumber = orden.orderNumber?.trim() || `OC-AUTO-${Date.now()}-${index}`;
      const supplierName = orden.supplierName?.trim() || 'Proveedor no especificado';
      const amount = Math.max(orden.amount || 0, 1);
      const date = orden.date || new Date().toISOString().split('T')[0];
      
      const ordenWithDefaults = {
        ...orden,
        orderNumber,
        supplierName,
        amount,
        date,
        state: orden.state || 'draft'
      };
      
      return {
        ...transformToApiOrdenCompraCreateData(ordenWithDefaults),
        _originalIndex: index,
        _originalOrderNumber: orden.orderNumber
      };
    });

    try {
      interface BatchCreateResponse {
        success: boolean;
        status: string;
        message: string;
        data: {
          ids: number[];
          created: number;
          updated: number; // ✅ NUEVO
          processed: number; // ✅ NUEVO
          errors: Array<{ 
            index: number; 
            item: {
              name: string;
              orderNumber: string;
              amount: number;
              categoria: string;
              error: string;
              po_number?: string;
              category?: string;
              poNumber?: string;
              description?: string;
              total?: number;
              supplierName?: string;
              [key: string]: any;
            }; 
          }>;
          total: number;
          details?: { // ✅ NUEVO
            createdIds: number[];
            updatedIds: number[];
          };
        };
      }
      
      const response = await api.post<BatchCreateResponse>('/ordenes-compra/batch', {
        ordenes: apiOrdenes
      });
      
      if (response.success || response.status === 'success' || response.status === 'partial_success') {
        const result: OrdenCompraBatchCreateResponse = {
          success: true,
          message: response.message,
          data: {
            ids: response.data.ids,
            created: response.data.created,
            updated: response.data.updated || 0, // ✅ NUEVO: Soporte para actualizaciones
            processed: response.data.processed || (response.data.created + (response.data.updated || 0)), // ✅ NUEVO
            errors: response.data.errors.map(error => ({
              index: error.index,
              item: {
                name: error.item.po_number || error.item.name || error.item.orderNumber || '',
                orderNumber: error.item.po_number || error.item.orderNumber || ordenes[error.index]?.orderNumber || '',
                amount: error.item.amount || ordenes[error.index]?.amount || 0,
                supplierName: ordenes[error.index]?.supplierName || 'N/A',
                state: ordenes[error.index]?.state || 'draft',
                paymentType: ordenes[error.index]?.paymentType || 'credit',
                date: ordenes[error.index]?.date || '',
                cuentaContable: error.item.category || error.item.categoria || ordenes[error.index]?.cuentaContable || '',
                grupoCuenta: error.item.category || error.item.categoria || ordenes[error.index]?.grupoCuenta || '',
                centroCostoNombre: ordenes[error.index]?.centroCostoNombre
              } as OrdenCompraCreateData,
              error: error.item.error
            })),
            total: response.data.total,
            details: response.data.details // ✅ NUEVO: Información detallada
          }
        };
        
        // ✅ LOG MEJORADO CON INFORMACIÓN DE UPSERTS
        console.log('✅ Batch completado:', {
          total: result.data.total,
          created: result.data.created,
          updated: result.data.updated,
          processed: result.data.processed,
          errors: result.data.errors.length
        });
        
        return result;
      } else {
        throw new Error(response.message || 'Failed to create órdenes de compra batch');
      }
    } catch (error: any) {
      console.error('❌ Error en batch principal:', error);
      return await createOrdenCompraIndividually(ordenes);
    }
  } catch (error) {
    console.error('❌ Error en createOrdenesCompraBatch:', error);
    throw new Error('No se pudieron crear las órdenes de compra en lote');
  }
};

/**
 * Método fallback: crear órdenes individualmente
 */
const createOrdenCompraIndividually = async (
  ordenes: OrdenCompraCreateData[]
): Promise<OrdenCompraBatchCreateResponse> => {
  try {
    console.log('⚠️ Usando método fallback: creación individual de órdenes');
    
    const createdIds: number[] = [];
    const updatedIds: number[] = [];
    const errors: Array<{ 
      index: number; 
      item: OrdenCompraCreateData; 
      error: string; 
    }> = [];
    
    for (let i = 0; i < ordenes.length; i++) {
      try {
        const response = await createOrdenCompra(ordenes[i]);
        
        // ✅ VERIFICAR SI FUE ACTUALIZACIÓN O CREACIÓN
        if (response.isUpdate) {
          updatedIds.push(response.id);
          console.log(`🔄 Orden ${i + 1}/${ordenes.length} actualizada con ID: ${response.id}`);
        } else {
          createdIds.push(response.id);
          console.log(`✅ Orden ${i + 1}/${ordenes.length} creada con ID: ${response.id}`);
        }
      } catch (error: any) {
        console.error(`❌ Error procesando orden ${i + 1}/${ordenes.length}:`, error);
        errors.push({ 
          index: i, 
          error: error.message || 'Error desconocido', 
          item: ordenes[i] 
        });
      }
    }
    
    const created = createdIds.length;
    const updated = updatedIds.length;
    const processed = created + updated;
    const total = ordenes.length;
    
    const result: OrdenCompraBatchCreateResponse = {
      success: true,
      message: `${created} órdenes creadas, ${updated} actualizadas, ${errors.length} errores`,
      data: {
        ids: [...createdIds, ...updatedIds],
        created,
        updated,
        processed,
        errors,
        total,
        details: {
          createdIds,
          updatedIds
        }
      }
    };
    
    console.log('✅ Fallback completado:', {
      created,
      updated,
      processed,
      errors: errors.length
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error en creación individual:', error);
    throw new Error('No se pudieron crear las órdenes de compra individualmente');
  }
};

/**
 * Obtener estadísticas de órdenes de compra
 */
export const getOrdenesCompraStats = async (filters: OrdenCompraFilter = {}): Promise<any> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.state) params.append('state', filters.state);
    if (filters.paymentType) params.append('paymentType', filters.paymentType);
    if (filters.startDate) params.append('fechaDesde', filters.startDate);
    if (filters.endDate) params.append('fechaHasta', filters.endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/ordenes-compra/stats?${queryString}` : '/ordenes-compra/stats';
    
    const response = await api.get<ApiResponse<any>>(url);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Error al obtener estadísticas');
    }
  } catch (error) {
    console.error('Error fetching órdenes de compra stats:', error);
    throw error;
  }
};

/**
 * Actualizar estado de orden de compra
 */
export const updateOrdenCompraState = async (id: number, state: string): Promise<boolean> => {
  try {
    // Mapear el estado del frontend a la base de datos
    const dbState = ESTADO_MAPPING.FRONTEND_TO_DB[state as keyof typeof ESTADO_MAPPING.FRONTEND_TO_DB] || state;
    
    const response = await api.put<ApiResponse<null>>(`/ordenes-compra/${id}/state`, { 
      state: dbState 
    });
    
    if (response.success) {
      return true;
    } else {
      throw new Error(response.message || 'Error al actualizar estado');
    }
  } catch (error) {
    console.error('Error updating orden de compra state:', error);
    throw error;
  }
};

// Export default object
export default {
  getOrdenesCompra,
  getOrdenCompraById,
  createOrdenCompra,
  updateOrdenCompra,
  deleteOrdenCompra,
  createOrdenCompraBatch,
  getOrdenesCompraStats,
  updateOrdenCompraState
};

// ✅ EXPORT ADICIONAL PARA COMPATIBILIDAD CON EL PROCESADOR EXCEL
export const createOrdenesCompraBatch = createOrdenCompraBatch;