// src/pages/CashFlow/CashFlowSummary.tsx
import React, { useState, useEffect } from 'react';
import ingresosApiService from '../../services/ingresosService';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardProps {
  title: string;
  value: string;
  change?: number;
  textColor?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

interface CashFlowSummaryProps {
  summary: {
    totalExpense: number;
    netCashFlow: number;
    previousPeriodChange: number;
  };
  items: Array<{
    id: number;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
  }>;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  change, 
  textColor = "text-gray-800 dark:text-white/90",
  icon,
  isLoading = false
}) => {
  const getChangeColor = () => {
    if (!change) return "text-gray-500";
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  const getChangeIcon = () => {
    if (!change) return null;
    return change >= 0 ? (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ) : (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h4>
        {icon && <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">{icon}</div>}
      </div>
      
      <div className="mt-4">
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        ) : (
          <h3 className={`text-2xl font-bold ${textColor}`}>{value}</h3>
        )}
        
        {!isLoading && change !== undefined && (
          <div className={`mt-1 flex items-center gap-1 ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="text-sm font-medium">
              {Math.abs(change).toFixed(1)}% vs. período anterior
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const CashFlowSummary: React.FC<CashFlowSummaryProps> = ({ summary, items }) => {
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [isLoadingIncome, setIsLoadingIncome] = useState<boolean>(true);
  const [recentIngresos, setRecentIngresos] = useState<any[]>([]);
  const [isLoadingIngresos, setIsLoadingIngresos] = useState<boolean>(true);

  // Función para obtener el total de ingresos del servicio
  const fetchTotalIncome = async () => {
    try {
      setIsLoadingIncome(true);
      console.log('🔍 CashFlowSummary - Fetching income stats...');
      
      const response = await ingresosApiService.getIngresoStats();
      
      console.log('📊 CashFlowSummary - Response received:', response);
      console.log('📊 CashFlowSummary - Response.data:', response.data);
      console.log('📊 CashFlowSummary - Response.data.montoTotal:', response.data?.montoTotal);
      
      const totalValue = response.data?.montoTotal || 0;
      console.log('📊 CashFlowSummary - Final total value:', totalValue);
      
      setTotalIncome(totalValue);
    } catch (error) {
      console.error('❌ Error fetching total income:', error);
      setTotalIncome(0);
    } finally {
      setIsLoadingIncome(false);
    }
  };

  // Función para obtener los últimos 5 ingresos
  const fetchRecentIngresos = async () => {
    try {
      setIsLoadingIngresos(true);
      console.log('🔍 CashFlowSummary - Fetching recent ingresos...');
      
      const response = await ingresosApiService.getIngresos({
        limit: 5,
        sortBy: 'date',
        sortDirection: 'desc'
      });
      
      console.log('📊 CashFlowSummary - Recent ingresos response:', response);
      console.log('📊 CashFlowSummary - Response.data structure:', response.data);
      console.log('📊 CashFlowSummary - First item structure:', response.data?.[0]);
      
      // Log all fields of the first item to see the exact structure
      if (response.data && response.data.length > 0) {
        const firstItem = response.data[0];
        console.log('📊 Fields in first item:', Object.keys(firstItem));
        console.log('📊 First item full object:', firstItem);
      }
      
      setRecentIngresos(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching recent ingresos:', error);
      setRecentIngresos([]);
    } finally {
      setIsLoadingIngresos(false);
    }
  };

  useEffect(() => {
    fetchTotalIncome();
    fetchRecentIngresos();
  }, []);

  // Calcular flujo neto y rentabilidad con el nuevo total de ingresos
  const netCashFlow = totalIncome - summary.totalExpense;
  const profitability = totalIncome > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Summary Cards */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Ingresos Totales"
            value={formatCurrency(totalIncome)}
            isLoading={isLoadingIncome}
            icon={
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          />
          
          <SummaryCard
            title="Gastos Totales"
            value={formatCurrency(summary.totalExpense)}
            icon={
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            }
          />
          
          <SummaryCard
            title="Flujo Neto"
            value={formatCurrency(netCashFlow)}
            change={summary.previousPeriodChange}
            textColor={netCashFlow >= 0 ? "text-green-500" : "text-red-500"}
            icon={
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          
          <SummaryCard
            title="Rentabilidad"
            value={`${profitability}%`}
            icon={
              <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            }
          />
        </div>
      </div>
      
      {/* Recent Ingresos */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
        <div className="rounded-xl border border-gray-200 bg-white px-5 pb-5 pt-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Últimos Ingresos
            </h4>
            {isLoadingIngresos && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            )}
          </div>
          
          <div className="flex flex-col">
            <div className="grid grid-cols-3 rounded-sm bg-gray-100 dark:bg-gray-800 sm:grid-cols-5">
              <div className="p-2.5 text-sm font-medium text-gray-800 dark:text-white/90 xl:p-5">
                Fecha
              </div>
              <div className="p-2.5 text-sm font-medium text-gray-800 dark:text-white/90 xl:p-5">
                Descripción
              </div>
              <div className="hidden p-2.5 text-sm font-medium text-gray-800 dark:text-white/90 sm:block xl:p-5">
                Categoría
              </div>
              <div className="hidden p-2.5 text-sm font-medium text-gray-800 dark:text-white/90 sm:block xl:p-5">
                Estado
              </div>
              <div className="p-2.5 text-sm font-medium text-gray-800 dark:text-white/90 xl:p-5">
                Monto
              </div>
            </div>
            
            {isLoadingIngresos ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div 
                  key={index}
                  className="grid grid-cols-3 border-b border-gray-200 dark:border-gray-700 sm:grid-cols-5"
                >
                  <div className="flex items-center p-2.5 xl:p-5">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="flex items-center p-2.5 xl:p-5">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="hidden items-center p-2.5 sm:flex xl:p-5">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="hidden items-center p-2.5 sm:flex xl:p-5">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="flex items-center p-2.5 xl:p-5">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              ))
            ) : recentIngresos.length > 0 ? (
              recentIngresos.map((ingreso) => (
                <div 
                  key={ingreso.id}
                  className="grid grid-cols-3 border-b border-gray-200 dark:border-gray-700 sm:grid-cols-5"
                >
                  <div className="flex items-center p-2.5 xl:p-5">
                    <p className="text-gray-800 dark:text-white/90">
                      {new Date(ingreso.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center p-2.5 xl:p-5">
                    <p className="text-gray-800 dark:text-white/90">{ingreso.ep_detail}</p>
                  </div>
                  
                  <div className="hidden items-center p-2.5 sm:flex xl:p-5">
                    <p className="text-gray-800 dark:text-white/90">{ingreso.category_name || 'Sin categoría'}</p>
                  </div>
                  
                  <div className="hidden items-center p-2.5 sm:flex xl:p-5">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      ingreso.payment_status === 'pagado' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : ingreso.payment_status === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {ingreso.payment_status}
                    </span>
                  </div>
                  
                  <div className="flex items-center p-2.5 xl:p-5">
                    <p className="text-green-500 font-medium">
                      + {formatCurrency(ingreso.total_amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-gray-500 dark:text-gray-400">No hay ingresos recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowSummary;