import React, { useState, useEffect } from 'react';
import { consolidatedDashboardService } from '../../services/consolidatedDashboardService';
import { useCostCenter } from '../../context/CostCenterContext';
import type { ConsolidatedData, FinancialKPIs, OperationalMetrics as OperationalMetricsType } from '../../services/consolidatedDashboardService';
import FinancialKPICards from '../../components/Dashboard/FinancialKPICards';
import OperationalMetrics from '../../components/Dashboard/OperationalMetrics';
import ComparativeLineChart from '../../components/Dashboard/ComparativeLineChart';
import TopTypesBarChart from '../../components/Dashboard/TopTypesBarChart';
import TopNTable from '../../components/Dashboard/TopNTable';

const ConsolidatedHome: React.FC = () => {
  const { selectedCostCenterId, costCenters } = useCostCenter();
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

  return (
    <div className="mx-auto max-w-screen-2xl p-2 md:p-3 2xl:p-5">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6 flex items-end gap-3">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Dashboard Principal
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 pb-0.5">
            · Vista consolidada de ingresos y egresos
          </span>
        </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {/* Overview Content */}
        <>
            {/* Financial KPI Cards */}
            {kpis && <FinancialKPICards kpis={kpis} loading={loading} />}

            {/* Operational Metrics */}
            {metrics && (
              <OperationalMetrics
                metrics={metrics}
                totalTransactions={metrics.totalTransactions}
                loading={loading}
                selectedCostCenterName={
                  selectedCostCenterId
                    ? costCenters.find(cc => cc.id === selectedCostCenterId)?.name
                    : undefined
                }
              />
            )}

            {/* Charts Section - 2 columns */}
            {data && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comparative Line Chart with Balance */}
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
      </div>
      </div>
    </div>
  );
};

export default ConsolidatedHome;
