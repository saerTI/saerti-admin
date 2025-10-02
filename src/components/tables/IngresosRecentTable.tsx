// src/components/tables/IngresosRecentTable.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useIngresos } from '../../hooks/useIngresos';
import { formatCurrency } from '../../utils/formatters';

/**
 * Componente que muestra los ingresos más recientes usando datos reales del backend
 */
export const IngresosRecentTable: React.FC = () => {
  const {
    ingresos,
    loading,
    error,
    hasData,
    isEmpty
  } = useIngresos({
    autoFetch: true,
    initialFilters: {
      page: 1,
      limit: 5, // Solo mostrar los 5 más recientes
      sortBy: 'created_at',
      sortDirection: 'desc'
    }
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Error al cargar ingresos</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">No hay ingresos registrados</p>
          <Link
            to="/ingresos/new"
            className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 text-sm"
          >
            Crear primer ingreso
            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Ingresos Recientes (Datos Reales)
          </h3>
          <Link
            to="/ingresos"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todos
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Documento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {ingresos.map((ingreso) => (
              <tr key={ingreso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {ingreso.document_number}
                  </div>
                  {ingreso.ep_detail && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32">
                      {ingreso.ep_detail}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {ingreso.client_name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {ingreso.client_tax_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(ingreso.date).toLocaleDateString('es-CL')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(ingreso.ep_total)}
                  </div>
                  {ingreso.total_amount !== ingreso.ep_total && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Total: {formatCurrency(ingreso.total_amount)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(ingreso.state)}`}>
                    {getStateLabel(ingreso.state)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link
                    to={`/ingresos/${ingreso.id}`}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Ver
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    to={`/ingresos/editar/${ingreso.id}`}
                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasData && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>Mostrando {ingresos.length} ingresos recientes</span>
            <Link
              to="/ingresos"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Ver todos los ingresos →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Obtiene el color para el estado del ingreso
 */
function getStateColor(state: string): string {
  switch (state) {
    case 'borrador':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case 'activo':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'facturado':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'pagado':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'cancelado':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

/**
 * Obtiene la etiqueta para el estado del ingreso
 */
function getStateLabel(state: string): string {
  switch (state) {
    case 'borrador':
      return 'Borrador';
    case 'activo':
      return 'Activo';
    case 'facturado':
      return 'Facturado';
    case 'pagado':
      return 'Pagado';
    case 'cancelado':
      return 'Cancelado';
    default:
      return state;
  }
}

export default IngresosRecentTable;
