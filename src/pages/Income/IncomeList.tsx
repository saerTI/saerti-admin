// src/pages/Income/IncomeList.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { incomeApiService } from '../../services/incomeService';
import { Income, IncomeFilter, IncomeStats } from '@/types/income';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import FilterPanel, { FilterConfig, FilterOption } from '../../components/common/FilterPanel';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/table';
import { Modal } from '../../components/ui/modal';
import Button from '@/components/ui/button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { EyeIcon, PencilIcon, TrashBinIcon } from '../../icons';

const IncomeList = () => {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [stats, setStats] = useState<IncomeStats | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  // Estados de UI
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Estados de filtros
  const [filters, setFilters] = useState<IncomeFilter>({
    page: 1,
    perPage: 25,
    search: '',
    state: 'all',
    costCenterId: undefined,
    clientId: '',
    startDate: '',
    endDate: '',
    paymentType: 'all',
    sortBy: 'date',
    sortDirection: 'desc'
  });

  // Estados para opciones dinámicas de filtros
  const [filterOptions, setFilterOptions] = useState<{
    costCenters: FilterOption[];
    clients: FilterOption[];
    statuses: FilterOption[];
  }>({
    costCenters: [],
    clients: [],
    statuses: []
  });

  const { user, isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();
  const navigate = useNavigate();

  // Helper function for status badges
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      borrador: { label: 'Borrador', className: 'bg-gray-100 text-gray-800' },
      activo: { label: 'Activo', className: 'bg-blue-100 text-blue-800' },
      facturado: { label: 'Facturado', className: 'bg-yellow-100 text-yellow-800' },
      pagado: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.borrador;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // **CONFIGURACIÓN DE FILTROS**
  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'search',
      placeholder: 'Buscar por número, cliente, RUT...',
      width: 'lg'
    },
    {
      key: 'state',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos los Estados' },
        { value: 'borrador', label: 'Borrador' },
        { value: 'activo', label: 'Activo' },
        { value: 'facturado', label: 'Facturado' },
        { value: 'pagado', label: 'Pagado' },
        { value: 'cancelado', label: 'Cancelado' }
      ],
      width: 'sm'
    },
    {
      key: 'costCenterId',
      label: 'Centro de Costo',
      type: 'select',
      options: [{ value: '', label: 'Todos los Centros' }, ...filterOptions.costCenters],
      loading: filterOptions.costCenters.length === 0,
      width: 'md'
    },
    {
      key: 'clientId',
      label: 'Cliente',
      type: 'select',
      options: [{ value: '', label: 'Todos los Clientes' }, ...filterOptions.clients],
      loading: filterOptions.clients.length === 0,
      width: 'md'
    },
    {
      key: 'startDate',
      label: 'Fecha Desde',
      type: 'date',
      width: 'sm'
    },
    {
      key: 'endDate',
      label: 'Fecha Hasta',
      type: 'date',
      width: 'sm'
    },
    {
      key: 'paymentType',
      label: 'Tipo de Pago',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'factoring', label: 'Factoring' },
        { value: 'transferencia', label: 'Transferencia' }
      ],
      width: 'sm'
    }
  ];

  // **CONFIGURACIÓN DE COLUMNAS DE LA TABLA** - Eliminado, usaremos Table manual
  const renderIncomeRow = (income: Income) => (
    <TableRow key={income.id}>
      <TableCell>
        <div className="font-medium">
          <Link 
            to={`/ingresos/${income.id}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {income.document_number}
          </Link>
          {income.ep_detail && (
            <div className="text-xs text-gray-500">{income.ep_detail}</div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {income.client_name}
          </div>
          <div className="text-sm text-gray-500">
            {income.client_tax_id}
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-right">
          <div className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(income.ep_total)}
          </div>
          {income.total_amount !== income.ep_total && (
            <div className="text-sm text-gray-500">
              Final: {formatCurrency(income.total_amount)}
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          {formatDate(income.date)}
        </div>
      </TableCell>
      
      <TableCell>
        {getStatusBadge(income.state)}
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          {income.center_name || 'Sin asignar'}
          {income.cost_center_code && (
            <div className="text-xs text-gray-500">
              {income.cost_center_code}
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          {income.factoring ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {income.factoring}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/ingresos/${income.id}`)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Ver detalles"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/ingresos/${income.id}/edit`)}
            className="text-gray-600 hover:text-gray-800 p-1"
            title="Editar"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(income)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Eliminar"
            disabled={deletingId === income.id}
          >
            <TrashBinIcon className="w-4 h-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );

  // **CARGAR OPCIONES DE FILTROS**
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await incomeApiService.getFilterOptions();
        setFilterOptions({
          costCenters: options.costCenters,
          clients: options.clients,
          statuses: options.statuses
        });
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    if (isAuthenticated && user) {
      loadFilterOptions();
    }
  }, [isAuthenticated, user]);

  // **CARGAR DATOS DE INGRESOS**
  useEffect(() => {
    const fetchIncomes = async () => {
      if (!isAuthenticated || !user) {
        setError('Necesita iniciar sesión para ver esta página');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await incomeApiService.getIncomes(filters);
        setIncomes(response.data);
        setStats(response.stats);
        setPagination(response.pagination);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar ingresos';
        setError(errorMessage);
        console.error('Error fetching incomes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncomes();
  }, [filters, isAuthenticated, user, currentTenant]);

  // **MANEJADORES DE EVENTOS**
  const handleFilterChange = (filterKey: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value,
      page: 1 // Reset page when filters change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      perPage: 25,
      search: '',
      state: 'all',
      costCenterId: undefined,
      clientId: '',
      startDate: '',
      endDate: '',
      paymentType: 'all',
      sortBy: 'date',
      sortDirection: 'desc'
    });
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortDirection: prev.sortBy === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDeleteClick = (income: Income) => {
    setIncomeToDelete(income);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!incomeToDelete) return;

    try {
      setDeletingId(incomeToDelete.id);
      const success = await incomeApiService.deleteIncome(incomeToDelete.id);
      
      if (success) {
        // Reload data
        const response = await incomeApiService.getIncomes(filters);
        setIncomes(response.data);
        setStats(response.stats);
        setPagination(response.pagination);
        
        setShowDeleteModal(false);
        setIncomeToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      setError('Error al eliminar el ingreso');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setIncomeToDelete(null);
  };

  if (error) {
    return (
      <div className="w-full px-4 py-6">
        <PageBreadcrumb pageTitle="Lista de Ingresos" titleSize="2xl" />
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <PageBreadcrumb pageTitle="Lista de Ingresos" titleSize="2xl" />
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/ingresos/new')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Nuevo Ingreso
          </Button>
          <Button
            onClick={() => navigate('/ingresos/import')}
            variant="outline"
          >
            Importar Archivo
          </Button>
        </div>
      </div>

      {/* **ESTADÍSTICAS** */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <ComponentCard title="Total Ingresos" className="bg-white dark:bg-gray-800">
            <div className="flex flex-col items-center justify-center h-24">
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(stats.montoTotal)}
              </p>
              <p className="text-sm text-gray-500">{stats.total} registros</p>
            </div>
          </ComponentCard>

          <ComponentCard title="Pagados" className="bg-white dark:bg-gray-800">
            <div className="flex flex-col items-center justify-center h-24">
              <p className="text-2xl font-bold text-green-600">
                {stats.pagado}
              </p>
              <p className="text-sm text-gray-500">Ingresos pagados</p>
            </div>
          </ComponentCard>

          <ComponentCard title="Pendientes" className="bg-white dark:bg-gray-800">
            <div className="flex flex-col items-center justify-center h-24">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.activo + stats.facturado}
              </p>
              <p className="text-sm text-gray-500">Por cobrar</p>
            </div>
          </ComponentCard>

          <ComponentCard title="Factoring" className="bg-white dark:bg-gray-800">
            <div className="flex flex-col items-center justify-center h-24">
              <p className="text-2xl font-bold text-purple-600">
                {stats.factoringCount}
              </p>
              <p className="text-sm text-gray-500">Con factoring</p>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* **FILTROS** */}
      <FilterPanel
        title="Filtros de Búsqueda"
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        showClearButton={true}
        loading={loading}
        className="mb-6"
      />

      {/* **TABLA DE DATOS** */}
      <ComponentCard title="Lista de Ingresos" className="bg-white dark:bg-gray-800">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <Table className="min-h-96">
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>N° Documento</TableCell>
                  <TableCell isHeader>Cliente</TableCell>
                  <TableCell isHeader>Total EP</TableCell>
                  <TableCell isHeader>Fecha</TableCell>
                  <TableCell isHeader>Estado</TableCell>
                  <TableCell isHeader>Centro de Costo</TableCell>
                  <TableCell isHeader>Factoring</TableCell>
                  <TableCell isHeader>Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.length > 0 ? (
                  incomes.map(renderIncomeRow)
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron ingresos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Simple pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-between items-center mt-4 px-6 py-3 border-t">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {pagination.from} a {pagination.to} de {pagination.total} resultados
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handlePageChange(filters.page! - 1)}
                    disabled={!pagination.has_prev}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Página {pagination.current_page} de {pagination.total_pages}
                  </span>
                  <Button
                    onClick={() => handlePageChange(filters.page! + 1)}
                    disabled={!pagination.has_next}
                    variant="outline"
                    size="sm"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </ComponentCard>

      {/* **MODAL DE CONFIRMACIÓN DE ELIMINACIÓN** */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        title="Eliminar Ingreso"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            ¿Está seguro que desea eliminar el ingreso <strong>{incomeToDelete?.document_number}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={handleDeleteCancel}
              variant="outline"
              disabled={deletingId !== null}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              isLoading={deletingId === incomeToDelete?.id}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IncomeList;