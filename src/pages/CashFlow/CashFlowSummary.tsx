// src/pages/CashFlow/CashFlowSummary.tsx - Versión corregida sin conflictos de tipos
import React from 'react';
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
  change?: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  icon, 
  textColor = "text-gray-800 dark:text-white/90",
  change,
  subtitle,
  trend
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
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h4>
        <h3 className={`mt-1 text-2xl font-bold ${textColor}`}>
          {value}
        </h3>
        
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
        
        {change !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <span className={`text-xs font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">
              vs período anterior
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

  // Get recent transactions (reducido para vista general)
  const recentTransactions = [...items]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6); // ← Reducido para vista general

  // Calcular tendencias (por ahora solo para gastos)
  const calculateTrend = (current: number, previous?: number): 'up' | 'down' | 'stable' => {
    if (!previous) return 'stable';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards con Ingresos incluidos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          title="Ingresos Totales"
          value={formatCurrency(summary.totalIncome)} // Por ahora será $0
          subtitle={summary.forecastIncome && summary.forecastIncome > 0 ? `Proyectado: ${formatCurrency(summary.forecastIncome)}` : "Próximamente disponible"}
          trend={summary.totalIncome > 0 ? 'up' : 'stable'}
          textColor="text-green-500"
          icon={
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        />
        
        <SummaryCard
          title="Gastos Totales"
          value={formatCurrency(summary.totalExpense)}
          subtitle={summary.forecastExpense ? `Proyectado: ${formatCurrency(summary.forecastExpense)}` : undefined}
          trend={calculateTrend(summary.totalExpense, summary.forecastExpense)}
          textColor="text-red-500"
          icon={
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          }
        />
        
        <SummaryCard
          title="Flujo Neto"
          value={formatCurrency(summary.netCashFlow)}
          change={summary.previousPeriodChange}
          textColor={summary.netCashFlow >= 0 ? "text-green-500" : "text-red-500"}
          trend={summary.netCashFlow >= 0 ? 'up' : 'down'}
          subtitle={summary.totalIncome === 0 ? "Solo gastos por ahora" : "Balance del período"}
          icon={
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        
        <SummaryCard
          title="Gastos Pendientes"
          value={summary.pendingItems.toString()}
          subtitle="Items por procesar"
          icon={
            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <SummaryCard
          title="Total Transacciones"
          value={summary.totalItems.toString()}
          subtitle="Registros en el período"
          icon={
            <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      </div>

      {/* Segunda fila de información detallada */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top Categorías */}
        <TopCategoriesCard items={items} />
        
        {/* Análisis Real vs Proyectado */}
        <DataTypeAnalysisCard items={items} summary={summary} />
        
        {/* Quick Stats adaptado para solo gastos */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Estadísticas Rápidas
          </h4>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total de Transacciones</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {items.length}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Promedio de Gastos</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(
                  items.length > 0
                    ? items.reduce((sum, i) => sum + i.amount, 0) / items.length
                    : 0
                )}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gasto Máximo</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(
                  items.length > 0
                    ? Math.max(...items.map(i => i.amount))
                    : 0
                )}
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Categorías Únicas</span>
                <span className="font-semibold text-blue-600">
                  {new Set(items.map(i => i.category)).size}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fuentes de Datos</span>
              <span className="font-semibold text-purple-600">
                {new Set(items.map(i => i.source_type)).size}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transacciones Recientes - Diseño más limpio */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Transacciones Recientes
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Últimas {recentTransactions.length} de {items.length}
              </span>
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Aquí podrías hacer scroll a la tab de detalles o cambiar la tab activa
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas →
              </a>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentTransactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {transaction.description}
                    </p>
                    {transaction.state && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        transaction.state === 'actual'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : transaction.state === 'forecast'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {transaction.state === 'actual' ? 'Real' : 
                         transaction.state === 'forecast' ? 'Proyectado' : 'Presupuesto'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {transaction.category}
                    </span>
                    {transaction.cost_center_name && (
                      <span className="truncate">{transaction.cost_center_name}</span>
                    )}
                    {transaction.source_type && (
                      <span className="text-xs opacity-75">• {transaction.source_type}</span>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-red-600">
                    -{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {recentTransactions.length === 0 && (
            <div className="px-6 py-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                No hay transacciones
              </h3>
              <p className="text-sm text-gray-500">
                No se encontraron movimientos para el período seleccionado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlowSummary;