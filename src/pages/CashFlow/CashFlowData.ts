/**
 * CashFlow Data Management
 * 
 * This module integrates real income data (ingresos) with cash flow visualization.
 * The ingresos are transformed to match the CashFlowItem interface:
 * 
 * Mapping:
 * - date -> date (from ingreso)
 * - description -> ep_detail or client_name + document_number
 * - category -> category_name
 * - type -> "income" (always for ingresos)
 * - amount -> total_amount
 * 
 * Only includes ingresos with states: 'activo', 'facturado', 'pagado'
 * Excludes: 'borrador' and 'cancelado' for accurate cash flow representation
 */

// src/pages/CashFlow/CashFlowData.ts
import cashFlowService from '../../services/cashFlowService';
import ingresosApiService from '../../services/ingresosService';
import { 
  DateRange, 
  CashFlowData, 
  CashFlowItem, 
  CashFlowSummaryData,
  CashFlowChartData
} from '../../types/cashFlow';
import { Ingreso, IngresoFilter } from '../../types/CC/ingreso';

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

// Function to convert Ingreso to CashFlowItem
const transformIngresoToCashFlowItem = (ingreso: Ingreso): CashFlowItem => {
  // Create a more descriptive description
  let description = '';
  
  if (ingreso.ep_detail && ingreso.ep_detail.trim()) {
    description = ingreso.ep_detail;
  } else if (ingreso.client_name && ingreso.client_name.trim()) {
    description = `Ingreso de ${ingreso.client_name}`;
  } else {
    description = `Documento ${ingreso.document_number}`;
  }
  
  // Add document number if not already included
  if (!description.includes(ingreso.document_number)) {
    description += ` (${ingreso.document_number})`;
  }

  return {
    id: ingreso.id,
    date: ingreso.date,
    description: description,
    category: ingreso.category_name || 'Sin categoría',
    amount: ingreso.total_amount,
    type: 'income' as const,
    state: 'actual',
    cost_center_name: ingreso.center_name || undefined,
    source_type: 'ingresos'
  };
};

// Function to fetch ingresos and transform them
const fetchIngresosAsCashFlowItems = async (dateRange: DateRange): Promise<CashFlowItem[]> => {
  try {
    const filter: IngresoFilter = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      // Only include active, invoiced and paid ingresos for cash flow
      state: undefined, // Include all states for now, can be filtered later
      limit: 1000, // Obtener un número suficiente de registros
      sortBy: 'date',
      sortDirection: 'desc'
    };

    const response = await ingresosApiService.getIngresos(filter);
    const ingresos = response.data || [];
    
    // Filter by relevant states for cash flow (exclude 'borrador' and 'cancelado')
    const relevantIngresos = ingresos.filter(ingreso => 
      ingreso.state === 'activo' || 
      ingreso.state === 'facturado' || 
      ingreso.state === 'pagado'
    );
    
    return relevantIngresos.map(transformIngresoToCashFlowItem);
  } catch (error) {
    console.error('Error fetching ingresos for cash flow:', error);
    return [];
  }
};

// Function to fetch cash flow data
export const fetchCashFlowData = async (dateRange: DateRange): Promise<CashFlowData> => {
  try {
    // Fetch both cash flow data and ingresos in parallel
    const [cashFlowResult, ingresosItems] = await Promise.all([
      cashFlowService.getCashFlowData({ periodType: 'monthly', year: new Date().getFullYear().toString() }).catch(() => null), // Allow to fail
      fetchIngresosAsCashFlowItems(dateRange)
    ]);
    
    // Get expenses from existing cash flow service or use empty array
    const existingItems = cashFlowResult?.recentItems || [];
    const expenseItems = existingItems.filter(item => item.type === 'expense');
    
    // Combine ingresos (income) with existing expenses
    const allItems = [...ingresosItems, ...expenseItems];
    
    // Calculate totals
    const totalIncome = allItems
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const totalExpense = allItems
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const netCashFlow = totalIncome - totalExpense;
    
    // Generate chart data from all items
    const chartData = generateChartData(allItems);
    
    return {
      recentItems: allItems,
      summary: {
        totalIncome,
        totalExpense,
        netCashFlow,
        forecastIncome: 0,
        forecastExpense: 0,
        actualIncome: totalIncome,
        actualExpense: totalExpense,
        pendingItems: 0,
        totalItems: allItems.length,
        previousPeriodChange: 0, // Could be calculated if needed
        costsExpense: totalExpense,
        remuneracionesExpense: 0
      },
      byCategoryData: [],
      emptyCategoriesData: [],
      chartData,
      // Keep original properties for backward compatibility
      items: allItems,
      totalIncome,
      totalExpense,
      balance: netCashFlow
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
    balance: data.income - data.expense,
    forecast_income: 0,
    forecast_expense: 0,
    actual_income: data.income,
    actual_expense: data.expense,
    costs_expense: data.expense,
    remuneraciones_expense: 0
  }));
}

