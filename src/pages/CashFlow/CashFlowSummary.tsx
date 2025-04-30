// src/pages/CashFlow/CashFlowSummary.tsx
import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardProps {
  title: string;
  value: string;
  change?: number;
  textColor?: string;
  icon?: React.ReactNode;
}

interface CashFlowSummaryProps {
  summary: {
    totalIncome: number;
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
  icon 
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
        <h3 className={`text-2xl font-bold ${textColor}`}>{value}</h3>
        
        {change !== undefined && (
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

  // Get recent transactions (last 5)
  const recentTransactions = [...items]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Summary Cards */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Ingresos Totales"
            value={formatCurrency(summary.totalIncome)}
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
            value={formatCurrency(summary.netCashFlow)}
            change={summary.previousPeriodChange}
            textColor={summary.netCashFlow >= 0 ? "text-green-500" : "text-red-500"}
            icon={
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          
          <SummaryCard
            title="Rentabilidad"
            value={`${Math.round((summary.netCashFlow / summary.totalIncome) * 100)}%`}
            icon={
              <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            }
          />
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
        <div className="rounded-xl border border-gray-200 bg-white px-5 pb-5 pt-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Transacciones Recientes
          </h4>
          
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
                Tipo
              </div>
              <div className="p-2.5 text-sm font-medium text-gray-800 dark:text-white/90 xl:p-5">
                Monto
              </div>
            </div>
            
            {recentTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="grid grid-cols-3 border-b border-gray-200 dark:border-gray-700 sm:grid-cols-5"
              >
                <div className="flex items-center p-2.5 xl:p-5">
                  <p className="text-gray-800 dark:text-white/90">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center p-2.5 xl:p-5">
                  <p className="text-gray-800 dark:text-white/90">{transaction.description}</p>
                </div>
                
                <div className="hidden items-center p-2.5 sm:flex xl:p-5">
                  <p className="text-gray-800 dark:text-white/90">{transaction.category}</p>
                </div>
                
                <div className="hidden items-center p-2.5 sm:flex xl:p-5">
                  <p className={transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                    {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </p>
                </div>
                
                <div className="flex items-center p-2.5 xl:p-5">
                  <p className={transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowSummary;