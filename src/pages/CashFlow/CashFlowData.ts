// src/pages/CashFlow/CashFlowData.ts
import cashFlowService from '../../services/cashFlowService';
import { 
  DateRange, 
  CashFlowData, 
  CashFlowItem, 
  CashFlowSummaryData,
  CashFlowChartData
} from '../../types/cashFlow';

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

// Function to fetch cash flow data
export const fetchCashFlowData = async (dateRange: DateRange): Promise<CashFlowData> => {
  try {
    // Get data from service
    const data = await cashFlowService.fetchCashFlowData(dateRange);
    
    // If the API already returns data in the expected format
    if (data.summary && data.chartData) {
      return data;
    }
    
    // Otherwise, transform the data to match the expected interface
    // This handles the case where your API returns a flatter structure
    return {
      items: data.items || [],
      summary: {
        totalIncome: data.totalIncome || 0,
        totalExpense: data.totalExpense || 0,
        netCashFlow: data.balance || 0, // Assuming balance is netCashFlow
        previousPeriodChange: 0, // Default value if not available
      },
      chartData: generateChartData(data.items || []),
      // Keep original properties for backward compatibility
      totalIncome: data.totalIncome,
      totalExpense: data.totalExpense,
      balance: data.balance
    };
  } catch (error) {
    console.error('Error fetching cash flow data:', error);
    
    // Return mock data as fallback for development
    return getMockCashFlowData();
  }
};

// Helper function to generate chart data from items
function generateChartData(items: CashFlowItem[]): CashFlowChartData[] {
  // Group items by week or month
  const weeks: { [key: string]: { income: number, expense: number } } = {};
  
  // Process each item
  items.forEach(item => {
    // Get the week of the month (or any other grouping logic)
    const date = new Date(item.date);
    const weekNumber = Math.ceil(date.getDate() / 7);
    const weekKey = `Semana ${weekNumber}`;
    
    // Initialize the week if not exists
    if (!weeks[weekKey]) {
      weeks[weekKey] = { income: 0, expense: 0 };
    }
    
    // Add to the corresponding type
    if (item.type === 'income') {
      weeks[weekKey].income += item.amount;
    } else {
      weeks[weekKey].expense += item.amount;
    }
  });
  
  // Convert to array format
  return Object.entries(weeks).map(([name, data]) => ({
    name,
    income: data.income,
    expense: data.expense,
    balance: data.income - data.expense
  }));
}

// Function to fetch cash flow categories
export const fetchCashFlowCategories = async (): Promise<any[]> => {
  try {
    return await cashFlowService.fetchCashFlowCategories();
  } catch (error) {
    console.error('Error fetching cash flow categories:', error);
    throw new Error('No se pudo cargar las categorías');
  }
};

// Function to generate report
export const generateCashFlowReport = async (
  dateRange: DateRange,
  options: Record<string, any> = {}
): Promise<any> => {
  try {
    return await cashFlowService.generateCashFlowReport(dateRange, options);
  } catch (error) {
    console.error('Error generating cash flow report:', error);
    throw new Error('No se pudo generar el reporte');
  }
};

// Mock data function to provide development fallback
const getMockCashFlowData = (): CashFlowData => {
  const items = [
    { id: 1, date: '2023-05-01', description: 'Pago de Cliente - Project A', category: 'Ventas', amount: 25000, type: 'income' as const },
    { id: 2, date: '2023-05-03', description: 'Compra de materiales', category: 'Materiales', amount: 12000, type: 'expense' as const },
    { id: 3, date: '2023-05-05', description: 'Pago a Contratista', category: 'Mano de Obra', amount: 15000, type: 'expense' as const },
    { id: 4, date: '2023-05-10', description: 'Pago de Cliente - Project B', category: 'Ventas', amount: 30000, type: 'income' as const },
    { id: 5, date: '2023-05-15', description: 'Renta de Maquinaria', category: 'Equipamiento', amount: 8000, type: 'expense' as const },
    { id: 6, date: '2023-05-20', description: 'Pago de Cliente - Project C', category: 'Ventas', amount: 30000, type: 'income' as const },
    { id: 7, date: '2023-05-25', description: 'Utilidades', category: 'Oficina', amount: 5000, type: 'expense' as const },
    { id: 8, date: '2023-05-28', description: 'Gastos Trámites', category: 'Permisos', amount: 10000, type: 'expense' as const },
    { id: 9, date: '2023-05-30', description: 'Pago de Seguros', category: 'Seguros', amount: 15000, type: 'expense' as const },
  ];
  
  const totalIncome = items.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = items.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0);
  
  return {
    items,
    summary: {
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      previousPeriodChange: 15.5,
    },
    chartData: [
      { name: 'Semana 1', income: 25000, expense: 12000, balance: 13000 },
      { name: 'Semana 2', income: 30000, expense: 15000, balance: 15000 },
      { name: 'Semana 3', income: 30000, expense: 8000, balance: 22000 },
      { name: 'Semana 4', income: 0, expense: 30000, balance: -30000 },
    ],
    // For backward compatibility
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  };
};

// Export the interfaces for use in other files
export type { 
  DateRange,
  CashFlowData, 
  CashFlowItem, 
  CashFlowSummaryData,
  CashFlowChartData
};