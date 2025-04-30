// src/types/cashFlow.ts

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface CashFlowItem {
  id: number;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
}

export interface CashFlowChartData {
  name: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CashFlowSummaryData {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  previousPeriodChange: number;
  categories?: {
    [category: string]: number;
  };
}

export interface CashFlowData {
  items: CashFlowItem[];
  summary: CashFlowSummaryData;
  chartData: CashFlowChartData[];
  totalIncome?: number; // For backward compatibility
  totalExpense?: number; // For backward compatibility
  balance?: number; // For backward compatibility
}