// src/pages/CashFlow/CashFlow.tsx - Usando backend real (solo costos)
import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import ChartTab from '../../components/common/ChartTab';
import CashFlowSummary from './CashFlowSummary';
import CashFlowDetails from './CashFlowDetails';
import CashFlowChart from './CashFlowChart';
import CashFlowFinancialTable from '../../components/tables/CashFlowFinancialTable';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { 
  cashFlowApiService, 
  CashFlowFilters, 
  CashFlowData
} from '../../services/cashFlowService';

// Tipos para compatibilidad con componentes existentes
export interface DateRange {
  startDate: string;
  endDate: string;
}

const CashFlow: React.FC = () => {
  // Estados principales
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Financial table controls
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'quarterly' | 'annual'>('monthly');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Estados de filtros (usando la misma estructura que CostsIndex)
  const [filters, setFilters] = useState<CashFlowFilters>({
    periodType: 'monthly',
    year: new Date().getFullYear().toString(),
    projectId: 'all',
    costCenterId: 'all',
    categoryId: 'all',
    status: 'all'
  });

  // Date range para compatibilidad con componentes existentes
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });
  
  const { user, isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();
  
  // Tabs for cash flow view
  const tabs = [
    { id: 'overview', label: 'Vista General' },
    { id: 'details', label: 'Detalles' },
    { id: 'chart', label: 'Gráficos' },
    { id: 'historical', label: 'Tabla Financiera' },
  ];
  
  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      if (!isAuthenticated || !user) {
        setError('Necesita iniciar sesión para ver esta página');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('🔄 Loading cash flow data with filters:', filters);
        
        // Obtener datos del backend usando el mismo servicio que costos
        const data = await cashFlowApiService.getCashFlowData(filters);
        setCashFlowData(data);
        
        console.log('✅ Cash flow data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading cash flow data:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [filters, isAuthenticated, user, currentTenant]);
  
  // Manejador para cambio de rango de fechas (para compatibilidad)
  const handleDateChange = (newRange: DateRange) => {
    setDateRange(newRange);
    
    // Opcional: Convertir el rango de fechas a filtros de año/mes si es necesario
    const startYear = new Date(newRange.startDate).getFullYear();
    if (startYear.toString() !== filters.year) {
      setFilters(prev => ({
        ...prev,
        year: startYear.toString()
      }));
    }
  };

  const handlePeriodTypeChange = (newPeriodType: 'weekly' | 'monthly' | 'quarterly' | 'annual') => {
    setPeriodType(newPeriodType);
    // También actualizamos los filtros para mantener consistencia
    setFilters(prev => ({
      ...prev,
      periodType: newPeriodType
    }));
  };

  // Función adaptadora para el componente CashFlowFinancialTable que usa 'yearly' en lugar de 'annual'
  const handlePeriodTypeChangeForTable = (newPeriodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => {
    const mappedPeriodType = newPeriodType === 'yearly' ? 'annual' : newPeriodType;
    handlePeriodTypeChange(mappedPeriodType);
  };

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    // También actualizamos los filtros para mantener consistencia
    setFilters(prev => ({
      ...prev,
      year: newYear.toString()
    }));
  };
  
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-60 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-center text-red-500 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400">
          <p>{error}</p>
          <button 
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      );
    }
    
    if (!cashFlowData) {
      return (
        <div className="rounded-sm border border-gray-200 bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-400">
          <p>No hay datos disponibles para el período seleccionado.</p>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'overview':
        return (
          <CashFlowSummary 
            summary={cashFlowData.summary} 
            items={cashFlowData.recentItems || []} 
          />
        );
      case 'details':
        return (
          <CashFlowDetails 
            items={cashFlowData.recentItems || []} 
            dateRange={dateRange} 
            onDateChange={handleDateChange} 
          />
        );
      case 'chart':
        return <CashFlowChart data={cashFlowData.chartData} />;
      case 'historical':
        return (
          <CashFlowFinancialTable
            title="Análisis Financiero de Flujo de Caja"
            periodType={periodType === 'annual' ? 'yearly' : periodType}
            year={year}
            onPeriodTypeChange={handlePeriodTypeChangeForTable}
            onYearChange={handleYearChange}
            loading={false}
            showExpenses={true}
          />
        );
      default:
        return null;
    }
  };

  // Tenant-aware title
  const getTitle = () => {
    if (currentTenant) {
      return `Flujo de Caja - ${currentTenant.name}`;
    }
    return 'Flujo de Caja';
  };

  return (
    <>
      <PageMeta title={getTitle()} description="Gestión y análisis del flujo de caja" />
      
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {getTitle()}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administre y visualice el flujo de caja de su empresa
          </p>
          {/* Nota temporal sobre ingresos */}
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Actualmente mostrando solo egresos (costos y gastos). Los ingresos se añadirán próximamente.
              </span>
            </div>
          </div>
        </div>
        
        <ChartTab tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="mt-4">
          {renderTabContent()}
        </div>
      </div>
    </>
  );
};

export default CashFlow;