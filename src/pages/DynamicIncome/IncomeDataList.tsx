// src/pages/DynamicIncome/IncomeDataList.tsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { incomeDataService } from '../../services/incomeDataService';
import { incomeTypeService } from '../../services/incomeTypeService';
import type { IncomeData, IncomeType, IncomeFilters } from '../../types/income';

export default function IncomeDataList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeIdParam = searchParams.get('tipo');

  const [incomes, setIncomes] = useState<IncomeData[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const [filters, setFilters] = useState<IncomeFilters>({
    income_type_id: typeIdParam ? Number(typeIdParam) : undefined,
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    loadIncomeTypes();
  }, []);

  useEffect(() => {
    loadIncomes();
  }, [filters]);

  const loadIncomeTypes = async () => {
    try {
      const types = await incomeTypeService.getAll();
      setIncomeTypes(types);
    } catch (err: any) {
      console.error('Error loading income types:', err);
    }
  };

  const loadIncomes = async () => {
    try {
      setLoading(true);
      const { data } = await incomeDataService.getAll(filters);
      setIncomes(data);
    } catch (err: any) {
      setError(err.message || 'Error cargando ingresos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este ingreso?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      await incomeDataService.delete(id);
      await loadIncomes();
    } catch (err: any) {
      alert(err.message || 'Error eliminando ingreso');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleFilterChange = (field: keyof IncomeFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset to first page when filtering
    }));

    // Update URL params
    if (field === 'income_type_id' && value) {
      searchParams.set('tipo', String(value));
      setSearchParams(searchParams);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL');
  };

  const selectedType = incomeTypes.find(t => t.id === filters.income_type_id);

  if (loading && incomes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando ingresos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Datos de Ingresos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {selectedType
              ? `Ingresos tipo: ${selectedType.name}`
              : 'Todos los ingresos registrados'}
          </p>
        </div>
        {selectedType && (
          <Link
            to={`/ingresos/datos/nuevo?tipo=${selectedType.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nuevo Ingreso
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Ingreso
            </label>
            <select
              value={filters.income_type_id || ''}
              onChange={(e) => handleFilterChange('income_type_id', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos los tipos</option>
              {incomeTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {!filters.income_type_id ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Seleccione un tipo de ingreso</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Debe seleccionar un tipo de ingreso para ver y crear registros
            </p>
            <div className="mt-6">
              <Link
                to="/ingresos/tipos"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ver Tipos de Ingresos
              </Link>
            </div>
          </div>
        </div>
      ) : incomes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay ingresos registrados</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comience creando su primer ingreso de tipo {selectedType?.name}
            </p>
            <div className="mt-6">
              <Link
                to={`/ingresos/datos/nuevo?tipo=${selectedType?.id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Crear Primer Ingreso
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  {selectedType?.show_amount && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Monto
                    </th>
                  )}
                  {selectedType?.show_date && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                  )}
                  {selectedType?.show_payment_method && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Método
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {income.name || '-'}
                      </div>
                    </td>
                    {selectedType?.show_amount && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(income.amount)}
                        </div>
                      </td>
                    )}
                    {selectedType?.show_date && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(income.date)}
                        </div>
                      </td>
                    )}
                    {selectedType?.show_payment_method && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {income.payment_method || '-'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/ingresos/datos/${income.id}/editar?tipo=${income.income_type_id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(income.id!)}
                        disabled={deleteLoading === income.id}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        {deleteLoading === income.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
