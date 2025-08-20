// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/tabs/SummaryTab.tsx

import React from 'react';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface SummaryTabProps {
  data: any;
  analysis: any;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ data, analysis }) => {
  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg">
          <h4 className="font-medium text-blue-100 text-sm">Presupuesto Total</h4>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(data.summary.budget)}
          </p>
          <p className="text-xs text-blue-200 mt-2">✓ Análisis optimizado</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white shadow-lg">
          <h4 className="font-medium text-green-100 text-sm">Materiales</h4>
          <p className="text-xl font-bold mt-1">
            {formatCurrency(data.materials.total)}
          </p>
          <p className="text-xs text-green-200 mt-2">
            {data.materials.items.length} items • {formatPercentage(analysis.presupuesto_estimado?.materials_percentage || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-xl text-white shadow-lg">
          <h4 className="font-medium text-yellow-100 text-sm">Mano de Obra</h4>
          <p className="text-xl font-bold mt-1">
            {formatCurrency(data.labor.total)}
          </p>
          <p className="text-xs text-yellow-100 mt-2">
            {data.labor.items.length} espec. • {formatPercentage(analysis.presupuesto_estimado?.labor_percentage || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white shadow-lg">
          <h4 className="font-medium text-purple-100 text-sm">Equipos</h4>
          <p className="text-xl font-bold mt-1">
            {formatCurrency(data.equipment.total)}
          </p>
          <p className="text-xs text-purple-200 mt-2">
            {data.equipment.items.length} equipos • {formatPercentage(analysis.presupuesto_estimado?.equipment_percentage || 0)}
          </p>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          📄 Resumen Ejecutivo
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {data.summary.content}
        </p>
      </div>

      {/* Desglose de Costos */}
      {analysis.desglose_costos && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            💰 Desglose Detallado de Costos
          </h3>
          <div className="space-y-3">
            {Object.entries(analysis.desglose_costos).map(([key, value]) => {
              if (key === 'total') return null;
              const percentage = ((value as number) / analysis.desglose_costos.total) * 100;
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize w-32">
                      {key.replace('_', ' ')}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-800 dark:text-gray-200">
                        {formatPercentage(percentage)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white ml-4 w-32 text-right">
                    {formatCurrency(value as number)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cronograma */}
      {data.timeline?.content && data.timeline.content !== 'No disponible' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-300">
            ⏱️ Cronograma Estimado
          </h3>
          <p className="text-blue-800 dark:text-blue-300">
            {data.timeline.content}
          </p>
        </div>
      )}

      {/* Recomendaciones */}
      {data.recommendations?.items?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            💡 Recomendaciones Clave
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recommendations.items.slice(0, 6).map((rec: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};