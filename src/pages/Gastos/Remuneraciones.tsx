import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gastosApiService, { GastoFilter } from '../../services/gastosService';
import Button from '../../components/ui/button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import Avatar from '../../components/ui/avatar/Avatar';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';
import MultiSelect from '../../components/form/MultiSelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

// Define the Remuneracion interface (add this to your gastosService.ts later)
interface Remuneracion {
  id: number;
  name: string;
  date: string;
  amount: number;
  state: string;
  company_id: number;
  project_id?: number;
  project_name?: string;
  employee_id: number;
  employee_name: string;
  employee_image?: string;
  employee_position: string;
  period: string;
  work_days: number;
  overtime_hours?: number;
  bonuses?: number;
  deductions?: number;
  payment_method: string;
  payment_date?: string;
  notes?: string;
}

// Status translation and styling
const GASTO_STATUS_MAP: Record<string, { label: string, color: BadgeColor }> = {
  'draft': { label: 'Borrador', color: 'warning' },
  'pending': { label: 'Pendiente', color: 'warning' },
  'approved': { label: 'Aprobado', color: 'success' },
  'rejected': { label: 'Rechazado', color: 'error' },
  'paid': { label: 'Pagado', color: 'success' },
  'cancelled': { label: 'Cancelado', color: 'error' }
};

