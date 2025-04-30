// src/pages/CashFlow/CashFlowDetails.tsx
import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface CashFlowItem {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

interface CashFlowDetailsProps {
  items: CashFlowItem[];
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
}

const CashFlowDetails: React.FC<CashFlowDetailsProps> = ({ 
  items, 
  dateRange, 
  onDateChange 
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  

  // Filter items based on current filters
  const filteredItems = items.filter(item => {
    // Filter by type
    if (filter !== 'all' && item.type !== filter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortField === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    if (sortField === 'amount') {
      return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    
    // Sort by description or category
    const valueA = a[sortField as keyof CashFlowItem]?.toString().toLowerCase() || '';
    const valueB = b[sortField as keyof CashFlowItem]?.toString().toLowerCase() || '';
    return sortDirection === 'asc' 
      ? valueA.localeCompare(valueB) 
      : valueB.localeCompare(valueA);
  });

  // Handle sort
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Calculate totals
  const totalIncome = filteredItems.reduce((sum, item) => 
    item.type === 'income' ? sum + item.amount : sum, 0);
  
  const totalExpense = filteredItems.reduce((sum, item) => 
    item.type === 'expense' ? sum + item.amount : sum, 0);
  
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 pb-5 pt-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Detalle de Transacciones
        </h4>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => onDateChange({ ...dateRange, startDate: e.target.value })}
              className="rounded-l-md border border-gray-200 bg-transparent px-4 py-2 focus:border-primary focus:outline-none dark:border-gray-700 dark:text-white/90"
            />
            <span className="bg-gray-100 px-2 py-2 dark:bg-gray-800 dark:text-white/90">a</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => onDateChange({ ...dateRange, endDate: e.target.value })}
              className="rounded-r-md border border-gray-200 bg-transparent px-4 py-2 focus:border-primary focus:outline-none dark:border-gray-700 dark:text-white/90"
            />
          </div>
          
          {/* Filter by Type */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-gray-200 bg-transparent px-4 py-2 focus:border-primary focus:outline-none dark:border-gray-700 dark:text-white/90"
          >
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-md border border-gray-200 bg-transparent px-4 py-2 pl-10 focus:border-primary focus:outline-none dark:border-gray-700 dark:text-white/90"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-4 w-4 fill-current text-gray-500 dark:text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
      
      {/* Transaction Table */}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100 text-left dark:bg-gray-800">
              <th 
                className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Fecha
                  {sortField === 'date' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 cursor-pointer"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center gap-1">
                  Descripción
                  {sortField === 'description' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 cursor-pointer"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Categoría
                  {sortField === 'category' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90">
                Tipo
              </th>
              <th 
                className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 cursor-pointer"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-1">
                  Monto
                  {sortField === 'amount' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.id}>
                <td className="border-b border-gray-200 px-4 py-3 dark:text-white/90 dark:border-gray-700">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="border-b border-gray-200 px-4 py-3 dark:text-white/90 dark:border-gray-700">
                  {item.description}
                </td>
                <td className="border-b border-gray-200 px-4 py-3 dark:text-white/90 dark:border-gray-700">
                  {item.category}
                </td>
                <td className="border-b border-gray-200 px-4 py-3 dark:text-white/90 dark:border-gray-700">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      item.type === 'income'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </span>
                </td>
                <td className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <span
                    className={
                      item.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }
                  >
                    {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                  </span>
                </td>
              </tr>
            ))}
            
            {/* Table Footer with Totals */}
            <tr className="bg-gray-50 font-medium dark:bg-gray-800/50">
              <td className="px-4 py-3" colSpan={3}>
                <span className="font-bold text-gray-800 dark:text-white/90">Totales</span>
              </td>
              <td className="px-4 py-3">
                <span className="font-bold text-gray-800 dark:text-white/90">Neto</span>
              </td>
              <td className="px-4 py-3">
                <span className={totalIncome - totalExpense >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                  {formatCurrency(totalIncome - totalExpense)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos Totales</h5>
          <h3 className="mt-2 text-xl font-bold text-green-500">{formatCurrency(totalIncome)}</h3>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Gastos Totales</h5>
          <h3 className="mt-2 text-xl font-bold text-red-500">{formatCurrency(totalExpense)}</h3>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance Neto</h5>
          <h3 className={`mt-2 text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default CashFlowDetails;