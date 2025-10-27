// src/types/income.ts
// Tipos TypeScript para sistema dinámico de ingresos

export interface IncomeType {
  id: number;
  organization_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;

  // Campos show_* (12 campos opcionales)
  show_amount: boolean;
  show_category: boolean;
  show_payment_date: boolean;
  show_reference_number: boolean;
  show_tax_amount: boolean;
  show_net_amount: boolean;
  show_total_amount: boolean;
  show_payment_method: boolean;
  show_payment_status: boolean;
  show_currency: boolean;
  show_exchange_rate: boolean;
  show_invoice_number: boolean;

  // Campos required_* (16 campos: 4 base + 12 opcionales)
  required_name: boolean;
  required_date: boolean;
  required_status: boolean;
  required_cost_center: boolean;
  required_amount: boolean;
  required_category: boolean;
  required_payment_date: boolean;
  required_reference_number: boolean;
  required_tax_amount: boolean;
  required_net_amount: boolean;
  required_total_amount: boolean;
  required_payment_method: boolean;
  required_payment_status: boolean;
  required_currency: boolean;
  required_exchange_rate: boolean;
  required_invoice_number: boolean;

  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface IncomeCategory {
  id: number;
  income_type_id: number;
  organization_id: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncomeStatus {
  id: number;
  income_type_id: number;
  organization_id: string;
  name: string;
  description?: string;
  color?: string;
  is_final: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncomeData {
  id: number;
  income_type_id: number;
  organization_id: string;
  name?: string;
  description?: string;
  notes?: string;
  date?: string;
  status_id?: number;
  cost_center_id?: number;
  amount?: number;
  category_id?: number;
  payment_date?: string;
  reference_number?: string;
  tax_amount?: number;
  net_amount?: number;
  total_amount?: number;
  payment_method?: 'transferencia' | 'cheque' | 'efectivo' | 'tarjeta' | 'otro';
  payment_status?: 'pendiente' | 'parcial' | 'pagado' | 'anulado';
  currency?: string;
  exchange_rate?: number;
  invoice_number?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  income_type_name?: string;
  status_name?: string;
  status_color?: string;
  category_name?: string;
  cost_center_name?: string;
  created_by_email?: string;
  updated_by_email?: string;
}

export interface FieldDefinition {
  name: string;
  required: boolean;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  options?: string[];
}

export interface VisibleFields {
  base: FieldDefinition[];
  optional: FieldDefinition[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface IncomeFilters {
  organization_id?: string;
  income_type_id?: number;
  status_id?: number;
  category_id?: number;
  cost_center_id?: number;
  date_from?: string;
  date_to?: string;
  payment_status?: 'pendiente' | 'parcial' | 'pagado' | 'anulado';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