// Function to fetch cash flow categories
export const fetchCashFlowCategories = async (): Promise<any[]> => {
  try {
    // Use getFilterOptions from service
    const options = await cashFlowService.getFilterOptions();
    return options.categories || [];
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
    // For now, return mock report data
    const data = await fetchCashFlowData(dateRange);
    return {
      summary: data.summary,
      items: data.recentItems,
      chartData: data.chartData,
      dateRange,
      generatedAt: new Date().toISOString(),
      options
    };
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
    { id: 10, date: '2023-05-15', description: 'Renta de Maquinaria', category: 'Equipamiento', amount: 8000, type: 'expense' as const },
    { id: 11, date: '2023-05-20', description: 'Pago de Cliente - Project C', category: 'Ventas', amount: 30000, type: 'income' as const },
    { id: 12, date: '2023-05-25', description: 'Utilidades', category: 'Oficina', amount: 5000, type: 'expense' as const },
    { id: 13, date: '2023-05-28', description: 'Gastos Trámites', category: 'Permisos', amount: 10000, type: 'expense' as const },
    { id: 14, date: '2023-05-30', description: 'Pago de Seguros', category: 'Seguros', amount: 15000, type: 'expense' as const },
    { id: 15, date: '2023-05-15', description: 'Renta de Maquinaria', category: 'Equipamiento', amount: 8000, type: 'expense' as const },
    { id: 16, date: '2023-05-20', description: 'Pago de Cliente - Project C', category: 'Ventas', amount: 30000, type: 'income' as const },
    { id: 17, date: '2023-05-25', description: 'Utilidades', category: 'Oficina', amount: 5000, type: 'expense' as const },
    { id: 18, date: '2023-05-28', description: 'Gastos Trámites', category: 'Permisos', amount: 10000, type: 'expense' as const },
    { id: 19, date: '2023-05-30', description: 'Pago de Seguros', category: 'Seguros', amount: 15000, type: 'expense' as const },
    { id: 20, date: '2023-05-15', description: 'Renta de Maquinaria', category: 'Equipamiento', amount: 8000, type: 'expense' as const },
    { id: 6, date: '2023-05-20', description: 'Pago de Cliente - Project C', category: 'Ventas', amount: 30000, type: 'income' as const },
    { id: 7, date: '2023-05-25', description: 'Utilidades', category: 'Oficina', amount: 5000, type: 'expense' as const },
    { id: 8, date: '2023-05-28', description: 'Gastos Trámites', category: 'Permisos', amount: 10000, type: 'expense' as const },
    { id: 9, date: '2023-05-30', description: 'Pago de Seguros', category: 'Seguros', amount: 15000, type: 'expense' as const },
  ];
  
  const totalIncome = items.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = items.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0);
  
  return {
    recentItems: items,
    summary: {
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      forecastIncome: 0,
      forecastExpense: 0,
      actualIncome: totalIncome,
      actualExpense: totalExpense,
      pendingItems: 0,
      totalItems: items.length,
      previousPeriodChange: 15.5,
      costsExpense: totalExpense,
      remuneracionesExpense: 0
    },
    byCategoryData: [],
    emptyCategoriesData: [],
    chartData: [
      { name: 'Semana 1', income: 25000, expense: 12000, balance: 13000, forecast_income: 0, forecast_expense: 0, actual_income: 25000, actual_expense: 12000, costs_expense: 12000, remuneraciones_expense: 0 },
      { name: 'Semana 2', income: 30000, expense: 15000, balance: 15000, forecast_income: 0, forecast_expense: 0, actual_income: 30000, actual_expense: 15000, costs_expense: 15000, remuneraciones_expense: 0 },
      { name: 'Semana 3', income: 30000, expense: 8000, balance: 22000, forecast_income: 0, forecast_expense: 0, actual_income: 30000, actual_expense: 8000, costs_expense: 8000, remuneraciones_expense: 0 },
      { name: 'Semana 4', income: 0, expense: 30000, balance: -30000, forecast_income: 0, forecast_expense: 0, actual_income: 0, actual_expense: 30000, costs_expense: 30000, remuneraciones_expense: 0 },
    ],
    // For backward compatibility
    items,
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