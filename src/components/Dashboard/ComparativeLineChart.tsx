import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import type { CashFlowPeriod } from '../../types/dashboard';

interface ComparativeLineChartProps {
  incomeData: CashFlowPeriod[];
  expenseData: CashFlowPeriod[];
  loading?: boolean;
}

const ComparativeLineChart: React.FC<ComparativeLineChartProps> = ({
  incomeData,
  expenseData,
  loading = false
}) => {
  const { series, categories } = useMemo(() => {
    // Combine and sort both datasets by period
    const allPeriods = new Set<string>();

    incomeData.forEach(item => allPeriods.add(item.period_label));
    expenseData.forEach(item => allPeriods.add(item.period_label));

    const sortedPeriods = Array.from(allPeriods).sort();

    // Create maps for quick lookup
    const incomeMap = new Map(incomeData.map(item => [item.period_label, item.total_amount]));
    const expenseMap = new Map(expenseData.map(item => [item.period_label, item.total_amount]));

    // Build series data
    const incomeSeries = sortedPeriods.map(period => incomeMap.get(period) || 0);
    const expenseSeries = sortedPeriods.map(period => expenseMap.get(period) || 0);

    return {
      series: [
        {
          name: 'Ingresos',
          data: incomeSeries
        },
        {
          name: 'Egresos',
          data: expenseSeries
        }
      ],
      categories: sortedPeriods
    };
  }, [incomeData, expenseData]);

  const options: ApexOptions = {
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
      },
      animations: {
        enabled: true,
        speed: 800
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
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          fontSize: '12px'
        },
        rotate: -45,
        rotateAlways: false
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
        },
        style: {
          fontSize: '12px'
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
      horizontalAlign: 'right',
      fontSize: '14px',
      markers: {
        size: 6,
        shape: 'circle'
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Evolución Mensual - Ingresos vs Egresos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Últimos {categories.length} períodos
        </p>
      </div>

      <ReactApexChart
        options={options}
        series={series}
        type="area"
        height={350}
      />
    </div>
  );
};

export default ComparativeLineChart;
