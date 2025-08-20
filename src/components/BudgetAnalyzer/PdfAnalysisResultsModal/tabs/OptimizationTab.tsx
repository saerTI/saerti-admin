// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/tabs/OptimizationTab.tsx

import React from 'react';
import { formatFileSize, formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { formatPdfAnalysisForDisplay } from '../utils/dataHelpers';
import { KPICard } from '../components/KPICard';
import type { PdfAnalysisResult } from '../../types/budgetAnalysis';

interface OptimizationTabProps {
  optimization: any;
  metadata: PdfAnalysisResult['metadata'];
  analysis: PdfAnalysisResult['analysis'];
}

export const OptimizationTab: React.FC<OptimizationTabProps> = ({ optimization: optimizationProp, metadata, analysis }) => {
  const analysisResult = { analysis, metadata, analysisId: 'temp' } as PdfAnalysisResult;
  const formattedData = formatPdfAnalysisForDisplay(analysis);
  
  // Datos básicos del análisis
  const confidence = analysis.confidence_score || 0;
  const chunksProcessed = metadata.chunksProcessed || 0;
  const fileSizeMB = (metadata.originalFileSize || 0) / (1024 * 1024);
  const processingTime = metadata.processingTime || new Date().toISOString();
  
  // Datos de optimización del metadata si existen
  const optimization = (metadata as any)?.optimization || optimizationProp || {};
  const extraction = (metadata as any)?.extraction || {};
  
  // Calcular algunos totales básicos
  const totalItems = formattedData.materials.items.length + 
                    formattedData.labor.items.length + 
                    formattedData.equipment.items.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          🛡️ Optimizaciones del Sistema
        </h3>
        <div className="text-sm text-gray-500">
          Análisis ID: {(metadata as any)?.analysisId || 'N/A'}
        </div>
      </div>
      
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Chunks Procesados"
          value={chunksProcessed}
          subtitle={`${extraction.chunks_successful || chunksProcessed} exitosos`}
          icon="📊"
          color="green"
        />
        
        <KPICard
          title="Confianza"
          value={`${confidence}%`}
          subtitle={confidence >= 80 ? 'Alta precisión' : confidence >= 60 ? 'Precisión media' : 'Requiere revisión'}
          icon="🎯"
          color={confidence >= 80 ? 'green' : confidence >= 60 ? 'yellow' : 'red'}
        />
        
        <KPICard
          title="Items Analizados"
          value={totalItems}
          subtitle="Materiales, mano de obra, equipos"
          icon="📋"
          color="blue"
        />
        
        <KPICard
          title="Tamaño Archivo"
          value={formatFileSize(metadata.originalFileSize || 0)}
          subtitle={fileSizeMB > 10 ? 'Archivo grande' : 'Tamaño óptimo'}
          icon="📄"
          color={fileSizeMB > 10 ? 'yellow' : 'green'}
        />
      </div>

      {/* Control de Costos */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
        <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4">
          💰 Control de Costos del Análisis
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Presupuesto Total</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">
              {formatCurrency(formattedData.summary.budget)}
            </div>
            <div className="text-xs text-green-600 dark:text-green-500 mt-1">
              Análisis completo
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Costo Procesamiento</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">
              ${(optimization.cost_estimate_usd || 0).toFixed(3)} USD
            </div>
            <div className="text-xs text-green-600 dark:text-green-500 mt-1">
              Sistema optimizado
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estado</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">
              ✅ Optimizado
            </div>
            <div className="text-xs text-green-600 dark:text-green-500 mt-1">
              Control de costos activo
            </div>
          </div>
        </div>
      </div>

      {/* Información del Procesamiento */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          🔧 Detalles del Procesamiento
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Fecha de análisis:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(processingTime)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Contenido extraído:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(metadata.textLength || 0)} caracteres
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Método de extracción:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {extraction.method || 'Chunking inteligente'}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Modelo usado:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {optimization.model_used || 'Claude Sonnet'}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Chunks procesados:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {chunksProcessed}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Eficiencia:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(((extraction.chunks_successful || chunksProcessed) / Math.max(chunksProcessed, 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de Costos */}
      {formattedData.costs.breakdown && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4">
            📊 Distribución de Costos
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Materiales</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(formattedData.costs.breakdown.materiales || 0)}
              </div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Mano de Obra</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(formattedData.costs.breakdown.mano_obra || 0)}
              </div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Equipos</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(formattedData.costs.breakdown.equipos || 0)}
              </div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Otros</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(formattedData.costs.breakdown.gastos_generales || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Factores Regionales para Chile */}
      {formattedData.costs.regional_factors && Object.keys(formattedData.costs.regional_factors).length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
          <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-4">
            🌎 Factores Regionales (Chile)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formattedData.costs.regional_factors).map(([factor, description]) => (
              <div key={factor} className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg">
                <div className="font-medium text-orange-900 dark:text-orange-300 mb-2 capitalize">
                  {factor.replace('_', ' ')}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-400">
                  {description as string}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen de Calidad */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
        <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-4">
          🎯 Calidad del Análisis
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-purple-800 dark:text-purple-300 mb-1">Confianza General</div>
            <div className={`text-2xl font-bold ${
              confidence >= 80 ? 'text-green-600' : 
              confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {confidence}%
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {confidence >= 80 ? 'Excelente' : confidence >= 60 ? 'Bueno' : 'Mejorable'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-purple-800 dark:text-purple-300 mb-1">Items Detectados</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalItems}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Materiales, labor, equipos
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-purple-800 dark:text-purple-300 mb-1">Procesamiento</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {fileSizeMB < 5 ? '⚡' : fileSizeMB < 10 ? '⚙️' : '🐌'}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {fileSizeMB < 5 ? 'Rápido' : fileSizeMB < 10 ? 'Normal' : 'Lento'}
            </div>
          </div>
        </div>

        {/* Recomendaciones simples */}
        <div className="mt-4 space-y-2">
          {confidence < 80 && (
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                💡 <strong>Sugerencia:</strong> Para mejorar la precisión, use un PDF con mejor estructura o análisis "detallado".
              </div>
            </div>
          )}
          
          {fileSizeMB > 10 && (
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-300">
                📦 <strong>Archivo grande:</strong> Para archivos grandes, el análisis "básico" es más eficiente.
              </div>
            </div>
          )}
          
          {confidence >= 80 && totalItems > 20 && (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <div className="text-sm text-green-800 dark:text-green-300">
                🎉 <strong>¡Excelente!</strong> Análisis de alta calidad con muchos items detectados.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl border border-gray-300 dark:border-gray-600">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          🛡️ Sistema Optimizado SAER
        </h4>
        
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <div className="flex justify-between">
            <span>Versión del sistema:</span>
            <span className="font-medium">2.0 Optimizado</span>
          </div>
          <div className="flex justify-between">
            <span>Control de costos:</span>
            <span className="font-medium text-green-600">✅ Activo</span>
          </div>
          <div className="flex justify-between">
            <span>Límites aplicados:</span>
            <span className="font-medium">Diarios y por usuario</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <strong>📊 Optimización activa:</strong> Este análisis fue procesado con chunking inteligente, 
            selección automática de modelos y control de costos en tiempo real para el mercado chileno.
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationTab;