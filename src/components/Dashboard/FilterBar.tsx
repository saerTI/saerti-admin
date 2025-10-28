// src/components/Dashboard/FilterBar.tsx
import { RefreshCw } from 'lucide-react';

interface FilterBarProps {
  selectedPeriod: 'week' | 'month' | 'quarter' | 'year';
  setSelectedPeriod: (period: 'week' | 'month' | 'quarter' | 'year') => void;
  dateRange: { date_from: string; date_to: string };
  setDateRange: (range: { date_from: string; date_to: string }) => void;
  onRefresh: () => void;
  color?: 'green' | 'red';
}

export default function FilterBar({
  selectedPeriod,
  setSelectedPeriod,
  dateRange,
  setDateRange,
  onRefresh,
  color = 'green'
}: FilterBarProps) {
  const periods: Array<{ value: 'week' | 'month' | 'quarter' | 'year'; label: string }> = [
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Año' }
  ];

  const btnColorClass = color === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
  const activeBtnClass = color === 'green' ? 'bg-green-600 text-white' : 'bg-red-600 text-white';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Selector de Período */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Período:
          </label>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period.value
                    ? activeBtnClass
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* DatePickers */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Desde:
          </label>
          <input
            type="date"
            value={dateRange.date_from}
            onChange={(e) => setDateRange({ ...dateRange, date_from: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hasta:
          </label>
          <input
            type="date"
            value={dateRange.date_to}
            onChange={(e) => setDateRange({ ...dateRange, date_to: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botón Refresh */}
        <button
          onClick={onRefresh}
          className={`ml-auto px-4 py-2 ${btnColorClass} text-white rounded-lg transition-colors flex items-center gap-2`}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>
    </div>
  );
}
