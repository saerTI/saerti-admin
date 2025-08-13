export interface Income {
  id: number;
  document_number: string;
  ep_detail?: string;
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
  factoring?: string;
  payment_date?: string;
  factoring_due_date?: string;
  state: 'borrador' | 'activo' | 'facturado' | 'pagado' | 'cancelado';
  payment_status: 'no_pagado' | 'pago_parcial' | 'pagado';
  date: string;
  cost_center_id?: number;
  cost_center_code?: string;
  center_name?: string;
  project_name?: string;
  description?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IncomeDetail extends Income {
  center_name: string;
  project_name: string;
}

export interface IncomeFilter {
  // Búsqueda
  search?: string;
  
  // Filtros principales
  state?: string;
  costCenterId?: number;
  clientId?: string;
  
  // Filtros de fecha
  startDate?: string;
  endDate?: string;
  
  // Filtros de monto
  minAmount?: number;
  maxAmount?: number;
  
  // Filtros específicos
  paymentType?: string;
  factoring?: string;
  payment_status?: string;
  
  // Paginación y ordenamiento
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface IncomeStats {
  total: number;
  totalIngresos: number;
  montoTotal: number;
  borrador: number;
  activo: number;
  facturado: number;
  pagado: number;
  cancelado: number;
  draft: number;
  active: number;
  invoiced: number;
  paid: number;
  cancelled: number;
  factoringCount: number;
  transferCount: number;
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

export interface IncomeData {
  totalIncomes: number;
  pendingIncomes: number;
  recentIncomes: IncomeItem[];
  byPeriodData: IncomesByPeriod[];
  byClientData: IncomesByClient[];
  byCenterData: IncomesByCenter[];
}

export interface IncomeItem {
  income_id: number;
  transaction_type: string;
  description: string;
  amount: number;
  date: string;
  period_year: number;
  period_month: number;
  status: string;
  cost_center_name: string;
  client_name: string;
  client_tax_id: string;
  factoring?: string;
  source_type: string;
  period_key: string;
}

export interface IncomesByPeriod {
  client: string;
  path: string;
  amounts: Record<string, number>;
}

export interface IncomesByClient {
  client_id: string;
  client_name: string;
  client_tax_id: string;
  amount: number;
  count: number;
  path: string;
  has_data: boolean;
}

export interface IncomesByCenter {
  center_id: number;
  center_name: string;
  center_code: string;
  amount: number;
  count: number;
  path: string;
  has_data: boolean;
}

export interface IncomeFilters {
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  year: string;
  projectId?: string;
  costCenterId?: string;
  clientId?: string;
  status?: string;
}