// src/components/Dashboard/TreemapCard.tsx
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { formatCurrency } from '../../utils/dashboardHelpers';
import type { CategorySummary } from '../../types/dashboard';

interface TreemapCardProps {
  data: CategorySummary[];
  title: string;
  color: 'green' | 'red';
}

// Función para convertir hex a RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Función para crear variaciones de tonalidad de un color base
function createColorShades(baseColor: string, numShades: number): string[] {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [baseColor];

  if (numShades === 1) return [baseColor];

  const shades: string[] = [];

  // Crear tonalidades desde más oscura hasta más clara
  for (let i = 0; i < numShades; i++) {
    // Factor de luminosidad: 0.6 (más oscuro) a 1.4 (más claro)
    const factor = 0.6 + (i / (numShades - 1)) * 0.8;

    // Aplicar el factor y asegurar que no exceda 255 ni sea menor que 0
    const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
    const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
    const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));

    shades.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
  }

  return shades;
}

export default function TreemapCard({ data, title, color }: TreemapCardProps) {
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

  // Paletas de colores de 10 tonos (igual que PieChartCard)
  const redPalette = [
    '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#B91C1C',
    '#991B1B', '#7F1D1D', '#FEE2E2', '#FECACA', '#BE123C',
  ];

  const greenPalette = [
    '#059669', '#10B981', '#34D399', '#6EE7B7', '#047857',
    '#065F46', '#064E3B', '#D1FAE5', '#A7F3D0', '#15803D',
  ];

  const palette = color === 'red' ? redPalette : greenPalette;

  // Agrupar categorías por tipo
  const typeGroups = data.reduce((acc, item) => {
    const typeId = item.type_id;
    if (!acc[typeId]) {
      acc[typeId] = {
        type_name: item.type_name,
        type_color: item.type_color,
        categories: []
      };
    }
    acc[typeId].categories.push(item);
    return acc;
  }, {} as Record<number, { type_name: string; type_color: string; categories: CategorySummary[] }>);

  // Asignar colores base a cada tipo
  const typeColors: Record<number, string> = {};
  Object.keys(typeGroups).forEach((typeIdStr, index) => {
    const typeId = parseInt(typeIdStr);
    const typeGroup = typeGroups[typeId];
    // Priorizar palette para variedad visual, solo usar type_color si es único
    const hasCustomColor = typeGroup.type_color && typeGroup.type_color !== '#EF4444' && typeGroup.type_color !== '#10B981';
    typeColors[typeId] = hasCustomColor ? typeGroup.type_color : palette[index % palette.length];
  });

  // Transformar datos para treemap con colores por tipo
  const transformedData = data.map(item => {
    const typeId = item.type_id;
    const baseColor = typeColors[typeId];
    const categoriesInType = typeGroups[typeId].categories;
    const categoryIndex = categoriesInType.findIndex(cat => cat.category_id === item.category_id);

    // Crear variaciones de color para las categorías del mismo tipo
    const colorShades = createColorShades(baseColor, categoriesInType.length);
    const categoryColor = colorShades[categoryIndex] || baseColor;

    return {
      x: `${item.type_name} - ${item.category_name}`,
      y: item.total_amount,
      fillColor: categoryColor
    };
  });

  const chartOptions: ApexOptions = {
    chart: {
      type: 'treemap',
      fontFamily: 'Inter, sans-serif',
      background: 'transparent'
    },
    plotOptions: {
      treemap: {
        enableShades: false, // Deshabilitamos las sombras automáticas porque usamos nuestras propias variaciones
        distributed: true
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px'
      },
      formatter: function(text: string, op: any) {
        return [text, formatCurrency(op.value)]
      }
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val)
      }
    }
  };

  const series = [{
    data: transformedData
  }];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <Chart
        options={chartOptions}
        series={series}
        type="treemap"
        height={350}
      />
    </div>
  );
}
