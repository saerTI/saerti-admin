// src/components/tables/FinancialTable.tsx - VERSIÓN CORREGIDA COMPLETA

import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../ui/table';
import { formatCurrency } from '../../utils/formatters';
import Badge from '../ui/badge/Badge';

// Existing interfaces...
export interface FinancialPeriod {
  id: string;
  label: string | { startDate: string; endDate: string };
  isDateRange?: boolean;
}

export interface FinancialCategory {
  category: string;
  amounts: Record<string, number>;
  path: string;
}

interface FinancialTableProps {
  title?: string;
  type: 'income' | 'expense';
  periods: FinancialPeriod[];
  data: FinancialCategory[];
  loading?: boolean;
  className?: string;
  showBadges?: boolean;
}

// Utility functions
const calculatePeriodTotals = (data: FinancialCategory[], periods: FinancialPeriod[]): Record<string, number> => {
  const totals: Record<string, number> = {};
  
  periods.forEach(period => {
    totals[period.id] = data.reduce((sum, category) => {
      return sum + (category.amounts[period.id] || 0);
    }, 0);
  });
  
  return totals;
};

const calculateCategoryTotals = (data: FinancialCategory[]): Record<string, number> => {
  const totals: Record<string, number> = {};

  data.forEach(category => {
    totals[category.category] = Object.values(category.amounts).reduce((sum, amount) => sum + amount, 0);
  });

  return totals;
};

/**
 * Calculate accumulated totals for each period (sum of current + all previous periods)
 */
