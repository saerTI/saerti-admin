import { api } from './apiService';
import type {
  DashboardSummary,
  CashFlowPeriod,
  TypeSummary,
  CategorySummary
} from '../types/dashboard';

export interface ConsolidatedData {
  income: {
    summary: DashboardSummary;
    byType: TypeSummary[];
    byCategory: CategorySummary[];
    cashFlow: CashFlowPeriod[];
  };
  expense: {
    summary: DashboardSummary;
    byType: TypeSummary[];
    byCategory: CategorySummary[];
    cashFlow: CashFlowPeriod[];
  };
}

export interface FinancialKPIs {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  profitMargin: number;
  incomeGrowth: number;
  expenseGrowth: number;
  cashFlowGrowth: number;
  incomeCount: number;
  expenseCount: number;
}

export interface OperationalMetrics {
  costCentersCount: number;
  incomeTypesCount: number;
  expenseTypesCount: number;
  totalTransactions: number;
}

export interface TopTransaction {
  id: number;
  name: string;
  type_name: string;
  category_name: string;
  amount: number;
  date: string;
}

class ConsolidatedDashboardService {
  /**
   * Fetch all consolidated data in parallel
   */
  async fetchAllData(filters: { date_from?: string; date_to?: string; cost_center_id?: number } = {}): Promise<ConsolidatedData> {
    try {
      const [
        incomeSummary,
        incomeByType,
        incomeByCategory,
        incomeCashFlow,
        expenseSummary,
        expenseByType,
        expenseByCategory,
        expenseCashFlow
      ] = await Promise.all([
        this.getIncomeSummary(filters),
        this.getIncomeByType(filters),
        this.getIncomeByCategory(filters),
        this.getIncomeCashFlow(filters),
        this.getExpenseSummary(filters),
        this.getExpenseByType(filters),
        this.getExpenseByCategory(filters),
        this.getExpenseCashFlow(filters)
      ]);

      console.log('Fetched Data:', {
        incomeSummary,
        expenseSummary,
        incomeByType,
        expenseByType
      });

      return {
        income: {
          summary: incomeSummary,
          byType: incomeByType,
          byCategory: incomeByCategory,
          cashFlow: incomeCashFlow
        },
        expense: {
          summary: expenseSummary,
          byType: expenseByType,
          byCategory: expenseByCategory,
          cashFlow: expenseCashFlow
        }
      };
    } catch (error) {
      console.error('Error fetching consolidated data:', error);
      throw error;
    }
  }

  /**
   * Calculate financial KPIs from consolidated data
   */
  calculateKPIs(data: ConsolidatedData): FinancialKPIs {
    const totalIncome = data.income.summary.total_amount || 0;
    const totalExpense = data.expense.summary.total_amount || 0;
    const netCashFlow = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

    // Calculate growth percentages (comparing with previous period)
    // This is a placeholder - you might want to implement proper period comparison
    const incomeGrowth = data.income.summary.trend_percentage || 0;
    const expenseGrowth = data.expense.summary.trend_percentage || 0;
    const cashFlowGrowth = incomeGrowth - expenseGrowth;

    return {
      totalIncome,
      totalExpense,
      netCashFlow,
      profitMargin,
      incomeGrowth,
      expenseGrowth,
      cashFlowGrowth,
      incomeCount: data.income.summary.total_count || 0,
      expenseCount: data.expense.summary.total_count || 0
    };
  }

  /**
   * Get operational metrics
   */
  async getOperationalMetrics(filters: { cost_center_id?: number } = {}): Promise<OperationalMetrics> {
    try {
      // Fetch active types and categories
      const [incomeTypes, expenseTypes] = await Promise.all([
        api.get('/income-types'),
        api.get('/expense-types')
      ]);

      return {
        costCentersCount: 0, // Implement if you have cost centers endpoint
        incomeTypesCount: incomeTypes.data?.data?.length || 0,
        expenseTypesCount: expenseTypes.data?.data?.length || 0,
        totalTransactions: 0 // Will be calculated from summary
      };
    } catch (error) {
      console.error('Error fetching operational metrics:', error);
      return {
        costCentersCount: 0,
        incomeTypesCount: 0,
        expenseTypesCount: 0,
        totalTransactions: 0
      };
    }
  }

  /**
   * Get top N transactions (calculated from full data if endpoint doesn't exist)
   */
  async getTopTransactions(limit: number = 5, filters: { date_from?: string; date_to?: string } = {}): Promise<{
    income: TopTransaction[];
    expense: TopTransaction[];
  }> {
    try {
      // Try to use dedicated endpoint first
      const [incomeTop, expenseTop] = await Promise.all([
        api.get(`/incomes/dashboard/top-transactions`, {
          params: { ...filters, limit }
        }).catch(() => null),
        api.get(`/expenses/dashboard/top-transactions`, {
          params: { ...filters, limit }
        }).catch(() => null)
      ]);

      return {
        income: incomeTop?.data || [],
        expense: expenseTop?.data || []
      };
    } catch (error) {
      console.error('Error fetching top transactions:', error);
      return {
        income: [],
        expense: []
      };
    }
  }

  // Private helper methods for individual endpoints
  private async getIncomeSummary(filters: any) {
    const response = await api.get('/incomes/dashboard/summary', { params: filters });
    console.log('Income Summary Response:', response.data);
    return response.data;
  }

  private async getIncomeByType(filters: any) {
    const response = await api.get('/incomes/dashboard/by-type', { params: filters });
    return response.data;
  }

  private async getIncomeByCategory(filters: any) {
    const response = await api.get('/incomes/dashboard/by-category', { params: filters });
    return response.data;
  }

  private async getIncomeCashFlow(filters: any) {
    const response = await api.get('/incomes/dashboard/cash-flow', { params: filters });
    return response.data;
  }

  private async getExpenseSummary(filters: any) {
    const response = await api.get('/expenses/dashboard/summary', { params: filters });
    console.log('Expense Summary Response:', response.data);
    return response.data;
  }

  private async getExpenseByType(filters: any) {
    const response = await api.get('/expenses/dashboard/by-type', { params: filters });
    return response.data;
  }

  private async getExpenseByCategory(filters: any) {
    const response = await api.get('/expenses/dashboard/by-category', { params: filters });
    return response.data;
  }

  private async getExpenseCashFlow(filters: any) {
    const response = await api.get('/expenses/dashboard/cash-flow', { params: filters });
    return response.data;
  }
}

export const consolidatedDashboardService = new ConsolidatedDashboardService();
