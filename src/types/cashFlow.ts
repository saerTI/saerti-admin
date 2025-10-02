// src/types/cashFlow.ts - Tipos actualizados para Cash Flow
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface CashFlowFilters {
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  year: string;
  projectId: string;
  costCenterId: string;
  categoryId: string;
  state: string;
  type?: 'income' | 'expense' | 'all';
}

export interface CashFlowItem {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  state?: 'forecast' | 'actual' | 'budget';
  cost_center_name?: string;
  supplier_name?: string;
  employee_name?: string;
  source_type?: string;
  employee_rut?: string;
  employee_position?: string;
  work_days?: number;
  payment_method?: string;
}

export interface CashFlowSummaryData {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  forecastIncome: number;
  forecastExpense: number;
  actualIncome: number;
  actualExpense: number;
  pendingItems: number;
  totalItems: number;
  previousPeriodChange?: number;
  costsExpense: number;
  remuneracionesExpense: number;
}

export interface CashFlowByCategory {
  category_id: number;
  category_name: string;
  category_type: 'income' | 'expense' | 'both';
  income_amount: number;
  expense_amount: number;
  net_amount: number;
  items_count: number;
  path: string;
}

export interface CashFlowChartData {
  name: string;
  income: number;
  expense: number;
  balance: number;
  forecast_income: number;
  forecast_expense: number;
  actual_income: number;
  actual_expense: number;
  costs_expense: number;
  remuneraciones_expense: number;
}

export interface CashFlowData {
  summary: CashFlowSummaryData;
  recentItems: CashFlowItem[];
  byCategoryData: CashFlowByCategory[];
  emptyCategoriesData: CashFlowByCategory[];
  chartData: CashFlowChartData[];
  
  // Para compatibilidad con el código existente
  items?: CashFlowItem[];
  totalIncome?: number;
  totalExpense?: number;
  balance?: number;
}

export interface CashFlowCategory {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  parent_id?: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CashFlowLineCreateData {
  cost_center_id: number;
  name: string;
  category_id: number;
  type: 'income' | 'expense';
  planned_date: string;
  actual_date?: string;
  amount: number;
  state?: 'forecast' | 'actual' | 'budget';
  partner_id?: number;
  notes?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface CashFlowFilterOptions {
  projects: FilterOption[];
  costCenters: FilterOption[];
  categories: FilterOption[];
  states: FilterOption[];
}

// Estados posibles para las líneas de flujo de caja
export type CashFlowState = 'forecast' | 'actual' | 'budget';

// Tipos posibles para las líneas de flujo de caja
export type CashFlowType = 'income' | 'expense';

// Tipos de período para filtros
export type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'annual';

// Interface para respuestas de la API
export interface CashFlowApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Interface para manejo de errores
export interface CashFlowError {
  message: string;
  code?: string;
  details?: any;
}

// Interface para paginación (si se implementa en el futuro)
export interface CashFlowPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Interface extendida para datos con paginación
export interface CashFlowDataPaginated extends CashFlowData {
  pagination?: CashFlowPagination;
}

// Tipos de exportación para el componente
export interface CashFlowExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  includeCharts: boolean;
  dateRange: DateRange;
  filters: CashFlowFilters;
}

// Interface para estadísticas avanzadas (futuro)
export interface CashFlowAdvancedStats {
  averageIncome: number;
  averageExpense: number;
  growthRate: number;
  seasonalityIndex: number;
  riskScore: number;
  predictionAccuracy: number;
}

// Interface completa para el dashboard
export interface CashFlowDashboardData extends CashFlowData {
  advancedStats?: CashFlowAdvancedStats;
  trends?: {
    incometrend: 'up' | 'down' | 'stable';
    expensesTrend: 'up' | 'down' | 'stable';
    balanceTrend: 'up' | 'down' | 'stable';
  };
  alerts?: {
    type: 'warning' | 'error' | 'info';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

// Interfaces para componentes específicos
export interface CashFlowSummaryProps {
  summary: CashFlowSummaryData;
  items: CashFlowItem[];
  loading?: boolean;
}

export interface CashFlowDetailsProps {
  items: CashFlowItem[];
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
  loading?: boolean;
}

export interface CashFlowChartProps {
  data: CashFlowChartData[];
  loading?: boolean;
  chartType?: 'line' | 'bar' | 'area';
}

// Tipos para hooks personalizados (si se crean)
export interface UseCashFlowOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: Partial<CashFlowFilters>;
}

export interface UseCashFlowReturn {
  data: CashFlowData | null;
  loading: boolean;
  error: CashFlowError | null;
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<CashFlowFilters>) => void;
  createItem: (item: CashFlowLineCreateData) => Promise<number>;
  updateItem: (id: number, item: Partial<CashFlowLineCreateData>) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
}