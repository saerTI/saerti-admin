// src/pages/Egresos/CostosFijos.tsx - Con filtros dinámicos corregidos

import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FixedCostFilter,
  FIXED_COST_STATUS_MAP,
  PAYMENT_STATUS_MAP,
  FixedCostState,
  CostoFijoCreateData
} from '../../types/CC/fixedCosts';
import Button from '../../components/ui/button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Badge from '../../components/ui/badge/Badge';
import SimpleResponsiveTable from '../../components/tables/SimpleResponsiveTable';
import CostoFijoModal from '../../components/CC/NuevoCostoFijoModal';
import FilterPanel, { FilterConfig } from '../../components/common/FilterPanel';
import { useFixedCosts, useFixedCostOperations } from '../../hooks/useFixedCosts';
import { useCostCenters } from '../../hooks/useCostCenters';
import config from '../../utils/config'; // ✅ AÑADIDO: Import del archivo de configuración

const CostosFijos = () => {
  // ✅ Estados locales
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<FixedCostFilter>({});
  
  // Referencias
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Hook principal para costos fijos
  const {
    fixedCosts,
    loading,
    error,
    pagination,
    stats,
    updateFilters,
    refresh,
    hasData,
    isEmpty,
    changePage
  } = useFixedCosts({
    initialFilters: filters,
    autoLoad: true,
    pageSize: 15
  });

  // ✅ Hook de operaciones
  const { 
    createFixedCost, 
    deleteFixedCost, 
    updatePaidQuotas, 
    loading: operationLoading 
  } = useFixedCostOperations();
  
  const { costCenters, loading: costCentersLoading } = useCostCenters();

  // ✅ CORREGIDO: Sincronizar filtros locales con el hook cuando cambian
  useEffect(() => {
    updateFilters(filters);
  }, [filters, updateFilters]);

  // ✅ DEBUG: Verificar datos de costCenters
  useEffect(() => {
    if (!costCentersLoading && costCenters.length > 0) {
      console.log('✅ Cost Centers cargados:', costCenters);
      console.log('✅ Tipos de centros:', [...new Set(costCenters.map(cc => cc.type))]);
    }
  }, [costCenters, costCentersLoading]);

  // ✅ Función para eliminar
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este costo fijo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const success = await deleteFixedCost(id);
      if (success) {
        refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el costo fijo');
      console.error('Error deleting fixed cost:', err);
    }
  };

  // ✅ Función para actualizar cuotas pagadas
  const handleUpdatePaidQuotas = async (id: number, currentPaidQuotas: number, maxQuotas: number) => {
    const newPaidQuotas = prompt(
      `Cuotas pagadas actuales: ${currentPaidQuotas}/${maxQuotas}\nIngrese el nuevo número de cuotas pagadas:`,
      currentPaidQuotas.toString()
    );

    if (newPaidQuotas === null) return; // Usuario canceló

    const paidQuotasNumber = parseInt(newPaidQuotas);
    
    if (isNaN(paidQuotasNumber) || paidQuotasNumber < 0 || paidQuotasNumber > maxQuotas) {
      alert(`El número de cuotas pagadas debe estar entre 0 y ${maxQuotas}`);
      return;
    }

    try {
      const success = await updatePaidQuotas(id, paidQuotasNumber);
      if (success) {
        refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar cuotas pagadas');
      console.error('Error updating paid quotas:', err);
    }
  };

  // ✅ Manejador para el envío del formulario del modal
  const handleSubmitCostoFijo = async (formData: CostoFijoCreateData) => {
    try {
      console.log("Datos de nuevo costo fijo:", formData);
      
      const fixedCostData = {
        name: formData.name,
        description: formData.description,
        quota_value: parseFloat(formData.quota_value.toString()),
        quota_count: parseInt(formData.quota_count.toString()),
        paid_quotas: 0,
        start_date: formData.startDate,
        payment_date: formData.paymentDate,
        cost_center_id: formData.projectId ? parseInt(formData.projectId) : undefined,
        state: 'active' as FixedCostState
      };
      
      const newId = await createFixedCost(fixedCostData);
      
      if (newId) {
        setModalOpen(false);
        refresh();
        alert("Costo fijo creado con éxito");
      }
      
    } catch (err) {
      console.error("Error al crear costo fijo:", err);
      alert("Error al crear el costo fijo. Por favor, inténtelo de nuevo.");
    }
  };

  // ✅ CORREGIDO: Manejador para cambios en filtros usando el componente FilterPanel
  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === null || value === undefined) {
      delete (newFilters as any)[filterKey];
    } else {
      if (filterKey === 'costCenterId') {
        (newFilters as any)[filterKey] = parseInt(value, 10);
      } else {
        (newFilters as any)[filterKey] = value;
      }
    }
    
    setFilters(newFilters);
  };

  // ✅ Limpiar todos los filtros
  const clearFilters = () => {
    setFilters({});
  };

  // ✅ Calcular métricas del dashboard usando stats
  const totalAmount = stats?.totalAmount || 0;
  const activeCount = stats?.active || 0;
  const completedCount = stats?.completed || 0;
  const totalCount = stats?.total || fixedCosts.length;
  const remainingAmount = stats?.remainingAmount || 0;

  // ✅ CORREGIDO: Configuración de filtros con opciones DINÁMICAS
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'state',
      label: 'Estado',
      type: 'select',
      options: [
        { value: '', label: 'Todos los estados' },
        ...Object.entries(FIXED_COST_STATUS_MAP).map(([value, config]) => ({
          value,
          label: config.label
        }))
      ]
    },
    {
      key: 'costCenterId',
      label: 'Centro de Costo',
      type: 'select',
      loading: costCentersLoading,
      // ✅ FUNCIÓN DINÁMICA que se ejecuta cada vez que se necesitan las opciones
      options: () => {
        if (costCentersLoading || !costCenters) {
          return [{ value: '', label: 'Cargando...' }];
        }

        const baseOptions = [{ value: '', label: 'Todos los centros' }];
        
        // ✅ CORREGIDO: Usar los tipos en español que devuelve tu hook
        const filteredCenters = costCenters.filter(cc => 
          cc.type === 'proyecto' || cc.type === 'administrativo' || cc.type === 'project' || cc.type === 'administrative'
        );

        console.log('✅ Centros filtrados para opciones:', filteredCenters);

        const centerOptions = filteredCenters.map(cc => ({
          value: cc.id.toString(),
          label: `${cc.code} - ${cc.name}`,
          disabled: cc.status === 'inactive' // Opcional: deshabilitar centros inactivos
        }));

        return [...baseOptions, ...centerOptions];
      }
    },
    {
      key: 'paymentStatus',
      label: 'Estado de Pago',
      type: 'select',
      options: [
        { value: '', label: 'Todos los estados de pago' },
        ...Object.entries(PAYMENT_STATUS_MAP).map(([value, config]) => ({
          value,
          label: config.label
        }))
      ]
    },
    {
      key: 'startDate',
      label: 'Fecha Inicio',
      type: 'date',
      placeholder: 'Seleccione fecha inicio'
    },
    {
      key: 'endDate',
      label: 'Fecha Fin',
      type: 'date',
      placeholder: 'Seleccione fecha fin'
    }
  ], [costCenters, costCentersLoading]); // ✅ DEPENDENCIAS para recalcular cuando cambien los datos

  // ✅ Funciones de paginación
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

  // ✅ Función para obtener el rango de páginas
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
      <PageBreadcrumb pageTitle="Costos Fijos" />

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-6">
        <ComponentCard title='Total Costos' titleCenter={true} centerContent={true}>
          <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</h3>
        </ComponentCard>
        
        <ComponentCard title='Monto Total'>
          <div className="flex flex-col items-center justify-center">
            <h3 className="mt-1 text-2xl font-bold text-brand-500">{formatCurrency(totalAmount)}</h3>
          </div>
        </ComponentCard>
        
        <ComponentCard title='Por Pagar'>
          <div className="flex flex-col items-center justify-center">
            <h3 className="mt-1 text-2xl font-bold text-orange-500">{formatCurrency(remainingAmount)}</h3>
          </div>
        </ComponentCard>
        
        <ComponentCard title='Estados'>
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs">Activos</span>
              </div>
              <span className="text-xs font-semibold">{activeCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-xs">Completados</span>
              </div>
              <span className="text-xs font-semibold">{completedCount}</span>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Título y botón de nuevo costo */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Costos Fijos</h1>
        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white"
          disabled={operationLoading}
        >
          Nuevo Costo Fijo
        </Button>
      </div>
      
      {/* Modal de Costo Fijo */}
      <CostoFijoModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitCostoFijo}
        projects={costCenters
          .filter(cc => cc.type === 'proyecto' || cc.type === 'project')
          .map(cc => ({ 
            id: cc.id, 
            name: `${cc.code} - ${cc.name}` 
          }))
        }
      />

      {/* ✅ NUEVO: Panel de filtros con opciones dinámicas */}
      <FilterPanel
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* ✅ DEBUG: Mostrar información de costCenters para debugging */}
      {config.isDevelopment && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Debug Info - Cost Centers:
          </h4>
          <div className="text-xs text-blue-600 dark:text-blue-300">
            <p>Loading: {costCentersLoading ? 'Sí' : 'No'}</p>
            <p>Total: {costCenters.length}</p>
            <p>Tipos: {[...new Set(costCenters.map(cc => cc.type))].join(', ')}</p>
            {costCenters.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">Ver todos los centros</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-32">
                  {JSON.stringify(costCenters, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
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
        /* Tabla de costos fijos */
        <SimpleResponsiveTable 
          hasData={hasData}
          emptyMessage="No se encontraron costos fijos con los filtros seleccionados."
          enableSmoothScroll={true}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
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
                  Centro de Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {fixedCosts.map((costo) => (
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
                    <button
                      onClick={() => handleUpdatePaidQuotas(costo.id, costo.paid_quotas, costo.quota_count)}
                      className="hover:text-brand-500 cursor-pointer transition-colors"
                      title="Actualizar cuotas pagadas"
                    >
                      {costo.paid_quotas}/{costo.quota_count}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {costo.center_name || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex flex-col">
                      <span>Inicio: {formatDate(costo.start_date)}</span>
                      <span>Fin: {formatDate(costo.end_date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge
                      size="sm"
                      color={FIXED_COST_STATUS_MAP[costo.state]?.color || 'light'}
                    >
                      {FIXED_COST_STATUS_MAP[costo.state]?.label || costo.state}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge
                      size="sm"
                      color={costo.payment_status ? PAYMENT_STATUS_MAP[costo.payment_status]?.color || 'light' : 'light'}
                    >
                      {costo.payment_status ? PAYMENT_STATUS_MAP[costo.payment_status]?.label || costo.payment_status : 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                    {formatCurrency(costo.total_amount)}
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay costos fijos</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comience creando un nuevo costo fijo.
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => setModalOpen(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Costo Fijo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostosFijos;