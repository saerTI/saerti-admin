import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gastosApiService, { GastoImprevisto, GastoFilter } from '../../services/gastosService';
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

// Emergency level styling
const emergencyLevel_MAP: Record<string, { label: string, color: string }> = {
  'low': { label: 'Baja', color: 'bg-green-200 text-green-800' },
  'medium': { label: 'Media', color: 'bg-yellow-200 text-yellow-800' },
  'high': { label: 'Alta', color: 'bg-red-200 text-red-800' }
};

const GastosImprevistos = () => {
  const [gastos, setGastos] = useState<GastoImprevisto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GastoFilter>({});
  const navigate = useNavigate();

  // Load unexpected expenses on component mount and when filters change
  useEffect(() => {
    const fetchGastos = async () => {
      try {
        setLoading(true);
        // Here we would normally call the API service
        // For now, we'll use mock data
        const data = await getMockGastosImprevistos();
        setGastos(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar gastos imprevistos');
        console.error('Error fetching gastos imprevistos:', err);
        setGastos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGastos();
  }, [filters]);

  // Mock data function
  const getMockGastosImprevistos = async (): Promise<GastoImprevisto[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock categories for unexpected expenses
    const categories = [
      { id: 401, name: 'Reparaciones de Emergencia' },
      { id: 402, name: 'Daños por Clima' },
      { id: 403, name: 'Fallos de Equipo' },
      { id: 404, name: 'Imprevistos Legales' },
      { id: 405, name: 'Gastos Médicos' },
      { id: 406, name: 'Seguridad' },
      { id: 407, name: 'Otros Imprevistos' }
    ];
    
    // Mock approvers
    const approvers = [
      { id: 501, name: 'Juan Pérez - Director de Obra' },
      { id: 502, name: 'María González - Gerente de Proyecto' },
      { id: 503, name: 'Carlos Rodríguez - Director Financiero' },
      { id: 504, name: 'Ana Martínez - Gerente General' }
    ];
    
    return Array(8).fill(null).map((_, index) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const approver = approvers[Math.floor(Math.random() * approvers.length)];
      const emergencyLevel = ['low', 'medium', 'high'] as const;
      
      return {
        id: index + 1,
        name: `Imprevisto - ${category.name} ${index + 1}`,
        categoryId: category.id,
        categoryName: category.name,
        authorizationId: Math.random() > 0.3 ? approver.id : undefined,
        authorizationName: Math.random() > 0.3 ? approver.name : undefined,
        emergencyLevel: emergencyLevel[Math.floor(Math.random() * emergencyLevel.length)],
        date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        amount: Math.floor(Math.random() * 5000000) + 200000,
        state: ['draft', 'pending', 'approved', 'paid', 'rejected'][Math.floor(Math.random() * 5)],
        projectId: Math.floor(Math.random() * 5) + 1,
        projectName: `Proyecto ${Math.floor(Math.random() * 5) + 1}`,
        companyId: 1,
        notes: `Gasto imprevisto por ${category.name.toLowerCase()}.${
          Math.random() > 0.5 ? ' Requiere atención inmediata.' : ''
        }${
          Math.random() > 0.7 ? ' Se notificó a seguro.' : ''
        }`
      };
    });
  };

  // Delete handler
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este gasto imprevisto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // In a real app, this would call the API
      // await gastosApiService.deleteGastoImprevisto(id);
      // For now, just remove from state
      setGastos(gastos.filter(item => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el gasto imprevisto');
      console.error('Error deleting gasto imprevisto:', err);
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
      <PageBreadcrumb pageTitle="Gastos Imprevistos" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gastos Imprevistos</h1>
        <Button 
          onClick={() => navigate('/gastos/imprevistos/new')}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nuevo Gasto Imprevisto
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option value="paid">Pagado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nivel de Emergencia
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
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
        /* Table */
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          {gastos.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No se encontraron gastos imprevistos con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nivel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Proyecto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Autorizado Por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
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
                  {gastos.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <Link 
                          to={`/gastos/imprevistos/${gasto.id}`}
                          className="text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          {gasto.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {gasto.categoryName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {gasto.emergencyLevel && (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            emergencyLevel_MAP[gasto.emergencyLevel]?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {emergencyLevel_MAP[gasto.emergencyLevel]?.label || gasto.emergencyLevel}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {gasto.projectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {gasto.authorizationName || 'Pendiente'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDate(gasto.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${GASTO_STATUS_MAP[gasto.state]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {GASTO_STATUS_MAP[gasto.state]?.label || gasto.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatCurrency(gasto.amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            to={`/gastos/imprevistos/${gasto.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(gasto.id)}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GastosImprevistos;