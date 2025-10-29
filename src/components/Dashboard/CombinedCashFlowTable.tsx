// src/components/Dashboard/CombinedCashFlowTable.tsx
import { useEffect, useRef } from 'react';
import { formatCurrency } from '../../utils/dashboardHelpers';

interface CategoryPeriodData {
  category_id: number | null;
  category_name: string | null;
  type_id: number;
  type_name: string;
  period_label: string;
  total_amount: number;
  count: number;
}

interface CombinedCashFlowTableProps {
  incomeCategoryData: CategoryPeriodData[];
  expenseCategoryData: CategoryPeriodData[];
  selectedYear?: number;
  selectedPeriod: 'week' | 'month' | 'quarter' | 'year';
}

// Función para obtener el primer día de la semana ISO (lunes)
function getISOWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);
  return weekStart;
}

// Función para formatear fecha como dd/mm
function formatDayMonth(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

// Función para obtener el número de semana ISO del año
function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const jan4 = new Date(target.getFullYear(), 0, 4);
  const dayDiff = (target.getTime() - jan4.getTime()) / 86400000;
  return 1 + Math.ceil(dayDiff / 7);
}

// Función para obtener el backend format del período actual
function getCurrentPeriodBackend(periodType: 'week' | 'month' | 'quarter' | 'year', year: number): string {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (year !== currentYear) {
    return '';
  }

  switch (periodType) {
    case 'week': {
      const weekNum = getISOWeekNumber(now);
      return `${currentYear}-W${weekNum.toString().padStart(2, '0')}`;
    }
    case 'month': {
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      return `${currentYear}-${month}`;
    }
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      return `${currentYear}-Q${quarter}`;
    }
    case 'year': {
      return `${currentYear}`;
    }
    default:
      return '';
  }
}

