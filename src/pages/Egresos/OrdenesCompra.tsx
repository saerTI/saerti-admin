import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  OrdenCompraFilter,
  ORDEN_COMPRA_STATUS_MAP,
  PAYMENT_TYPE_MAP,
  GRUPOS_CUENTAS,
  OrdenCompraEstado
} from '../../types/CC/ordenCompra';
import Button from '../../components/ui/button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Badge from '../../components/ui/badge/Badge';
import Select from '../../components/form/Select';
import Label from '../../components/form/Label';
import DatePicker from '../../components/form/date-picker';
import SimpleResponsiveTable from '../../components/tables/SimpleResponsiveTable';
import ImportOrdenesCompraModal from '../../components/CC/ImportOrdenesCompraModal';
import { useOrdenesCompra, useOrdenCompraOperations } from '../../hooks/useOrdenesCompra';
import { useCostCenters } from '../../hooks/useCostCenters';

const OrdenesCompra = () => {
  const navigate = useNavigate();
  
  // Estados locales
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [filters, setFilters] = useState<OrdenCompraFilter>({});
  
  // Referencias
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hook principal
  const {
    ordenes,
    loading,
    error,
    pagination,
    stats,
    updateFilters,
    refresh,
    hasData,
    isEmpty,
    changePage
  } = useOrdenesCompra({
    initialFilters: filters,
    autoLoad: true,
    pageSize: 15
  });

  // Hook de operaciones
  const { deleteOrden, loading: operationLoading } = useOrdenCompraOperations();
  const { costCenters, loading: costCentersLoading } = useCostCenters();

  // Función para eliminar
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar esta orden de compra? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const success = await deleteOrden(id);
      if (success) {
        refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la orden de compra');
      console.error('Error deleting orden de compra:', err);
    }
  };

  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Manejador para el éxito de la importación
  const handleImportSuccess = (count: number, type: string) => {
    alert(`Se importaron ${count} órdenes de compra ${type} correctamente`);
    refresh();
  };

  // Funciones para el modal de importación
  const openImportModal = () => {
    setDropdownOpen(false);
    setImportModalOpen(true);
  };
  
  const closeImportModal = () => {
    setImportModalOpen(false);
  };

  // Manejador para cambios en filtros
  const handleFilterChange = (filterName: keyof OrdenCompraFilter) => (value: string) => {
    const newFilters = { ...filters };
    
    if (value === '') {
      delete newFilters[filterName];
    } else {
      (newFilters as any)[filterName] = value;
    }
    
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    setFilters({});
    updateFilters({});
  };


  // Calcular métricas del dashboard usando stats
  const totalAmount = stats?.montoTotal || 0;
  const pendingCount = stats?.pending || stats?.borrador || 0;
  const approvedCount = stats?.approved || stats?.activo || 0;
  const creditCount = stats?.creditCount || stats?.totalOrdenes || 0;
  const totalCount = stats?.totalOrdenes || ordenes.length;

  // Opciones para dropdowns
  const stateOptions = [
    { value: '', label: 'Todos los estados' },
    ...Object.entries(ORDEN_COMPRA_STATUS_MAP).map(([value, config]) => ({
      value,
      label: config.label
    }))
  ];
  
  const grupoOptions = [
    { value: '', label: 'Todos los grupos' },
    ...GRUPOS_CUENTAS.map(grupo => ({ value: grupo, label: grupo }))
  ];

  const paymentTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    ...Object.entries(PAYMENT_TYPE_MAP).map(([value, config]) => ({
      value,
      label: config.label
    }))
  ];

  const costCenterOptions = [
    { value: '', label: 'Todos los centros' },
    ...costCenters
      .filter(cc => cc.type === 'proyecto' || cc.type === 'administrativo')
      .map(cc => ({
        value: cc.id.toString(),
        label: `${cc.code} - ${cc.name}`
      }))
  ];

  // Función para navegación de páginas
  const handlePageChange = (page: number) => {
    changePage(page);
  };

  const handleNextPage = () => {
    if (pagination?.has_next) {
      changePage(pagination.current_page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.has_prev) {
      changePage(pagination.current_page - 1);
    }
  };

  // Función para obtener el rango de páginas
  const getPaginationRange = () => {
    if (!pagination) return [];
    
    const { current_page, total_pages } = pagination;
    const delta = 2;
    const range = [];
    
    for (let i = Math.max(2, current_page - delta); 
         i <= Math.min(total_pages - 1, current_page + delta); 
         i++) {
      range.push(i);
    }
    
    if (current_page - delta > 2) {
      range.unshift("...");
    }
    if (current_page + delta < total_pages - 1) {
      range.push("...");
    }
    
    range.unshift(1);
    if (total_pages !== 1) {
      range.push(total_pages);
    }
    
    return range;
  };


  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb pageTitle="Gestión de Órdenes de Compra" />

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-6">
        <ComponentCard title='Total Órdenes' titleCenter={true} centerContent={true}>
          <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</h3>
        </ComponentCard>
        
        <ComponentCard title='Monto Total'>
          <div className="flex flex-col items-center justify-center">
            <h3 className="mt-1 text-2xl font-bold text-brand-500">{formatCurrency(totalAmount)}</h3>
          </div>
        </ComponentCard>
        
        <ComponentCard title='Estados'>
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-xs">Pendientes</span>
              </div>
              <span className="text-xs font-semibold">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs">Aprobadas</span>
              </div>
              <span className="text-xs font-semibold">{approvedCount}</span>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title='Tipo Pago'>
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">Crédito</span>
              <span className="text-xs font-semibold">{creditCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Contado</span>
              <span className="text-xs font-semibold">{totalCount - creditCount}</span>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Título y botón de nueva orden */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Órdenes de Compra</h1>
        <div className="relative" ref={dropdownRef}>
          <Button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-2"
          >
            <span>Nueva Orden de Compra</span>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
      
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 z-10 border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/cuentas/ordenes-compra/nueva');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Ingresar manualmente
                </button>
                
                <button
                  onClick={openImportModal}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Importar desde Excel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Importación */}
      <ImportOrdenesCompraModal 
        isOpen={importModalOpen}
        onClose={closeImportModal}
        onSuccess={handleImportSuccess}
      />

      {/* Filtros */}
      <ComponentCard title="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
            <Label htmlFor="costCenter">Centro de Costo</Label>
            <Select
              options={costCenterOptions}
              defaultValue={filters.costCenterId ? filters.costCenterId.toString() : ''}
              onChange={handleFilterChange('costCenterId')}
              placeholder="Seleccione centro"
              disabled={costCentersLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="grupo">Cuenta Contable</Label>
            <Select
              options={grupoOptions}
              defaultValue={filters.grupoCuenta || ''}
              onChange={handleFilterChange('grupoCuenta')}
              placeholder="Seleccione grupo"
            />
          </div>

          <div>
            <Label htmlFor="paymentType">Tipo de Pago</Label>
            <Select
              options={paymentTypeOptions}
              defaultValue={filters.paymentType || ''}
              onChange={handleFilterChange('paymentType')}
              placeholder="Seleccione tipo"
            />
          </div>
          
          <div>
            <DatePicker
              id="startDate"
              label="Fecha Inicio"
              placeholder="Seleccione fecha inicio"
              defaultDate={filters.startDate || undefined}
              onChange={(selectedDates, dateStr) => {
                handleFilterChange('startDate')(dateStr);
              }}
            />
          </div>
          
          <div>
            <DatePicker
              id="endDate"
              label="Fecha Fin"
              placeholder="Seleccione fecha fin"
              defaultDate={filters.endDate || undefined}
              onChange={(selectedDates, dateStr) => {
                handleFilterChange('endDate')(dateStr);
              }}
            />
          </div>
        </div>

        {/* Botón para limpiar filtros */}
        {Object.keys(filters).length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </ComponentCard>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Indicador de carga */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        /* Tabla de órdenes de compra */
        <SimpleResponsiveTable 
          hasData={hasData}
          emptyMessage="No se encontraron órdenes de compra con los filtros seleccionados."
          enableSmoothScroll={true}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="sticky-first-column px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  N° OC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Centro de Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cuenta Contable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {ordenes.map((oc) => (
                <tr key={oc.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                  <td className="sticky-first-column px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                    <Link 
                      to={`/gastos/ordenes-compra/${oc.id}`}
                      className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {oc.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {oc.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {oc.supplierName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {oc.centroCostoNombre || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {oc.accountCategoryId ? (
                      <Link
                        to={`/cuentas-contables/${oc.accountCategoryId}`}
                        className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"

                      >
                        {oc.grupoCuenta || 'Sin grupo'}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        {oc.grupoCuenta || 'Sin grupo'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatDate(oc.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      oc.paymentType === 'credit' 
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {PAYMENT_TYPE_MAP[oc.paymentType]?.label || oc.paymentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                    <Badge
                      size="sm"
                      color={
                        (ORDEN_COMPRA_STATUS_MAP as any)[oc.state as OrdenCompraEstado]?.color || 'secondary'
                      }
                    >
                      {(ORDEN_COMPRA_STATUS_MAP as any)[oc.state as OrdenCompraEstado]?.label || oc.state}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                    {formatCurrency(oc.amount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/cuentas/ordenes-compra/${oc.id}/editar`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(oc.id)}
                        disabled={operationLoading}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
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

      {/* Paginación */}
      {pagination && pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {(pagination.current_page - 1) * pagination.per_page + 1} a{' '}
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de{' '}
            {pagination.total} resultados
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botón Anterior */}
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_prev}
              onClick={handlePrevPage}
              className="px-3 py-1 text-xs"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </Button>

            {/* Números de página */}
            <div className="hidden sm:flex space-x-1">
              {getPaginationRange().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  disabled={page === '...' || page === pagination.current_page}
                  className={`px-3 py-1 text-xs rounded ${
                    page === pagination.current_page
                      ? 'bg-brand-500 text-white'
                      : page === '...'
                      ? 'text-gray-500 cursor-default'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Página actual (solo en móvil) */}
            <div className="sm:hidden text-xs text-gray-600 dark:text-gray-400">
              Página {pagination.current_page} de {pagination.total_pages}
            </div>

            {/* Botón Siguiente */}
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_next}
              onClick={handleNextPage}
              className="px-3 py-1 text-xs"
            >
              Siguiente
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Información adicional cuando no hay datos */}
      {!loading && isEmpty && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay órdenes de compra</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comience creando una nueva orden de compra.
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => navigate('/cuentas/ordenes-compra/nueva')}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Orden de Compra
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesCompra;