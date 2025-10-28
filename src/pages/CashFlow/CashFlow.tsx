// src/pages/CashFlow/CashFlow.tsx - Vista combinada de ingresos y egresos por categorías
import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { incomeDashboardService } from '../../services/incomeDashboardService';
import { expenseDashboardService } from '../../services/expenseDashboardService';
import { useCostCenter } from '../../context/CostCenterContext';
import { getFullYearDateRange } from '../../utils/dashboardHelpers';
import CombinedCashFlowTable from '../../components/Dashboard/CombinedCashFlowTable';
import FilterBar from '../../components/Dashboard/FilterBar';

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

      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Flujo de Caja por Categorías
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vista combinada de ingresos y egresos por categorías en todos los períodos (semanas, meses, trimestres, año)
          </p>
        </div>

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

        {/* Tabla Combinada */}
        <CombinedCashFlowTable
          incomeCategoryData={incomeCategoryData}
          expenseCategoryData={expenseCategoryData}
          selectedYear={year}
          selectedPeriod={selectedPeriod}
        />
      </div>
    </>
  );
};

export default CashFlow;
