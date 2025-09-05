import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/button/Button';
import { useAuth } from '@/context/AuthContext';
import empleadosService from '@/services/CC/empleadosService';
import type { Empleado, EmpleadoFilter } from '@/types/CC/empleados';

const Empleados = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmpleadoFilter>({
    search: '',
    active: '',
    department: '',
    position: '',
    cost_center: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total: 0,
    per_page: 15,
    has_next: false,
    has_prev: false
  });
  
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Create filter options
  const activeOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Activo' },
    { value: 'false', label: 'Inactivo' }
  ];

  // Load empleados on component mount and when filters change
  const fetchEmpleados = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching empleados - Page:', page, 'Filters:', filters);
      
      const response = await empleadosService.getEmpleados({ 
        ...filters, 
        page, 
        per_page: 15 
      });
      
      console.log('Response from API:', response);
      
      if (response && response.items) {
        setEmpleados(response.items);
        
        // Asegurar que la paginación tenga la estructura correcta
        const paginationData = response.pagination || {
          current_page: page,
          per_page: 15,
          total: response.items.length,
          total_pages: Math.ceil(response.items.length / 15),
          has_next: false,
          has_prev: false
        };
        
        setPagination(paginationData);
        console.log('Pagination set:', paginationData);
      } else {
        // Manejo de respuesta vacía o malformada
        setEmpleados([]);
        setPagination({
          current_page: 1,
          per_page: 15,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        });
      }
    } catch (err) {
      console.error('Error in fetchEmpleados:', err);
      setError('Error cargando empleados. Por favor, intente nuevamente.');
      setEmpleados([]);
      setPagination({
        current_page: 1,
        per_page: 15,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered - currentPage:', currentPage, 'filters:', filters);
    fetchEmpleados(currentPage);
  }, [filters, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.total_pages || page === currentPage) {
      return;
    }
    console.log('Changing to page:', page);
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (pagination.has_next && currentPage < pagination.total_pages) {
      const nextPage = currentPage + 1;
      console.log('Moving to next page:', nextPage);
      setCurrentPage(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (pagination.has_prev && currentPage > 1) {
      const prevPage = currentPage - 1;
      console.log('Moving to previous page:', prevPage);
      setCurrentPage(prevPage);
    }
  };

  const getPaginationRange = () => {
    const { current_page, total_pages } = pagination;
    const delta = 2; // Número de páginas a mostrar a cada lado de la página actual
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    // Siempre incluir la primera página
    if (total_pages <= 1) return [1];

    // Calcular el rango alrededor de la página actual
    const start = Math.max(2, current_page - delta);
    const end = Math.min(total_pages - 1, current_page + delta);

    // Agregar primera página
    rangeWithDots.push(1);

    // Agregar puntos suspensivos si hay un gap después de la primera página
    if (start > 2) {
      rangeWithDots.push('...');
    }

    // Agregar páginas del rango central
    for (let i = start; i <= end; i++) {
      rangeWithDots.push(i);
    }

    // Agregar puntos suspensivos si hay un gap antes de la última página
    if (end < total_pages - 1) {
      rangeWithDots.push('...');
    }

    // Agregar última página (solo si es diferente de la primera)
    if (total_pages > 1) {
      rangeWithDots.push(total_pages);
    }

    return rangeWithDots;
  };

  // Delete empleado handler
  const handleDeleteEmpleado = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este empleado? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await empleadosService.deleteEmpleado(id);
      // Remove the deleted empleado from the state
      setEmpleados(empleados.filter(emp => emp.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el empleado');
      console.error('Error deleting empleado:', err);
    }
  };

  // Update filter handler
  const handleFilterChange = (filterName: keyof EmpleadoFilter, value: string) => {
    console.log('Filter changed:', filterName, '=', value);
    
    // Resetear la página a 1 cuando se cambian los filtros
    setCurrentPage(1);
    
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP' 
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('es-CL').format(new Date(dateString));
  };

  // Retry fetching if there was an error
  const handleRetry = () => {
    console.log('Retrying fetch...');
    setError(null);
    fetchEmpleados(currentPage);
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Empleados</h1>
        <Button 
          onClick={() => navigate('/gastos/empleados/new')}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nuevo Empleado
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-6 mb-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar empleado..."
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <select
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            value={filters.active}
            onChange={(e) => handleFilterChange('active', e.target.value)}
          >
            {activeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Departamento..."
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Cargo..."
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            value={filters.position}
            onChange={(e) => handleFilterChange('position', e.target.value)}
          />
        </div>
      </div>

      {/* Error message with retry button */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <p>{error}</p>
            <Button onClick={handleRetry} className="bg-red-500 hover:bg-red-600 text-white">
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando empleados...</p>
            </div>
          </div>
        </div>
      ) : (
        /* Empleados table */
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          {empleados.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No se encontraron empleados con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      RUT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Centro de Costo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha Ingreso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {empleados.map((empleado) => (
                    <tr key={empleado.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <button
                          onClick={() => navigate(`/gastos/empleados/${empleado.id}`)}
                          className="hover:text-brand-600 hover:underline"
                        >
                          {empleado.tax_id || '-'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <button
                          onClick={() => navigate(`/gastos/empleados/${empleado.id}`)}
                          className="hover:text-brand-600 hover:underline text-left"
                        >
                          {empleado.full_name || `${empleado.first_name} ${empleado.last_name}`}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {empleado.position || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {empleado.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {empleado.cost_center_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(empleado.hire_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          empleado.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empleado.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          onClick={() => navigate(`/gastos/empleados/${empleado.id}`)}
                          className="text-brand-600 hover:text-brand-900 mr-2"
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDeleteEmpleado(empleado.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación Mejorada */}
              {pagination && (
                <div className="bg-white dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    {/* Información de resultados */}
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span>
                        Mostrando{' '}
                        <span className="font-medium">
                          {pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1}
                        </span>
                        {' '}a{' '}
                        <span className="font-medium">
                          {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                        </span>
                        {' '}de{' '}
                        <span className="font-medium">{pagination.total}</span>
                        {' '}resultados
                      </span>
                    </div>

                    {/* Controles de paginación */}
                    {pagination.total_pages > 1 && (
                      <div className="flex items-center space-x-2">
                        {/* Botón Anterior */}
                        <button
                          onClick={handlePrevPage}
                          disabled={!pagination.has_prev}
                          className={`relative inline-flex items-center px-2 py-2 text-sm font-medium rounded-l-md border ${
                            !pagination.has_prev
                              ? 'bg-gray-50 border-gray-300 text-gray-300 cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span className="sr-only">Anterior</span>
                          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>

                        {/* Números de página */}
                        <div className="hidden md:flex">
                          {getPaginationRange().map((page, idx) => (
                            <button
                              key={idx}
                              onClick={() => typeof page === 'number' && handlePageChange(page)}
                              disabled={typeof page !== 'number'}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                                page === pagination.current_page
                                  ? 'z-10 bg-brand-50 border-brand-500 text-brand-600 dark:bg-brand-900 dark:border-brand-400 dark:text-brand-300'
                                  : typeof page === 'number'
                                  ? 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                                  : 'bg-white border-gray-300 text-gray-700 cursor-default dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                              } ${idx === 0 ? 'rounded-l-md' : ''} ${idx === getPaginationRange().length - 1 ? 'rounded-r-md' : ''}`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        {/* Información móvil */}
                        <div className="md:hidden">
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                            Página {pagination.current_page} de {pagination.total_pages}
                          </span>
                        </div>

                        {/* Botón Siguiente */}
                        <button
                          onClick={handleNextPage}
                          disabled={!pagination.has_next}
                          className={`relative inline-flex items-center px-2 py-2 text-sm font-medium rounded-r-md border ${
                            !pagination.has_next
                              ? 'bg-gray-50 border-gray-300 text-gray-300 cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span className="sr-only">Siguiente</span>
                          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Empleados;
