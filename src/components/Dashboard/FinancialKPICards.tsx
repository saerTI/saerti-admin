import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, PiggyBank, Percent } from 'lucide-react';
import type { FinancialKPIs } from '../../services/consolidatedDashboardService';

interface FinancialKPICardsProps {
  kpis: FinancialKPIs;
  loading?: boolean;
}

const FinancialKPICards: React.FC<FinancialKPICardsProps> = ({ kpis, loading = false }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number, inverse: boolean = false) => {
    const isPositive = inverse ? value < 0 : value > 0;
    return isPositive ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getTrendColor = (value: number, inverse: boolean = false) => {
    const isPositive = inverse ? value < 0 : value > 0;
    return isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'income',
      title: 'Total Ingresos',
      value: kpis.totalIncome,
      trend: kpis.incomeGrowth,
      secondary: `${kpis.incomeCount} registros`,
      icon: DollarSign,
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      id: 'expense',
      title: 'Total Egresos',
      value: kpis.totalExpense,
      trend: kpis.expenseGrowth,
      secondary: `${kpis.expenseCount} registros`,
      icon: Activity,
      color: 'red',
      bgColor: 'bg-red-500',
      lightBg: 'bg-red-50 dark:bg-red-900/20',
      inverseTrend: true
    },
    {
      id: 'cashflow',
      title: 'Flujo Neto',
      value: kpis.netCashFlow,
      trend: kpis.cashFlowGrowth,
      secondary: kpis.netCashFlow >= 0 ? 'Positivo' : 'Negativo',
      icon: PiggyBank,
      color: kpis.netCashFlow >= 0 ? 'blue' : 'red',
      bgColor: kpis.netCashFlow >= 0 ? 'bg-blue-500' : 'bg-red-500',
      lightBg: kpis.netCashFlow >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'
    },
    {
      id: 'margin',
      title: 'Margen',
      value: kpis.profitMargin,
      trend: 0, // Calculate margin change if you have historical data
      secondary: kpis.profitMargin >= 20 ? 'Saludable' : kpis.profitMargin >= 10 ? 'Moderado' : 'Bajo',
      icon: Percent,
      color: 'purple',
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50 dark:bg-purple-900/20',
      isPercentage: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const trendColor = card.inverseTrend
          ? getTrendColor(card.trend, true)
          : getTrendColor(card.trend);
        const trendIcon = card.inverseTrend
          ? getTrendIcon(card.trend, true)
          : getTrendIcon(card.trend);

        return (
          <div
            key={card.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
          >
            {/* Header with icon */}
            <div className={`${card.lightBg} px-6 pt-4 pb-3`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </h3>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {/* Main value */}
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {card.isPercentage ? `${card.value.toFixed(1)}%` : formatCurrency(card.value)}
              </div>

              {/* Trend */}
              {card.trend !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${trendColor} mb-2`}>
                  {trendIcon}
                  <span className="font-medium">{formatPercentage(card.trend)} vs mes ant.</span>
                </div>
              )}

              {/* Secondary metric */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {card.secondary}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FinancialKPICards;
