// src/components/Dashboard/PieChartCard.tsx
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { formatCurrency } from '../../utils/dashboardHelpers';
import type { TypeSummary } from '../../types/dashboard';

interface PieChartCardProps {
  data: TypeSummary[];
  title: string;
  color: 'green' | 'red';
}

export default function PieChartCard({ data, title, color }: PieChartCardProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="h-[350px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          No hay datos para mostrar
        </div>
      </div>
    );
  }

  // Paletas de colores de 10 tonos
  const redPalette = [
    '#DC2626', // red-600
    '#EF4444', // red-500
    '#F87171', // red-400
    '#FCA5A5', // red-300
    '#B91C1C', // red-700
    '#991B1B', // red-800
    '#7F1D1D', // red-900
    '#FEE2E2', // red-100
    '#FECACA', // red-200
    '#BE123C', // rose-700
  ];

  const greenPalette = [
    '#059669', // emerald-600
    '#10B981', // emerald-500
    '#34D399', // emerald-400
    '#6EE7B7', // emerald-300
    '#047857', // emerald-700
    '#065F46', // emerald-800
    '#064E3B', // emerald-900
    '#D1FAE5', // emerald-100
    '#A7F3D0', // emerald-200
    '#15803D', // green-700
  ];

  const palette = color === 'red' ? redPalette : greenPalette;

  // Asignar colores: priorizar palette para variedad visual
  // Solo usar type_color si es significativamente diferente
  const colors = data.map((d, index) => {
    // Si el tipo no tiene color o todos tienen el mismo, usar palette
    const hasCustomColor = d.type_color && d.type_color !== '#EF4444' && d.type_color !== '#10B981';
    return hasCustomColor ? d.type_color : palette[index % palette.length];
  });

  const chartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      fontFamily: 'Inter, sans-serif',
      background: 'transparent'
    },
    labels: data.map(d => d.type_name),
    colors: colors,
    legend: {
      position: 'bottom',
      labels: {
        colors: '#6B7280'
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val)
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const series = data.map(d => d.total_amount);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <Chart
        options={chartOptions}
        series={series}
        type="pie"
        height={350}
      />
    </div>
  );
}
