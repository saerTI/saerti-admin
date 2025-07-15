// src/types/CC/ordenCompra.ts

// ✅ MAPEO DE ESTADOS CENTRALIZADO
export const ESTADO_MAPPING = {
  // Frontend -> Backend
  FRONTEND_TO_DB: {
    'draft': 'borrador',
    'pending': 'borrador', 
    'approved': 'activo',
    'received': 'completado',
    'rejected': 'cancelado',
    'paid': 'completado',
    'delivered': 'completado',
    'cancelled': 'cancelado'
  },
  
  // Backend -> Frontend  
  DB_TO_FRONTEND: {
    'borrador': 'draft',
    'activo': 'approved',
    'en_progreso': 'approved',
    'suspendido': 'pending',
    'completado': 'received',
    'cancelado': 'cancelled'
  }
} as const;

// Estados que acepta la base de datos
export type OrdenCompraEstadoDB = 
  | 'borrador'
  | 'activo' 
  | 'en_progreso'
  | 'suspendido'
  | 'completado'
  | 'cancelado';

// Estados que usa el frontend
export type OrdenCompraEstado = 
  | 'draft'
  | 'pending'
  | 'approved'
  | 'received'
  | 'rejected'
  | 'paid'
  | 'delivered'
  | 'cancelled';

// Type for different payment types
export type OrdenCompraPaymentType = 'credit' | 'cash';

// Type for different estado pago values
export type OrdenCompraEstadoPago = 'pendiente' | 'parcial' | 'pagado';

// Base interface for common properties
export interface OrdenCompraBase {
  id: number;
  name: string;
  date: string;
  amount: number;
  projectId?: number;
  projectName?: string;
  currencyId?: number;
  currencySymbol?: string;
  state: OrdenCompraEstado; // ✅ Usar tipo específico
  companyId: number;
  notes?: string;
}

// Extended interface for Orden de Compra with accounting system properties
export interface OrdenCompra extends OrdenCompraBase {
  providerId: number;
  supplierName: string;
  orderNumber: string;
  paymentType: OrdenCompraPaymentType;
  deliveryDate?: string;
  paymentTerms?: string;
  
  // Accounting system properties
  centroCostoId?: number;
  centroCostoNombre?: string;
  cuentaContable?: string;
  grupoCuenta?: string;
  tieneFactura?: boolean;
  facturaId?: number;
  montoFacturado?: number;
  estadoPago?: OrdenCompraEstadoPago;
  fechaVencimiento?: string;
}

// Interface for creating new Orden de Compra
export interface OrdenCompraCreateData {
  name: string;
  orderNumber: string;
  supplierName: string;
  providerId?: number;
  amount: number;
  date: string;
  paymentType: OrdenCompraPaymentType;
  state: OrdenCompraEstado; // ✅ Usar tipo específico
  cuentaContable?: string;
  grupoCuenta?: string;
  centroCostoId?: number;
  centroCostoNombre?: string;
  deliveryDate?: string;
  paymentTerms?: string;
  tieneFactura?: boolean;
  estadoPago?: OrdenCompraEstadoPago;
  fechaVencimiento?: string;
  notes?: string;
  projectId?: number;
  projectName?: string;
}

// Interface for updating Orden de Compra
export interface OrdenCompraUpdateData extends Partial<OrdenCompraCreateData> {
  id: number;
}

// Interface for filtering Orden de Compra
export interface OrdenCompraFilter {
  // Filtros básicos
  search?: string;
  state?: string;
  paymentType?: string;
  
  // Filtros de fecha
  startDate?: string;
  endDate?: string;
  
  // Filtros de monto
  minAmount?: number;
  maxAmount?: number;
  
  // Filtros de organización
  centroCostoId?: number;
  costCenterId?: number;
  categoriaId?: number;
  
  // Filtros de proveedor
  providerId?: number;
  provider?: string;
  
  // Filtros específicos del backend
  orderNumber?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  
  // Filtros legacy
  projectId?: number;
  grupoCuenta?: string;
  cuentaContable?: string;
  estadoPago?: string;
  tieneFactura?: boolean;
}

// Interface for Orden de Compra statistics
export interface OrdenCompraStats {
  // Contadores básicos
  totalOrdenes: number;
  montoTotal: number;
  
