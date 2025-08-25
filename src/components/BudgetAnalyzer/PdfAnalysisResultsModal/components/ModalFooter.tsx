// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/components/ModalFooter.tsx

import React, { useState } from 'react';
import Button from '../../../ui/button/Button';
import { 
  exportToJSON, 
  exportToCSV, 
  exportMaterialsToERP, 
  exportScheduleToTXT 
} from '../utils/exportHandlers';
import type { PdfAnalysisResult } from '../../types/budgetAnalysis';
import { formatDateTime } from '@/utils/formatters';

interface ModalFooterProps {
  analysisResult: PdfAnalysisResult;
  onClose: () => void;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ analysisResult, onClose }) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv' | 'materials-erp' | 'schedule') => {
    setIsExporting(true);
    
    try {
      const filename = `analisis-${analysisResult.analysisId}`;
      
      switch (format) {
        case 'json':
          exportToJSON(analysisResult, filename);
          break;
          
        case 'csv':
          exportToCSV(analysisResult, filename);
          break;
          
        case 'materials-erp':
          if (analysisResult.analysis.materiales_detallados?.length > 0) {
            exportMaterialsToERP(analysisResult.analysis.materiales_detallados, `${filename}-materiales`);
          } else {
            alert('No hay materiales disponibles para exportar');
            return;
          }
          break;
          
        case 'schedule':
          if (analysisResult.analysis.cronograma_estimado) {
            exportScheduleToTXT(analysisResult.analysis.cronograma_estimado, `${filename}-cronograma`);
          } else {
            alert('No hay cronograma disponible para exportar');
            return;
          }
          break;
          
        default:
          console.warn('Formato de exportación no reconocido:', format);
          return;
      }
      
      // Mostrar notificación de éxito
      console.log(`✅ Exportación ${format.toUpperCase()} completada exitosamente`);
      
    } catch (error) {
      console.error('❌ Error durante la exportación:', error);
      alert(`Error al exportar en formato ${format}. Por favor, intente nuevamente.`);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Obtener información de procesamiento
  const processingTime = analysisResult.metadata.processingTime || new Date().toISOString();
  const formattedTime = formatDateTime(processingTime);
  const chunksProcessed = analysisResult.metadata.chunksProcessed || 0;
  const confidence = analysisResult.analysis.confidence_score || 0;

  // Determinar si hay datos suficientes para exportar
  const hasMaterials = (analysisResult.analysis.materiales_detallados?.length || 0) > 0;
  const hasSchedule = !!analysisResult.analysis.cronograma_estimado;
  const hasCompleteData = hasMaterials || hasSchedule || confidence > 60;

  return (
    <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
      <div className="flex items-center justify-between">
        {/* Información del análisis */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div>
              <span className="font-medium">Análisis completado:</span>
              <span className="ml-1">{formattedTime}</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <div>
                <span className="font-medium">Chunks:</span>
                <span className="ml-1">{chunksProcessed}</span>
              </div>
              
              <div>
                <span className="font-medium">Confianza:</span>
                <span className={`ml-1 font-medium ${
                  confidence >= 80 ? 'text-green-600' : 
                  confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {confidence}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
            <span className="mr-1">🛡️</span>
            Procesado con sistema optimizado • Control de costos activo
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cerrar
          </Button>
          
          <div className="relative">
            <Button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || !hasCompleteData}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Exportando...
                </>
              ) : (
                <>
                  📥 Exportar Resultados
                </>
              )}
            </Button>
            
            {/* Menú de exportación */}
            {showExportMenu && !isExporting && (
              <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  {/* Exportación completa */}
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
                    Exportación Completa
                  </div>
                  
                  <button
                    onClick={() => handleExport('json')}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="mr-3">📄</span>
                    <div>
                      <div className="font-medium">Exportar como JSON</div>
                      <div className="text-xs text-gray-500">Datos completos estructurados</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="mr-3">📊</span>
                    <div>
                      <div className="font-medium">Exportar como CSV</div>
                      <div className="text-xs text-gray-500">Compatible con Excel</div>
                    </div>
                  </button>

                  {/* Exportaciones específicas */}
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 mt-2">
                    Exportaciones Específicas
                  </div>
                  
                  <button
                    onClick={() => handleExport('materials-erp')}
                    disabled={!hasMaterials}
                    className={`flex items-center w-full text-left px-4 py-2 text-sm transition-colors ${
                      hasMaterials 
                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' 
                        : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <span className="mr-3">🏗️</span>
                    <div>
                      <div className="font-medium">Materiales para ERP</div>
                      <div className="text-xs text-gray-500">
                        {hasMaterials ? 'CSV optimizado para sistemas ERP' : 'No hay materiales disponibles'}
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleExport('schedule')}
                    disabled={!hasSchedule}
                    className={`flex items-center w-full text-left px-4 py-2 text-sm transition-colors ${
                      hasSchedule 
                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' 
                        : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <span className="mr-3">⏱️</span>
                    <div>
                      <div className="font-medium">Cronograma</div>
                      <div className="text-xs text-gray-500">
                        {hasSchedule ? 'Archivo de texto plano' : 'No hay cronograma disponible'}
                      </div>
                    </div>
                  </button>
                </div>
                
                {/* Información adicional */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    <span className="mr-1">💡</span>
                    Los archivos incluyen metadatos del sistema optimizado
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Advertencia si los datos están incompletos */}
      {!hasCompleteData && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-xs text-yellow-800 dark:text-yellow-300 flex items-center">
            <span className="mr-1">⚠️</span>
            El análisis tiene datos limitados (confianza: {confidence}%). Algunas exportaciones pueden no estar disponibles.
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalFooter;