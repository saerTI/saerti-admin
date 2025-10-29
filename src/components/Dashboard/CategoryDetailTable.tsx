// src/components/Dashboard/CategoryDetailTable.tsx
import { formatCurrency } from '../../utils/dashboardHelpers';
import type { CategorySummary } from '../../types/dashboard';

interface CategoryDetailTableProps {
  data: CategorySummary[];
  color: 'green' | 'red';
}

export default function CategoryDetailTable({ data, color }: CategoryDetailTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detalle por Categoría
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No hay datos para mostrar
        </div>
      </div>
    );
  }

  const borderColor = color === 'red' ? 'border-red-200 dark:border-red-800' : 'border-emerald-200 dark:border-emerald-800';
  const headerBg = color === 'red' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
  const headerText = color === 'red' ? 'text-red-900 dark:text-red-100' : 'text-emerald-900 dark:text-emerald-100';
  const progressBg = color === 'red' ? 'bg-red-500' : 'bg-emerald-500';

  const total = data.reduce((sum, item) => sum + item.total_amount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Detalle por Categoría
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={headerBg}>
            <tr>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${headerText} uppercase tracking-wider`}>
                Tipo
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${headerText} uppercase tracking-wider`}>
                Categoría
              </th>
              <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${headerText} uppercase tracking-wider`}>
                Monto Total
              </th>
              <th scope="col" className={`px-6 py-3 text-center text-xs font-medium ${headerText} uppercase tracking-wider`}>
                Cantidad
              </th>
              <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${headerText} uppercase tracking-wider`}>
                Promedio
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${headerText} uppercase tracking-wider`}>
                % del Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.total_amount / total) * 100 : 0;
              const avgAmount = item.count > 0 ? item.total_amount / item.count : 0;

              return (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.type_color }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.type_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(item.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {item.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(avgAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${progressBg} rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className={`${headerBg} font-semibold`}>
            <tr>
              <td colSpan={2} className={`px-6 py-4 text-sm ${headerText}`}>
                Total General
              </td>
              <td className={`px-6 py-4 text-sm text-right ${headerText}`}>
                {formatCurrency(total)}
              </td>
              <td className={`px-6 py-4 text-center text-sm ${headerText}`}>
                {data.reduce((sum, item) => sum + item.count, 0)}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
