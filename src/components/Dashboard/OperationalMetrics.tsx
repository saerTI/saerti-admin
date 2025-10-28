import React from 'react';
import { Building2, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import type { OperationalMetrics as OperationalMetricsType } from '../../services/consolidatedDashboardService';

interface OperationalMetricsProps {
  metrics: OperationalMetricsType;
  totalTransactions?: number;
  loading?: boolean;
}

const OperationalMetrics: React.FC<OperationalMetricsProps> = ({
  metrics,
  totalTransactions = 0,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      id: 'cost-centers',
      title: 'Centros de Costo',
      value: metrics.costCentersCount,
      label: 'Activos',
      icon: Building2,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'income-types',
      title: 'Tipos de Ingresos',
      value: metrics.incomeTypesCount,
      label: 'Activos',
      icon: TrendingUp,
      color: 'bg-green-500',
      lightBg: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'expense-types',
      title: 'Tipos de Egresos',
      value: metrics.expenseTypesCount,
      label: 'Activos',
      icon: TrendingDown,
      color: 'bg-red-500',
      lightBg: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      id: 'total-records',
      title: 'Total Registros',
      value: totalTransactions,
      label: 'Este mes',
      icon: FileText,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className={`${card.lightBg} rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-5`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {card.title}
                </p>
              </div>
              <div className={`${card.color} p-2 rounded-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className={`text-3xl font-bold ${card.textColor} mb-1`}>
              {card.value.toLocaleString('es-CL')}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default OperationalMetrics;
