import odooAPI from '../../services/odooService';

// Types for CashFlow data
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface CashFlowSummaryData {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  previousPeriodChange: number;
}

export interface CashFlowItem {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface CashFlowChartData {
  name: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CashFlowData {
  summary: CashFlowSummaryData;
  items: CashFlowItem[];
  chartData: CashFlowChartData[];
}

// Default date range - current month
export const getDefaultDateRange = (): DateRange => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0],
  };
};

// Function to fetch cash flow data from Odoo
export const fetchCashFlowData = async (dateRange: DateRange): Promise<CashFlowData> => {
  try {
    // Call Odoo API to get cash flow data
    const data = await odooAPI.getCashFlowData(dateRange.startDate, dateRange.endDate);
    return data as CashFlowData;
  } catch (error) {
    console.error('Error fetching cash flow data:', error);
    // If there's an error, throw it to be handled by the component
    throw new Error('No se pudo cargar los datos de flujo de caja');
  }
};

// Function to fetch cash flow categories from Odoo
export const fetchCashFlowCategories = async (): Promise<any[]> => {
  try {
    // Call Odoo API to get categories
    const categories = await odooAPI.getCashFlowCategories();
    return categories;
  } catch (error) {
    console.error('Error fetching cash flow categories:', error);
    throw new Error('No se pudo cargar las categorías');
  }
};

// Function to generate report from Odoo
export const generateCashFlowReport = async (
  dateRange: DateRange,
  options: Record<string, any> = {}
): Promise<any> => {
  try {
    const report = await odooAPI.generateCashFlowReport(
      dateRange.startDate,
      dateRange.endDate,
      options
    );
    return report;
  } catch (error) {
    console.error('Error generating cash flow report:', error);
    throw new Error('No se pudo generar el reporte');
  }
};