// Función para generar display label a partir del period_label del backend
function getDisplayLabel(periodLabel: string, periodType: 'week' | 'month' | 'quarter' | 'year'): string {
  switch (periodType) {
    case 'week': {
      // periodLabel viene como "2025-W01", "2025-W02", etc
      const match = periodLabel.match(/(\d{4})-W(\d+)/);
      if (match) {
        const year = parseInt(match[1]);
        const weekNum = parseInt(match[2]);
        const weekStart = getISOWeekStart(year, weekNum);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${formatDayMonth(weekStart)} - ${formatDayMonth(weekEnd)}`;
      }
      return periodLabel;
    }
    case 'month': {
      // periodLabel viene como "2025-01", "2025-02", etc
      const match = periodLabel.match(/\d{4}-(\d{2})/);
      if (match) {
        const monthNum = parseInt(match[1]) - 1;
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return monthNames[monthNum] || periodLabel;
      }
      return periodLabel;
    }
    case 'quarter': {
      // periodLabel viene como "2025-Q1", "2025-Q2", etc
      const match = periodLabel.match(/-Q(\d)/);
      if (match) {
        return `Q${match[1]}`;
      }
      return periodLabel;
    }
    case 'year': {
      // periodLabel viene como "2025"
      return periodLabel;
    }
    default:
      return periodLabel;
  }
}

export default function CombinedCashFlowTable({
  incomeCategoryData,
  expenseCategoryData,
  selectedYear = new Date().getFullYear(),
  selectedPeriod
}: CombinedCashFlowTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentPeriodRef = useRef<HTMLTableCellElement>(null);

  // Obtener todos los period_labels únicos del backend y ordenarlos
  const allPeriodLabels = [...new Set([
    ...incomeCategoryData.map(d => d.period_label),
    ...expenseCategoryData.map(d => d.period_label)
  ])].sort();

  // Crear array de períodos con display label
  const periods = allPeriodLabels.map(periodLabel => ({
    display: getDisplayLabel(periodLabel, selectedPeriod),
    backend: periodLabel
  }));

  // Obtener período actual para destacar
  const currentPeriodBackend = getCurrentPeriodBackend(selectedPeriod, selectedYear);
  const currentPeriodIndex = periods.findIndex(p => p.backend === currentPeriodBackend);

  // Scroll automático al período actual
  useEffect(() => {
    if (currentPeriodRef.current && scrollContainerRef.current && currentPeriodIndex >= 0) {
      const container = scrollContainerRef.current;
      const element = currentPeriodRef.current;
      const containerWidth = container.clientWidth;
      const elementLeft = element.offsetLeft;
      const elementWidth = element.clientWidth;
      const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [currentPeriodIndex, selectedPeriod]);

  // Crear mapas de datos por categoría y período
  const incomeMap = new Map<string, number>();
  incomeCategoryData.forEach(item => {
    const categoryName = item.category_name || 'Sin Categoría';
    const key = `${categoryName}-${item.period_label}`;
    incomeMap.set(key, (incomeMap.get(key) || 0) + item.total_amount);
  });

  const expenseMap = new Map<string, number>();
  expenseCategoryData.forEach(item => {
    const categoryName = item.category_name || 'Sin Categoría';
    const key = `${categoryName}-${item.period_label}`;
    expenseMap.set(key, (expenseMap.get(key) || 0) + item.total_amount);
  });

  // Obtener categorías únicas
  const incomeCategories = [...new Set(incomeCategoryData.map(c => c.category_name || 'Sin Categoría'))];
  const expenseCategories = [...new Set(expenseCategoryData.map(c => c.category_name || 'Sin Categoría'))];

  // Función para obtener monto de una categoría en un período
  const getAmount = (categoryName: string, periodBackend: string, isIncome: boolean): number => {
    const map = isIncome ? incomeMap : expenseMap;
    const key = `${categoryName}-${periodBackend}`;
    return map.get(key) || 0;
  };

  // Función para calcular totales por período
  const getTotalByPeriod = (periodBackend: string, isIncome: boolean): number => {
    const categories = isIncome ? incomeCategories : expenseCategories;
    return categories.reduce((sum, category) => sum + getAmount(category, periodBackend, isIncome), 0);
  };

  // Función para calcular acumulado hasta un período
  const getAccumulatedByPeriod = (periodBackend: string, isIncome: boolean): number => {
    const currentIndex = periods.findIndex(p => p.backend === periodBackend);
    if (currentIndex === -1) return 0;

    let accumulated = 0;
    for (let i = 0; i <= currentIndex; i++) {
      accumulated += getTotalByPeriod(periods[i].backend, isIncome);
    }
    return accumulated;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div ref={scrollContainerRef} className="overflow-auto max-h-[calc(100vh-300px)]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r-2 border-gray-300 dark:border-gray-600 shadow-sm">
                Categoría
              </th>

              {/* Columnas del período seleccionado */}
              {periods.map((period, index) => {
                const isCurrent = period.backend === currentPeriodBackend;
                return (
                  <th
                    key={`period-${index}`}
                    ref={isCurrent ? currentPeriodRef : null}
                    className={`px-3 py-3 text-right text-xs font-medium uppercase tracking-wider whitespace-nowrap border-r border-gray-200 dark:border-gray-600 ${
                      isCurrent ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 font-bold' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {period.display}
                    {isCurrent && <span className="ml-1">●</span>}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {/* ===== SECCIÓN DE INGRESOS ===== */}
            {incomeCategories.map((category, catIndex) => (
              <tr key={`income-${catIndex}`} className="hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-4 py-3 whitespace-nowrap text-sm font-medium text-green-700 dark:text-green-400 border-r-2 border-gray-300 dark:border-gray-600">
                  {category}
                </td>

                {/* Datos por período */}
                {periods.map((period, idx) => {
                  const amount = getAmount(category, period.backend, true);
                  const isCurrent = period.backend === currentPeriodBackend;
                  return (
                    <td key={`income-${idx}`} className={`px-3 py-3 whitespace-nowrap text-xs text-right border-r border-gray-200 dark:border-gray-600 ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {amount > 0 ? formatCurrency(amount) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* FILA: TOTAL INGRESOS */}
            <tr className="bg-green-100 dark:bg-green-900/30 font-bold">
              <td className="sticky left-0 z-10 bg-green-100 dark:bg-green-900/30 px-4 py-3 whitespace-nowrap text-sm text-green-900 dark:text-green-100 border-r-2 border-gray-300 dark:border-gray-600">
                TOTAL INGRESOS
              </td>

              {periods.map((period, idx) => {
                const total = getTotalByPeriod(period.backend, true);
                const isCurrent = period.backend === currentPeriodBackend;
                return (
                  <td key={`total-income-${idx}`} className={`px-3 py-3 whitespace-nowrap text-xs text-right text-green-900 dark:text-green-100 border-r border-gray-200 dark:border-gray-600 ${isCurrent ? 'bg-green-200 dark:bg-green-900/50' : ''}`}>
                    {total > 0 ? formatCurrency(total) : '-'}
                  </td>
                );
              })}
            </tr>

            {/* FILA: ACUMULADO INGRESOS */}
            <tr className="bg-green-50 dark:bg-green-900/20 font-semibold">
              <td className="sticky left-0 z-10 bg-green-50 dark:bg-green-900/20 px-4 py-3 whitespace-nowrap text-sm text-green-800 dark:text-green-200 border-r-2 border-gray-300 dark:border-gray-600">
                ACUMULADO INGRESOS
              </td>

              {periods.map((period, idx) => {
                const accumulated = getAccumulatedByPeriod(period.backend, true);
                const isCurrent = period.backend === currentPeriodBackend;
                return (
                  <td key={`acc-income-${idx}`} className={`px-3 py-3 whitespace-nowrap text-xs text-right text-green-800 dark:text-green-200 border-r border-gray-200 dark:border-gray-600 ${isCurrent ? 'bg-green-100 dark:bg-green-900/40' : ''}`}>
                    {accumulated > 0 ? formatCurrency(accumulated) : '-'}
                  </td>
                );
              })}
            </tr>

            {/* ===== SECCIÓN DE EGRESOS ===== */}
            {expenseCategories.map((category, catIndex) => (
              <tr key={`expense-${catIndex}`} className="hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-4 py-3 whitespace-nowrap text-sm font-medium text-red-700 dark:text-red-400 border-r-2 border-gray-300 dark:border-gray-600">
                  {category}
                </td>

                {/* Datos por período */}
                {periods.map((period, idx) => {
                  const amount = getAmount(category, period.backend, false);
                  const isCurrent = period.backend === currentPeriodBackend;
                  return (
                    <td key={`expense-${idx}`} className={`px-3 py-3 whitespace-nowrap text-xs text-right border-r border-gray-200 dark:border-gray-600 ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {amount > 0 ? formatCurrency(amount) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* FILA: TOTAL EGRESOS */}
            <tr className="bg-red-100 dark:bg-red-900/30 font-bold">
              <td className="sticky left-0 z-10 bg-red-100 dark:bg-red-900/30 px-4 py-3 whitespace-nowrap text-sm text-red-900 dark:text-red-100 border-r-2 border-gray-300 dark:border-gray-600">
                TOTAL EGRESOS
              </td>

              {periods.map((period, idx) => {
                const total = getTotalByPeriod(period.backend, false);
                const isCurrent = period.backend === currentPeriodBackend;
                return (
                  <td key={`total-expense-${idx}`} className={`px-3 py-3 whitespace-nowrap text-xs text-right text-red-900 dark:text-red-100 border-r border-gray-200 dark:border-gray-600 ${isCurrent ? 'bg-red-200 dark:bg-red-900/50' : ''}`}>
                    {total > 0 ? formatCurrency(total) : '-'}
                  </td>
                );
              })}
            </tr>

            {/* FILA: ACUMULADO EGRESOS */}
            <tr className="bg-red-50 dark:bg-red-900/20 font-semibold">
              <td className="sticky left-0 z-10 bg-red-50 dark:bg-red-900/20 px-4 py-3 whitespace-nowrap text-sm text-red-800 dark:text-red-200 border-r-2 border-gray-300 dark:border-gray-600">
                ACUMULADO EGRESOS
              </td>

              {periods.map((period, idx) => {
                const accumulated = getAccumulatedByPeriod(period.backend, false);
                const isCurrent = period.backend === currentPeriodBackend;
                return (
                  <td key={`acc-expense-${idx}`} className={`px-3 py-3 whitespace-nowrap text-xs text-right text-red-800 dark:text-red-200 border-r border-gray-200 dark:border-gray-600 ${isCurrent ? 'bg-red-100 dark:bg-red-900/40' : ''}`}>
                    {accumulated > 0 ? formatCurrency(accumulated) : '-'}
                  </td>
                );
              })}
            </tr>

            {/* ===== SECCIÓN DE BALANCE ===== */}
            {/* FILA: BALANCE TOTAL (Ingresos - Egresos) */}
            <tr className="bg-blue-100 dark:bg-blue-900/30 font-bold border-t-2 border-gray-400 dark:border-gray-500">
              <td className="sticky left-0 z-10 bg-blue-100 dark:bg-blue-900/30 px-4 py-3 whitespace-nowrap text-sm text-blue-900 dark:text-blue-100 border-r-2 border-gray-300 dark:border-gray-600">
                BALANCE TOTAL
              </td>

              {periods.map((period, idx) => {
                const incomeTotal = getTotalByPeriod(period.backend, true);
                const expenseTotal = getTotalByPeriod(period.backend, false);
                const balance = incomeTotal - expenseTotal;
                const isCurrent = period.backend === currentPeriodBackend;
                const isPositive = balance >= 0;

                return (
                  <td key={`balance-${idx}`} className={`px-3 py-3 whitespace-nowrap text-xs text-right font-bold border-r border-gray-200 dark:border-gray-600 ${
                    isCurrent ? 'bg-blue-200 dark:bg-blue-900/50' : ''
                  } ${
                    isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                    {balance !== 0 ? formatCurrency(balance) : '-'}
                  </td>
                );
              })}
            </tr>

            {/* FILA: BALANCE TOTAL ACUMULADO */}
            <tr className="bg-blue-50 dark:bg-blue-900/20 font-semibold">
              <td className="sticky left-0 z-10 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 whitespace-nowrap text-sm text-blue-800 dark:text-blue-200 border-r-2 border-gray-300 dark:border-gray-600">
                BALANCE TOTAL ACUMULADO
              </td>

              {periods.map((period, idx) => {
                const incomeAccumulated = getAccumulatedByPeriod(period.backend, true);
                const expenseAccumulated = getAccumulatedByPeriod(period.backend, false);
                const balanceAccumulated = incomeAccumulated - expenseAccumulated;
                const isCurrent = period.backend === currentPeriodBackend;
                const isPositive = balanceAccumulated >= 0;

                return (
                  <td key={`balance-acc-${idx}`} className={`px-3 py-3 whitespace-nowrap text-xs text-right font-semibold border-r border-gray-200 dark:border-gray-600 ${
                    isCurrent ? 'bg-blue-100 dark:bg-blue-900/40' : ''
                  } ${
                    isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                    {balanceAccumulated !== 0 ? formatCurrency(balanceAccumulated) : '-'}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
