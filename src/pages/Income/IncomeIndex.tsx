// src/pages/Income/IncomeIndex.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { incomeApiService } from '../../services/incomeService';
import { IncomeData, IncomeFilters, IncomeItem } from '@/types/income';
import { FinancialRecordItem } from '../../components/tables/RecentFinantialTable';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import FilterPanel, { FilterConfig, FilterOption } from '../../components/common/FilterPanel';
import { formatCurrency } from '../../utils/formatters';
import FinancialTable, { 
  FinancialCategory, 
  FinancialPeriod, 
  generateWeekPeriods,
  generateMonthPeriods,
  generateQuarterPeriods
} from '../../components/tables/FinancialTable';
import FileInput from '../../components/form/input/FileInput';
import RecentFinancialTable from '../../components/tables/RecentFinantialTable';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

// Type for period filter
type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'annual';

const IncomeIndex = () => {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null);
  const [incomesByDate, setIncomesByDate] = useState<FinancialCategory[]>([]);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmptyClients, setShowEmptyClients] = useState(false);

  // Estados de filtros
  const [filters, setFilters] = useState<IncomeFilters>({
    periodType: 'monthly',
    year: new Date().getFullYear().toString(),
    projectId: 'all',
    costCenterId: 'all',
    clientId: 'all',
    status: 'all'
  });

  // Estados para opciones dinámicas de filtros
  const [filterOptions, setFilterOptions] = useState<{
    projects: FilterOption[];
    costCenters: FilterOption[];
    clients: FilterOption[];
    statuses: FilterOption[];
  }>({
    projects: [],
    costCenters: [],
    clients: [],
    statuses: []
  });

  const { user, isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();

  // **CONFIGURACIÓN DE FILTROS USANDO FilterPanel**
  const filterConfigs: FilterConfig[] = [
    {
      key: 'year',
      label: 'Año',
      type: 'select',
      options: () => {
        const currentYear = new Date().getFullYear();
        return Array(5).fill(0).map((_, i) => ({
          value: (currentYear - i).toString(),
          label: (currentYear - i).toString()
        }));
      },
      width: 'sm'
    },
    {
      key: 'projectId',
      label: 'Proyecto',
      type: 'select',
      options: [{ value: 'all', label: 'Todos los Proyectos' }, ...filterOptions.projects],
      loading: filterOptions.projects.length === 0,
      width: 'md'
    },
    {
      key: 'costCenterId',
      label: 'Centro de Costo',
      type: 'select',
      options: [{ value: 'all', label: 'Todos los Centros' }, ...filterOptions.costCenters],
      loading: filterOptions.costCenters.length === 0,
      width: 'md'
    },
    {
      key: 'clientId',
      label: 'Cliente',
      type: 'select',
      options: [{ value: 'all', label: 'Todos los Clientes' }, ...filterOptions.clients],
      loading: filterOptions.clients.length === 0,
      width: 'md'
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [{ value: 'all', label: 'Todos los Estados' }, ...filterOptions.statuses],
      loading: filterOptions.statuses.length === 0,
      width: 'sm'
    }
  ];

  // **CARGAR OPCIONES DE FILTROS AL INICIALIZAR**
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        console.log('🔄 Loading filter options...');
        const options = await incomeApiService.getFilterOptions();
        setFilterOptions(options);
        console.log('✅ Filter options loaded:', options);
      } catch (error) {
        console.error('❌ Error loading filter options:', error);
        // Usar opciones por defecto si falla
        setFilterOptions({
          projects: [
            { value: 'proyecto-a', label: 'Proyecto A' },
            { value: 'proyecto-b', label: 'Proyecto B' }
          ],
          costCenters: [
            { value: 'cc-1', label: 'Centro 1' },
            { value: 'cc-2', label: 'Centro 2' }
          ],
          clients: [
            { value: '12345678-9', label: 'Cliente A (12345678-9)' },
            { value: '98765432-1', label: 'Cliente B (98765432-1)' }
          ],
          statuses: [
            { value: 'borrador', label: 'Borrador' },
            { value: 'activo', label: 'Activo' },
            { value: 'facturado', label: 'Facturado' },
            { value: 'pagado', label: 'Pagado' }
          ]
        });
      }
    };
    
    if (isAuthenticated && user) {
      loadFilterOptions();
    }
  }, [isAuthenticated, user]);

  // **CARGAR DATOS PRINCIPALES**
  useEffect(() => {
    const fetchIncomeData = async () => {
      if (!isAuthenticated || !user) {
        setError('Necesita iniciar sesión para ver esta página');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Fetching income data with filters:', filters);

        // **1. OBTENER DATOS PRINCIPALES**
        const data = await incomeApiService.getIncomeData(filters);
        setIncomeData(data);
        console.log('✅ Income data loaded:', data);

        // **2. GENERAR PERÍODOS**
        let periodData: FinancialPeriod[] = [];
        const selectedYear = parseInt(filters.year);
        
        if (filters.periodType === 'weekly') {
          periodData = generateWeekPeriods(selectedYear);
        } else if (filters.periodType === 'monthly') {
          periodData = generateMonthPeriods(selectedYear);
        } else if (filters.periodType === 'quarterly') {
          periodData = generateQuarterPeriods(selectedYear);
        } else if (filters.periodType === 'annual') {
          // Show last 5 years
          periodData = Array(5).fill(0).map((_, i) => ({
            id: `${selectedYear - 4 + i}`,
            label: (selectedYear - 4 + i).toString()
          }));
        }
        
        setPeriods(periodData);
        console.log('✅ Periods generated:', periodData);

        // **3. OBTENER DATOS POR PERÍODO**
        console.log('🔄 Calling getIncomesByPeriod with filters:', filters);
        const periodDataFromAPI = await incomeApiService.getIncomesByPeriod(filters);
        console.log('📊 Period data received:', periodDataFromAPI);
        console.log('📊 Period data length:', periodDataFromAPI.length);
        
        if (periodDataFromAPI.length > 0) {
          console.log('📊 Sample period data:', periodDataFromAPI.slice(0, 2));
        }
        
        // Transformar IncomesByPeriod a FinancialCategory
        const transformedPeriodData: FinancialCategory[] = periodDataFromAPI.map(item => ({
          category: item.client, // client -> category
          path: item.path,
          amounts: item.amounts
        }));
        
        setIncomesByDate(transformedPeriodData);
        console.log('✅ Period data loaded:', transformedPeriodData);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos de ingresos';
        setError(errorMessage);
        console.error('❌ Error fetching income data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeData();
  }, [filters, isAuthenticated, user, currentTenant]);

  // **FUNCIÓN PARA TRANSFORMAR DATOS**
  const transformIncomeItemsToFinancialRecords = (incomeItems: IncomeItem[]): FinancialRecordItem[] => {
    return incomeItems.map(item => ({
      id: item.income_id,
      name: item.description || 'Sin descripción',
      category: item.client_name || 'Sin cliente',
      date: item.date,
      state: mapStatusToState(item.status),
      amount: item.amount
    }));
  };

  // **MAPEAR ESTADOS DEL BACKEND A ESTADOS DEL FRONTEND**
  const mapStatusToState = (status: string): 'draft' | 'pending' | 'approved' | 'paid' | 'deposited' | 'rejected' => {
    switch (status?.toLowerCase()) {
      case 'activo':
        return 'approved';
      case 'facturado':
        return 'pending';
      case 'pagado':
        return 'paid';
      case 'cancelado':
        return 'rejected';
      case 'borrador':
      case 'draft':
        return 'draft';
      default:
        return 'draft';
    }
  };

  // **MANEJADORES DE EVENTOS**
  const handleFilterChange = (filterKey: string, value: string) => {
    console.log(`🔄 Filter changed: ${filterKey} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleClearFilters = () => {
    console.log('🔄 Clearing filters');
    setFilters({
      periodType: 'monthly',
      year: new Date().getFullYear().toString(),
      projectId: 'all',
      costCenterId: 'all',
      clientId: 'all',
      status: 'all'
    });
  };

  // **FILE UPLOAD HANDLER**
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Simulate file processing - in real implementation, call API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete upload
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Reset after delay
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 1500);
      
      console.log('File processed:', file);
      
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadStatus('error');
      
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 1500);
    }
  };

  // **TÍTULO DINÁMICO**
  const getTitle = () => {
    if (currentTenant) {
      return `Gestión de Ingresos`;
    }
    return 'Gestión de Ingresos';
  };

  return (
    <div className="w-full px-4 py-6">
      <PageBreadcrumb pageTitle={getTitle()} titleSize="2xl" />

      {/* **SUMMARY OVERVIEW** */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <ComponentCard title="Total de Ingresos" className="bg-white dark:bg-gray-800 h-48">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold text-green-500">
              {incomeData ? formatCurrency(incomeData.totalIncomes) : formatCurrency(0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monto total registrado</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Ingresos Pendientes" className="bg-white dark:bg-gray-800 h-48">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold text-yellow-500">
              {incomeData ? incomeData.pendingIncomes : 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Registros por procesar</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Importar Ingresos" className="bg-white dark:bg-gray-800 h-48">
          <FileInput 
            onChange={(event) => {
              if (event.target.files && event.target.files[0]) {
                handleFileUpload(event.target.files[0]);
              }
            }} 
          />
        </ComponentCard>
      </div>

      {/* **FILTROS USANDO FilterPanel** */}
      <FilterPanel
        title="Filtros de Ingresos"
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        showClearButton={true}
        loading={loading}
        className="mb-6"
      />

      {/* **TABLA FINANCIERA POR PERÍODOS** */}
      <FinancialTable 
        title={`Ingresos por mes`}
        type="income"
        periods={periods}
        data={incomesByDate}
        loading={loading}
        className="mb-6"
      />

      {/* **CLIENTES CON INGRESOS** */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Clientes con Ingresos</h2>
      
      {/* Clientes con datos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {incomeData?.byClientData.filter(client => client.has_data).map((client, index) => (
          <Link to={client.path} key={client.client_id || index}>
            <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-800 dark:text-white text-sm line-clamp-2">{client.client_name}</h3>
                <div className="flex items-center ml-2">
                  <svg className="w-4 h-4 text-gray-400 hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              {client.client_tax_id && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">RUT: {client.client_tax_id}</p>
              )}
              
              <p className="text-2xl font-bold text-green-500 mb-1">{formatCurrency(client.amount)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{client.count} registros</p>
            </div>
          </Link>
        ))}
      </div>

      {/* **CENTROS DE COSTO CON INGRESOS** */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Centros de Costo con Ingresos</h2>
      
      {/* Centros con datos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {incomeData?.byCenterData.filter(center => center.has_data).map((center, index) => (
          <Link to={center.path} key={center.center_id || index}>
            <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-800 dark:text-white text-sm line-clamp-2">{center.center_name}</h3>
                <div className="flex items-center ml-2">
                  <svg className="w-4 h-4 text-gray-400 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              {center.center_code && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Código: {center.center_code}</p>
              )}
              
              <p className="text-2xl font-bold text-blue-500 mb-1">{formatCurrency(center.amount)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{center.count} registros</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Clientes sin datos */}
      {incomeData?.byClientData && incomeData.byClientData.filter(client => !client.has_data).length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Clientes sin Ingresos ({incomeData.byClientData.filter(client => !client.has_data).length})
            </h3>
            <button
              onClick={() => setShowEmptyClients(!showEmptyClients)}
              className="text-sm text-green-500 hover:text-green-600 flex items-center gap-1"
            >
              {showEmptyClients ? 'Ocultar' : 'Ver todos'}
              <svg 
                className={`w-4 h-4 transition-transform ${showEmptyClients ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Mostrar siempre los primeros 3, luego el resto si showEmptyClients */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {incomeData.byClientData
              .filter(client => !client.has_data)
              .slice(0, showEmptyClients ? undefined : 3)
              .map((client, index) => (
                <Link to={client.path} key={client.client_id || index}>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all dark:bg-gray-700 dark:border-gray-600 opacity-75 hover:opacity-100">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{client.client_name}</h4>
                      <div className="flex items-center ml-1">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    {client.client_tax_id && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">RUT: {client.client_tax_id}</p>
                    )}
                    
                    <p className="text-lg font-bold text-gray-400 dark:text-gray-500">{formatCurrency(0)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Sin registros</p>
                  </div>
                </Link>
              ))}
          </div>
          
          {!showEmptyClients && incomeData.byClientData.filter(client => !client.has_data).length > 3 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowEmptyClients(true)}
                className="text-sm text-gray-500 hover:text-green-500 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
              >
                Ver {incomeData.byClientData.filter(client => !client.has_data).length - 3} clientes más
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* **TABLA DE INGRESOS RECIENTES** */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white my-6">Ingresos Recientes</h2>
      <RecentFinancialTable 
        data={incomeData ? transformIncomeItemsToFinancialRecords(incomeData.recentIncomes) : []}
        loading={loading}
        type="income"
      />
    </div>
  );
};

export default IncomeIndex;