// src/types/CC/ingreso.ts

/**
 * Tipos de datos para el módulo de ingresos
 */

// ✅ TIPO BASE PARA INGRESO
export interface Ingreso {
  id: number;
  document_number: string;
  ep_detail: string;
  client_name: string;
  client_tax_id: string;
  ep_value: number;
  adjustments: number;
  ep_total: number;
  fine: number;
  retention: number;
  advance: number;
  exempt: number;
  net_amount: number;
  tax_amount: number;
  total_amount: number;
  factoring: string | null;
  payment_date: string | null;
  factoring_due_date: string | null;
  state: IngresoState;
  payment_status: PaymentStatus;
  date: string;
  cost_center_id: number | null;
  cost_center_code: string | null;
  center_name: string | null;
  project_name: string | null;
  category_id: number | null;
  category_name: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ✅ ESTADOS DEL INGRESO
export type IngresoState = 
  | 'borrador' 
  | 'activo' 
  | 'facturado' 
  | 'pagado' 
  | 'cancelado';

// ✅ ESTADOS DE PAGO
export type PaymentStatus = 
  | 'no_pagado' 
  | 'pago_parcial' 
  | 'pagado';

// ✅ TIPOS DE PAGO
export type PaymentType = 
  | 'transferencia' 
  | 'cheque' 
  | 'efectivo' 
  | 'factoring';

// ✅ FILTROS PARA BÚSQUEDA DE INGRESOS
export interface IngresoFilter {
  search?: string;
  state?: IngresoState;
  costCenterId?: number;
  categoryId?: number;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentType?: PaymentType;
  factoring?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// ✅ DATOS PARA CREAR/ACTUALIZAR INGRESO
export interface IngresoCreateData {
  document_number: string;
  ep_detail?: string;
  client_name: string;
  client_tax_id: string;
  ep_value?: number;
  adjustments?: number;
  ep_total: number;
  fine?: number;
  retention?: number;
  advance?: number;
  exempt?: number;
  net_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  factoring?: string;
  payment_date?: string;
  factoring_due_date?: string;
  state?: IngresoState;
  payment_status?: PaymentStatus;
  date: string;
  cost_center_code?: string;
  category_id?: number;
  description?: string;
  notes?: string;
}

// ✅ DATOS PARA ACTUALIZACIÓN DE INGRESO
export interface IngresoUpdateData extends Partial<IngresoCreateData> {
  id?: never; // No permitir actualizar el ID
}

// ✅ ESTADÍSTICAS DE INGRESOS
export interface IngresoStats {
  total: number;
  totalIngresos: number;
  montoTotal: number;
  monto_promedio: number;
  
  // Contadores por estado
  borrador: number;
  activo: number;
  facturado: number;
  pagado: number;
  cancelado: number;
  
  // Estados en inglés para compatibilidad
  draft: number;
  active: number;
  invoiced: number;
  paid: number;
  cancelled: number;
  
  // Tipos de pago
  factoringCount: number;
  transferCount: number;
  
  // Agrupaciones
  porCliente: Record<string, {
    tax_id: string;
    cantidad: number;
    monto_total: number;
  }>;
  porCentro: Record<string, {
    nombre: string;
    cantidad: number;
    monto_total: number;
  }>;
}

// ✅ PAGINACIÓN
export interface IngresoPagination {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  from: number;
  to: number;
}

// ✅ RESPUESTA DE LA API PARA LISTA DE INGRESOS
export interface IngresoListResponse {
  success: boolean;
  data: Ingreso[];
  pagination: IngresoPagination;
  stats: IngresoStats;
  filters: IngresoFilter;
}

// ✅ RESPUESTA DE LA API PARA INGRESO INDIVIDUAL
export interface IngresoResponse {
  success: boolean;
  data: Ingreso;
  message?: string;
}

// ✅ RESPUESTA DE LA API PARA CREACIÓN/ACTUALIZACIÓN
export interface IngresoMutationResponse {
  success: boolean;
  data: Ingreso;
  message: string;
}

// ✅ RESPUESTA DE LA API PARA BATCH
export interface IngresoBatchResponse {
  success: boolean;
  message: string;
  data: {
    created: number[];
    updated: number[];
    errors: Array<{
      index: number;
      item: any;
      error: string;
    }>;
    summary: {
      total_processed: number;
      successful: number;
      failed: number;
      created_count: number;
      updated_count: number;
    };
  };
}

// ✅ RESPUESTA DE LA API PARA ESTADÍSTICAS
export interface IngresoStatsResponse {
  success: boolean;
  data: IngresoStats;
}

// ✅ RESPUESTA DE LA API PARA ELIMINACIÓN
export interface IngresoDeleteResponse {
  success: boolean;
  message: string;
}

// ✅ OPCIONES PARA OBTENER INGRESOS POR CENTRO DE COSTO
export interface IngresosByCostCenterOptions {
  limit?: number;
  state?: IngresoState;
}

// ✅ TYPE GUARDS
export function isIngreso(obj: any): obj is Ingreso {
  return obj && 
         typeof obj === 'object' &&
         typeof obj.id === 'number' &&
         typeof obj.document_number === 'string' &&
         typeof obj.client_name === 'string' &&
         typeof obj.ep_total === 'number';
}

export function isIngresoListResponse(obj: any): obj is IngresoListResponse {
  return obj && 
         typeof obj === 'object' &&
         obj.success === true &&
         Array.isArray(obj.data) &&
         obj.pagination &&
         obj.stats;
}

export function isIngresoResponse(obj: any): obj is IngresoResponse {
  return obj && 
         typeof obj === 'object' &&
         obj.success === true &&
         obj.data &&
         isIngreso(obj.data);
}