  // Estados en español (para compatibilidad con BD)
  borrador: number;
  activo: number;
  en_progreso: number;
  suspendido: number;
  completado: number;
  cancelado: number;
  
  // Estados en inglés (para frontend)
  pending: number;
  approved: number;
  received: number;
  paid: number;
  delivered: number;
  cancelled: number;
  
  // Tipos de pago
  creditCount: number;
  cashCount: number;
  
  // Estadísticas adicionales
  monto_promedio?: number;
  
  // Agrupaciones
  porGrupo: {
    [grupo: string]: {
      count: number;
      monto: number;
    };
  };
}

// Interface for pagination
export interface OrdenCompraPagination {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Interface for API response
export interface OrdenCompraApiResponse {
  data: OrdenCompra[];
  pagination: OrdenCompraPagination;
  stats: OrdenCompraStats;
  filters?: OrdenCompraFilter;
}

// Interface for batch create response
export interface OrdenCompraBatchCreateResponse {
  success: boolean;
  status?: string;
  message: string;
  data: {
    ids: number[];
    created: number;
    updated: number;
    processed: number;
    errors: Array<{ 
      index: number; 
      item: OrdenCompraCreateData; 
      error: string; 
    }>;
    total: number;
    details?: {
      createdIds: number[];
      updatedIds: number[];
    };
  };
}

// Interface for batch create response (legacy)
export interface BatchCreateResponse {
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

// Interface for cuenta contable
export interface CuentaContable {
  id: number;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
  description?: string;
}

// Interface for centro de costo
export interface CentroCosto {
  id: number;
  code: string;
  name: string;
  type: 'project' | 'administrative' | 'operational' | 'maintenance';
  status: 'active' | 'inactive' | 'in_progress' | 'completed' | 'cancelled';
  client?: string;
  location?: string;
  description?: string;
  total_budget?: number;
  start_date?: string;
  expected_end_date?: string;
  department?: string;
}

// Interface for proveedor
export interface Proveedor {
  id: number;
  name: string;
  rut?: string;
  email?: string;
  phone?: string;
  address?: string;
  especialidad?: string;
  activo: boolean;
}

// Grupos de cuentas contables
export const GRUPOS_CUENTAS = [
  'Materiales de Construcción',
  'Combustibles y Lubricantes', 
  'Herramientas y Equipos Menores',
  'Mano de Obra Directa',
  'Subcontratos',
  'Equipos y Maquinaria',
  'Gastos Administrativos',
  'Arriendos',
  'Servicios Básicos',
  'Seguros',
  'Mantención Vehículos',
  'Profesionales y Consultorías',
  'Seguridad Industrial',
  'Otros Gastos'
] as const;

export type GrupoCuenta = typeof GRUPOS_CUENTAS[number];

// Mapeo de estados con colores para frontend
export const ORDEN_COMPRA_STATUS_MAP = {
  'draft': { label: 'Borrador', color: 'secondary' as const },
  'pending': { label: 'Pendiente', color: 'warning' as const },
  'approved': { label: 'Aprobado', color: 'info' as const },
  'received': { label: 'Recibido', color: 'success' as const },
  'rejected': { label: 'Rechazado', color: 'error' as const },
  'paid': { label: 'Pagado', color: 'success' as const },
  'delivered': { label: 'Entregado', color: 'primary' as const },
  'cancelled': { label: 'Cancelado', color: 'error' as const }
} as const;

// Mapeo de tipos de pago
export const PAYMENT_TYPE_MAP = {
  'credit': { label: 'Crédito', color: 'info' as const },
  'cash': { label: 'Contado', color: 'success' as const }
} as const;

// Options for select components
export interface SelectOption {
  value: string;
  label: string;
}

// Sort options
export interface OrdenCompraSortOption {
  field: keyof OrdenCompra;
  direction: 'asc' | 'desc';
  label: string;
}

export const ORDEN_COMPRA_SORT_OPTIONS: OrdenCompraSortOption[] = [
  { field: 'date', direction: 'desc', label: 'Fecha (más reciente)' },
  { field: 'date', direction: 'asc', label: 'Fecha (más antigua)' },
  { field: 'amount', direction: 'desc', label: 'Monto (mayor a menor)' },
  { field: 'amount', direction: 'asc', label: 'Monto (menor a mayor)' },
  { field: 'orderNumber', direction: 'asc', label: 'Número de orden (A-Z)' },
  { field: 'supplierName', direction: 'asc', label: 'Proveedor (A-Z)' },
  { field: 'state', direction: 'asc', label: 'Estado' }
];

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100
};

// Validaciones
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 255
  },
  ORDER_NUMBER: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50
  },
  PROVIDER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  AMOUNT: {
    MIN: 0
  },
  DESCRIPTION: {
    MAX_LENGTH: 500
  },
  NOTES: {
    MAX_LENGTH: 1000
  }
};

