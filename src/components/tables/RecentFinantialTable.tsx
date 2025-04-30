import React from 'react';
import { formatCurrency } from '../../utils/formatters';

// Types
export interface FinancialRecordItem {
  id: number | string;
  name: string;
  category: string;
  date: string;
  state: 'draft' | 'pending' | 'approved' | 'paid' | 'deposited' | 'rejected';
  amount: number;
}

export interface RecentFinancialTableProps {
  data: FinancialRecordItem[];
  loading?: boolean;
  type: 'income' | 'expense';
  className?: string;
}

/**
 * Reusable component for displaying recent financial records
 * Works for both expenses and income records
 */
const RecentFinancialTable: React.FC<RecentFinancialTableProps> = ({
  data,
  loading = false,
  type = 'expense',
  className = '',
}) => {
  // Get state label based on record state
  const getStateLabel = (state: string): string => {
    switch (state) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      case 'paid':
        return 'Pagado';
      case 'deposited':
        return 'Depositado';
      default:
        return 'Borrador';
    }
  };

  // Get state badge color based on record state
  const getStateBadgeClass = (state: string): string => {
    switch (state) {
      case 'approved':
        return 'bg-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'rejected':
        return 'bg-red-200 text-red-800';
      case 'paid':
      case 'deposited':
        return 'bg-blue-200 text-blue-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Column title based on record type
  const conceptTitle = type === 'income' ? 'Concepto de Ingreso' : 'Concepto de Gasto';
  const categoryTitle = type === 'income' ? 'Categoría de Ingreso' : 'Categoría de Gasto';
  const stateTitle = type === 'income' ? 'Estado de Ingreso' : 'Estado de Gasto';

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden ${className}`}>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {conceptTitle}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {categoryTitle}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {stateTitle}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Monto
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {data.length > 0 ? (
              data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {record.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {record.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStateBadgeClass(
                        record.state
                      )}`}
                    >
                      {getStateLabel(record.state)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatCurrency(record.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay registros para mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecentFinancialTable;