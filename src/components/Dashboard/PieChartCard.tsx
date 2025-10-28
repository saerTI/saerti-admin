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

  // Paletas extendidas con ~100 colores
  // Paleta de egresos: Rojos, naranjas, amarillos
  const expensePalette = [
    // Rojos intensos
    '#DC2626', '#EF4444', '#F87171', '#B91C1C', '#991B1C', '#7F1D1D', '#BE123C', '#E11D48', '#F43F5E',
    // Naranjas
    '#EA580C', '#F97316', '#FB923C', '#FDBA74', '#C2410C', '#9A3412', '#FF6B35', '#FF8A5B', '#FF9B6A',
    // Naranjas rojizos
    '#DC2F02', '#E85D04', '#F48C06', '#FAA307', '#FFBA08', '#D00000', '#9D0208', '#FF4D00', '#FF6600',
    // Amarillos cálidos
    '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#D97706', '#B45309', '#F9A825', '#FFB300', '#FFC107',
    // Coral y salmón
    '#FF6F61', '#FF8C94', '#FFA07A', '#FA8072', '#E9967A', '#F08080', '#CD5C5C', '#DC143C', '#FF7F50',
    // Terracota
    '#C1666B', '#D4A5A5', '#9B6A6C', '#A67C6D', '#8B4513', '#CD853F', '#D2691E', '#B8860B', '#DAA520',
    // Rojos oscuros y vino
    '#800020', '#8B0000', '#A52A2A', '#B22222', '#8B2500', '#A0522D', '#922B21', '#78281F', '#641E16',
    // Naranjas pastel
    '#FFD3B6', '#FFAAA5', '#FF8B94', '#FFC3A0', '#FFB6B9', '#FEC8D8', '#FFDFD3', '#FFE5B4', '#FFEAA7',
    // Rojos suaves
    '#FFCCCB', '#FFB3BA', '#FFA7A7', '#FF9999', '#FF8888', '#FF7777', '#FFAAAA', '#FF6666', '#FF5555',
    // Amarillos brillantes
    '#FFE66D', '#FFEB3B', '#FFF176', '#FFF59D', '#FFEE58', '#FFD54F', '#FFCA28', '#FBC02D', '#F9A825',
    // Tonos tierra
    '#BC6C25', '#DDA15E', '#FEFAE0', '#E76F51', '#F4A261', '#E9C46A', '#D4A574', '#C19A6B', '#B8956A',
    // Extra rojos
    '#FF4500', '#FF6347', '#FF7F50', '#FA8072'
  ];

  // Paleta de ingresos: Verdes, azules, celestes
  const incomePalette = [
    // Verdes esmeralda
    '#059669', '#10B981', '#34D399', '#6EE7B7', '#047857', '#065F46', '#064E3B', '#15803D', '#166534',
    // Verdes brillantes
    '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0', '#16A34A', '#14532D', '#84CC16', '#A3E635', '#BEF264',
    // Verdes azulados
    '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4', '#0D9488', '#0F766E', '#115E59', '#134E4A', '#20B2AA',
    // Azules turquesa
    '#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC', '#0891B2', '#0E7490', '#155E75', '#00CED1', '#48D1CC',
    // Azules cielo
    '#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD', '#0284C7', '#0369A1', '#075985', '#0C4A6E', '#1E90FF',
    // Azules profundos
    '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#4169E1',
    // Azules acero
    '#4682B4', '#5F9EA0', '#6495ED', '#00BFFF', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1', '#4A90E2',
    // Verdes pastel
    '#A8E6CF', '#C1FBA4', '#B4F8C8', '#A0E7E5', '#88D8B0', '#98D8C8', '#6BCF7F', '#77DD77', '#90EE90',
    // Azules pastel
    '#B4E7F5', '#A7C7E7', '#87CEEB', '#B0E0E6', '#ADD8E6', '#AFEEEE', '#B0C4DE', '#BBDEFB', '#C5E1A5',
    // Menta y lima
    '#00FA9A', '#00FF7F', '#7FFF00', '#ADFF2F', '#98FB98', '#90EE90', '#8FBC8F', '#3CB371', '#2E8B57',
    // Cyan y aqua
    '#00FFFF', '#00E5E5', '#00D9D9', '#00CCCC', '#00BFBF', '#00B3B3', '#00A6A6', '#009999', '#008B8B',
    // Extra azules y verdes
    '#5DADE2', '#52BE80', '#48C9B0', '#45B39D'
  ];

  const palette = color === 'red' ? expensePalette : incomePalette;

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
