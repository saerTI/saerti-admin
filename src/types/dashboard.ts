// src/types/dashboard.ts
// Tipos TypeScript para los dashboards de resumen

export interface DashboardFilters {
  date_from?: string;
  date_to?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
  type_id?: number;
  category_id?: number;
  status_id?: number;
  cost_center_id?: number;
}

export interface DashboardSummary {
  total_amount: number;
  total_count: number;
  avg_amount: number;
  by_type: TypeSummary[];
  by_category: CategorySummary[];
  by_status: StatusSummary[];
  trend_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
  top_income_types?: TypeSummary[];
  top_expense_types?: TypeSummary[];
  recent_incomes?: RecentTransaction[];
  recent_expenses?: RecentTransaction[];
}

export interface TypeSummary {
  type_id: number;
  type_name: string;
  type_color: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export interface CategorySummary {
  category_id: number | null;
  category_name: string;
  category_color?: string;
  type_id: number;
  type_name: string;
  type_color: string;
  total_amount: number;
  count: number;
}

export interface StatusSummary {
  status_id: number;
  status_name: string;
  status_color: string;
  total_amount: number;
  count: number;
}

export interface CashFlowPeriod {
  period_label: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  count: number;
}

export interface RecentTransaction {
  id: number;
  name: string;
  amount: number;
  date: string;
  income_type_name?: string;
  expense_type_name?: string;
  type_color: string;
  status_name: string;
  status_color: string;
}

export interface KPIMetric {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'stable';
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange';
}

export interface ChartDataPoint {
  x: string;
  y: number;
  fillColor?: string;
}

export interface PeriodComparison {
  current: {
    label: string;
    amount: number;
    count: number;
  };
  previous: {
    label: string;
    amount: number;
    count: number;
  };
  change: {
    amount: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
}

export interface TrendsData {
  current_period: {
    date_from: string;
    date_to: string;
    amount: number;
    count: number;
  };
  previous_period: {
    date_from: string;
    date_to: string;
    amount: number;
    count: number;
  };
  growth_rate: number;
  trend_direction: 'up' | 'down' | 'stable';
}


// Types for consolidated dashboard
export interface IncomeSummary {
  total: number;
  count: number;
  growth_percentage?: number;
}

export interface ExpenseSummary {
  total: number;
  count: number;
  growth_percentage?: number;
}

export interface CashFlowData {
  period: string;
  total: number;
}

export interface ByTypeData {
  type_id: number;
  type_name: string;
  type_color?: string;
  total: number;
  count: number;
}

export interface ByCategoryData {
  category_id: number;
  category_name: string;
  type_id: number;
  type_name: string;
  total: number;
  count: number;
}