const calculateAccumulatedTotals = (periodTotals: Record<string, number>, periods: FinancialPeriod[]): Record<string, number> => {
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
export const generateWeekPeriods = (year: number): FinancialPeriod[] => {
  const periods: FinancialPeriod[] = [];
  const startDate = new Date(year, 0, 1);
  
  for (let week = 1; week <= 52; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (week - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    periods.push({
      id: `week-${week}`,
      label: {
        startDate: weekStart.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        endDate: weekEnd.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
      },
      isDateRange: true
    });
  }
  
  return periods;
};

/**
 * Generate month periods for a given year
 */
export const generateMonthPeriods = (year: number): FinancialPeriod[] => {
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
export const generateQuarterPeriods = (year: number): FinancialPeriod[] => {
  return Array(4).fill(0).map((_, i) => ({
    id: `quarter-${i + 1}`,
    label: `Q${i + 1}`
  }));
};

const FinancialTable: React.FC<FinancialTableProps> = ({
  title,
  type,
  periods,
  data,
  loading = false,
  className = '',
  showBadges = false
}) => {
  // Calculate totals
  const periodTotals = calculatePeriodTotals(data, periods);
  const categoryTotals = calculateCategoryTotals(data);
  const grandTotal = Object.values(periodTotals).reduce((sum, amount) => sum + amount, 0);

  // Calculate accumulated totals
  const accumulatedTotals = calculateAccumulatedTotals(periodTotals, periods);
  
  // Determine color based on financial type
  const titleColor = type === 'income' ? 'text-green-600' : 'text-red-600';
  
  // Badge colors for income/expense values
  const getBadgeColor = (amount: number): 'success' | 'error' | 'warning' => {
    if (!showBadges) return type === 'income' ? 'success' : 'error';
    
    if (type === 'income') {
      return amount > 1000000 ? 'success' : amount > 100000 ? 'warning' : 'error';
    } else {
      return amount > 1000000 ? 'error' : amount > 100000 ? 'warning' : 'success';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-xl font-semibold ${titleColor}`}>{title}</h2>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            {/* ✅ HEADER CON CORRECCIONES DE HOVER */}
            <TableHeader className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <TableRow className="hover:!bg-gray-50 dark:hover:!bg-gray-700">
                {/* ✅ PRIMERA COLUMNA - ALINEADA CON CONTENIDO */}
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-sm sticky left-0 bg-gray-50 dark:bg-gray-700 dark:text-gray-300 z-50"
                >
                  {type === 'income' ? 'INGRESOS' : 'EGRESOS'}
                </TableCell>
                
                {/* ✅ PERIOD HEADERS - ALINEADOS CON LOS DATOS */}
                {periods.map((period, index) => (
                  <TableCell
                    key={index}
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-right text-sm dark:text-gray-300 min-w-[120px]"
                  >
                    {period.isDateRange && typeof period.label !== 'string' ? (
                      <div className="flex flex-col text-xs">
                        <span>{period.label.startDate}</span>
                        <span>{period.label.endDate}</span>
                      </div>
                    ) : (
                      <>{period.label}</>
                    )}
                  </TableCell>
                ))}
                
                {/* ✅ TOTAL HEADER - ALINEADO CON LOS DATOS */}
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-right text-sm dark:text-gray-300 min-w-[120px]"
                >
                  TOTAL
                </TableCell>
              </TableRow>
            </TableHeader>
            
            {/* ✅ BODY CON CORRECCIONES DE HOVER */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] bg-white dark:bg-gray-800">
              {/* ✅ DATA ROWS - HOVER CORREGIDO */}
              {data.map((item, index) => (
                <TableRow 
                  key={index} 
                  className="group hover:!bg-gray-50 dark:hover:!bg-white/[0.02] transition-colors duration-150"
                >
                  {/* ✅ PRIMERA COLUMNA - ALINEADA A LA IZQUIERDA COMO EL HEADER */}
                  <TableCell className="px-5 py-3 font-medium text-gray-800 text-sm sticky left-0 bg-white dark:bg-gray-800 dark:text-white text-start z-40 group-hover:!bg-gray-50 dark:group-hover:!bg-gray-800">
                    <Link
                      to={item.path}
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {item.category}
                    </Link>
                  </TableCell>
                  
                  {/* ✅ PERIOD VALUES - ALINEADOS A LA DERECHA COMO LOS HEADERS */}
                  {periods.map((period, pIndex) => (
                    <TableCell
                      key={pIndex}
                      className={`px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-300 ${period.isDateRange ? 'align-middle' : ''}`}
                    >
                      {item.amounts[period.id] > 0 ? (
                        showBadges ? (
                          <Badge
                            variant="light"
                            size="sm"
                            color={getBadgeColor(item.amounts[period.id])}
                          >
                            {formatCurrency(item.amounts[period.id])}
                          </Badge>
                        ) : (
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {formatCurrency(item.amounts[period.id])}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                      )}
                    </TableCell>
                  ))}
                  
                  {/* ✅ CATEGORY TOTAL - ALINEADO A LA DERECHA */}
                  <TableCell className="px-5 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white">
                    {categoryTotals[item.category] > 0 ? (
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {formatCurrency(categoryTotals[item.category])}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* ✅ TOTALS ROW - HOVER CONTROLADO */}
              <TableRow className="bg-gray-50 dark:bg-gray-700 hover:!bg-gray-100 dark:hover:!bg-gray-600 transition-colors duration-150">
                {/* ✅ TOTAL LABEL - ALINEADO A LA IZQUIERDA COMO EL HEADER */}
                <TableCell className="px-5 py-3 font-bold text-gray-800 text-sm sticky left-0 bg-gray-50 dark:bg-gray-700 dark:text-white text-start z-40">
                  TOTAL
                </TableCell>
                
                {/* ✅ PERIOD TOTALS - CENTRADOS */}
                {periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="px-5 py-3 text-center text-sm font-bold text-gray-800 dark:text-white"
                  >
                    {periodTotals[period.id] > 0 ? (
                      <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {formatCurrency(periodTotals[period.id])}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-lg">-</span>
                    )}
                  </TableCell>
                ))}
                
                {/* ✅ GRAND TOTAL - CENTRADO */}
                <TableCell className="px-5 py-3 text-center text-sm font-bold">
                  <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {formatCurrency(grandTotal)}
                  </span>
                </TableCell>
              </TableRow>

              {/* ✅ ACCUMULATED TOTALS ROW */}
              <TableRow className={`${type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} hover:${type === 'income' ? '!bg-green-200 dark:!bg-green-800/40' : '!bg-red-200 dark:!bg-red-800/40'} transition-colors duration-150`}>
                {/* ✅ ACCUMULATED TOTAL LABEL */}
                <TableCell className={`px-5 py-3 font-bold text-sm sticky left-0 ${type === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'} text-start z-40`}>
                  TOTAL ACUMULADO
                </TableCell>

                {/* ✅ ACCUMULATED PERIOD TOTALS - CENTRADOS */}
                {periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className={`px-5 py-3 text-center text-sm font-bold ${type === 'income' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}
                  >
                    {accumulatedTotals[period.id] > 0 ? (
                      <span className="text-lg font-bold">
                        {formatCurrency(accumulatedTotals[period.id])}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-lg">-</span>
                    )}
                  </TableCell>
                ))}

                {/* ✅ GRAND TOTAL ACCUMULATED - CENTRADO (same as grand total since it's cumulative) */}
                <TableCell className={`px-5 py-3 text-center text-sm font-bold ${type === 'income' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                  <span className="text-xl font-bold">
                    {formatCurrency(grandTotal)}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default FinancialTable;