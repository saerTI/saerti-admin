import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { costsApiService, Cotizacion, GastoFilter } from '../../services/costsService';
import Button from '../../components/ui/button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';

// Status translation and styling
const GASTO_STATUS_MAP: Record<string, { label: string, color: string }> = {
  'draft': { label: 'Borrador', color: 'bg-gray-200 text-gray-800' },
  'pending': { label: 'Pendiente', color: 'bg-yellow-200 text-yellow-800' },
  'approved': { label: 'Aprobado', color: 'bg-green-200 text-green-800' },
  'rejected': { label: 'Rechazado', color: 'bg-red-200 text-red-800' },
  'paid': { label: 'Pagado', color: 'bg-blue-200 text-blue-800' },
  'cancelled': { label: 'Cancelado', color: 'bg-red-200 text-red-800' }
};

const Cotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GastoFilter>({});
  const navigate = useNavigate();

  // Load cotizaciones on component mount and when filters change
  useEffect(() => {
    const fetchCotizaciones = async () => {
      try {
        setLoading(true);
        const data = await costsApiService.getCotizaciones(filters);
        setCotizaciones(data || []); // Ensure we always have an array even if data is undefined
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar cotizaciones');
        console.error('Error fetching cotizaciones:', err);
        // Initialize with empty array to prevent rendering errors
        setCotizaciones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCotizaciones();
  }, [filters]);

  // Delete cotizacion handler
  const handleDeleteCotizacion = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar esta cotización? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await costsApiService.deleteCotizacion(id);
      // Remove the deleted cotizacion from the state
      setCotizaciones(cotizaciones.filter(cotizacion => cotizacion.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la cotización');
      console.error('Error deleting cotizacion:', err);
    }
  };

  // Update filter handler
  const handleFilterChange = (filterName: keyof GastoFilter, value: any) => {
    if (value === '') {
      // Remove the filter if empty value
      const newFilters = { ...filters };
      delete newFilters[filterName];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [filterName]: value });
    }
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb pageTitle="Cotizaciones" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cotizaciones</h1>
        <Button 
          onClick={() => navigate('/gastos/cotizaciones/new')}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nueva Cotización
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="paid">Pagado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        /* Cotizaciones table */
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          {cotizaciones.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No se encontraron cotizaciones con los filtros seleccionados.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Proyecto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {cotizaciones.map((cotizacion) => (
                  <tr key={cotizacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <Link 
                        to={`/gastos/cotizaciones/${cotizacion.id}`}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {cotizacion.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {cotizacion.supplierName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(cotizacion.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${GASTO_STATUS_MAP[cotizacion.state]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {GASTO_STATUS_MAP[cotizacion.state]?.label || cotizacion.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {cotizacion.projectName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatCurrency(cotizacion.amount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          to={`/gastos/cotizaciones/${cotizacion.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDeleteCotizacion(cotizacion.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;