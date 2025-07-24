// src/types/CC/fixedCosts.ts

// Estados del costo fijo
export type FixedCostState = 
  | 'draft'
  | 'active'
  | 'suspended'
  | 'completed'
  | 'cancelled';

// Estado de pago calculado
export type PaymentStatus = 'active' | 'completed' | 'overdue';

// ✅ Interfaz principal para costo fijo
export interface FixedCost {
  id: number;
  name: string;
  description?: string;
  quota_value: number;
  quota_count: number;
  paid_quotas: number;
  start_date: string;
  end_date: string;
  payment_date: string;
  next_payment_date?: string;
  cost_center_id: number;
  account_category_id?: number;
  company_id: number;
  state: FixedCostState;
  created_at: string;
  updated_at: string;
  
  // ✅ Campos relacionados - opcionales porque pueden no estar presentes
  center_code?: string;
  center_name?: string;
  center_type?: string;
  category_name?: string;
  category_code?: string;
  
  // ✅ Campos calculados - siempre presentes desde el backend
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status?: PaymentStatus;
}

// ✅ Datos para crear costo fijo
export interface FixedCostCreateData {
  name: string;
  description?: string;
  quota_value: number;
  quota_count: number;
  paid_quotas?: number;
  start_date: string;
  end_date?: string;
  payment_date: string;
  cost_center_id?: number;
  account_category_id?: number;
  
  // ✅ Campos alternativos para mapeo
  center_code?: string;
  category_name?: string;
  projectId?: number;        // Alias para cost_center_id (compatibilidad con formularios)
  
  state?: FixedCostState;
}

// ✅ Datos para actualizar costo fijo
export interface FixedCostUpdateData extends Partial<FixedCostCreateData> {
  id: number;
}

// ✅ MEJORADO: Filtros completos para costos fijos
export interface FixedCostFilter {
  search?: string;
  state?: FixedCostState;
  costCenterId?: number;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  paymentStatus?: PaymentStatus;
  
  // ✅ Filtros adicionales útiles
  projectId?: number;       // Alias para costCenterId
  date_from?: string;       // Alias para startDate
  date_to?: string;         // Alias para endDate
  center_name?: string;     // Para filtrar por nombre de centro
  category_name?: string;   // Para filtrar por nombre de categoría
}

// ✅ Estadísticas de costos fijos
export interface FixedCostStats {
  total: number;
  totalCosts: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  
  // ✅ Estados
  draft: number;
  active: number;
  suspended: number;
  completed: number;
  cancelled: number;
  
  avgQuotaValue: number;
}

// ✅ Paginación estándar
export interface FixedCostPagination {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ✅ Respuesta de la API para listas
export interface FixedCostsResponse {
  success: boolean;
  data: FixedCost[];
  pagination: FixedCostPagination;
  stats: FixedCostStats;
  filters?: FixedCostFilter;
  message?: string;
}

// ✅ Respuesta para un solo costo fijo
export interface FixedCostSingleResponse {
  success: boolean;
  data: FixedCost;
  message?: string;
}

// ✅ Respuesta para operaciones de creación/actualización
export interface FixedCostOperationResponse {
  success: boolean;
  data: { id: number };
  message: string;
}

// ✅ Mapeo de estados con colores para frontend
export const FIXED_COST_STATUS_MAP = {
  'draft': { label: 'Borrador', color: 'light' as const },
  'active': { label: 'Activo', color: 'success' as const },
  'suspended': { label: 'Suspendido', color: 'warning' as const },
  'completed': { label: 'Completado', color: 'info' as const },
  'cancelled': { label: 'Cancelado', color: 'error' as const }
} as const;
// ✅ Mapeo de estados de pago
export const PAYMENT_STATUS_MAP = {
  'active': { label: 'En Curso', color: 'success' as const },
  'completed': { label: 'Completado', color: 'info' as const },
  'overdue': { label: 'Vencido', color: 'error' as const }
} as const;

// ✅ Opciones para selects
export interface SelectOption {
  value: string;
  label: string;
}

// ✅ Configuración de paginación
export const FIXED_COST_PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100
};

// ✅ Reglas de validación
export const FIXED_COST_VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 255
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000
  },
  QUOTA_VALUE: {
    MIN: 0.01
  },
  QUOTA_COUNT: {
    MIN: 1,
    MAX: 240 // 20 años máximo
  },
  PAID_QUOTAS: {
    MIN: 0
  }
};

// ✅ Valores por defecto para formularios
export const FIXED_COST_FORM_DEFAULTS = {
  STATE: 'active' as FixedCostState,
  PAID_QUOTAS: 0,
  QUOTA_COUNT: 12
};

// ✅ Interfaz para proyectos simples (compatibilidad con modal)
export interface ProjectSimple {
  id: number;
  name: string;
}

// ✅ Interfaz compatible con el modal existente
export interface CostoFijoCreateData {
  name: string;
  description?: string;
  quota_value: number;
  paymentDate: string;
  quota_count: string;
  startDate: string;
  projectId?: string;
}