import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import ingresosApiService from '../../services/ingresosService';
import { FinancialAggregationService } from '../../services/financialAggregationService';
import { accountCategoriesService } from '../../services/accountCategoriesService';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Select from "../form/Select";
import Badge from "../ui/badge/Badge";

// Types for cash flow financial data
export interface CashFlowCategory {
  category: string;
  path: string;
  type: 'income' | 'expense';
  amounts: Record<string, number>;
}

export interface CashFlowPeriod {
  id: string;
  label: string | DateRange;
  isDateRange?: boolean;
}

export interface CashFlowFinancialTableProps {
  title: string;
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  year: number;
  onPeriodTypeChange: (periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => void;
  onYearChange: (year: number) => void;
  loading?: boolean;
  className?: string;
  showBadges?: boolean;
  showExpenses?: boolean; // Para futuro uso con gastos
  costCenterId?: number; // Optional cost center filter
}

/**
 * Date range object with start and end dates
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Calculate totals for each period by type
 */
const calculatePeriodTotals = (data: CashFlowCategory[], periods: CashFlowPeriod[], type?: 'income' | 'expense') => {
  const totals: Record<string, number> = {};
  
  periods.forEach(period => {
    totals[period.id] = data
      .filter(item => !type || item.type === type)
      .reduce((sum, item) => sum + (item.amounts[period.id] || 0), 0);
  });
  
  return totals;
};

/**
 * Calculate total for each category
 */
const calculateCategoryTotals = (data: CashFlowCategory[]) => {
  return data.map(item => {
    const total = Object.values(item.amounts).reduce((sum, amount) => sum + (amount || 0), 0);
    return {
      category: item.category,
      path: item.path,
      type: item.type,
      total
    };
  });
};

/**
 * Calculate accumulated totals for each period (sum of current + all previous periods)
 */
const calculateAccumulatedTotals = (periodTotals: Record<string, number>, periods: CashFlowPeriod[]): Record<string, number> => {
  const accumulated: Record<string, number> = {};
  let runningTotal = 0;

  periods.forEach(period => {
    runningTotal += (periodTotals[period.id] || 0);
    accumulated[period.id] = runningTotal;
  });

  return accumulated;
};

/**
 * Generate week periods for a given year
 */
export const generateWeekPeriods = (year: number): CashFlowPeriod[] => {
  return Array(52).fill(0).map((_, i) => {
    const dateRange = getWeekDateRange(year, i + 1);
    return {
      id: `week-${i + 1}`,
      label: dateRange,
      isDateRange: true
    };
  });
};

/**
 * Generate date range for a week in a given year
 */
export const getWeekDateRange = (year: number, weekNumber: number): DateRange => {
  const firstDayOfYear = new Date(year, 0, 1);
  const dayOffset = firstDayOfYear.getDay() || 7;
  const firstMonday = new Date(year, 0, 1 + (8 - dayOffset));
  
  const startDate = new Date(firstMonday);
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

/**
 * Generate month periods for a given year
 */
export const generateMonthPeriods = (year: number): CashFlowPeriod[] => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return months.map((month, i) => ({
    id: `month-${i + 1}`,
    label: month
  }));
};

/**
 * Generate quarter periods for a given year
 */
export const generateQuarterPeriods = (year: number): CashFlowPeriod[] => {
  return Array(4).fill(0).map((_, i) => ({
    id: `quarter-${i + 1}`,
    label: `Q${i + 1}`
  }));
};

/**
 * Generate yearly period
 */
export const generateYearlyPeriods = (year: number): CashFlowPeriod[] => {
  return [{
    id: `year-${year}`,
    label: year.toString()
  }];
};

const CashFlowFinancialTable: React.FC<CashFlowFinancialTableProps> = ({
  title,
  periodType,
  year,
  onPeriodTypeChange,
  onYearChange,
  loading = false,
  className = '',
  showBadges = false,
  showExpenses = false,
  costCenterId
}) => {
  const [data, setData] = useState<CashFlowCategory[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<CashFlowPeriod[]>([]);

  // Income categories
  const incomeCategories = [
    { title: 'Pagos de Clientes', categoryId: 1, path: '/ingresos/categoria/pagos-clientes' },
    { title: 'Anticipos', categoryId: 2, path: '/ingresos/categoria/anticipos' },
    { title: 'Estados de Pago', categoryId: 3, path: '/ingresos/categoria/estados-pago' },
    { title: 'Venta de Activos', categoryId: 4, path: '/ingresos/categoria/venta-activos' },
    { title: 'Devoluciones', categoryId: 5, path: '/ingresos/categoria/devoluciones' },
    { title: 'Subsidios', categoryId: 6, path: '/ingresos/categoria/subsidios' },
    { title: 'Retorno de Inversiones', categoryId: 7, path: '/ingresos/categoria/retorno-inversiones' },
    { title: 'Otros Ingresos', categoryId: 8, path: '/ingresos/categoria/otros' },
  ];

  // Predefined expense categories
  const predefinedExpenseCategories = [
    { title: 'Remuneraciones', key: 'remuneraciones', path: '/costos/remuneraciones' },
    { title: 'Factoring', key: 'factoring', path: '/costos/factoring' },
    { title: 'Previsionales', key: 'previsionales', path: '/costos/previsionales' },
    { title: 'Costos Fijos', key: 'costosFijos', path: '/costos/costos-fijos' },
  ];

  // Generate periods based on periodType and year
  useEffect(() => {
    let newPeriods: CashFlowPeriod[] = [];
    
    switch (periodType) {
      case 'weekly':
        newPeriods = generateWeekPeriods(year);
        break;
      case 'monthly':
        newPeriods = generateMonthPeriods(year);
        break;
      case 'quarterly':
        newPeriods = generateQuarterPeriods(year);
        break;
      case 'yearly':
        newPeriods = generateYearlyPeriods(year);
        break;
      default:
        newPeriods = generateMonthPeriods(year);
    }
    
    setPeriods(newPeriods);
  }, [periodType, year]);

  // Load cash flow data
  useEffect(() => {
    const fetchCashFlowData = async () => {
      if (!periods.length) return;

      try {
        setLoadingData(true);
        setError(null);
        
        console.log('🔄 Loading cash flow financial data for periods:', periods.length);

        // Generate data for income categories
        const incomeDataPromises = incomeCategories.map(async (category) => {
          const periodAmounts: Record<string, number> = {};

          // Get data for each period
          for (const period of periods) {
            const range = getPeriodDateRange(period, periodType, year);
            if (range) {
              try {
                const response = await ingresosApiService.getIngresos({
                  categoryId: category.categoryId,
                  startDate: range.startDate,
                  endDate: range.endDate,
                  limit: 1000
                });

                const totalAmount = response.data?.reduce((sum, ingreso) => sum + ingreso.total_amount, 0) || 0;
                periodAmounts[period.id] = totalAmount;
              } catch (error) {
                console.warn(`Error fetching data for ${category.title} - ${period.label}:`, error);
                periodAmounts[period.id] = 0;
              }
            } else {
              periodAmounts[period.id] = 0;
            }
          }

          return {
            category: category.title,
            path: category.path,
            type: 'income' as const,
            amounts: periodAmounts
          };
        });

        const incomeData = await Promise.all(incomeDataPromises);

        // Load real expense data when showExpenses is true
        let allData: CashFlowCategory[] = [...incomeData];

        if (showExpenses) {
          console.log('🔄 Loading expense data from FinancialAggregationService...');

          try {
            // Convert periods to the format expected by FinancialAggregationService
            const financialPeriods = periods.map(p => ({
              id: p.id,
              label: p.label,
              isDateRange: p.isDateRange
            }));

            // Load financial data using the aggregation service
            const financialData = await FinancialAggregationService.getAllFinancialData({
              periods: financialPeriods,
              year: year,
              costCenterId: costCenterId // Apply cost center filter if provided
            });

            console.log('📊 Financial data loaded:', financialData);

            // Convert predefined categories to CashFlowCategory format
            const expenseData: CashFlowCategory[] = [];

            // Add predefined expense categories
            for (const category of predefinedExpenseCategories) {
              const amounts = financialData[category.key] || {};
              const hasData = Object.values(amounts).some(amt => amt > 0);

              if (hasData) {
                expenseData.push({
                  category: category.title,
                  path: category.path,
                  type: 'expense',
                  amounts: amounts
                });
              }
            }

            // Load and add account categories (from purchase orders)
            try {
              const accountCategories = await accountCategoriesService.getActiveCategories();
              console.log('📋 Account categories loaded:', accountCategories.length);

              for (const accCategory of accountCategories) {
                const categoryKey = FinancialAggregationService.generateCategoryKey(accCategory);
                const amounts = financialData[categoryKey];

                if (amounts && Object.values(amounts).some(amt => amt > 0)) {
                  expenseData.push({
                    category: accCategory.name,
                    path: `/costos/categoria/${accCategory.id}`,
                    type: 'expense',
                    amounts: amounts
                  });
                }
              }
            } catch (error) {
              console.warn('⚠️ Error loading account categories:', error);
            }

            console.log(`✅ Loaded ${expenseData.length} expense categories with data`);
            allData = [...incomeData, ...expenseData];
          } catch (error) {
            console.error('❌ Error loading expense data:', error);
            // Keep only income data on error
            allData = [...incomeData];
          }
        }

        setData(allData);
        console.log('✅ Cash flow financial data loaded successfully');
        
      } catch (err) {
        console.error('❌ Error fetching cash flow financial data:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos financieros');
      } finally {
        setLoadingData(false);
      }
    };

    fetchCashFlowData();
  }, [periods, periodType, year, showExpenses, costCenterId]);

  // Helper function to get date range for a specific period
  const getPeriodDateRange = (period: CashFlowPeriod, periodType: string, year: number): { startDate: string; endDate: string } | null => {
    switch (periodType) {
      case 'weekly':
        if (period.isDateRange && typeof period.label !== 'string') {
          const startParts = period.label.startDate.split('/');
          const endParts = period.label.endDate.split('/');
          return {
            startDate: `${year}-${startParts[1].padStart(2, '0')}-${startParts[0].padStart(2, '0')}`,
            endDate: `${year}-${endParts[1].padStart(2, '0')}-${endParts[0].padStart(2, '0')}`
          };
        }
        break;
      case 'monthly':
        const monthNum = parseInt(period.id.split('-')[1]);
        const startOfMonth = new Date(year, monthNum - 1, 1);
        const endOfMonth = new Date(year, monthNum, 0);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        };
      case 'quarterly':
        const quarterNum = parseInt(period.id.split('-')[1]);
        const startMonth = (quarterNum - 1) * 3;
        const startOfQuarter = new Date(year, startMonth, 1);
        const endOfQuarter = new Date(year, startMonth + 3, 0);
        return {
          startDate: startOfQuarter.toISOString().split('T')[0],
          endDate: endOfQuarter.toISOString().split('T')[0]
        };
      case 'yearly':
        return {
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`
        };
    }
    return null;
  };

  // Calculate totals
  const incomeData = data.filter(item => item.type === 'income');
  const expenseData = data.filter(item => item.type === 'expense');
  
  const incomeTotals = calculatePeriodTotals(data, periods, 'income');
  const expenseTotals = calculatePeriodTotals(data, periods, 'expense');
  const netTotals: Record<string, number> = {};

  periods.forEach(period => {
    netTotals[period.id] = (incomeTotals[period.id] || 0) - (expenseTotals[period.id] || 0);
  });

  // Calculate accumulated totals for income, expenses, and net flow
  const incomeAccumulatedTotals = calculateAccumulatedTotals(incomeTotals, periods);
  const expenseAccumulatedTotals = calculateAccumulatedTotals(expenseTotals, periods);
  const netAccumulatedTotals = calculateAccumulatedTotals(netTotals, periods);

  const categoryTotals = calculateCategoryTotals(data);
  const grandTotalIncome = Object.values(incomeTotals).reduce((sum, amount) => sum + amount, 0);
  const grandTotalExpense = Object.values(expenseTotals).reduce((sum, amount) => sum + amount, 0);
  const grandTotalNet = grandTotalIncome - grandTotalExpense;
  
  // Badge colors for cash flow values
  const getBadgeColor = (amount: number, type: 'income' | 'expense'): 'success' | 'error' | 'warning' => {
    if (!showBadges) return type === 'income' ? 'success' : 'error';
    
    if (type === 'income') {
      return amount > 1000000 ? 'success' : amount > 100000 ? 'warning' : 'error';
    } else {
      return amount > 1000000 ? 'error' : amount > 100000 ? 'warning' : 'success';
    }
  };

  const isLoading = loading || loadingData;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Header with period controls */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
          
          {/* Period controls */}
          <div className="flex items-center gap-4">
            {/* Period Type Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</label>
              <select
                value={periodType}
                onChange={(e) => onPeriodTypeChange(e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly')}
                className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-700 dark:text-white/90"
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Año:</label>
              <select
                value={year}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-700 dark:text-white/90"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const yearOption = new Date().getFullYear() - 5 + i;
                  return (
                    <option key={yearOption} value={yearOption}>
                      {yearOption}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-sm sticky left-0 bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                >
                  FLUJO DE CAJA
                </TableCell>
                
                {/* Period Headers */}
                {periods.map((period, index) => (
                  <TableCell
                    key={index}
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-300"
                  >
                    {period.isDateRange && typeof period.label !== 'string' ? (
                      <div className="flex flex-col">
                        <span>{period.label.startDate}</span>
                        <span>{period.label.endDate}</span>
                      </div>
                    ) : (
                      <>{period.label}</>
                    )}
                  </TableCell>
                ))}
                
                {/* Total Header */}
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-300"
                >
                  TOTAL
                </TableCell>
              </TableRow>
            </TableHeader>
            
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {/* Income Section Header */}
              <TableRow className="bg-green-50 dark:bg-green-900/20">
                <TableCell className="px-5 py-2 font-bold text-green-700 text-sm sticky left-0 bg-green-50 dark:bg-green-900/20 dark:text-green-300">
                  INGRESOS
                </TableCell>
                {periods.map((period, index) => (
                  <TableCell key={index} className="px-5 py-2">&nbsp;</TableCell>
                ))}
                <TableCell className="px-5 py-2">&nbsp;</TableCell>
              </TableRow>

              {/* Income Data Rows */}
              {incomeData.map((item, index) => (
                <TableRow key={`income-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <TableCell className="px-5 py-3 font-medium text-gray-800 text-sm sticky left-0 bg-white dark:bg-gray-800 dark:text-white">
                    <Link
                      to={item.path}
                      className="text-green-600 hover:text-green-700 dark:text-green-400 hover:underline"
                    >
                      {item.category}
                    </Link>
                  </TableCell>
                  
                  {/* Period Values */}
                  {periods.map((period, pIndex) => (
                    <TableCell
                      key={pIndex}
                      className={`px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-300 ${period.isDateRange ? 'align-middle' : ''}`}
                    >
                      {item.amounts[period.id] > 0 ? (
                        showBadges ? (
                          <Badge
                            size="sm"
                            color={getBadgeColor(item.amounts[period.id], 'income')}
                          >
                            {formatCurrency(item.amounts[period.id])}
                          </Badge>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
                            {formatCurrency(item.amounts[period.id])}
                          </span>
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  ))}
                  
                  {/* Row Total */}
                  <TableCell className="px-5 py-3 text-right font-medium text-sm text-green-600 dark:text-green-400">
                    {formatCurrency(categoryTotals.find(ct => ct.category === item.category)?.total || 0)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Income Total Row */}
              <TableRow className="bg-green-100 dark:bg-green-900/30 font-bold">
                <TableCell className="px-5 py-3 text-green-800 text-sm sticky left-0 bg-green-100 dark:bg-green-900/30 dark:text-green-300">
                  TOTAL INGRESOS
                </TableCell>

                {periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className={`px-5 py-3 text-right text-sm text-green-800 dark:text-green-300 ${period.isDateRange ? 'align-middle' : ''}`}
                  >
                    {formatCurrency(incomeTotals[period.id] || 0)}
                  </TableCell>
                ))}

                <TableCell className="px-5 py-3 text-right text-sm text-green-800 dark:text-green-300">
                  {formatCurrency(grandTotalIncome)}
                </TableCell>
              </TableRow>

              {/* Accumulated Income Total Row */}
              <TableRow className="bg-green-200 dark:bg-green-800/40 font-bold">
                <TableCell className="px-5 py-3 text-green-900 text-sm sticky left-0 bg-green-200 dark:bg-green-800/40 dark:text-green-200">
                  TOTAL ACUMULADO
                </TableCell>

                {periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className={`px-5 py-3 text-right text-sm text-green-900 dark:text-green-200 ${period.isDateRange ? 'align-middle' : ''}`}
                  >
                    {formatCurrency(incomeAccumulatedTotals[period.id] || 0)}
                  </TableCell>
                ))}

                <TableCell className="px-5 py-3 text-right text-sm text-green-900 dark:text-green-200">
                  {formatCurrency(grandTotalIncome)}
                </TableCell>
              </TableRow>

              {/* Expense Section (if enabled) */}
              {showExpenses && (
                <>
                  {/* Expense Section Header */}
                  <TableRow className="bg-red-50 dark:bg-red-900/20">
                    <TableCell className="px-5 py-2 font-bold text-red-700 text-sm sticky left-0 bg-red-50 dark:bg-red-900/20 dark:text-red-300">
                      EGRESOS
                    </TableCell>
                    {periods.map((period, index) => (
                      <TableCell key={index} className="px-5 py-2">&nbsp;</TableCell>
                    ))}
                    <TableCell className="px-5 py-2">&nbsp;</TableCell>
                  </TableRow>

                  {/* Expense Data Rows */}
                  {expenseData.map((item, index) => (
                    <TableRow key={`expense-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="px-5 py-3 font-medium text-gray-800 text-sm sticky left-0 bg-white dark:bg-gray-800 dark:text-white">
                        <Link
                          to={item.path}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 hover:underline"
                        >
                          {item.category}
                        </Link>
                      </TableCell>
                      
                      {/* Period Values */}
                      {periods.map((period, pIndex) => (
                        <TableCell
                          key={pIndex}
                          className={`px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-300 ${period.isDateRange ? 'align-middle' : ''}`}
                        >
                          {item.amounts[period.id] > 0 ? (
                            showBadges ? (
                              <Badge
                                size="sm"
                                color={getBadgeColor(item.amounts[period.id], 'expense')}
                              >
                                {formatCurrency(item.amounts[period.id])}
                              </Badge>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">
                                {formatCurrency(item.amounts[period.id])}
                              </span>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      ))}
                      
                      {/* Row Total */}
                      <TableCell className="px-5 py-3 text-right font-medium text-sm text-red-600 dark:text-red-400">
                        {formatCurrency(categoryTotals.find(ct => ct.category === item.category)?.total || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Expense Total Row */}
                  <TableRow className="bg-red-100 dark:bg-red-900/30 font-bold">
                    <TableCell className="px-5 py-3 text-red-800 text-sm sticky left-0 bg-red-100 dark:bg-red-900/30 dark:text-red-300">
                      TOTAL EGRESOS
                    </TableCell>

                    {periods.map((period, index) => (
                      <TableCell
                        key={index}
                        className={`px-5 py-3 text-right text-sm text-red-800 dark:text-red-300 ${period.isDateRange ? 'align-middle' : ''}`}
                      >
                        {formatCurrency(expenseTotals[period.id] || 0)}
                      </TableCell>
                    ))}

                    <TableCell className="px-5 py-3 text-right text-sm text-red-800 dark:text-red-300">
                      {formatCurrency(grandTotalExpense)}
                    </TableCell>
                  </TableRow>

                  {/* Accumulated Expense Total Row */}
                  <TableRow className="bg-red-200 dark:bg-red-800/40 font-bold">
                    <TableCell className="px-5 py-3 text-red-900 text-sm sticky left-0 bg-red-200 dark:bg-red-800/40 dark:text-red-200">
                      TOTAL ACUMULADO EGRESOS
                    </TableCell>

                    {periods.map((period, index) => (
                      <TableCell
                        key={index}
                        className={`px-5 py-3 text-right text-sm text-red-900 dark:text-red-200 ${period.isDateRange ? 'align-middle' : ''}`}
                      >
                        {formatCurrency(expenseAccumulatedTotals[period.id] || 0)}
                      </TableCell>
                    ))}

                    <TableCell className="px-5 py-3 text-right text-sm text-red-900 dark:text-red-200">
                      {formatCurrency(grandTotalExpense)}
                    </TableCell>
                  </TableRow>

                  {/* Net Cash Flow Row */}
                  <TableRow className="bg-blue-100 dark:bg-blue-900/30 font-bold">
                    <TableCell className="px-5 py-3 text-blue-800 text-sm sticky left-0 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                      FLUJO NETO
                    </TableCell>

                    {periods.map((period, index) => (
                      <TableCell
                        key={index}
                        className={`px-5 py-3 text-right text-sm font-bold ${
                          netTotals[period.id] >= 0
                            ? 'text-green-800 dark:text-green-300'
                            : 'text-red-800 dark:text-red-300'
                        } ${period.isDateRange ? 'align-middle' : ''}`}
                      >
                        {formatCurrency(netTotals[period.id] || 0)}
                      </TableCell>
                    ))}

                    <TableCell className={`px-5 py-3 text-right text-sm font-bold ${
                      grandTotalNet >= 0
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}>
                      {formatCurrency(grandTotalNet)}
                    </TableCell>
                  </TableRow>

                  {/* Accumulated Net Cash Flow Row */}
                  <TableRow className="bg-blue-200 dark:bg-blue-800/40 font-bold">
                    <TableCell className="px-5 py-3 text-blue-900 text-sm sticky left-0 bg-blue-200 dark:bg-blue-800/40 dark:text-blue-200">
                      FLUJO NETO ACUMULADO
                    </TableCell>

                    {periods.map((period, index) => (
                      <TableCell
                        key={index}
                        className={`px-5 py-3 text-right text-sm font-bold ${
                          netAccumulatedTotals[period.id] >= 0
                            ? 'text-green-900 dark:text-green-200'
                            : 'text-red-900 dark:text-red-200'
                        } ${period.isDateRange ? 'align-middle' : ''}`}
                      >
                        {formatCurrency(netAccumulatedTotals[period.id] || 0)}
                      </TableCell>
                    ))}

                    <TableCell className={`px-5 py-3 text-right text-sm font-bold ${
                      grandTotalNet >= 0
                        ? 'text-green-900 dark:text-green-200'
                        : 'text-red-900 dark:text-red-200'
                    }`}>
                      {formatCurrency(grandTotalNet)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CashFlowFinancialTable;
