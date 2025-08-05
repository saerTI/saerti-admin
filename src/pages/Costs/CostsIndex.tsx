// src/pages/Gastos/CostsIndex.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { costsApiService, CostsFilters, CostsData, CostItem, CostsByCategory } from '../../services/costsService';
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

const CostsIndex = () => {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costsData, setCostsData] = useState<CostsData | null>(null);
  const [expensesByDate, setExpensesByDate] = useState<FinancialCategory[]>([]);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showEmptyCategories, setShowEmptyCategories] = useState(false);

  // Estados de filtros
  const [filters, setFilters] = useState<CostsFilters>({
    periodType: 'monthly',
    year: new Date().getFullYear().toString(),
    projectId: 'all',
    costCenterId: 'all',
    categoryId: 'all',
    status: 'all'
  });

  // Estados para opciones dinámicas de filtros
  const [filterOptions, setFilterOptions] = useState<{
    projects: FilterOption[];
    costCenters: FilterOption[];
    categories: FilterOption[];
    statuses: FilterOption[];
  }>({
    projects: [],
    costCenters: [],
    categories: [],
    statuses: []
  });

  const { user, isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();

  // **CONFIGURACIÓN DE FILTROS USANDO FilterPanel**
  const filterConfigs: FilterConfig[] = [
    // {
    //   key: 'periodType',
    //   label: 'Tipo de Período',
    //   type: 'select',
    //   options: [
    //     { value: 'weekly', label: 'Semanal' },
    //     { value: 'monthly', label: 'Mensual' },
    //     { value: 'quarterly', label: 'Trimestral' },
    //     { value: 'annual', label: 'Anual' }
    //   ],
    //   width: 'sm'
    // },
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
      key: 'categoryId',
      label: 'Categoría',
      type: 'select',
      options: [{ value: 'all', label: 'Todas las Categorías' }, ...filterOptions.categories],
      loading: filterOptions.categories.length === 0,
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
        const options = await costsApiService.getFilterOptions();
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
          categories: [
            { value: 'cat-1', label: 'Remuneraciones' },
            { value: 'cat-2', label: 'Materiales' }
          ],
          statuses: [
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'aprobado', label: 'Aprobado' }
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
    const fetchCostsData = async () => {
      if (!isAuthenticated || !user) {
        setError('Necesita iniciar sesión para ver esta página');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Fetching costs data with filters:', filters);

        // **1. OBTENER DATOS PRINCIPALES**
        const data = await costsApiService.getCostsData(filters);
        setCostsData(data);
        console.log('✅ Costs data loaded:', data);

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
          // Show last 5 years - UPDATED TO MATCH BACKEND FORMAT
          periodData = Array(5).fill(0).map((_, i) => ({
            id: `${selectedYear - 4 + i}`, // ← CAMBIADO: de `year-${...}` a solo `${...}`
            label: (selectedYear - 4 + i).toString()
          }));
        }
        
        setPeriods(periodData);
        console.log('✅ Periods generated:', periodData);

        // **3. OBTENER DATOS POR PERÍODO**
        console.log('🔄 Calling getCostsByPeriod with filters:', filters);
        const periodDataFromAPI = await costsApiService.getCostsByPeriod(filters);
        console.log('📊 Period data received:', periodDataFromAPI);
        console.log('📊 Period data length:', periodDataFromAPI.length);
        
        if (periodDataFromAPI.length > 0) {
          console.log('📊 Sample period data:', periodDataFromAPI.slice(0, 2));
        }
        
        setExpensesByDate(periodDataFromAPI);
        console.log('✅ Period data loaded:', periodDataFromAPI);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos de costos';
        setError(errorMessage);
        console.error('❌ Error fetching costs data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCostsData();
  }, [filters, isAuthenticated, user, currentTenant]);

  // **FUNCIÓN PARA TRANSFORMAR DATOS**
  const transformCostItemsToFinancialRecords = (costItems: CostItem[]): FinancialRecordItem[] => {
    return costItems.map(item => ({
      id: item.cost_id,
      name: item.description || 'Sin descripción',
      category: item.category_name || 'Sin categoría',
      date: item.date,
      state: mapStatusToState(item.status),
      amount: item.amount
    }));
  };

  // **MAPEAR ESTADOS DEL BACKEND A ESTADOS DEL FRONTEND**
  const mapStatusToState = (status: string): 'draft' | 'pending' | 'approved' | 'paid' | 'deposited' | 'rejected' => {
    switch (status?.toLowerCase()) {
      case 'aprobado':
        return 'approved';
      case 'pendiente':
        return 'pending';
      case 'rechazado':
        return 'rejected';
      case 'pagado':
        return 'paid';
      case 'depositado':
        return 'deposited';
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
      categoryId: 'all',
      status: 'all'
    });
  };

  // **FILE UPLOAD HANDLER** (mantener funcionalidad existente)
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

  // **MÉTODO DE DEBUG**
  const handleLoadDebugData = async () => {
    try {
      console.log('🔍 Loading debug data...');
      const debug = await costsApiService.getDebugData();
      setDebugData(debug);
      setShowDebug(true);
      console.log('🔍 Debug data loaded:', debug);
    } catch (error) {
      console.error('❌ Error loading debug data:', error);
    }
  };

  // **TÍTULO DINÁMICO**
  const getTitle = () => {
    if (currentTenant) {
      return `Gestión de Costos - ${currentTenant.name}`;
    }
    return 'Gestión de Costos';
  };

  return (
          <div className="w-full px-4 py-6">
      <PageBreadcrumb pageTitle={getTitle()} titleSize="2xl" />

      {/* **BOTÓN DE DEBUG** */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleLoadDebugData}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          🔍 Debug Data Sources
        </button>
      </div>

      {/* **PANEL DE DEBUG** */}
      {showDebug && debugData && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">🔍 Debug Information</h3>
            <button
              onClick={() => setShowDebug(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📊 Table Counts:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>accounting_costs: <strong>{debugData.debug_data?.accounting_costs?.total_count || 0}</strong></li>
                <li>purchase_orders: <strong>{debugData.debug_data?.purchase_orders?.total_count || 0}</strong></li>
                <li>fixed_costs: <strong>{debugData.debug_data?.fixed_costs?.total_count || 0}</strong></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">🎯 Analysis:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>Total sources: <strong>{debugData.analysis?.total_sources || 0}</strong></li>
                <li>View records: <strong>{debugData.analysis?.view_total_records || 0}</strong></li>
                <li>Has accounting: <strong>{debugData.analysis?.has_accounting_data ? '✅' : '❌'}</strong></li>
                <li>Has purchases: <strong>{debugData.analysis?.has_purchase_orders ? '✅' : '❌'}</strong></li>
              </ul>
            </div>
          </div>
          
          {debugData.recommendations && debugData.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">💡 Recommendations:</h4>
              <ul className="space-y-1">
                {debugData.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">{rec}</li>
                ))}
              </ul>
            </div>
          )}
          
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300">
              🔧 Raw Debug Data (Click to expand)
            </summary>
            <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* **SUMMARY OVERVIEW** */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <ComponentCard title="Total de Gastos" className="bg-white dark:bg-gray-800 h-48">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold text-brand-500">
              {costsData ? formatCurrency(costsData.totalExpenses) : formatCurrency(0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monto total registrado</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Gastos Pendientes" className="bg-white dark:bg-gray-800 h-48">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold text-yellow-500">
              {costsData ? costsData.pendingExpenses : 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Registros por procesar</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Importar Costos" className="bg-white dark:bg-gray-800 h-48">
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
        title="Filtros de Costos"
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
        title={`Costos por ${filters.periodType === 'weekly' ? 'Semanas' : 
                filters.periodType === 'monthly' ? 'Meses' : 
                filters.periodType === 'quarterly' ? 'Trimestres' : 'Años'}`}
        type="expense"
        periods={periods}
        data={expensesByDate}
        loading={loading}
        className="mb-6"
      />

      {/* **CATEGORÍAS DE COSTOS** */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Categorías de Costos</h2>
      
      {/* Categorías con datos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {costsData?.byCategoryData.map((category, index) => (
          <Link to={category.path} key={category.category_id || index}>
            <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-800 dark:text-white text-sm line-clamp-2">{category.title}</h3>
                <div className="flex items-center ml-2">
                  <svg className="w-4 h-4 text-gray-400 hover:text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              {category.category_group && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{category.category_group}</p>
              )}
              
              <p className="text-2xl font-bold text-brand-500 mb-1">{formatCurrency(category.amount)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{category.count} registros</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Categorías vacías */}
      {costsData?.emptyCategoriesData && costsData.emptyCategoriesData.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Categorías sin Movimientos ({costsData.emptyCategoriesData.length})
            </h3>
            <button
              onClick={() => setShowEmptyCategories(!showEmptyCategories)}
              className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              {showEmptyCategories ? 'Ocultar' : 'Ver todas'}
              <svg 
                className={`w-4 h-4 transition-transform ${showEmptyCategories ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Mostrar siempre las primeras 3, luego el resto si showEmptyCategories */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {costsData.emptyCategoriesData
              .slice(0, showEmptyCategories ? undefined : 3)
              .map((category, index) => (
                <Link to={category.path} key={category.category_id || index}>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all dark:bg-gray-700 dark:border-gray-600 opacity-75 hover:opacity-100">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{category.title}</h4>
                      <div className="flex items-center ml-1">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    {category.category_group && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{category.category_group}</p>
                    )}
                    
                    <p className="text-lg font-bold text-gray-400 dark:text-gray-500">{formatCurrency(0)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Sin registros</p>
                  </div>
                </Link>
              ))}
          </div>
          
          {!showEmptyCategories && costsData.emptyCategoriesData.length > 3 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowEmptyCategories(true)}
                className="text-sm text-gray-500 hover:text-brand-500 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
              >
                Ver {costsData.emptyCategoriesData.length - 3} categorías más
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* **TABLA DE COSTOS RECIENTES** */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white my-6">Costos Recientes</h2>
      <RecentFinancialTable 
        data={costsData ? transformCostItemsToFinancialRecords(costsData.recentExpenses) : []}
        loading={loading}
        type="expense"
      />
    </div>
  );
};

export default CostsIndex;