const Remuneraciones = () => {
  const [remuneraciones, setRemuneraciones] = useState<Remuneracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GastoFilter>({});
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const navigate = useNavigate();

  // Load salary payments on component mount and when filters change
  useEffect(() => {
    const fetchRemuneraciones = async () => {
      try {
        setLoading(true);
        // Here we would normally call the API service
        // For now, we'll use mock data
        const data = await getMockRemuneraciones();
        
        // Apply period filter from multi-select if any
        let filteredData = data;
        if (selectedPeriods.length > 0) {
          filteredData = data.filter(item => selectedPeriods.includes(item.period));
        }
        
        setRemuneraciones(filteredData || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar remuneraciones');
        console.error('Error fetching remuneraciones:', err);
        setRemuneraciones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRemuneraciones();
  }, [filters, selectedPeriods]);

  // Mock data function
  const getMockRemuneraciones = async (): Promise<Remuneracion[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock employee positions
    const positions = [
      'Obrero', 
      'Capataz', 
      'Maestro', 
      'Supervisor', 
      'Ingeniero Residente',
      'Administrador de Obra',
      'Gerente de Proyecto',
      'Arquitecto'
    ];
    
    const paymentMethods = ['Transferencia', 'Cheque', 'Efectivo'];
    
    // Mock employee images for avatars
    const employeeImages = [
      "/images/user/user-01.jpg",
      "/images/user/user-02.jpg",
      "/images/user/user-03.jpg",
      "/images/user/user-04.jpg",
      "/images/user/user-05.jpg",
    ];
    
    // Generate mock data for employees and their salaries
    return Array(15).fill(null).map((_, index) => {
      const employeeId = 100 + index;
      const position = positions[Math.floor(Math.random() * positions.length)];
      const baseAmount = position === 'Obrero' ? 600000 : 
                         position === 'Capataz' ? 900000 :
                         position === 'Maestro' ? 850000 :
                         position === 'Supervisor' ? 1200000 :
                         position === 'Ingeniero Residente' ? 2000000 :
                         position === 'Administrador de Obra' ? 1500000 :
                         position === 'Gerente de Proyecto' ? 2500000 : 1800000;
      
      const workDays = Math.floor(Math.random() * 6) + 20; // 20-25 days
      const overtimeHours = Math.random() > 0.3 ? Math.floor(Math.random() * 30) : 0;
      const bonuses = Math.random() > 0.5 ? Math.floor(Math.random() * 200000) : 0;
      const deductions = Math.random() > 0.7 ? Math.floor(Math.random() * 100000) : 0;
      
      // Calculate final amount
      const amount = baseAmount + (overtimeHours * baseAmount / 180) + bonuses - deductions;
      
      // Generate a month period (current or previous months of 2023)
      const month = Math.floor(Math.random() * 12) + 1;
      const period = `${month < 10 ? '0' + month : month}/2023`;
      
      return {
        id: index + 1,
        name: `Remuneración ${period} - ${position}`,
        employee_id: employeeId,
        employee_name: `Empleado ${employeeId}`,
        employee_image: employeeImages[Math.floor(Math.random() * employeeImages.length)],
        employee_position: position,
        period,
        work_days: workDays,
        overtime_hours: overtimeHours,
        bonuses,
        deductions,
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        date: new Date(2023, month - 1, 28).toISOString(),
        payment_date: Math.random() > 0.3 ? new Date(2023, month - 1, 30).toISOString() : undefined,
        amount,
        state: ['draft', 'pending', 'approved', 'paid'][Math.floor(Math.random() * 4)],
        project_id: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : undefined,
        project_name: Math.random() > 0.3 ? `Proyecto ${Math.floor(Math.random() * 5) + 1}` : undefined,
        company_id: 1,
        notes: Math.random() > 0.8 ? `Notas para remuneración ${period}` : undefined
      };
    });
  };

  // Delete handler
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar esta remuneración? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // In a real app, this would call the API
      // await gastosApiService.deleteRemuneracion(id);
      // For now, just remove from state
      setRemuneraciones(remuneraciones.filter(item => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la remuneración');
      console.error('Error deleting remuneración:', err);
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

  // Calculate totals for the summary
  const totalAmount = remuneraciones.reduce((sum, rem) => sum + rem.amount, 0);
  const pendingCount = remuneraciones.filter(rem => rem.state === 'pending').length;
  const approvedAmount = remuneraciones
    .filter(rem => rem.state === 'approved' || rem.state === 'paid')
    .reduce((sum, rem) => sum + rem.amount, 0);
    
  // Get unique periods for multi-select
  const uniquePeriods = [...new Set(remuneraciones.map(r => r.period))];
  const periodOptions = uniquePeriods.map(period => ({
    value: period,
    text: `${period.split('/')[0] === '01' ? 'Enero' : 
           period.split('/')[0] === '02' ? 'Febrero' :
           period.split('/')[0] === '03' ? 'Marzo' :
           period.split('/')[0] === '04' ? 'Abril' :
           period.split('/')[0] === '05' ? 'Mayo' :
           period.split('/')[0] === '06' ? 'Junio' :
           period.split('/')[0] === '07' ? 'Julio' :
           period.split('/')[0] === '08' ? 'Agosto' :
           period.split('/')[0] === '09' ? 'Septiembre' :
           period.split('/')[0] === '10' ? 'Octubre' :
           period.split('/')[0] === '11' ? 'Noviembre' : 'Diciembre'} ${period.split('/')[1]}`,
    selected: false
  }));
  
  // Position options for select
  const positionOptions = [
    { value: '', label: 'Todos los cargos' },
    { value: 'Obrero', label: 'Obrero' },
    { value: 'Capataz', label: 'Capataz' },
    { value: 'Maestro', label: 'Maestro' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Ingeniero Residente', label: 'Ingeniero Residente' },
    { value: 'Administrador de Obra', label: 'Administrador de Obra' },
    { value: 'Gerente de Proyecto', label: 'Gerente de Proyecto' },
    { value: 'Arquitecto', label: 'Arquitecto' }
  ];

  // Status options for select
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
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

  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb pageTitle="Remuneraciones" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-6">
        <ComponentCard title='Total Remuneraciones'>
          <h3 className="mt-1 text-2xl font-bold text-brand-500">{formatCurrency(totalAmount)}</h3>
        </ComponentCard>
        
        <ComponentCard title='Pendientes'>
          <h3 className="mt-1 text-2xl font-bold text-yellow-500">{pendingCount}</h3>
        </ComponentCard>
        
        <ComponentCard title='Pagado'>
          <h3 className="mt-1 text-2xl font-bold text-green-500">{formatCurrency(approvedAmount)}</h3>
        </ComponentCard>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Remuneraciones</h1>
        <Button 
          onClick={() => navigate('/gastos/remuneraciones/new')}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nueva Remuneración
        </Button>
      </div>

      {/* Filters */}
      <ComponentCard title="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <Label>Estado</Label>
            <Select
              options={statusOptions}
              placeholder="Seleccione Estado"
              onChange={handleFilterChange('state')}
              className="dark:bg-gray-900"
            />
          </div>
          
          <div>
            <Label>Cargo</Label>
            <Select
              options={positionOptions}
              placeholder="Seleccione Cargo"
              onChange={handleFilterChange('project_id')}
              className="dark:bg-gray-900"
            />
          </div>
          
          <div>
            <MultiSelect
              label="Períodos"
              options={periodOptions}
              defaultSelected={[]}
              onChange={(values) => setSelectedPeriods(values)}
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
        <ComponentCard >
          <div className="overflow-hidden rounded-xl">
            <div className="max-w-full overflow-x-auto">
              {remuneraciones.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron remuneraciones con los filtros seleccionados.
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
                        Empleado
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Periodo
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
                        Días
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
                    {remuneraciones.map((rem) => (
                      <TableRow key={rem.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full">
                              {rem.employee_image ? (
                                <Avatar
                                  src={rem.employee_image}
                                  size="small"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
                                  {rem.employee_name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <Link 
                                to={`/gastos/remuneraciones/${rem.id}`}
                                className="block font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500"
                              >
                                {rem.employee_name}
                              </Link>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                {rem.employee_position}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {rem.period}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {rem.project_name || 'Administración Central'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div className="flex flex-col">
                            <span>{rem.work_days} días</span>
                            {rem.overtime_hours ? (
                              <span className="text-xs text-green-600">+{rem.overtime_hours} hrs extras</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Badge
                            size="sm"
                            color={GASTO_STATUS_MAP[rem.state]?.color || 'secondary'}
                          >
                            {GASTO_STATUS_MAP[rem.state]?.label || rem.state}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400 font-medium">
                          {formatCurrency(rem.amount)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm">
                          <div className="flex space-x-2">
                            <Link 
                              to={`/gastos/remuneraciones/${rem.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Editar
                            </Link>
                            <button
                              onClick={() => handleDelete(rem.id)}
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

export default Remuneraciones;