// Constantes para formularios
export const FORM_DEFAULTS = {
  PAYMENT_TYPE: 'credit' as OrdenCompraPaymentType,
  STATE: 'draft' as OrdenCompraEstado, // ✅ Usar estado frontend
  ESTADO_PAGO: 'pendiente' as OrdenCompraEstadoPago,
  WORK_DAYS: 30,
  CURRENCY_ID: 1
};

// Interface para datos de importación desde Excel
export interface OrdenCompraImportData {
  name: string;
  orderNumber: string;
  supplierName: string;
  amount: number;
  date: string;
  paymentType?: OrdenCompraPaymentType;
  state?: OrdenCompraEstado;
  cuentaContable?: string;
  grupoCuenta?: string;
  centroCostoNombre?: string;
  centroCostoCode?: string;
  notes?: string;
  rowIndex?: number;
  importErrors?: string[];
}

// Interface para resultado de validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Interface para configuración de importación
export interface ImportConfig {
  skipEmptyRows: boolean;
  validateRequired: boolean;
  defaultPaymentType: OrdenCompraPaymentType;
  defaultState: OrdenCompraEstado;
  maxBatchSize: number;
}

// Utility functions types
export interface OrdenCompraUtilities {
  formatAmount: (amount: number) => string;
  formatDate: (date: string) => string;
  getStatusColor: (status: OrdenCompraEstado) => string;
  getPaymentTypeLabel: (type: OrdenCompraPaymentType) => string;
  validateOrdenCompra: (data: OrdenCompraCreateData) => ValidationResult;
}

// TIPOS PARA API RESPONSES
export interface BaseApiResponse {
  success: boolean;
  message: string;
  status?: string;
}

export interface ApiDataResponse<T> extends BaseApiResponse {
  data: T;
}

export interface ApiPaginatedResponse<T> extends BaseApiResponse {
  data: T[];
  pagination: OrdenCompraPagination;
  stats?: OrdenCompraStats;
  filters?: OrdenCompraFilter;
}

export interface ApiBatchResponse extends BaseApiResponse {
  status: 'success' | 'partial_success' | 'error';
  data: {
    ids: number[];
    created: number;
    total: number;
    errors: Array<{
      index: number;
      item: {
        [key: string]: any;
        po_number?: string;
        name?: string;
        orderNumber?: string;
        amount?: number;
        categoria?: string;
        category?: string;
        error: string;
      };
    }>;
  };
}

// Interfaz para datos que vienen de la API (snake_case)
export interface ApiOrdenCompra {
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

// Interfaz para envío de datos a la API
export interface ApiOrdenCompraCreateData {
  poNumber?: string;
  po_number?: string;
  poDate?: string;
  po_date?: string;
  description?: string;
  supplierName?: string;
  total?: number;
  amount?: number;
  subtotal?: number;
  categoryName?: string;
  category?: string;
  categoriaNombre?: string;
  costCenterCode?: string;
  centerCode?: string;
  centroCosto?: string;
  paymentType?: string;
  status?: string;
  state?: string;
  currency?: string;
  notes?: string;
}

// TYPE GUARDS
export function isApiDataResponse<T>(response: any): response is ApiDataResponse<T> {
  return response && typeof response === 'object' && 'data' in response;
}

export function isApiBatchResponse(response: any): response is ApiBatchResponse {
  return response && 
         typeof response === 'object' && 
         'data' in response && 
         'ids' in response.data && 
         'created' in response.data;
}

export function isApiPaginatedResponse<T>(response: any): response is ApiPaginatedResponse<T> {
  return response && 
         typeof response === 'object' && 
         'data' in response && 
         'pagination' in response &&
         Array.isArray(response.data);
}

// UTILITIES
export function extractApiData<T>(response: any, defaultValue: T): T {
  if (isApiDataResponse<T>(response)) {
    return response.data;
  }
  return defaultValue;
}

export function extractApiArray<T>(response: any, defaultValue: T[] = []): T[] {
  if (isApiPaginatedResponse<T>(response)) {
    return response.data;
  }
  if (isApiDataResponse<T[]>(response) && Array.isArray(response.data)) {
    return response.data;
  }
  return defaultValue;
}

export function getApiErrorMessage(error: any, defaultMessage: string = 'Error desconocido'): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
}

