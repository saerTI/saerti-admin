// src/pages/CashFlow/CashFlowSummary.tsx
import React, { useState, useEffect } from 'react';
// import ingresosApiService from '../../services/ingresosService'; // ELIMINADO
import { formatCurrency } from '../../utils/formatters';
import { CashFlowItem, CashFlowSummary as CashFlowSummaryData } from '../../services/cashFlowService';

interface CashFlowSummaryProps {
  summary: CashFlowSummaryData;
  items: CashFlowItem[];
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  textColor?: string;
  isLoading?: boolean;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  textColor = "text-gray-800 dark:text-white/90",
  icon,
  isLoading = false,
  trend,
  change
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l10-10M7 7h10v10" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-10 10M7 17h10V7" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getChangeIcon = () => {
    if (change === undefined) return null;
    
    if (change > 0) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l10-10M7 7h10v10" />
        </svg>
      );
    } else if (change < 0) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-10 10M7 17h10V7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      );
    }
  };

  const getChangeColor = () => {
    if (change === undefined) return 'text-gray-500';
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          {icon}
        </div>
        {trend && (
          <div className="flex items-center">
            {getTrendIcon()}
          </div>
        )}
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

// Componente para categorías top (adaptado para solo gastos)
const TopCategoriesCard: React.FC<{ items: CashFlowItem[] }> = ({ items }) => {
  // Calcular categorías más importantes (solo gastos por ahora)
  const categoryTotals = items.reduce((acc, item) => {
    const key = item.category;
    if (!acc[key]) {
      acc[key] = {
        category: item.category,
        type: item.type,
        total: 0,
        count: 0
      };
    }
    acc[key].total += item.amount;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, any>);

  const topCategories = Object.values(categoryTotals)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Top Categorías de Gastos
      </h4>
      
      <div className="space-y-3">
        {topCategories.map((cat: any, index) => (
          <div key={`${cat.category}-${index}`} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {cat.category}
                </p>
                <p className="text-xs text-gray-500">
                  {cat.count} transacciones
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-red-600">
                {formatCurrency(cat.total)}
              </p>
            </div>
          </div>
        ))}
        
        {topCategories.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No hay datos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para análisis por tipo de datos (rediseñado para incluir ingresos futuros)
const DataTypeAnalysisCard: React.FC<{ items: CashFlowItem[], summary: CashFlowSummaryData }> = ({ items, summary }) => {
  // Análisis por estados (Real vs Proyectado)
  const stateAnalysis = items.reduce((acc, item) => {
    const state = item.state || 'actual';
    if (!acc[state]) {
      acc[state] = { income: 0, expense: 0, count: 0 };
    }
    
    if (item.type === 'income') {
      acc[state].income += item.amount;
    } else {
      acc[state].expense += item.amount;
    }
    acc[state].count += 1;
    return acc;
  }, {} as Record<string, any>);

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'forecast': return 'Proyectado';
      case 'actual': return 'Real';
      case 'budget': return 'Presupuesto';
      default: return 'Otros';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'forecast': 
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'actual': 
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'budget': 
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      default: 
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getDescription = (state: string) => {
    switch (state) {
      case 'forecast': return 'Montos estimados o planificados';
      case 'actual': return 'Montos ya ejecutados';
      case 'budget': return 'Montos presupuestados';
      default: return 'Otros tipos de movimientos';
    }
  };

  const hasIncomes = summary.totalIncome > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Real vs Proyectado
      </h4>
      
      <div className="space-y-4">
        {Object.entries(stateAnalysis).map(([state, data]: [string, any]) => (
          <div key={state} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStateIcon(state)}
                <div>
                  <h5 className="font-medium text-gray-800">
                    {getStateLabel(state)}
                  </h5>
                  <p className="text-xs text-gray-500">
                    {getDescription(state)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {data.count} transacciones
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Ingresos</p>
                <p className="font-semibold text-green-600">
                  {hasIncomes ? formatCurrency(data.income) : formatCurrency(0)}
                </p>
                {!hasIncomes && (
                  <p className="text-xs text-gray-400">Próximamente</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Gastos</p>
                <p className="font-semibold text-red-600">
                  {formatCurrency(data.expense)}
                </p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Balance Neto</p>
                <p className={`font-bold ${
                  data.income - data.expense >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(data.income - data.expense)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {Object.keys(stateAnalysis).length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No hay datos disponibles</p>
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