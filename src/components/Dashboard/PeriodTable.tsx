// src/components/Dashboard/PeriodTable.tsx
import { useEffect, useRef } from 'react';
import { formatCurrency } from '../../utils/dashboardHelpers';
import type { CategorySummary, CashFlowPeriod } from '../../types/dashboard';

interface CategoryPeriodData {
  category_id: number;
  category_name: string;
  type_id: number;
  type_name: string;
  period_label: string;
  total_amount: number;
  count: number;
}

interface PeriodTableProps {
  data: CashFlowPeriod[];
  categories: CategorySummary[];
  categoryPeriodData: CategoryPeriodData[];
  color: 'green' | 'red';
  period: 'week' | 'month' | 'quarter' | 'year';
}

// Función para obtener el primer día de la semana ISO (lunes)
function getISOWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4); // 4 de enero siempre está en la semana 1
  const jan4Day = jan4.getDay() || 7; // Domingo = 7
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7); // Lunes de la semana
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
  const dayNr = (date.getDay() + 6) % 7; // Lunes = 0, Domingo = 6
  target.setDate(target.getDate() - dayNr + 3); // Jueves de la semana
  const jan4 = new Date(target.getFullYear(), 0, 4);
  const dayDiff = (target.getTime() - jan4.getTime()) / 86400000;
  return 1 + Math.ceil(dayDiff / 7);
}

// Función para obtener el backend format del período actual
function getCurrentPeriodBackend(periodType: 'week' | 'month' | 'quarter' | 'year'): string {
  const now = new Date();
  const currentYear = now.getFullYear();

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

// Función para generar todos los períodos del año actual con su mapeo al backend
function generateAllPeriods(periodType: 'week' | 'month' | 'quarter' | 'year'): Array<{ display: string; backend: string }> {
  const currentYear = new Date().getFullYear();
  const periods: Array<{ display: string; backend: string }> = [];

  switch (periodType) {
    case 'week':
      // Generar 52 semanas del año con rangos de fechas
      for (let i = 1; i <= 52; i++) {
        const weekStart = getISOWeekStart(currentYear, i);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Domingo

        const startStr = formatDayMonth(weekStart);
        const endStr = formatDayMonth(weekEnd);

        // Backend usa formato: 2025-W43
        const backendFormat = `${currentYear}-W${i.toString().padStart(2, '0')}`;

        periods.push({
          display: `${startStr} - ${endStr}`,
          backend: backendFormat
        });
      }
      break;
    case 'month':
      // Generar 12 meses del año
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      monthNames.forEach((month, index) => {
        // Backend usa formato: 2025-10
        const backendFormat = `${currentYear}-${(index + 1).toString().padStart(2, '0')}`;

        periods.push({
          display: month,
          backend: backendFormat
        });
      });
      break;
    case 'quarter':
      // Generar 4 trimestres del año
      for (let i = 1; i <= 4; i++) {
        // Backend usa formato: 2025-Q4
        const backendFormat = `${currentYear}-Q${i}`;

        periods.push({
          display: `Q${i} ${currentYear}`,
          backend: backendFormat
        });
      }
      break;
    case 'year':
      // Mostrar últimos 5 años
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        // Backend usa formato: 2025
        periods.push({
          display: `${year}`,
          backend: `${year}`
        });
      }
      break;
  }

  return periods;
}

