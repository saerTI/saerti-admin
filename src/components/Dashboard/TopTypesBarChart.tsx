import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import type { TypeSummary } from '../../types/dashboard';

interface TopTypesBarChartProps {
  incomeByType: TypeSummary[];
  expenseByType: TypeSummary[];
  topN?: number;
  loading?: boolean;
}

const TopTypesBarChart: React.FC<TopTypesBarChartProps> = ({
  incomeByType,
  expenseByType,
  topN = 5,
  loading = false
}) => {
  const chartData = useMemo(() => {
    // Get top N for each type
    const topIncomes = [...incomeByType]
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, topN);

    const topExpenses = [...expenseByType]
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, topN);

    // Prepare data for grouped bar chart
    const incomeCategories = topIncomes.map(item => item.type_name);
    const incomeValues = topIncomes.map(item => item.total_amount);

    const expenseCategories = topExpenses.map(item => item.type_name);
    const expenseValues = topExpenses.map(item => item.total_amount);

    return {
      income: {
        categories: incomeCategories,
        values: incomeValues
      },
      expense: {
        categories: expenseCategories,
        values: expenseValues
      }
    };
  }, [incomeByType, expenseByType, topN]);

  const incomeOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 250,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: ['#10b981'],
    dataLabels: {
      enabled: true,
      formatter: (value: number | string | number[]) => {
        const num = typeof value === 'number' ? value : parseFloat(String(value));
        if (num >= 1000000) {
          return `$${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
          return `$${(num / 1000).toFixed(0)}k`;
        }
        return `$${num}`;
      },
      offsetX: 5,
      style: {
        fontSize: '11px',
        colors: ['#000']
      }
    },
    xaxis: {
      categories: chartData.income.categories,
      labels: {
        formatter: (value) => {
          const num = parseFloat(value);
          if (num >= 1000000) {
            return `$${(num / 1000000).toFixed(1)}M`;
          } else if (num >= 1000) {
            return `$${(num / 1000).toFixed(0)}k`;
          }
          return `$${num}`;
        },
        style: {
          fontSize: '11px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    tooltip: {
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
    }
  };

  const expenseOptions: ApexOptions = {
    ...incomeOptions,
    colors: ['#ef4444']
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 gap-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top {topN} Tipos: Ingresos vs Egresos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Comparativa de mayores movimientos por tipo
        </p>
      </div>

      <div className="space-y-8">
        {/* Ingresos Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Top {topN} Ingresos
            </h4>
          </div>
          {chartData.income.categories.length > 0 ? (
            <ReactApexChart
              options={{
                ...incomeOptions,
                xaxis: {
                  ...incomeOptions.xaxis,
                  categories: chartData.income.categories
                }
              }}
              series={[{ name: 'Ingresos', data: chartData.income.values }]}
              type="bar"
              height={250}
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No hay datos de ingresos disponibles
              </p>
            </div>
          )}
        </div>

        {/* Egresos Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Top {topN} Egresos
            </h4>
          </div>
          {chartData.expense.categories.length > 0 ? (
            <ReactApexChart
              options={{
                ...expenseOptions,
                xaxis: {
                  ...expenseOptions.xaxis,
                  categories: chartData.expense.categories
                }
              }}
              series={[{ name: 'Egresos', data: chartData.expense.values }]}
              type="bar"
              height={250}
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No hay datos de egresos disponibles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopTypesBarChart;
