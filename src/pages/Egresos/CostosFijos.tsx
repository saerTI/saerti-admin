import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
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
import CostoFijoModal from '../../components/CC/NuevoCostoFijoModal';
import SimpleResponsiveTable from '../../components/tables/SimpleResponsiveTable';

// Interfaz para CostoFijo
interface CostoFijo {
  id: number;
  name: string;
  description?: string;
  quota_value: number;
  paymentDate: string;
  quota_count: number;
  startDate: string;
  endDate: string;
  projectId?: number;
  projectName?: string;
  state: string;
  date: string;
  companyId: number;
}

// Status translation and styling
const GASTO_STATUS_MAP: Record<string, { label: string, color: BadgeColor }> = {
  'draft': { label: 'Borrador', color: 'warning' },
  'pending': { label: 'Pendiente', color: 'warning' },
  'active': { label: 'Activo', color: 'success' },
  'completed': { label: 'Completado', color: 'success' },
  'cancelled': { label: 'Cancelado', color: 'error' }
};

const CostosFijos = () => {
  const [costosFijos, setCostosFijos] = useState<CostoFijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const navigate = useNavigate();
  
  // Estado para el modal
  const [modalOpen, setModalOpen] = useState(false);

  // Cargar costos fijos cuando cambian los filtros
  useEffect(() => {
    const fetchCostosFijos = async () => {
      try {
        setLoading(true);
        // Aquí normalmente llamaríamos a la API
        // Por ahora, usaremos datos de prueba
        const data = await getMockCostosFijos();
        setCostosFijos(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar costos fijos');
        console.error('Error fetching costos fijos:', err);
        setCostosFijos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCostosFijos();
  }, [filters]);

  // Función de datos de prueba
  const getMockCostosFijos = async (): Promise<CostoFijo[]> => {
    // Simular retraso de API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock categories to use for the costs
    const categories = [
      'Arriendo de Oficina', 
      'Leasing Equipos', 
      'Mantención Sistema', 
      'Plan Celulares',
      'Internet y Telefonía',
      'Servicios Básicos',
      'Seguros'
    ];
    
    return Array(10).fill(null).map((_, index) => {
      const name = categories[Math.floor(Math.random() * categories.length)];
      const quotaCount = Math.floor(Math.random() * 12) + 6; // Entre 6 y 18 cuotas
      const startDate = new Date(2023, Math.floor(Math.random() * 3), 1); // Comenzar en los primeros 3 meses de 2023
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + quotaCount);
      
      return {
        id: index + 1,
        name,
        description: Math.random() > 0.5 ? `Descripción para ${name.toLowerCase()}` : undefined,
        quota_value: Math.floor(Math.random() * 1000000) + 200000,
        paymentDate: new Date(startDate.getFullYear(), startDate.getMonth(), 15).toISOString(),
        quota_count: quotaCount,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        projectId: Math.random() > 0.4 ? Math.floor(Math.random() * 5) + 1 : undefined,
        projectName: Math.random() > 0.4 ? `Proyecto ${Math.floor(Math.random() * 5) + 1}` : undefined,
        state: ['active', 'pending', 'completed', 'draft'][Math.floor(Math.random() * 4)],
        date: new Date().toISOString(),
        companyId: 1
      };
    });
  };

  // Función para eliminar
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este costo fijo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // En una app real, esto llamaría a la API
      // await api.deleteCostoFijo(id);
      // Por ahora, solo lo eliminamos del estado
      setCostosFijos(costosFijos.filter(item => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el costo fijo');
      console.error('Error deleting costo fijo:', err);
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
  const handleSubmitCostoFijo = async (formData: any) => {
    try {
      // Aquí enviarías los datos a tu API
      console.log("Datos de nuevo costo fijo:", formData);
      
      // En una app real, enviarías los datos al servidor
      // const result = await api.createCostoFijo(formData);
      
      // Crear un objeto temporal para simular la creación
      const newId = costosFijos.length > 0 
        ? Math.max(...costosFijos.map(c => c.id)) + 1 
        : 1;
      
      // Calcular fecha de término (fecha inicio + cantidad de cuotas en meses)
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + parseInt(formData.quota_count));
      
      // Crear objeto de costo fijo
      const newCostoFijo: CostoFijo = {
        id: newId,
        name: formData.name,
        description: formData.description,
        quota_value: formData.quota_value,
        paymentDate: formData.paymentDate,
        quota_count: parseInt(formData.quota_count),
        startDate: formData.startDate,
        endDate: endDate.toISOString(),
        projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
        projectName: formData.projectId ? `Proyecto ${formData.projectId}` : undefined,
        state: "active",
        date: new Date().toISOString(),
        companyId: 1
      };
      
      // Actualizar el estado local
      setCostosFijos([newCostoFijo, ...costosFijos]);
      
      // Cerrar el modal
      setModalOpen(false);
      
      // Mostrar mensaje de éxito
      alert("Costo fijo creado con éxito");
      
    } catch (err) {
      console.error("Error al crear costo fijo:", err);
      alert("Error al crear el costo fijo. Por favor, inténtelo de nuevo.");
    }
  };

  // Calcular algunos datos de resumen
  const totalAmount = costosFijos.reduce((sum, c) => sum + (c.quota_value * c.quota_count), 0);
  const activeCount = costosFijos.filter(c => c.state === 'active').length;
  const pendingCount = costosFijos.filter(c => c.state === 'pending').length;

  // Crear opciones para los desplegables
  const stateOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'active', label: 'Activo' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];
  
  const projectOptions = [
    { value: '', label: 'Todos los proyectos' },
    { value: '1', label: 'Proyecto 1' },
    { value: '2', label: 'Proyecto 2' },
    { value: '3', label: 'Proyecto 3' },
    { value: '4', label: 'Proyecto 4' },
    { value: '5', label: 'Proyecto 5' }
  ];

  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb pageTitle="Costos Fijos" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-6">
        <ComponentCard title='Total Costos' titleCenter={true} centerContent={true}>
          <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{costosFijos.length}</h3>
        </ComponentCard>
        
        <ComponentCard title='Monto Total'>
          <div className="flex flex-col items-center justify-center">
            <h3 className="mt-1 text-2xl font-bold text-brand-500">{formatCurrency(totalAmount)}</h3>
          </div>
        </ComponentCard>
        
        <ComponentCard title='Estado'>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs">Activos: {activeCount}</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-xs">Pendientes: {pendingCount}</span>
            </div>
          </div>
        </ComponentCard>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Costos Fijos</h1>
        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nuevo Costo Fijo
        </Button>
      </div>
      
      {/* Modal de Costo Fijo */}
      <CostoFijoModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitCostoFijo}
        projects={projectOptions.filter(p => p.value !== '').map(p => ({ id: parseInt(p.value), name: p.label }))}
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
            <DatePicker
              id="startDate"
              label="Fecha Inicio"
              placeholder="Seleccione fecha"
              defaultDate={filters.startDate || undefined}
              onChange={(selectedDates, dateStr) => {
                handleFilterChange('startDate')(dateStr);
              }}
            />
          </div>
          
          <div>
            <DatePicker
              id="endDate"
              label="Fecha Término"
              placeholder="Seleccione fecha"
              defaultDate={filters.endDate || undefined}
              onChange={(selectedDates, dateStr) => {
                handleFilterChange('endDate')(dateStr);
              }}
            />
          </div>

          <div>
            <Label htmlFor="projectId">Proyecto</Label>
            <Select
              options={projectOptions}
              defaultValue={filters.projectId ? String(filters.projectId) : ''}
              onChange={handleFilterChange('projectId')}
              placeholder="Seleccione proyecto"
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
          hasData={costosFijos.length > 0}
          emptyMessage="No se encontraron costos fijos con los filtros seleccionados."
          enableSmoothScroll={true}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* Primera columna con clase sticky */}
                <th className="sticky-first-column px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor Cuota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cuotas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Período
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
              {costosFijos.map((costo) => (
                <tr key={costo.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                  <td className="sticky-first-column px-6 py-4 whitespace-nowrap text-sm">
                    <Link 
                      to={`/gastos/costos-fijos/${costo.id}`}
                      className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {costo.name}
                    </Link>
                    {costo.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {costo.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                    {formatCurrency(costo.quota_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {costo.quota_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {costo.projectName || 'Administración Central'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex flex-col">
                      <span>Inicio: {formatDate(costo.startDate)}</span>
                      <span>Fin: {formatDate(costo.endDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge
                      size="sm"
                      color={GASTO_STATUS_MAP[costo.state]?.color || 'secondary'}
                    >
                      {GASTO_STATUS_MAP[costo.state]?.label || costo.state}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/gastos/costos-fijos/${costo.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(costo.id)}
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

export default CostosFijos;