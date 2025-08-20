// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/tabs/LaborTab.tsx

import React from 'react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';

interface LaborTabProps {
  labor: {
    items: Array<{
      especialidad: string;
      cantidad_personas: number;
      horas_totales: number;
      tarifa_hora: number;
      subtotal: number;
    }>;
    total: number;
  };
}

export const LaborTab: React.FC<LaborTabProps> = ({ labor }) => {
  if (labor.items.length === 0) {
    return <EmptyState 
      icon="👷"
      title="No se encontró información de mano de obra"
      message="El análisis no detectó información específica de mano de obra en el documento"
    />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            👷 Desglose de Mano de Obra ({labor.items.length})
          </h3>
          <div className="text-xl font-bold text-yellow-600">
            Total: {formatCurrency(labor.total)}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Especialidad
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Personas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Horas Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Tarifa/Hora
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Subtotal
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  % del Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800">
              {labor.items.map((item, index) => {
                const percentage = (item.subtotal / labor.total) * 100;
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-yellow-600 text-sm">👷</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.especialidad}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                        {item.cantidad_personas}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {item.horas_totales} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(item.tarifa_hora)}/hr
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {formatPercentage(percentage)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};