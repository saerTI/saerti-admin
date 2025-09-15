import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button/Button';
import { formatCurrency, formatDate, formatPercent } from '../../utils/formatters';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import Select from '../../components/form/Select';
import Label from '../../components/form/Label';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import DatePicker from '../../components/form/date-picker';
import FactoringModal from '../../components/CC/NuevoFactoringModal';
import SimpleResponsiveTable from '../../components/tables/SimpleResponsiveTable';

// Interfaz para Factoring
interface Factoring {
  id: number;
  amount: number;
  interest_rate: number;
  paymentDate: string;
  entity: string;
  state: string;
  projectId?: number;
  projectName?: string;
  date: string;
  companyId: number;
  notes?: string;
}

// Status translation and styling
const GASTO_STATUS_MAP: Record<string, { label: string, color: BadgeColor }> = {
  'draft': { label: 'Borrador', color: 'warning' },
  'pending': { label: 'Pendiente', color: 'warning' },
  'approved': { label: 'Aprobado', color: 'success' },
  'rejected': { label: 'Rechazado', color: 'error' },
  'paid': { label: 'Pagado', color: 'success' },
  'delivered': { label: 'Entregado', color: 'info' },
  'cancelled': { label: 'Cancelado', color: 'error' }
};

const Factoring = () => {
  const [factorings, setFactorings] = useState<Factoring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const navigate = useNavigate();
  
  // Estado para el modal
  const [modalOpen, setModalOpen] = useState(false);

  // Cargar factorings cuando cambian los filtros
  useEffect(() => {
    const fetchFactorings = async () => {
      try {
        setLoading(true);
        // Aquí normalmente llamaríamos a la API
        // Por ahora, usaremos datos de prueba
        const data = await getMockFactorings();
        setFactorings(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar factorings');
        console.error('Error fetching factorings:', err);
        setFactorings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFactorings();
  }, [filters]);

  // Función de datos de prueba
  const getMockFactorings = async (): Promise<Factoring[]> => {
    // Simular retraso de API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Entidades financieras
    const entities = [
      'Banco Estado', 
      'Banco de Chile', 
      'Santander', 
      'BCI',
      'Itaú',
      'Scotiabank',
      'Tanner'
    ];
    
    return Array(10).fill(null).map((_, index) => {
      const entity = entities[Math.floor(Math.random() * entities.length)];
      return {
        id: index + 1,
        amount: Math.floor(Math.random() * 50000000) + 10000000,
        interest_rate: Math.random() * 0.1, // Entre 0% y 10%
        paymentDate: new Date(Date.now() + (Math.floor(Math.random() * 90) + 30) * 24 * 60 * 60 * 1000).toISOString(),
        entity,
        state: ['pending', 'approved', 'paid'][Math.floor(Math.random() * 3)],
        projectId: Math.random() > 0.2 ? Math.floor(Math.random() * 5) + 1 : undefined,
        projectName: Math.random() > 0.2 ? `Proyecto ${Math.floor(Math.random() * 5) + 1}` : undefined,
        date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        companyId: 1,
        notes: Math.random() > 0.7 ? `Notas para factoring ${index + 1}` : undefined
      };
    });
  };

  // Función para eliminar
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este factoring? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // En una app real, esto llamaría a la API
      // await api.deleteFactoring(id);
      // Por ahora, solo lo eliminamos del estado
      setFactorings(factorings.filter(item => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el factoring');
      console.error('Error deleting factoring:', err);
    }
  };

  // Manejar cambios en los filtros
  const handleFilterChange = (filterName: string) => (value: string) => {
    if (value === '') {
      // Eliminar el filtro si el valor está vacío
      const newFilters = { ...filters };
      delete newFilters[filterName];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [filterName]: value });
    }
  };
  
  // Manejador para el envío del formulario del modal
  const handleSubmitFactoring = async (formData: any) => {
    try {
      // Aquí enviarías los datos a tu API
      console.log("Datos de nuevo factoring:", formData);
      
      // En una app real, enviarías los datos al servidor
      // const result = await api.createFactoring(formData);
      
      // Crear un objeto temporal para simular la creación
      const newId = factorings.length > 0 
        ? Math.max(...factorings.map(f => f.id)) + 1 
        : 1;
      
      // Crear objeto de factoring
      const newFactoring: Factoring = {
        id: newId,
        amount: formData.amount,
        interest_rate: formData.interest_rate / 100, // Convertir de porcentaje a decimal
        paymentDate: formData.paymentDate,
        entity: formData.entity,
        state: "pending",
        projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
        projectName: formData.projectId ? `Proyecto ${formData.projectId}` : undefined,
        date: new Date().toISOString(),
        companyId: 1
      };
      
      // Actualizar el estado local
      setFactorings([newFactoring, ...factorings]);
      
      // Cerrar el modal
      setModalOpen(false);
      
      // Mostrar mensaje de éxito
      alert("Factoring creado con éxito");
      
    } catch (err) {
      console.error("Error al crear factoring:", err);
      alert("Error al crear el factoring. Por favor, inténtelo de nuevo.");
    }
  };

  // Calcular algunos datos de resumen
  const totalAmount = factorings.reduce((sum, f) => sum + f.amount, 0);
  const pendingCount = factorings.filter(f => f.state === 'pending').length;
  const approvedCount = factorings.filter(f => f.state === 'approved' || f.state === 'paid').length;

  // Crear opciones para los desplegables
  const stateOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'paid', label: 'Pagado' }
  ];
  
  const projectOptions = [
    { value: '', label: 'Todos los proyectos' },
    { value: '1', label: 'Proyecto 1' },
    { value: '2', label: 'Proyecto 2' },
    { value: '3', label: 'Proyecto 3' },
    { value: '4', label: 'Proyecto 4' },
    { value: '5', label: 'Proyecto 5' }
  ];
  
  const entityOptions = [
    { value: '', label: 'Todas las entidades' },
    { value: 'Banco Estado', label: 'Banco Estado' },
    { value: 'Banco de Chile', label: 'Banco de Chile' },
    { value: 'Santander', label: 'Santander' },
    { value: 'BCI', label: 'BCI' },
    { value: 'Itaú', label: 'Itaú' },
    { value: 'Scotiabank', label: 'Scotiabank' },
    { value: 'Tanner', label: 'Tanner' }
  ];

  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb pageTitle="Factoring" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-6">
        <ComponentCard title='Total Factoring' titleCenter={true} centerContent={true}>
          <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{factorings.length}</h3>
        </ComponentCard>
        
        <ComponentCard title='Monto Total'>
          <div className="flex flex-col items-center justify-center">
            <h3 className="mt-1 text-2xl font-bold text-brand-500">{formatCurrency(totalAmount)}</h3>
          </div>
        </ComponentCard>
        
        <ComponentCard title='Estado'>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-xs">Pendientes: {pendingCount}</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs">Aprobados: {approvedCount}</span>
            </div>
          </div>
        </ComponentCard>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Factoring</h1>
        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nuevo Factoring
        </Button>
      </div>
      
      {/* Modal de Factoring */}
      <FactoringModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitFactoring}
        projects={projectOptions.filter(p => p.value !== '').map(p => ({ id: parseInt(p.value), name: p.label }))}
        entities={entityOptions.filter(e => e.value !== '').map(e => e.value)}
      />

      {/* Filtros */}
      <ComponentCard title="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="state">Estado</Label>
            <Select
              options={stateOptions}
              defaultValue={filters.state || ''}
              onChange={handleFilterChange('state')}
              placeholder="Seleccione estado"
            />
          </div>
          
          <div>
            <Label htmlFor="entity">Entidad</Label>
            <Select
              options={entityOptions}
              defaultValue={filters.entity || ''}
              onChange={handleFilterChange('entity')}
              placeholder="Seleccione entidad"
            />
          </div>
          
          <div>
            <DatePicker
              id="paymentDate"
              label="Fecha de Pago"
              placeholder="Seleccione fecha"
              defaultDate={filters.paymentDate || undefined}
              onChange={(selectedDates, dateStr) => {
                handleFilterChange('paymentDate')(dateStr);
              }}
            />
          </div>

          <div>
            <Label htmlFor="projectId">Centro de Costo</Label>
            <Select
              options={projectOptions}
              defaultValue={filters.projectId ? String(filters.projectId) : ''}
              onChange={handleFilterChange('projectId')}
              placeholder="Seleccione Centro de Costo"
            />
          </div>
        </div>
      </ComponentCard>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Indicador de carga */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        /* Tabla usando SimpleResponsiveTable */
        <SimpleResponsiveTable 
          hasData={factorings.length > 0}
          emptyMessage="No se encontraron factorings con los filtros seleccionados."
          enableSmoothScroll={true}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* Primera columna con clase sticky */}
                <th className="sticky-first-column px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Entidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tasa de Interés
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total: POR IMPLEMENTAR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Centro de Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha de Factoring
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {factorings.map((factoring) => (
                <tr key={factoring.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                  <td className="sticky-first-column px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {factoring.entity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                    {formatCurrency(factoring.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatPercent(factoring.interest_rate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    === 00.00 ===
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {factoring.projectName || 'Sin proyecto'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatDate(factoring.paymentDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge
                      size="sm"
                      color={GASTO_STATUS_MAP[factoring.state]?.color || 'secondary'}
                    >
                      {GASTO_STATUS_MAP[factoring.state]?.label || factoring.state}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/gastos/factoring/${factoring.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(factoring.id)}
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
        </SimpleResponsiveTable>
      )}
    </div>
  );
};

export default Factoring;