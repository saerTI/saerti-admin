// src/pages/CashFlow/CashFlow.tsx - Vista combinada de ingresos y egresos por categorías
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, TrendingUp } from 'lucide-react';
import PageMeta from '../../components/common/PageMeta';
import { incomeDashboardService } from '../../services/incomeDashboardService';
import { expenseDashboardService } from '../../services/expenseDashboardService';
import { useCostCenter } from '../../context/CostCenterContext';
import { getFullYearDateRange } from '../../utils/dashboardHelpers';
import CombinedCashFlowTable from '../../components/Dashboard/CombinedCashFlowTable';
import FilterBar from '../../components/Dashboard/FilterBar';
import WaterfallChart from '../../components/Dashboard/WaterfallChart';
import Tabs from '../../components/Dashboard/Tabs';

interface CategoryPeriodData {
  category_id: number | null;
  category_name: string | null;
  type_id: number;
  type_name: string;
  period_label: string;
  total_amount: number;
  count: number;
}

const CashFlow: React.FC = () => {
  const { selectedCostCenterId } = useCostCenter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para datos de categorías por período
  const [incomeCategoryData, setIncomeCategoryData] = useState<CategoryPeriodData[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<CategoryPeriodData[]>([]);

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [dateRange, setDateRange] = useState(getFullYearDateRange());
  const [activeTab, setActiveTab] = useState('table');

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedCostCenterId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        ...dateRange,
        cost_center_id: selectedCostCenterId || undefined
      };

      console.log('[CashFlow] Cargando datos con filtros:', filters, 'período:', selectedPeriod);

      // Cargar datos solo del período seleccionado
      const [incomeData, expenseData] = await Promise.all([
        incomeDashboardService.getCategoryByPeriod(selectedPeriod, filters),
        expenseDashboardService.getCategoryByPeriod(selectedPeriod, filters)
      ]);

      setIncomeCategoryData(incomeData);
      setExpenseCategoryData(expenseData);

      console.log('[CashFlow] Datos cargados:', {
        ingresos: incomeData.length,
        egresos: expenseData.length
      });
    } catch (err) {
      console.error('Error loading cash flow data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(period);
  };

  // Extraer el año del dateRange para pasarlo al componente
  const year = new Date(dateRange.date_from).getFullYear();

  // Calcular datos para el gráfico de cascada
  const { periods, balanceData } = useMemo(() => {
    // Obtener todos los period_labels únicos y ordenarlos
    const allPeriodLabels = [...new Set([
      ...incomeCategoryData.map(d => d.period_label),
      ...expenseCategoryData.map(d => d.period_label)
    ])].sort();

    // Crear mapas de datos por período
    const incomeMap = new Map<string, number>();
    incomeCategoryData.forEach(item => {
      const key = item.period_label;
      incomeMap.set(key, (incomeMap.get(key) || 0) + item.total_amount);
    });

    const expenseMap = new Map<string, number>();
    expenseCategoryData.forEach(item => {
      const key = item.period_label;
      expenseMap.set(key, (expenseMap.get(key) || 0) + item.total_amount);
    });

    // Funciones auxiliares para calcular fechas de semana
    const getISOWeekStart = (year: number, week: number): Date => {
      const jan4 = new Date(year, 0, 4);
      const jan4Day = jan4.getDay() || 7;
      const weekStart = new Date(jan4);
      weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);
      return weekStart;
    };

    const formatDayMonth = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    };

    // Función para generar display label
    const getDisplayLabel = (periodLabel: string): string => {
      switch (selectedPeriod) {
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
          const match = periodLabel.match(/\d{4}-(\d{2})/);
          if (match) {
            const monthNum = parseInt(match[1]) - 1;
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return monthNames[monthNum] || periodLabel;
          }
          return periodLabel;
        }
        case 'quarter': {
          const match = periodLabel.match(/-Q(\d)/);
          if (match) {
            return `Q${match[1]}`;
          }
          return periodLabel;
        }
        case 'year': {
          return periodLabel;
        }
        default:
          return periodLabel;
      }
    };

    // Crear array de períodos con display label
    const periods = allPeriodLabels.map(periodLabel => ({
      display: getDisplayLabel(periodLabel),
      backend: periodLabel
    }));

    // Calcular balance por período
    const balanceData = allPeriodLabels.map(periodLabel => {
      const income = incomeMap.get(periodLabel) || 0;
      const expense = expenseMap.get(periodLabel) || 0;
      return income - expense;
    });

    return { periods, balanceData };
  }, [incomeCategoryData, expenseCategoryData, selectedPeriod]);

  const tabs = [
    { id: 'table', label: 'Tabla', icon: <LayoutGrid size={16} /> },
    { id: 'chart', label: 'Gráfico de Cascada', icon: <TrendingUp size={16} /> }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando flujo de caja...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Flujo de Caja" description="Visualización de ingresos y egresos por todos los períodos" />

      <div className="mx-auto max-w-screen-2xl p-2 md:p-3 2xl:p-5">
        {/* Header */}
        <div className="mb-6 flex items-end gap-3">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Flujo de Caja
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 pb-0.5">
            · Vista combinada de ingresos y egresos por categorías en todos los períodos
          </span>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} color="green" />

        {/* Filtros */}
        <FilterBar
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={handlePeriodChange}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onRefresh={loadData}
          color="green"
        />

        {/* Info del centro de costo si está seleccionado */}
        {selectedCostCenterId && (
          <div className="mb-6 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 w-fit">
            Filtrando por centro de costo seleccionado
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Tab: Tabla */}
        {activeTab === 'table' && (
          <CombinedCashFlowTable
            incomeCategoryData={incomeCategoryData}
            expenseCategoryData={expenseCategoryData}
            selectedYear={year}
            selectedPeriod={selectedPeriod}
          />
        )}

        {/* Tab: Gráfico de Cascada */}
        {activeTab === 'chart' && (
          <WaterfallChart
            periods={periods}
            balanceData={balanceData}
            title={`Balance por ${selectedPeriod === 'week' ? 'Semana' : selectedPeriod === 'month' ? 'Mes' : selectedPeriod === 'quarter' ? 'Trimestre' : 'Año'}`}
          />
        )}
      </div>
    </>
  );
};

export default CashFlow;