export default function PeriodTable({ data, categories, categoryPeriodData, color, period }: PeriodTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentPeriodRef = useRef<HTMLTableCellElement>(null);

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No hay categorías para mostrar
        </div>
      </div>
    );
  }

  const borderColor = color === 'red' ? 'border-red-200 dark:border-red-800' : 'border-emerald-200 dark:border-emerald-800';
  const headerBg = color === 'red' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
  const headerText = color === 'red' ? 'text-red-900 dark:text-red-100' : 'text-emerald-900 dark:text-emerald-100';

  // Generar todos los períodos del año actual
  const allPeriods = generateAllPeriods(period);

  // Obtener el período actual
  const currentPeriodBackend = getCurrentPeriodBackend(period);
  const currentPeriodIndex = allPeriods.findIndex(p => p.backend === currentPeriodBackend);

  // Scroll automático al período actual cuando cambia el período o se monta el componente
  useEffect(() => {
    if (currentPeriodRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = currentPeriodRef.current;

      // Calcular la posición para centrar el elemento
      const containerWidth = container.clientWidth;
      const elementLeft = element.offsetLeft;
      const elementWidth = element.clientWidth;
      const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);

      // Scroll suave
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [period, currentPeriodIndex]);

  // Crear un mapa de datos reales del backend para totales por período
  const dataMap = new Map<string, number>();
  data.forEach(d => {
    dataMap.set(d.period_label, d.total_amount);
  });

  // Crear un mapa de datos por categoría y período usando el formato del backend
  const categoryPeriodMap = new Map<string, number>();
  categoryPeriodData.forEach(item => {
    const key = `${item.category_name}-${item.period_label}`;
    categoryPeriodMap.set(key, item.total_amount);
  });

  // Obtener categorías únicas
  const categoryNames = [...new Set(categories.map(c => c.category_name))];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={headerBg}>
            <tr>
              <th scope="col" className={`sticky left-0 z-10 ${headerBg} px-6 py-3 text-left text-xs font-medium ${headerText} uppercase tracking-wider`}>
                Categoría
              </th>
              {allPeriods.map((periodItem, index) => {
                const isCurrent = index === currentPeriodIndex;
                const highlightBg = color === 'red'
                  ? 'bg-red-100 dark:bg-red-900/40'
                  : 'bg-emerald-100 dark:bg-emerald-900/40';

                return (
                  <th
                    key={index}
                    ref={isCurrent ? currentPeriodRef : null}
                    scope="col"
                    className={`px-6 py-3 text-right text-xs font-medium ${headerText} uppercase tracking-wider whitespace-nowrap ${isCurrent ? highlightBg : ''} ${isCurrent ? 'font-bold' : ''}`}
                  >
                    {periodItem.display}
                    {isCurrent && <span className="ml-1 text-xs">●</span>}
                  </th>
                );
              })}
              <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${headerText} uppercase tracking-wider`}>
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {categoryNames.map((categoryName, catIndex) => {
              const categoryData = categories.find(c => c.category_name === categoryName);
              const total = categoryData?.total_amount || 0;

              return (
                <tr key={catIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {categoryName}
                  </td>
                  {allPeriods.map((periodItem, periodIndex) => {
                    // Buscar el monto real para esta categoría y período usando el formato del backend
                    const key = `${categoryName}-${periodItem.backend}`;
                    const amount = categoryPeriodMap.get(key) || 0;
                    const isCurrent = periodIndex === currentPeriodIndex;
                    const highlightBg = color === 'red'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-emerald-50 dark:bg-emerald-900/20';

                    return (
                      <td key={periodIndex} className={`px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300 ${isCurrent ? highlightBg : ''} ${isCurrent ? 'font-semibold' : ''}`}>
                        {amount > 0 ? formatCurrency(amount) : '-'}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
            <tr className={`${headerBg} font-bold`}>
              <td className={`sticky left-0 z-10 ${headerBg} px-6 py-4 whitespace-nowrap text-sm ${headerText}`}>
                Total por Período
              </td>
              {allPeriods.map((periodItem, index) => {
                // Obtener el total del período si existe en los datos reales usando el formato del backend
                const periodTotal = dataMap.get(periodItem.backend) || 0;
                const isCurrent = index === currentPeriodIndex;
                const highlightBg = color === 'red'
                  ? 'bg-red-100 dark:bg-red-900/40'
                  : 'bg-emerald-100 dark:bg-emerald-900/40';

                return (
                  <td key={index} className={`px-6 py-4 whitespace-nowrap text-sm text-right ${headerText} ${isCurrent ? highlightBg : ''}`}>
                    {periodTotal > 0 ? formatCurrency(periodTotal) : '-'}
                  </td>
                );
              })}
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${headerText}`}>
                {formatCurrency(data.reduce((sum, p) => sum + p.total_amount, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