export function isSuccessResponse(response: any): boolean {
  return response && 
         (response.success === true || 
          response.status === 'success' || 
          response.status === 'partial_success');
}

// ✅ FUNCIONES DE TRANSFORMACIÓN CON MAPEO DE ESTADOS
export function transformApiOrdenCompra(apiOrden: ApiOrdenCompra): OrdenCompra {
  return {
    id: apiOrden.id,
    name: apiOrden.name,
    orderNumber: apiOrden.order_number,
    supplierName: apiOrden.provider_name,
    providerId: 0,
    amount: apiOrden.amount || 0,
    date: apiOrden.date || '',
    paymentType: apiOrden.payment_type || 'credit',
    state: ESTADO_MAPPING.DB_TO_FRONTEND[apiOrden.state as keyof typeof ESTADO_MAPPING.DB_TO_FRONTEND] || 'draft',
    centroCostoId: apiOrden.cost_center_id,
    centroCostoNombre: apiOrden.center_name,
    cuentaContable: apiOrden.categoria_name,
    grupoCuenta: apiOrden.categoria_name,
    notes: apiOrden.notes,
    companyId: 1,
    deliveryDate: undefined,
    paymentTerms: undefined,
    tieneFactura: false,
    facturaId: undefined,
    montoFacturado: undefined,
    estadoPago: 'pendiente',
    fechaVencimiento: undefined,
    projectId: apiOrden.cost_center_id,
    projectName: apiOrden.center_name
  };
}

export function transformToApiOrdenCompraCreateData(data: OrdenCompraCreateData): ApiOrdenCompraCreateData {
  return {
    poNumber: data.orderNumber,
    po_number: data.orderNumber,
    poDate: data.date,
    po_date: data.date,
    description: data.name,
    supplierName: data.supplierName,
    total: data.amount,
    amount: data.amount,
    subtotal: data.amount,
    categoryName: data.cuentaContable || data.grupoCuenta,
    category: data.cuentaContable || data.grupoCuenta,
    categoriaNombre: data.cuentaContable || data.grupoCuenta,
    costCenterCode: data.centroCostoNombre,
    centerCode: data.centroCostoNombre,
    centroCosto: data.centroCostoNombre,
    paymentType: data.paymentType,
    status: ESTADO_MAPPING.FRONTEND_TO_DB[data.state as keyof typeof ESTADO_MAPPING.FRONTEND_TO_DB] || 'borrador',
    state: ESTADO_MAPPING.FRONTEND_TO_DB[data.state as keyof typeof ESTADO_MAPPING.FRONTEND_TO_DB] || 'borrador',
    currency: 'CLP',
    notes: data.notes
  };
}

// Export default
export default {
  GRUPOS_CUENTAS,
  ORDEN_COMPRA_STATUS_MAP,
  PAYMENT_TYPE_MAP,
  ORDEN_COMPRA_SORT_OPTIONS,
  PAGINATION_CONFIG,
  VALIDATION_RULES,
  FORM_DEFAULTS,
  ESTADO_MAPPING,
  isApiDataResponse,
  isApiBatchResponse,
  isApiPaginatedResponse,
  extractApiData,
  extractApiArray,
  getApiErrorMessage,
  isSuccessResponse,
  transformApiOrdenCompra,
  transformToApiOrdenCompraCreateData
};