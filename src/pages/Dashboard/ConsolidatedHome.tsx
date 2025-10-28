import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { consolidatedDashboardService } from '../../services/consolidatedDashboardService';
import { useCostCenter } from '../../context/CostCenterContext';
import type { ConsolidatedData, FinancialKPIs, OperationalMetrics as OperationalMetricsType } from '../../services/consolidatedDashboardService';
import FinancialKPICards from '../../components/Dashboard/FinancialKPICards';
import OperationalMetrics from '../../components/Dashboard/OperationalMetrics';
import ComparativeLineChart from '../../components/Dashboard/ComparativeLineChart';
import TopTypesBarChart from '../../components/Dashboard/TopTypesBarChart';
import TopNTable from '../../components/Dashboard/TopNTable';
import CashFlowComparison from '../../components/Dashboard/CashFlowComparison';
import IncomeDashboard from '../DynamicIncome/IncomeDashboard';
import ExpenseDashboard from '../DynamicExpense/ExpenseDashboard';

type TabType = 'overview' | 'income-analysis' | 'expense-analysis' | 'cash-flow';

const ConsolidatedHome: React.FC = () => {
  const { selectedCostCenterId } = useCostCenter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [data, setData] = useState<ConsolidatedData | null>(null);
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [metrics, setMetrics] = useState<OperationalMetricsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedCostCenterId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Agregar cost_center_id a filtros si hay uno seleccionado
      const filters = selectedCostCenterId
        ? { cost_center_id: selectedCostCenterId }
        : {};

      console.log('[ConsolidatedHome] Cargando datos con filtros:', filters);

      // Fetch all data in parallel
      const [consolidatedData, operationalMetrics] = await Promise.all([
        consolidatedDashboardService.fetchAllData(filters),
        consolidatedDashboardService.getOperationalMetrics(filters)
      ]);

      setData(consolidatedData);

      // Calculate KPIs
      const calculatedKPIs = consolidatedDashboardService.calculateKPIs(consolidatedData);
      setKpis(calculatedKPIs);

      // Update metrics with total transactions
      const totalTransactions = calculatedKPIs.incomeCount + calculatedKPIs.expenseCount;
      setMetrics({ ...operationalMetrics, totalTransactions });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Resumen General',
      icon: BarChart3,
      description: 'KPIs consolidados'
    },
    {
      id: 'income-analysis' as TabType,
      label: 'Análisis de Ingresos',
      icon: TrendingUp,
      description: 'Vista detallada'
    },
    {
      id: 'expense-analysis' as TabType,
      label: 'Análisis de Egresos',
      icon: TrendingDown,
      description: 'Vista detallada'
    },
    {
      id: 'cash-flow' as TabType,
      label: 'Flujo de Caja',
      icon: Activity,
      description: 'Comparativa'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Principal
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Vista consolidada de ingresos, egresos y flujo de caja
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Tab 1: Overview - Resumen General */}
        {activeTab === 'overview' && (
          <>
            {/* Financial KPI Cards */}
            {kpis && <FinancialKPICards kpis={kpis} loading={loading} />}

            {/* Operational Metrics */}
            {metrics && (
              <OperationalMetrics
                metrics={metrics}
                totalTransactions={metrics.totalTransactions}
                loading={loading}
              />
            )}

            {/* Charts Section - 2 columns */}
            {data && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comparative Line Chart */}
                <ComparativeLineChart
                  incomeData={data.income.cashFlow}
                  expenseData={data.expense.cashFlow}
                  loading={loading}
                />

                {/* Top Types Bar Chart */}
                <TopTypesBarChart
                  incomeByType={data.income.byType}
                  expenseByType={data.expense.byType}
                  topN={5}
                  loading={loading}
                />
              </div>
            )}

            {/* Top N Tables - 2 columns */}
            {data && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Income Transactions */}
                <TopNTable
                  transactions={data.income.byType
                    .sort((a, b) => b.total_amount - a.total_amount)
                    .slice(0, 5)
                    .map((item, index) => ({
                      id: index,
                      name: item.type_name,
                      type_name: item.type_name,
                      category_name: '-',
                      amount: item.total_amount,
                      date: new Date().toISOString()
                    }))}
                  type="income"
                  loading={loading}
                />

                {/* Top Expense Transactions */}
                <TopNTable
                  transactions={data.expense.byType
                    .sort((a, b) => b.total_amount - a.total_amount)
                    .slice(0, 5)
                    .map((item, index) => ({
                      id: index,
                      name: item.type_name,
                      type_name: item.type_name,
                      category_name: '-',
                      amount: item.total_amount,
                      date: new Date().toISOString()
                    }))}
                  type="expense"
                  loading={loading}
                />
              </div>
            )}
          </>
        )}

        {/* Tab 2: Income Analysis */}
        {activeTab === 'income-analysis' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <IncomeDashboard />
          </div>
        )}

        {/* Tab 3: Expense Analysis */}
        {activeTab === 'expense-analysis' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <ExpenseDashboard />
          </div>
        )}

        {/* Tab 4: Cash Flow Comparison */}
        {activeTab === 'cash-flow' && data && (
          <CashFlowComparison
            incomeData={data.income.cashFlow}
            expenseData={data.expense.cashFlow}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default ConsolidatedHome;
