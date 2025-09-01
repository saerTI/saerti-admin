// src/components/tables/IngresosFullTable.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIngresos } from '../../hooks/useIngresos';
import { formatCurrency } from '../../utils/formatters';
import { IngresoFilter } from '../../types/CC/ingreso';

interface IngresosFullTableProps {
  initialFilters?: Partial<IngresoFilter>;
  showTitle?: boolean;
  pageSize?: number;
  showFilters?: boolean;
}

/**
 * Componente completo de tabla de ingresos con paginación
 */
export const IngresosFullTable: React.FC<IngresosFullTableProps> = ({
  initialFilters = {},
  showTitle = true,
  pageSize = 10,
  showFilters = true
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Partial<IngresoFilter>>({
    page: 1,
    limit: pageSize,
    sortBy: 'created_at',
    sortDirection: 'desc',
    ...initialFilters
  });

  const {
    ingresos,
    loading,
    error,
    hasData,
    isEmpty,
    pagination,
    fetchIngresos
  } = useIngresos({
    autoFetch: true,
    initialFilters: filters
  });

  // Estado para filtros locales
  const [localSearch, setLocalSearch] = useState('');
  const [localState, setLocalState] = useState('all');
  const [localCategory, setLocalCategory] = useState('all');

  // Actualizar filtros cuando cambie la página
  useEffect(() => {
    setFilters((prev: Partial<IngresoFilter>) => ({
      ...prev,
      page: currentPage
    }));
  }, [currentPage]);

  // Refrescar datos cuando cambien los filtros
  useEffect(() => {
    fetchIngresos(filters);
  }, [filters, fetchIngresos]);

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Manejar búsqueda
  const handleSearch = () => {
    const newFilters: Partial<IngresoFilter> = {
      ...filters,
      page: 1,
      ...(localSearch && { search: localSearch }),
      ...(localState !== 'all' && { state: localState as 'borrador' | 'activo' | 'facturado' | 'pagado' | 'cancelado' }),
      ...(localCategory !== 'all' && { categoryId: parseInt(localCategory) })
    };
    
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setLocalSearch('');
    setLocalState('all');
    setLocalCategory('all');
    setFilters({
      page: 1,
      limit: pageSize,
      sortBy: 'created_at',
      sortDirection: 'desc'
    });
    setCurrentPage(1);
  };

  // Opciones de categorías
  const categoryOptions = [
    { value: 'all', label: 'Todas las categorías' },
    { value: '1', label: 'Pagos de Clientes' },
    { value: '2', label: 'Anticipos' },
    { value: '3', label: 'Estados de Pago' },
    { value: '4', label: 'Venta de Activos' },
    { value: '5', label: 'Devoluciones' },
    { value: '6', label: 'Subsidios' },
    { value: '7', label: 'Retorno de Inversiones' },
    { value: '8', label: 'Otros Ingresos' },
  ];

  // Opciones de estado
  const stateOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'activo', label: 'Activo' },
    { value: 'facturado', label: 'Facturado' },
    { value: 'pagado', label: 'Pagado' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  if (loading && currentPage === 1) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
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
          <button
            onClick={() => fetchIngresos()}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {showTitle && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Listado de Ingresos
            </h3>
            <Link
              to="/ingresos/nuevo"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Nuevo Ingreso
            </Link>
          </div>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Buscar por documento, cliente..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                value={localState}
                onChange={(e) => setLocalState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {stateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <select
                value={localCategory}
                onChange={(e) => setLocalCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1"
              >
                Buscar
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
            No se encontraron ingresos
          </p>
          <p className="text-gray-500 dark:text-gray-500 mb-4">
            {Object.keys(filters).length > 3 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Aún no tienes ingresos registrados'
            }
          </p>
          <Link
            to="/ingresos/nuevo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Crear primer ingreso
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      ) : (
        <>
          {/* Tabla */}
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
                {loading ? (
                  // Skeleton loading para páginas siguientes
                  Array(pageSize).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    </tr>
                  ))
                ) : (
                  ingresos.map((ingreso) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination && pagination.total_pages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {((pagination.current_page - 1) * pagination.per_page) + 1} a{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de{' '}
                  {pagination.total} resultados
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Botón página anterior */}
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Anterior
                  </button>
                  
                  {/* Números de página */}
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum: number;
                    
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.current_page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.current_page >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = pagination.current_page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          pageNum === pagination.current_page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* Botón página siguiente */}
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.total_pages}
                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
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

export default IngresosFullTable;
