import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";

// Types for financial data
export interface FinancialCategory {
  category: string;
  path: string;
  amounts: Record<string, number>;
}

export interface FinancialPeriod {
  id: string;
  label: string | DateRange;
  isDateRange?: boolean;
}

export interface FinancialTableProps {
  title: string;
  type: 'income' | 'expense';
  periods: FinancialPeriod[];
  data: FinancialCategory[];
  loading?: boolean;
  className?: string;
  showBadges?: boolean;
}

/**
 * Calculate totals for each period
 */
const calculatePeriodTotals = (data: FinancialCategory[], periods: FinancialPeriod[]) => {
  const totals: Record<string, number> = {};
  
  periods.forEach(period => {
    totals[period.id] = data.reduce((sum, item) => 
      sum + (item.amounts[period.id] || 0), 0);
  });
  
  return totals;
};

/**
 * Calculate total for each category
 */
const calculateCategoryTotals = (data: FinancialCategory[]) => {
  return data.map(item => {
    const total = Object.values(item.amounts).reduce((sum, amount) => sum + (amount || 0), 0);
    return {
      category: item.category,
      path: item.path,
      total
    };
  });
};

/**
 * Date range object with start and end dates
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Generate date range for a week in a given year
 */
export const getWeekDateRange = (year: number, weekNumber: number): DateRange => {
  // Get the first day of the year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Get the first Monday of the year (or the first day if it's already Monday)
  const dayOffset = firstDayOfYear.getDay() || 7;
  const firstMonday = new Date(year, 0, 1 + (8 - dayOffset));
  
  // Calculate the start date for the given week
  const startDate = new Date(firstMonday);
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  
  // Calculate the end date (6 days after start date)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  // Format dates as DD/MM
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
 * Generate week periods for a given year
 */
export const generateWeekPeriods = (year: number): FinancialPeriod[] => {
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
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-sm sticky left-0 bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                >
                  {type === 'income' ? 'INGRESOS' : 'EGRESOS'}
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
              {/* Data Rows */}
              {data.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <TableCell className="px-5 py-3 font-medium text-gray-800 text-sm sticky left-0 bg-white dark:bg-gray-800 dark:text-white">
                    <Link
                      to={item.path}
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
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
                            color={getBadgeColor(item.amounts[period.id])}
                          >
                            {formatCurrency(item.amounts[period.id])}
                          </Badge>
                        ) : (
                          formatCurrency(item.amounts[period.id])
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  ))}
                  
                  {/* Row Total */}
                  <TableCell className="px-5 py-3 text-right font-medium text-sm text-gray-800 dark:text-white">
                    {formatCurrency(categoryTotals[index].total)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow className="bg-gray-100 dark:bg-gray-700 font-bold">
                <TableCell className="px-5 py-3 text-gray-800 text-sm sticky left-0 bg-gray-100 dark:bg-gray-700 dark:text-white">
                  TOTAL {type === 'income' ? 'INGRESOS' : 'GASTOS'}
                </TableCell>
                
                                  {/* Period Totals */}
                {periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className={`px-5 py-3 text-right text-sm text-gray-800 dark:text-white ${period.isDateRange ? 'align-middle' : ''}`}
                  >
                    {formatCurrency(periodTotals[period.id])}
                  </TableCell>
                ))}
                
                {/* Grand Total */}
                <TableCell className="px-5 py-3 text-right text-sm text-gray-800 dark:text-white">
                  {formatCurrency(grandTotal)}
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