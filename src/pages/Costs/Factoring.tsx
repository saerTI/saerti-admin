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
import FactoringModal from '../../components/CC/FactoringModalNew';
import SimpleResponsiveTable from '../../components/tables/SimpleResponsiveTable';
import { factoringService } from '../../services/factoringService';
import { getCostCenters } from '../../services/costCenterService';
import type { 
  Factoring as FactoringType, 
  FactoringEntity, 
  FactoringFilter
} from '../../types/factoring';
import { FACTORING_STATUS_OPTIONS } from '../../types/factoring';
import type { CostCenter } from '../../types/factoring';

// Status translation and styling
const FACTORING_STATUS_MAP: Record<string, { label: string, color: BadgeColor }> = {
  'Pendiente': { label: 'Pendiente', color: 'warning' },
  'Girado y no pagado': { label: 'Girado y no pagado', color: 'error' },
  'Girado y pagado': { label: 'Girado y pagado', color: 'success' }
};

const FactoringPage = () => {
  const [factorings, setFactorings] = useState<FactoringType[]>([]);
  const [factoringEntities, setFactoringEntities] = useState<FactoringEntity[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FactoringFilter>({});
  const [totals, setTotals] = useState<{
    total_amount: number;
    total_pendiente: number;
    total_giradoynopagado: number;
    total_giradoypagado: number;
  }>({
    total_amount: 0,
    total_pendiente: 0,
    total_giradoynopagado: 0,
    total_giradoypagado: 0
  });
  const [selectedTotal, setSelectedTotal] = useState<'total_amount' | 'total_pendiente' | 'total_giradoynopagado' | 'total_giradoypagado'>('total_amount');
  const navigate = useNavigate();
  
  // Estado para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFactoring, setEditingFactoring] = useState<FactoringType | null>(null);

  // Calculamos los IDs de filas vencidas una vez
  // Esto evita el cálculo repetitivo de fechas durante el renderizado
  const [expiredRowIds, setExpiredRowIds] = useState<Set<number>>(new Set());
  
  // Calculamos qué filas deben estar resaltadas cuando cambian los datos
  useEffect(() => {
    if (!factorings.length) return;
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const expiredIds = new Set<number>();
    
    factorings.forEach(factoring => {
      const expirationDate = new Date(factoring.date_expiration);
      expirationDate.setHours(0, 0, 0, 0);
      
      const isExpired = expirationDate < currentDate;
      const isPendingOrUnpaid = factoring.status === 'Pendiente' || factoring.status === 'Girado y no pagado';
      
      if (isExpired && isPendingOrUnpaid) {
        expiredIds.add(factoring.id);
      }
    });
    
    setExpiredRowIds(expiredIds);
  }, [factorings]);
  
  // Función para verificar si una fila debe ser resaltada
  const isRowHighlighted = (factoring: FactoringType): boolean => {
    return expiredRowIds.has(factoring.id);
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar factorings cuando cambian los filtros
  // Utilizamos useEffect con dependencia en una versión serializada de los filtros
  // para evitar recarga innecesaria si solo cambia la referencia pero no los valores
  const filtersString = JSON.stringify(filters);
  useEffect(() => {
    console.log('Filtros cambiados, recargando datos. Nuevos filtros:', filters);
    loadFactorings();
  }, [filtersString]);

  const loadInitialData = async () => {
    try {
      const [entitiesData, costCentersData] = await Promise.all([
        factoringService.getFactoringEntities(),
        getCostCenters()
      ]);
      
      setFactoringEntities(entitiesData);
      setCostCenters(costCentersData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Error al cargar datos iniciales');
    }
  };

  const loadFactorings = async () => {
    try {
      setLoading(true);
      
      // Log los filtros actuales antes de la llamada
      console.log('Cargando factorings con los filtros:', filters);
      
      // Cargar datos y los montos totales en paralelo
      const [data, totalsData] = await Promise.all([
        factoringService.getFactorings(filters),
        factoringService.getFactoringTotalAmounts(filters)
      ]);
      
      console.log('Datos recibidos del servidor:', data);
      console.log('Montos totales recibidos del servidor:', totalsData);
      
      // Garantizamos que el estado de los datos es estable
      // para evitar renderizados innecesarios
      const hasDataChanged = JSON.stringify(data) !== JSON.stringify(factorings);
      if (hasDataChanged) {
        console.log('Datos actualizados, actualizando estado');
        setFactorings(data);
      } else {
        console.log('No hay cambios en los datos');
      }
      
      // Actualizar los montos totales
      setTotals(totalsData);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar factorings');
      console.error('Error fetching factorings:', err);
      setFactorings([]);
      setTotals({
        total_amount: 0,
        total_pendiente: 0,
        total_giradoynopagado: 0,
        total_giradoypagado: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este factoring? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await factoringService.deleteFactoring(id);
      // Recargar datos después de eliminar
      await loadFactorings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el factoring');
      console.error('Error deleting factoring:', err);
    }
  };

  // Función para editar
  const handleEdit = (factoring: FactoringType) => {
    setEditingFactoring(factoring);
    setModalOpen(true);
  };

  // Manejar cambios en los filtros
  const handleFilterChange = (filterName: string) => (value: string) => {
    console.log(`Cambiando filtro ${filterName} a valor: ${value}`);
    
    // Crear una copia de los filtros actuales
    let newFilters: FactoringFilter = { ...filters };
    
    if (value === '') {
      // Eliminar el filtro si el valor está vacío
      delete newFilters[filterName as keyof FactoringFilter];
    } else {
      // Añadir o actualizar el filtro con tipado seguro
      if (filterName === 'factoring_entities_id') {
        newFilters.factoring_entities_id = parseInt(value);
      } else if (filterName === 'cost_center_id') {
        newFilters.cost_center_id = parseInt(value);
      } else if (filterName === 'status') {
        newFilters.status = value;
      } else if (filterName === 'date_from') {
        newFilters.date_from = value;
      } else if (filterName === 'date_to') {
        newFilters.date_to = value;
      }
    }
    
    console.log("Aplicando nuevos filtros:", newFilters);
    setFilters(newFilters);
  };
  
  // Manejador para el envío del formulario del modal
  const handleSubmitFactoring = async (formData: any) => {
    try {
      if (editingFactoring) {
        // Actualizar factoring existente
        await factoringService.updateFactoring(editingFactoring.id, formData);
      } else {
        // Crear nuevo factoring
        await factoringService.createFactoring(formData);
      }
      
      // Recargar datos
      await loadFactorings();
      
      // Cerrar modal y limpiar estado
      setModalOpen(false);
      setEditingFactoring(null);
      
    } catch (err) {
      console.error("Error al crear/actualizar factoring:", err);
      alert("Error al procesar el factoring. Por favor, inténtelo de nuevo.");
    }
  };
  
  // Manejador para crear una nueva entidad de factoring
  const handleCreateEntity = async (name: string): Promise<FactoringEntity> => {
    try {
      const newEntity = await factoringService.createFactoringEntity(name);
      
      // Actualizar la lista de entidades
      await loadInitialData();
      
      return newEntity;
    } catch (err) {
      console.error("Error al crear entidad de factoring:", err);
      throw new Error("Error al crear la entidad de factoring. Por favor, inténtelo de nuevo.");
    }
  };

  // Calcular datos de resumen (pendientes y pagados)
  const pendingCount = factorings.filter(f => f.status === 'Pendiente').length;
  const paidCount = factorings.filter(f => f.status === 'Girado y pagado').length;

  // Crear opciones para los desplegables
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    ...FACTORING_STATUS_OPTIONS.map(option => ({ 
      value: option.value, 
      label: option.label 
    }))
  ];
  
  const entityOptions = [
    { value: '', label: 'Todas las entidades' },
    ...factoringEntities.map(entity => ({
      value: entity.id.toString(),
      label: entity.name
    }))
  ];

  const costCenterOptions = [
    { value: '', label: 'Todos los centros de costo' },
    ...costCenters.map(cc => ({
      value: cc.id.toString(),
      label: `${cc.code} - ${cc.name}`
    }))
  ];

  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb pageTitle="Factoring" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-6">
        {/* Card 1: Total Factoring */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90 text-center">
              Total Factoring
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {factorings.length}
              </h3>
            </div>
          </div>
        </div>
        
        {/* Card 2: Monto con selector */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-center gap-2">
              <span className="text-base font-medium text-gray-800 dark:text-white/90">Monto</span>
              <select 
                value={selectedTotal}
                onChange={(e) => setSelectedTotal(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-md p-1 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="total_amount">Total</option>
                <option value="total_pendiente">Pendiente</option>
                <option value="total_giradoynopagado">Girado y no pagado</option>
                <option value="total_giradoypagado">Girado y pagado</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-brand-500">
                {formatCurrency(totals[selectedTotal])}
              </h3>
            </div>
          </div>
        </div>
        
        {/* Card 3: Estado */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90 text-center">
              Estado
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col space-y-2 w-full px-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-sm">Pendientes:</span>
                </div>
                <span className="text-sm font-medium">{pendingCount} ({formatCurrency(totals.total_pendiente)})</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm">Girado y no pagado:</span>
                </div>
                <span className="text-sm font-medium">
                  {factorings.filter(f => f.status === 'Girado y no pagado').length} ({formatCurrency(totals.total_giradoynopagado)})
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">Girado y pagado:</span>
                </div>
                <span className="text-sm font-medium">{paidCount} ({formatCurrency(totals.total_giradoypagado)})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Factoring</h1>
        <Button 
          onClick={() => {
            setEditingFactoring(null);
            setModalOpen(true);
          }}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nuevo Factoring
        </Button>
      </div>
      
      {/* Modal de Factoring */}
      <FactoringModal 
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingFactoring(null);
        }}
        onSubmit={handleSubmitFactoring}
        onCreateEntity={handleCreateEntity}
        factoring={editingFactoring}
        factoringEntities={factoringEntities}
        costCenters={costCenters}
      />

      {/* Filtros */}
      <ComponentCard title="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="status">Estado</Label>
            <select 
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status')(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {FACTORING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="entity">Entidad</Label>
            <select 
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              value={filters.factoring_entities_id?.toString() || ''}
              onChange={(e) => handleFilterChange('factoring_entities_id')(e.target.value)}
            >
              <option value="">Todas las entidades</option>
              {factoringEntities.map((entity) => (
                <option key={entity.id} value={entity.id.toString()}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="dateFrom">Fecha Desde</Label>
            <input
              type="date"
              id="dateFrom"
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from')(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="dateTo">Fecha Hasta</Label>
            <input
              type="date"
              id="dateTo"
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to')(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="costCenter">Centro de Costo</Label>
            <select 
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              value={filters.cost_center_id?.toString() || ''}
              onChange={(e) => handleFilterChange('cost_center_id')(e.target.value)}
            >
              <option value="">Todos los centros de costo</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id.toString()}>
                  {`${cc.code} - ${cc.name}`}
                </option>
              ))}
            </select>
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
                {/* Primera columna */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Entidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tasa de Interés
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Centro de Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha de Factoring
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha de Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado de pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {factorings.map((factoring) => (
                <tr 
                  key={factoring.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-white/[0.05] ${
                    isRowHighlighted(factoring) ? 'expired-row' : ''
                  }`}
                  style={{
                    backgroundColor: isRowHighlighted(factoring) 
                      ? 'rgba(254, 226, 226, 1)' 
                      : undefined,
                    transition: 'none' // Desactivar transiciones para evitar parpadeos
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {factoring.entity.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                    {formatCurrency(factoring.mount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatPercent(factoring.interest_rate / 100)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {factoring.costCenter.name || 'Sin centro de costo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatDate(factoring.date_factoring)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatDate(factoring.date_expiration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge
                      size="sm"
                      color={FACTORING_STATUS_MAP[factoring.status]?.color || 'secondary'}
                    >
                      {FACTORING_STATUS_MAP[factoring.status]?.label || factoring.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {factoring.payment_status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(factoring)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Editar
                      </button>
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

// Estilos específicos para las filas vencidas
const styles = document.createElement('style');
styles.innerHTML = `
  .expired-row {
    background-color: rgba(254, 226, 226, 1) !important;
    --tw-bg-opacity: 1 !important;
    background-color: rgb(254 226 226 / var(--tw-bg-opacity)) !important;
  }
  
  .dark .expired-row {
    background-color: rgba(127, 29, 29, 0.2) !important;
    --tw-bg-opacity: 0.2 !important;
    background-color: rgb(127 29 29 / var(--tw-bg-opacity)) !important;
  }
  
  /* Override para evitar que SimpleResponsiveTable quite el estilo */
  .expired-row.table-row-with-hover {
    background-color: rgba(254, 226, 226, 1) !important;
  }
  
  .dark .expired-row.table-row-with-hover {
    background-color: rgba(127, 29, 29, 0.2) !important;
  }
`;
document.head.appendChild(styles);

export default FactoringPage;