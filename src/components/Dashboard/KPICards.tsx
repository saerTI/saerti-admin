// src/components/Dashboard/KPICards.tsx
import { DollarSign, FileText, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/dashboardHelpers';
import type { DashboardSummary } from '../../types/dashboard';

interface KPICardsProps {
  summary: DashboardSummary | null;
  color?: 'green' | 'red';
}

export default function KPICards({ summary, color = 'green' }: KPICardsProps) {
  if (!summary) return null;

  const cards = [
    {
      title: color === 'green' ? 'Total Ingresos' : 'Total Egresos',
      value: formatCurrency(summary.total_amount),
      icon: DollarSign,
      trend: summary.trend_percentage,
      trendDirection: summary.trend_direction,
      color: color
    },
    {
      title: 'Cantidad de Registros',
      value: summary.total_count.toString(),
      icon: FileText,
      color: 'blue' as const
    },
    {
      title: 'Promedio por Registro',
      value: formatCurrency(summary.avg_amount),
      icon: TrendingUp,
      color: 'purple' as const
    },
    {
      title: 'Tipos Activos',
      value: summary.by_type.length.toString(),
      icon: Calendar,
      color: 'orange' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              {card.trend !== undefined && (
                <div className="mt-2 flex items-center gap-1">
                  {card.trendDirection === 'up' ? (
                    <TrendingUp className="text-green-500" size={16} />
                  ) : card.trendDirection === 'down' ? (
                    <TrendingDown className="text-red-500" size={16} />
                  ) : null}
                  {card.trendDirection !== 'stable' && (
                    <span
                      className={`text-sm font-medium ${
                        card.trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {Math.abs(card.trend).toFixed(1)}% vs período anterior
                    </span>
                  )}
                </div>
              )}
            </div>
            <div
              className={`p-3 rounded-lg ${
                card.color === 'green'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : card.color === 'red'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : card.color === 'blue'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : card.color === 'purple'
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'bg-orange-100 dark:bg-orange-900/30'
              }`}
            >
              <card.icon
                className={`${
                  card.color === 'green'
                    ? 'text-green-600 dark:text-green-400'
                    : card.color === 'red'
                    ? 'text-red-600 dark:text-red-400'
                    : card.color === 'blue'
                    ? 'text-blue-600 dark:text-blue-400'
                    : card.color === 'purple'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
                size={24}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
