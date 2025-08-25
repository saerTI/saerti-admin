// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/tabs/MaterialsTab.tsx

import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';

interface MaterialsTabProps {
  materials: {
    items: Array<{
      item: string;
      cantidad: number;
      unidad: string;
      precio_unitario: number;
      subtotal: number;
      categoria: string;
    }>;
    total: number;
  };
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({ materials }) => {
  if (materials.items.length === 0) {
    return <EmptyState 
      icon="🧱"
      title="No se encontraron materiales"
      message="El análisis no detectó materiales específicos en el documento"
    />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            🧱 Materiales Detallados ({materials.items.length})
          </h3>
          <div className="text-xl font-bold text-green-600">
            Total: {formatCurrency(materials.total)}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Material
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Precio Unit.
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Subtotal
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800">
              {materials.items.map((material, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {material.item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {material.cantidad} {material.unidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {formatCurrency(material.precio_unitario)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(material.subtotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {material.categoria}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};