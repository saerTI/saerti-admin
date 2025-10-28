// src/pages/DynamicIncome/IncomeDashboard.tsx
import { useState, useEffect } from 'react';
import { TrendingUp, LayoutGrid, Calendar, FileText, Tags } from 'lucide-react';
import { incomeDashboardService } from '../../services/incomeDashboardService';
import { getDateRangeForPeriod, getFullYearDateRange } from '../../utils/dashboardHelpers';
import { useCostCenter } from '../../context/CostCenterContext';
import KPICards from '../../components/Dashboard/KPICards';
import FilterBar from '../../components/Dashboard/FilterBar';
import PieChartCard from '../../components/Dashboard/PieChartCard';
import TreemapCard from '../../components/Dashboard/TreemapCard';
import CashFlowChart from '../../components/Dashboard/CashFlowChart';
import TypesDetailTable from '../../components/Dashboard/TypesDetailTable';
import CategoryDetailTable from '../../components/Dashboard/CategoryDetailTable';
import PeriodTable from '../../components/Dashboard/PeriodTable';
import Tabs from '../../components/Dashboard/Tabs';
import type { DashboardSummary, TypeSummary, CategorySummary, CashFlowPeriod } from '../../types/dashboard';

export default function IncomeDashboard() {
  const { selectedCostCenterId } = useCostCenter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [byType, setByType] = useState<TypeSummary[]>([]);
  const [byCategory, setByCategory] = useState<CategorySummary[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowPeriod[]>([]);
  const [categoryByPeriod, setCategoryByPeriod] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [dateRange, setDateRange] = useState(getFullYearDateRange());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Recargar datos cuando cambia el período seleccionado o el centro de costo
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod, selectedCostCenterId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Agregar cost_center_id a todos los filtros si hay uno seleccionado
      const filters = selectedCostCenterId
        ? { ...dateRange, cost_center_id: selectedCostCenterId }
        : dateRange;

      console.log('[IncomeDashboard] Cargando datos con filtros:', filters);

      const [summaryData, typeData, categoryData, flowData, categoryPeriodData] = await Promise.all([
        incomeDashboardService.getSummary({ ...filters, period: selectedPeriod }),
        incomeDashboardService.getByType(filters),
        incomeDashboardService.getByCategory(filters),
        incomeDashboardService.getCashFlow(selectedPeriod, filters),
        incomeDashboardService.getCategoryByPeriod(selectedPeriod, {
          ...filters,
          date_from: `${new Date().getFullYear()}-01-01`,
          date_to: `${new Date().getFullYear()}-12-31`
        })
      ]);

      setSummary(summaryData);
      setByType(typeData);
      setByCategory(categoryData);
      setCashFlow(flowData);
      setCategoryByPeriod(categoryPeriodData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(period);
    // Mantener el rango de todo el año independientemente del período seleccionado
    setDateRange(getFullYearDateRange());
  };

  const tabs = [
    { id: 'overview', label: 'Resumen General', icon: <LayoutGrid size={16} /> },
    { id: 'periods', label: 'Por Período', icon: <Calendar size={16} /> },
    { id: 'types', label: 'Por Tipo', icon: <FileText size={16} /> },
    { id: 'categories', label: 'Por Categoría', icon: <Tags size={16} /> }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TrendingUp className="text-green-600" size={32} />
            Resumen de Ingresos
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Análisis detallado de ingresos por tipo, categoría y período
          </p>
        </div>

        {/* Pill Badge */}
        <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full">
          Ingresos
        </span>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} color="green" />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {/* Tab 1: Resumen General */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards - Sin filtros de período */}
              <KPICards summary={summary} color="green" />

              {/* Gráficos principales - Grid 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Pie - Distribución por Tipo */}
                <PieChartCard data={byType} title="Distribución por Tipo" color="green" />

                {/* Treemap - Distribución por Tipo y Categoría */}
                <TreemapCard data={byCategory} title="Distribución por Categorías" color="green" />
              </div>
            </div>
          )}

          {/* Tab 2: Por Período */}
          {activeTab === 'periods' && (
            <div className="space-y-6">
              {/* Filtros de Período */}
              <FilterBar
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={handlePeriodChange}
                dateRange={dateRange}
                setDateRange={setDateRange}
                onRefresh={loadDashboardData}
                color="green"
              />

              {/* Tabla de categorías por período */}
              <PeriodTable
                data={cashFlow}
                categories={byCategory}
                categoryPeriodData={categoryByPeriod}
                color="green"
                period={selectedPeriod}
              />
            </div>
          )}

          {/* Tab 3: Por Tipo */}
          {activeTab === 'types' && (
            <div className="space-y-6">
              <TypesDetailTable data={byType} color="green" />
            </div>
          )}

          {/* Tab 4: Por Categoría */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <CategoryDetailTable data={byCategory} color="green" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
