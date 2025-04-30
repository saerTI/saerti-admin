import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gastosApiService, { OrdenCompra, GastoFilter } from '../../services/gastosService';
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

const OCCredito = () => {
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GastoFilter>({});
  const navigate = useNavigate();

  // Load purchase orders on component mount and when filters change
  useEffect(() => {
    const fetchOrdenesCompra = async () => {
      try {
        setLoading(true);
        // Here we would normally call the API service
        // For now, we'll use mock data
        const data = await getMockOrdenesCompra();
        setOrdenesCompra(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar órdenes de compra');
        console.error('Error fetching órdenes de compra:', err);
        setOrdenesCompra([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdenesCompra();
  }, [filters]);

  // Mock data function
  const getMockOrdenesCompra = async (): Promise<OrdenCompra[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock categories to use for the purchase orders
    const categories = [
      'Materiales de Construcción', 
      'Herramientas', 
      'Equipos', 
      'Materiales Eléctricos',
      'Materiales Sanitarios',
      'Material de Oficina',
      'Seguridad'
    ];
    
    // Mock providers
    const providers = [
      { id: 301, name: 'Ferretería Industrial S.A.' },
      { id: 302, name: 'Materiales Constructivos Ltda.' },
      { id: 303, name: 'Distribuidora Técnica SpA' },
      { id: 304, name: 'Seguridad Industrial JM' },
      { id: 305, name: 'Suministros Eléctricos Chile' }
    ];
    
    return Array(12).fill(null).map((_, index) => {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      return {
        id: index + 1,
        name: `OC - ${categories[Math.floor(Math.random() * categories.length)]}`,
        provider_id: provider.id,
        provider_name: provider.name,
        order_number: `OC-${2023}-${5000 + index}`,
        payment_type: 'credit', // All credit for this page
        delivery_date: new Date(Date.now() + (Math.floor(Math.random() * 30) + 5) * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms: `${Math.floor(Math.random() * 3) + 1}0 días`,
        date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        amount: Math.floor(Math.random() * 20000000) + 500000,
        state: ['draft', 'pending', 'approved', 'paid', 'delivered'][Math.floor(Math.random() * 5)],
        project_id: Math.random() > 0.2 ? Math.floor(Math.random() * 5) + 1 : undefined,
        project_name: Math.random() > 0.2 ? `Proyecto ${Math.floor(Math.random() * 5) + 1}` : undefined,
        company_id: 1,
        notes: Math.random() > 0.7 ? `Notas para orden de compra ${index + 1}` : undefined
      };
    });
  };

  // Delete handler
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar esta orden de compra? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // In a real app, this would call the API
      // await gastosApiService.deleteOrdenCompra(id);
      // For now, just remove from state
      setOrdenesCompra(ordenesCompra.filter(item => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la orden de compra');
      console.error('Error deleting orden de compra:', err);
    }
  };

  // Update filter handler
  const handleFilterChange = (filterName: keyof GastoFilter) => (value: string) => {
    if (value === '') {
      // Remove the filter if empty value
      const newFilters = { ...filters };
      delete newFilters[filterName];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [filterName]: value });
    }
  };

  // Calculate some summary data
  const totalAmount = ordenesCompra.reduce((sum, oc) => sum + oc.amount, 0);
  const pendingCount = ordenesCompra.filter(oc => oc.state === 'pending').length;
  const approvedCount = ordenesCompra.filter(oc => oc.state === 'approved' || oc.state === 'paid').length;

  // Create options for dropdowns
  const stateOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'paid', label: 'Pagado' },
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
      <PageBreadcrumb pageTitle="Órdenes de Compra con Crédito" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-6">
      <ComponentCard title='Total Órdenes' titleCenter={true} centerContent={true}>
        <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{ordenesCompra.length}</h3>
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
              <span className="text-xs">Aprobadas: {approvedCount}</span>
            </div>
          </div>
        </ComponentCard>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Órdenes de Compra con Crédito</h1>
        <Button 
          onClick={() => navigate('/gastos/oc-credito/new')}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nueva Orden de Compra
        </Button>
      </div>

      {/* Filters */}
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
              id="start_date"
              label="Fecha Inicio"
              placeholder="Seleccione fecha inicio"
              defaultDate={filters.start_date || undefined}
              onChange={(selectedDates, dateStr) => {
                handleFilterChange('start_date')(dateStr);
              }}
            />
          </div>
          
          <div>
            <DatePicker
              id="end_date"
              label="Fecha Fin"
              placeholder="Seleccione fecha fin"
              defaultDate={filters.end_date || undefined}
              onChange={(selectedDates, dateStr) => {
                handleFilterChange('end_date')(dateStr);
              }}
            />
          </div>

          <div>
            <Label htmlFor="project_id">Proyecto</Label>
            <Select
              options={projectOptions}
              defaultValue={filters.project_id ? String(filters.project_id) : ''}
              onChange={handleFilterChange('project_id')}
              placeholder="Seleccione proyecto"
            />
          </div>
        </div>
      </ComponentCard>

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
        /* Table Component */
        <ComponentCard>
          <div className="overflow-hidden rounded-xl">
            <div className="max-w-full overflow-x-auto">
              {ordenesCompra.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron órdenes de compra con los filtros seleccionados.
                </div>
              ) : (
                <Table>
                  {/* Table Header */}
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        N° Orden
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Descripción
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Proveedor
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Proyecto
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Fecha
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Estado
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Monto
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  
                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {ordenesCompra.map((oc) => (
                      <TableRow key={oc.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {oc.order_number}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm">
                          <Link 
                            to={`/gastos/oc-credito/${oc.id}`}
                            className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                          >
                            {oc.name}
                          </Link>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {oc.provider_name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {oc.project_name || 'Sin proyecto'}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {formatDate(oc.date)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm">
                          <Badge
                            size="sm"
                            color={GASTO_STATUS_MAP[oc.state]?.color || 'secondary'}
                          >
                            {GASTO_STATUS_MAP[oc.state]?.label || oc.state}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white">
                          {formatCurrency(oc.amount || 0)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm">
                          <div className="flex space-x-2">
                            <Link 
                              to={`/gastos/oc-credito/${oc.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Editar
                            </Link>
                            <button
                              onClick={() => handleDelete(oc.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Eliminar
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </ComponentCard>
      )}
    </div>
  );
};

export default OCCredito;