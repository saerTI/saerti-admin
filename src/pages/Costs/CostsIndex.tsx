// src/pages/Gastos/CostsIndex.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { costsApiService, CostsFilters, CostsData, CostItem, CostsByCategory } from '../../services/costsService';
import { getCostCenters, CostCenter } from '../../services/costCenterService';
import { FinancialRecordItem } from '../../components/tables/RecentFinantialTable';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import FilterPanel, { FilterConfig, FilterOption } from '../../components/common/FilterPanel';
import ChartTab from '../../components/common/ChartTab';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';
import Button from '../../components/ui/button/Button';
import { formatCurrency } from '../../utils/formatters';
import FinancialTable, {
  FinancialPeriod,
  generateWeekPeriods,
  generateMonthPeriods,
  generateQuarterPeriods
} from '../../components/tables/FinancialTable';
import { FinancialAggregationService } from '../../services/financialAggregationService';
import { getRemuneracionesByPeriod } from '../../services/CC/remuneracionesService';
import { factoringService } from '../../services/factoringService';
import { previsionalesService } from '../../services/CC/previsionalesService';
import { getFixedCosts } from '../../services/CC/fixedCostsService';
import { listItems } from '../../services/CC/ordenesCompraItemService';
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
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [aggregatedFinancialData, setAggregatedFinancialData] = useState<{
    remuneraciones: number;
    factoring: number;
    previsionales: number;
    costosFijos: number;
  } | null>(null);
  const [detailedFinancialRecords, setDetailedFinancialRecords] = useState<FinancialRecordItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showEmptyCategories, setShowEmptyCategories] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Estados de filtros - simplificados a solo año y centro de costo
  const [filters, setFilters] = useState<CostsFilters>({
    periodType: 'monthly',
    year: new Date().getFullYear().toString(),
    costCenterId: 'all'
  });

  // Estados para opciones dinámicas de filtros - solo centros de costo
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loadingCostCenters, setLoadingCostCenters] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();

  // Tabs para la vista de egresos
  const tabs = [
    { id: 'overview', label: 'Vista General' },
    { id: 'financial', label: 'Tabla Financiera' },
    { id: 'details', label: 'Detalle' }
  ];

  // **CONFIGURACIÓN DE FILTROS - AÑO, PERIODO Y CENTRO DE COSTO**
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
      key: 'periodType',
      label: 'Periodo',
      type: 'select',
      options: [
        { value: 'weekly', label: 'Semanal' },
        { value: 'monthly', label: 'Mensual' },
        { value: 'quarterly', label: 'Trimestral' },
        { value: 'annual', label: 'Anual' }
      ],
      width: 'sm'
    },
    {
      key: 'costCenterId',
      label: 'Centro de Costo',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos los Centros de Costo' },
        ...costCenters.map(cc => ({
          value: cc.id.toString(),
          label: cc.name
        }))
      ],
      loading: loadingCostCenters,
      width: 'md'
    }
  ];

  // **CARGAR CENTROS DE COSTO AL INICIALIZAR**
  useEffect(() => {
    const loadCostCenters = async () => {
      try {
        setLoadingCostCenters(true);
        console.log('🔄 Loading cost centers...');
        const costCentersData = await getCostCenters();
        setCostCenters(costCentersData);
        console.log('✅ Cost centers loaded:', costCentersData);
      } catch (error) {
        console.error('❌ Error loading cost centers:', error);
        setCostCenters([]); // Set empty array on error
      } finally {
        setLoadingCostCenters(false);
      }
    };

    if (isAuthenticated && user) {
      loadCostCenters();
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

        // **3. CARGAR DATOS FINANCIEROS AGREGADOS PARA TARJETAS**
        try {
          const financialData = await FinancialAggregationService.getAllFinancialData({
            periods: periodData,
            year: selectedYear,
            costCenterId: filters.costCenterId !== 'all' && filters.costCenterId ? parseInt(filters.costCenterId) : undefined
          });

          // Calcular totales anuales
          const totals = {
            remuneraciones: FinancialAggregationService.getTotalForCategory(financialData.remuneraciones),
            factoring: FinancialAggregationService.getTotalForCategory(financialData.factoring),
            previsionales: FinancialAggregationService.getTotalForCategory(financialData.previsionales),
            costosFijos: FinancialAggregationService.getTotalForCategory(financialData.costosFijos)
          };

          setAggregatedFinancialData(totals);
          console.log('✅ Aggregated financial data loaded:', totals);
        } catch (error) {
          console.error('❌ Error loading aggregated financial data:', error);
          setAggregatedFinancialData({ remuneraciones: 0, factoring: 0, previsionales: 0, costosFijos: 0 });
        }

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

  // **CARGAR DETALLES FINANCIEROS**
  useEffect(() => {
    const loadDetailedFinancialRecords = async () => {
      if (!isAuthenticated || !user || activeTab !== 'details') {
        return; // Solo cargar cuando estemos en el tab de detalles
      }

      try {
        setLoadingDetails(true);
        const selectedYear = parseInt(filters.year);
        const costCenterFilter = filters.costCenterId !== 'all' && filters.costCenterId ? parseInt(filters.costCenterId) : undefined;

        const allRecords: FinancialRecordItem[] = [];

        // 1. CARGAR REMUNERACIONES
        try {
          for (let month = 1; month <= 12; month++) {
            const remuneraciones = await getRemuneracionesByPeriod(month, selectedYear);
            remuneraciones
              .filter(rem => !costCenterFilter || rem.projectId === costCenterFilter)
              .forEach(rem => {
                const employeeName = rem.employeeName || 'Sin nombre';
                allRecords.push({
                  id: `rem-${rem.id}`,
                  name: employeeName.charAt(0).toUpperCase() + employeeName.slice(1),
                  category: 'Remuneraciones',
                  date: rem.date || `${selectedYear}-${month.toString().padStart(2, '0')}-01`,
                  amount: rem.sueldoLiquido || rem.amount || 0
                });
              });
          }
        } catch (error) {
          console.error('Error loading remuneraciones:', error);
        }

        // 2. CARGAR FACTORING
        try {
          const factorings = await factoringService.getFactorings();
          factorings
            .filter(f => {
              const factoringYear = new Date(f.date_factoring).getFullYear();
              return factoringYear === selectedYear && (!costCenterFilter || f.cost_center_id === costCenterFilter);
            })
            .forEach(f => {
              const mount = typeof f.mount === 'string' ? parseFloat(f.mount) : Number(f.mount);
              const interestRate = typeof f.interest_rate === 'string' ? parseFloat(f.interest_rate) : Number(f.interest_rate);
              const factoringCost = mount * (interestRate / 100);

              allRecords.push({
                id: `fact-${f.id}`,
                name: `Estado de pago: ${f.payment_status || 'Sin estado'}`,
                category: 'Factoring',
                date: f.date_factoring,
                amount: factoringCost
              });
            });
        } catch (error) {
          console.error('Error loading factoring:', error);
        }

        // 3. CARGAR PREVISIONALES
        try {
          const response = await previsionalesService.getPrevisionales({ limit: 10000 });
          response.data
            .filter(p => {
              const previsionalYear = new Date(p.date).getFullYear();
              return previsionalYear === selectedYear;
            })
            .forEach(p => {
              const typeName = p.type.toUpperCase().replace('_', ' ');
              const employeeName = p.employee_name || 'Sin nombre';
              const capitalizedEmployeeName = employeeName.charAt(0).toUpperCase() + employeeName.slice(1);
              allRecords.push({
                id: `prev-${p.id}`,
                name: `${typeName} - ${capitalizedEmployeeName}`,
                category: 'Previsionales',
                date: p.date,
                amount: typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount)
              });
            });
        } catch (error) {
          console.error('Error loading previsionales:', error);
        }

        // 4. CARGAR COSTOS FIJOS
        try {
          const response = await getFixedCosts({}, 1, 10000);
          response.data
            .filter(cf => !costCenterFilter || cf.cost_center_id === costCenterFilter)
            .forEach(cf => {
              const startDate = new Date(cf.start_date);
              const quotaCount = Number(cf.quota_count);
              const quotaValue = typeof cf.quota_value === 'string' ? parseFloat(cf.quota_value) : Number(cf.quota_value);

              // Generar un registro por cada cuota
              for (let i = 0; i < quotaCount; i++) {
                const paymentDate = new Date(startDate);
                paymentDate.setMonth(startDate.getMonth() + i);

                if (paymentDate.getFullYear() === selectedYear) {
                  const costName = cf.name || 'Sin nombre';
                  allRecords.push({
                    id: `cf-${cf.id}-${i}`,
                    name: costName.charAt(0).toUpperCase() + costName.slice(1),
                    category: 'Costos Fijos',
                    date: paymentDate.toISOString().split('T')[0],
                    amount: quotaValue
                  });
                }
              }
            });
        } catch (error) {
          console.error('Error loading costos fijos:', error);
        }

        // 5. CARGAR ITEMS DE ÓRDENES DE COMPRA
        try {
          // Necesitamos cargar todas las órdenes de compra del año filtrado
          // Como no tenemos un método directo para obtener todos los items por año,
          // usaremos el servicio de categorías de cuenta para obtener los items
          const categories = await import('../../services/accountCategoriesService').then(m => m.accountCategoriesService.getActiveCategories());

          for (const category of categories) {
            try {
              const items = await import('../../services/CC/ordenesCompraItemService').then(m =>
                m.getItemsByAccountCategory(category.id, {
                  date_from: `${selectedYear}-01-01`,
                  date_to: `${selectedYear}-12-31`
                })
              );

              items
                .filter(item => !costCenterFilter || item.cost_center_id === costCenterFilter)
                .forEach(item => {
                  const description = item.description || item.glosa || 'Sin descripción';
                  allRecords.push({
                    id: `oci-${item.id}`,
                    name: description.charAt(0).toUpperCase() + description.slice(1),
                    category: 'Orden de Compra',
                    date: item.date,
                    amount: typeof item.total === 'string' ? parseFloat(item.total) : Number(item.total)
                  });
                });
            } catch (error) {
              console.error(`Error loading items for category ${category.name}:`, error);
            }
          }
        } catch (error) {
          console.error('Error loading purchase order items:', error);
        }

        // Ordenar por fecha descendente
        allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setDetailedFinancialRecords(allRecords);
        console.log(`✅ Loaded ${allRecords.length} detailed financial records`);
      } catch (error) {
        console.error('❌ Error loading detailed financial records:', error);
        setDetailedFinancialRecords([]);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetailedFinancialRecords();
  }, [filters, isAuthenticated, user, activeTab]);

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

  const handleSearch = () => {
    console.log('🔍 Search button clicked - filters will be applied automatically');
    // The useEffect will automatically trigger when filters change
  };

  const handleClearFilters = () => {
    console.log('🔄 Clearing filters');
    setFilters({
      periodType: 'monthly',
      year: new Date().getFullYear().toString(),
      costCenterId: 'all'
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


  // **TÍTULO DINÁMICO**
  const getTitle = () => {
    if (currentTenant) {
      return `Gestión de Costos `;
    }
    return 'Gestión de Costos';
  };

  // **RENDERIZAR CONTENIDO DEL TAB ACTIVO**
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex h-60 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-center text-red-500 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400">
          <p>{error}</p>
          <button
            className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-white"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'financial':
        return renderFinancialTab();
      case 'details':
        return renderDetailsTab();
      default:
        return renderOverviewTab();
    }
  };

  // **TAB: VISTA GENERAL - Cards y categorías**
  const renderOverviewTab = () => (
    <>
      {/* **SUMMARY OVERVIEW** */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mb-6">
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
      </div>

      {/* **CATEGORÍAS PREDEFINIDAS (Remuneraciones, Factoring, Previsionales, Costos Fijos)** */}
      {aggregatedFinancialData && (
        <>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Categorías Principales</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Remuneraciones */}
            {aggregatedFinancialData.remuneraciones > 0 && (
              <Link to="/costos/remuneraciones">
                <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800 dark:text-white text-sm">Remuneraciones</h3>
                    <div className="flex items-center ml-2">
                      <svg className="w-4 h-4 text-gray-400 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-500 mb-1">{formatCurrency(aggregatedFinancialData.remuneraciones)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total anual</p>
                </div>
              </Link>
            )}

            {/* Factoring */}
            {aggregatedFinancialData.factoring > 0 && (
              <Link to="/costos/factoring">
                <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800 dark:text-white text-sm">Factoring</h3>
                    <div className="flex items-center ml-2">
                      <svg className="w-4 h-4 text-gray-400 hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-500 mb-1">{formatCurrency(aggregatedFinancialData.factoring)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total anual</p>
                </div>
              </Link>
            )}

            {/* Previsionales */}
            {aggregatedFinancialData.previsionales > 0 && (
              <Link to="/costos/previsionales">
                <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800 dark:text-white text-sm">Previsionales</h3>
                    <div className="flex items-center ml-2">
                      <svg className="w-4 h-4 text-gray-400 hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-500 mb-1">{formatCurrency(aggregatedFinancialData.previsionales)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total anual</p>
                </div>
              </Link>
            )}

            {/* Costos Fijos */}
            {aggregatedFinancialData.costosFijos > 0 && (
              <Link to="/costos/costos-fijos">
                <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800 dark:text-white text-sm">Costos Fijos</h3>
                    <div className="flex items-center ml-2">
                      <svg className="w-4 h-4 text-gray-400 hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-orange-500 mb-1">{formatCurrency(aggregatedFinancialData.costosFijos)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total anual</p>
                </div>
              </Link>
            )}
          </div>
        </>
      )}

      {/* **CATEGORÍAS DE ÓRDENES DE COMPRA** */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Categorías de Órdenes de Compra</h2>

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
    </>
  );

  // **TAB: TABLA FINANCIERA**
  // Para expenses, data debe estar vacío ya que las filas vienen dinámicamente de:
  // 1. Remuneraciones, Factoring, Previsionales, Costos Fijos (predefinidas)
  // 2. Categorías de cuenta desde órdenes de compra (dinámicas)
  const renderFinancialTab = () => {
    // Título dinámico según el tipo de periodo
    const getPeriodTitle = () => {
      switch (filters.periodType) {
        case 'weekly':
          return 'Costos por semana';
        case 'monthly':
          return 'Costos por mes';
        case 'quarterly':
          return 'Costos por trimestre';
        case 'annual':
          return 'Costos anuales';
        default:
          return 'Costos por mes';
      }
    };

    return (
      <FinancialTable
        title={getPeriodTitle()}
        type="expense"
        periods={periods}
        data={[]} // Vacío para expenses - las filas se generan dinámicamente
        loading={loading}
        className="mb-6"
        year={parseInt(filters.year)}
        costCenterId={filters.costCenterId !== 'all' ? parseInt(filters.costCenterId || '') : undefined}
        periodType={filters.periodType}
      />
    );
  };

  // **TAB: DETALLE - Tabla con costos recientes**
  const renderDetailsTab = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Detalle de Costos</h2>
      <RecentFinancialTable
        data={detailedFinancialRecords}
        loading={loadingDetails}
        type="expense"
        showState={false}
      />
    </div>
  );

  return (
    <div className="w-full px-4 py-6">
      <PageBreadcrumb pageTitle={getTitle()} titleSize="2xl" />

      {/* **FILTROS USANDO FilterPanel CON BOTÓN DE BÚSQUEDA** */}
      <ComponentCard title="Filtros de Costos" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {filterConfigs.map(config => {
            const currentValue = filters[config.key as keyof CostsFilters] || '';
            const isDisabled = config.disabled || loading || loadingCostCenters;

            if (config.type === 'select') {
              let options: FilterOption[] = [];
              if (typeof config.options === 'function') {
                options = config.options();
              } else if (config.options) {
                options = config.options;
              }

              return (
                <div key={config.key} className="md:col-span-1">
                  <Label htmlFor={config.key}>
                    {config.label}
                    {config.loading && (
                      <span className="ml-2 inline-flex items-center">
                        <svg className="animate-spin h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    )}
                  </Label>
                  <Select
                    options={options}
                    defaultValue={currentValue}
                    onChange={(value) => handleFilterChange(config.key, value)}
                    placeholder={config.placeholder || `Seleccione ${config.label.toLowerCase()}`}
                    disabled={isDisabled}
                  />
                </div>
              );
            }
            return null;
          })}

          {/* Botón de limpiar filtros en la misma fila */}
          <div className="md:col-span-2 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              disabled={loading}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar filtros
            </Button>

            {(filters.year !== new Date().getFullYear().toString() || filters.costCenterId !== 'all') && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 ml-2">
                Filtros aplicados
              </div>
            )}
          </div>
        </div>
      </ComponentCard>

      {/* **TABS NAVIGATION** */}
      <ChartTab tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* **TAB CONTENT** */}
      <div className="mt-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CostsIndex;