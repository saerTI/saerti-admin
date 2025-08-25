// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/components/KPICard.tsx

import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'pink' | 'gray';
  className?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  className = '',
  trend,
  trendValue
}) => {
  const colorClasses = {
    blue: 'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800',
    green: 'from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800',
    yellow: 'from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-800',
    red: 'from-red-50 to-rose-50 border-red-200 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-800',
    purple: 'from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800',
    indigo: 'from-indigo-50 to-blue-50 border-indigo-200 dark:from-indigo-900/20 dark:to-blue-900/20 dark:border-indigo-800',
    pink: 'from-pink-50 to-rose-50 border-pink-200 dark:from-pink-900/20 dark:to-rose-900/20 dark:border-pink-800',
    gray: 'from-gray-50 to-slate-50 border-gray-200 dark:from-gray-900/20 dark:to-slate-900/20 dark:border-gray-800'
  };

  const textColorClasses = {
    blue: 'text-blue-700 dark:text-blue-400',
    green: 'text-green-700 dark:text-green-400',
    yellow: 'text-yellow-700 dark:text-yellow-400',
    red: 'text-red-700 dark:text-red-400',
    purple: 'text-purple-700 dark:text-purple-400',
    indigo: 'text-indigo-700 dark:text-indigo-400',
    pink: 'text-pink-700 dark:text-pink-400',
    gray: 'text-gray-700 dark:text-gray-400'
  };

  const subtitleColorClasses = {
    blue: 'text-blue-600 dark:text-blue-500',
    green: 'text-green-600 dark:text-green-500',
    yellow: 'text-yellow-600 dark:text-yellow-500',
    red: 'text-red-600 dark:text-red-500',
    purple: 'text-purple-600 dark:text-purple-500',
    indigo: 'text-indigo-600 dark:text-indigo-500',
    pink: 'text-pink-600 dark:text-pink-500',
    gray: 'text-gray-600 dark:text-gray-500'
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return '';
    }
  };

  return (
    <div className={`
      bg-gradient-to-br ${colorClasses[color]} 
      p-4 rounded-lg border transition-all duration-200 hover:shadow-md
      ${className}
    `}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {title}
        </span>
        {icon && (
          <span className="text-2xl" role="img" aria-label={title}>
            {icon}
          </span>
        )}
      </div>
      
      <div className="mb-1">
        <div className={`text-2xl font-bold ${textColorClasses[color]}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        {subtitle && (
          <div className={`text-xs ${subtitleColorClasses[color]}`}>
            {subtitle}
          </div>
        )}
        
        {trend && trendValue && (
          <div className={`flex items-center text-xs font-medium ${getTrendColor()}`}>
            <span className="mr-1">{getTrendIcon()}</span>
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;