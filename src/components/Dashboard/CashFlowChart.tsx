// src/components/Dashboard/CashFlowChart.tsx
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { formatCurrency, formatPeriodLabel, getPeriodName } from '../../utils/dashboardHelpers';
import type { CashFlowPeriod } from '../../types/dashboard';

interface CashFlowChartProps {
  data: CashFlowPeriod[];
  period: 'week' | 'month' | 'quarter' | 'year';
  color: 'green' | 'red';
}

export default function CashFlowChart({ data, period, color }: CashFlowChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Flujo de Caja por {getPeriodName(period)}
        </h3>
        <div className="h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          No hay datos para mostrar
        </div>
      </div>
    );
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    colors: [color === 'green' ? '#10B981' : '#EF4444'],
    xaxis: {
      categories: data.map(d => formatPeriodLabel(d.period_label, period)),
      labels: {
        style: {
          colors: '#6B7280'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatCurrency(val),
        style: {
          colors: '#6B7280'
        }
      }
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val)
      }
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 3
    }
  };

  const series = [{
    name: color === 'green' ? 'Ingresos' : 'Egresos',
    data: data.map(d => d.total_amount)
  }];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Flujo de Caja por {getPeriodName(period)}
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {data.length} períodos
        </span>
      </div>
      <Chart
        options={chartOptions}
        series={series}
        type="area"
        height={400}
      />
    </div>
  );
}
