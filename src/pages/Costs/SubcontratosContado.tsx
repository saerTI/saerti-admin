import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gastosApiService, { Subcontrato, GastoFilter } from '../../services/costsService';
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

const SubcontratosContado = () => {
  const [subcontratos, setSubcontratos] = useState<Subcontrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GastoFilter>({});
  const navigate = useNavigate();

  // Load subcontratos on component mount and when filters change
  useEffect(() => {
    const fetchSubcontratos = async () => {
      try {
        setLoading(true);
        // Here we would normally call the API service
        // For now, we'll use mock data
        const data = await getMockSubcontratos();
        setSubcontratos(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar subcontratos');
        console.error('Error fetching subcontratos:', err);
        setSubcontratos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcontratos();
  }, [filters]);

  // Mock data function
  const getMockSubcontratos = async (): Promise<Subcontrato[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return Array(10).fill(null).map((_, index) => ({
      id: index + 1,
      name: `Subcontrato ${index + 1}`,
      contractor_id: 200 + index,
      contractor_name: `Contratista ${200 + index}`,
      contract_number: `SC-${2023}-${1000 + index}`,
      startDate: new Date(2023, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
      endDate: new Date(2023, 6 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
      paymentType: 'credit', // All credit for this page
      paymentTerms: `${Math.floor(Math.random() * 3) + 1}0 días`,
      date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      amount: Math.floor(Math.random() * 50000000) + 5000000,
      state: ['draft', 'pending', 'approved', 'paid'][Math.floor(Math.random() * 4)],
      projectId: Math.floor(Math.random() * 5) + 1,
      projectName: `Proyecto ${Math.floor(Math.random() * 5) + 1}`,
      companyId: 1,
      notes: Math.random() > 0.7 ? `Notas para subcontrato ${index + 1}` : undefined
    }));
  };

  // Delete handler
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este subcontrato? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // In a real app, this would call the API
      // await gastosApiService.deleteSubcontrato(id);
      // For now, just remove from state
      setSubcontratos(subcontratos.filter(item => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el subcontrato');
      console.error('Error deleting subcontrato:', err);
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
      <PageBreadcrumb pageTitle="Subcontratos pago Contado" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Subcontratos con Crédito</h1>
        <Button
          onClick={() => navigate('/costos/subcontratos-credito/new')}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nuevo Subcontrato
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
              <option value="paid">Pagado</option>
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
          {subcontratos.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No se encontraron subcontratos con los filtros seleccionados.
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
                      Contratista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      N° Contrato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Proyecto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vigencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Plazo Pago
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
                  {subcontratos.map((subcontrato) => (
                    <tr key={subcontrato.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <Link
                          to={`/costos/subcontratos-credito/${subcontrato.id}`}
                          className="text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          {subcontrato.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {subcontrato.contractor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {subcontrato.contract_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {subcontrato.projectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDate(subcontrato.startDate)} - {formatDate(subcontrato.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {subcontrato.paymentTerms}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${GASTO_STATUS_MAP[subcontrato.state]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {GASTO_STATUS_MAP[subcontrato.state]?.label || subcontrato.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatCurrency(subcontrato.amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/costos/subcontratos-credito/${subcontrato.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(subcontrato.id)}
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

export default SubcontratosContado;