import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import type { CashFlowPeriod } from '../../types/dashboard';

interface CashFlowComparisonProps {
  incomeData: CashFlowPeriod[];
  expenseData: CashFlowPeriod[];
  loading?: boolean;
}

interface CombinedPeriodData {
  period: string;
  income: number;
  expense: number;
  netFlow: number;
  margin: number;
}

const CashFlowComparison: React.FC<CashFlowComparisonProps> = ({
  incomeData,
  expenseData,
  loading = false
}) => {
  const { chartData, tableData, totals } = useMemo(() => {
    // Combine data by period
    const periodMap = new Map<string, CombinedPeriodData>();

    incomeData.forEach(item => {
      const existing = periodMap.get(item.period_label) || {
        period: item.period_label,
        income: 0,
        expense: 0,
        netFlow: 0,
        margin: 0
      };
      existing.income = item.total_amount;
      periodMap.set(item.period_label, existing);
    });

    expenseData.forEach(item => {
      const existing = periodMap.get(item.period_label) || {
        period: item.period_label,
        income: 0,
        expense: 0,
        netFlow: 0,
        margin: 0
      };
      existing.expense = item.total_amount;
      periodMap.set(item.period_label, existing);
    });

    // Calculate net flow and margin
    const combined: CombinedPeriodData[] = Array.from(periodMap.values())
      .map(item => ({
        ...item,
        netFlow: item.income - item.expense,
        margin: item.income > 0 ? ((item.income - item.expense) / item.income) * 100 : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate totals
    const totalIncome = combined.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = combined.reduce((sum, item) => sum + item.expense, 0);
    const totalNetFlow = totalIncome - totalExpense;
    const totalMargin = totalIncome > 0 ? (totalNetFlow / totalIncome) * 100 : 0;

    // Prepare chart data
    const categories = combined.map(item => item.period_label);
    const incomeSeries = combined.map(item => item.income);
    const expenseSeries = combined.map(item => item.expense);

    return {
      chartData: {
        categories,
        incomeSeries,
        expenseSeries
      },
      tableData: combined,
      totals: {
        income: totalIncome,
        expense: totalExpense,
        netFlow: totalNetFlow,
        margin: totalMargin
      }
    };
  }, [incomeData, expenseData]);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false,
          reset: true
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['#10b981', '#ef4444'],
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.6,
        opacityTo: 0.1
      }
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value) => {
          if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}k`;
          }
          return `$${value.toFixed(0)}`;
        }
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => {
          return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        }
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right'
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Flujo de Caja - Ingresos vs Egresos
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comparativa de períodos
          </p>
        </div>

        <ReactApexChart
          options={chartOptions}
          series={[
            { name: 'Ingresos', data: chartData.incomeSeries },
            { name: 'Egresos', data: chartData.expenseSeries }
          ]}
          type="area"
          height={350}
        />

        {/* Summary below chart */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Acumulado Ingresos</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(totals.income)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Acumulado Egresos</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(totals.expense)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Flujo Neto</p>
              <p className={`text-lg font-semibold ${totals.netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(totals.netFlow)} ({totals.margin >= 0 ? '+' : ''}{totals.margin.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detalle por Período - Comparativa
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Egresos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Flujo Neto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Margen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tableData.map((row) => (
                <tr key={row.period} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {row.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                    {formatCurrency(row.income)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                    {formatCurrency(row.expense)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${row.netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(row.netFlow)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={row.margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {row.margin.toFixed(1)}%
                      </span>
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${row.margin >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(Math.abs(row.margin), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  TOTAL
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                  {formatCurrency(totals.income)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                  {formatCurrency(totals.expense)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${totals.netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(totals.netFlow)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                  {totals.margin.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashFlowComparison;
