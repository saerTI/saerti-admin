import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TopTransaction } from '../../services/consolidatedDashboardService';

interface TopNTableProps {
  transactions: TopTransaction[];
  type: 'income' | 'expense';
  loading?: boolean;
}

const TopNTable: React.FC<TopNTableProps> = ({ transactions, type, loading = false }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const isIncome = type === 'income';

  const title = isIncome ? 'Mayores Ingresos del Mes' : 'Mayores Egresos del Mes';
  const icon = isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />;
  const headerColor = isIncome
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  const iconColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className={`${headerColor} border-b px-6 py-4`}>
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {transactions.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo/Categoría
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">{transaction.type_name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.category_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-semibold ${iconColor}`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay transacciones disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopNTable;
