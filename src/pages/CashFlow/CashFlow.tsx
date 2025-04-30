// src/pages/CashFlow/CashFlow.tsx
import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import ChartTab from '../../components/common/ChartTab';
import CashFlowSummary from './CashFlowSummary';
import CashFlowDetails from './CashFlowDetails';
import CashFlowChart from './CashFlowChart';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import {
  DateRange,
  CashFlowData,
  getDefaultDateRange,
  fetchCashFlowData
} from './CashFlowData';

const CashFlow: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();
  
  // Tabs for cash flow view
  const tabs = [
    { id: 'overview', label: 'Vista General' },
    { id: 'details', label: 'Detalles' },
    { id: 'chart', label: 'Gráficos' },
  ];
  
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
        // Fetch cash flow data
        const data = await fetchCashFlowData(dateRange);
        setCashFlowData(data);
      } catch (error) {
        console.error('Error loading cash flow data:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dateRange, isAuthenticated, user, currentTenant]);
  
  const handleDateChange = (newRange: DateRange) => {
    setDateRange(newRange);
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
        return <CashFlowSummary summary={cashFlowData.summary} items={cashFlowData.items} />;
      case 'details':
        return <CashFlowDetails items={cashFlowData.items} dateRange={dateRange} onDateChange={handleDateChange} />;
      case 'chart':
        return <CashFlowChart data={cashFlowData.chartData} />;
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