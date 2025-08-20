// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/tabs/EquipmentTab.tsx

import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';

interface EquipmentTabProps {
  equipment: {
    items: Array<{
      tipo_equipo: string;
      tiempo_uso: string;
      tarifa_periodo: number;
      subtotal: number;
    }>;
    total: number;
  };
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({ equipment }) => {
  if (equipment.items.length === 0) {
    return <EmptyState 
      icon="🚧"
      title="No se encontraron equipos"
      message="El análisis no detectó información de equipos o maquinaria en el documento"
    />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            🚧 Equipos y Maquinaria ({equipment.items.length})
          </h3>
          <div className="text-xl font-bold text-purple-600">
            Total: {formatCurrency(equipment.total)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.items.map((equipo, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🏗️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {equipo.tipo_equipo}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Equipo #{index + 1}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiempo de uso:</span>
                  <span className="font-medium text-gray-900">{equipo.tiempo_uso}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tarifa:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(equipo.tarifa_periodo)}
                  </span>
                </div>
                <div className="pt-3 mt-3 border-t border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                    <span className="text-lg font-bold text-purple-600">
                      {formatCurrency(equipo.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};