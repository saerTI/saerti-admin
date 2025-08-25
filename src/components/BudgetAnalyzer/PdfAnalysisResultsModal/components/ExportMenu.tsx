// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/components/ExportMenu.tsx - ACTUALIZADO
import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import type { PdfAnalysisResult } from '../../types/budgetAnalysis';
import { 
  exportAnalysisToPDF, 
  validateAnalysisForPDF, 
  formatChileanCurrency 
} from '../utils/pdfExportIntegration';

interface ExportMenuProps {
  analysisResult: PdfAnalysisResult;
  className?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ analysisResult, className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // ✅ HANDLER para exportar PDF
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      // Validar antes de exportar
      const validation = validateAnalysisForPDF(analysisResult);
      
      if (!validation.canGenerate) {
        alert('❌ No se puede generar el PDF:\n' + validation.warnings.join('\n'));
        return;
      }
      
      if (validation.warnings.length > 0) {
        const proceed = confirm(
          '⚠️ Se detectaron algunas advertencias:\n' + 
          validation.warnings.join('\n') + 
          '\n\n¿Desea continuar con la generación del PDF?'
        );
        
        if (!proceed) {
          return;
        }
      }
      
      // Exportar usando la función de integración
      await exportAnalysisToPDF(analysisResult);
      
    } catch (error) {
      console.error('Error en exportación:', error);
      // El error ya se maneja en exportAnalysisToPDF
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ HANDLER para mostrar información del análisis
  const handleShowValidation = () => {
    const validation = validateAnalysisForPDF(analysisResult);
    const stats = {
      presupuesto: formatChileanCurrency(analysisResult.analysis.presupuesto_estimado?.total_clp || 0),
      materiales: analysisResult.analysis.materiales_detallados?.length || 0,
      manoObra: analysisResult.analysis.mano_obra?.length || 0,
      equipos: analysisResult.analysis.equipos_maquinaria?.length || 0,
      confianza: Math.round(analysisResult.analysis.confidence_score || 0)
    };
    
    let message = '📊 INFORMACIÓN DEL ANÁLISIS:\n\n';
    message += `💰 Presupuesto: ${stats.presupuesto}\n`;
    message += `🧱 Materiales: ${stats.materiales} items\n`;
    message += `👷 Mano de obra: ${stats.manoObra} especialidades\n`;
    message += `🚧 Equipos: ${stats.equipos} items\n`;
    message += `🎯 Confianza: ${stats.confianza}%\n\n`;
    
    if (validation.warnings.length > 0) {
      message += '⚠️ ADVERTENCIAS:\n';
      message += validation.warnings.map(w => `• ${w}`).join('\n');
    } else {
      message += '✅ Análisis completo y listo para exportar';
    }
    
    alert(message);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* ✅ BOTÓN PRINCIPAL de exportar PDF */}
      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
          ${isExporting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
        title="Exportar análisis completo a PDF"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? 'Generando...' : 'Exportar PDF'}</span>
      </button>

      {/* ✅ BOTÓN SECUNDARIO de información */}
      <button
        onClick={handleShowValidation}
        className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
        title="Ver información del análisis"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm">Info</span>
      </button>
      
      {/* ✅ INDICADOR de estado del análisis */}
      <div className="flex items-center space-x-2">
        {(() => {
          const validation = validateAnalysisForPDF(analysisResult);
          if (validation.canGenerate && validation.isValid) {
            return (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">Listo</span>
              </div>
            );
          } else if (validation.canGenerate) {
            return (
              <div className="flex items-center space-x-1 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs">Con advertencias</span>
              </div>
            );
          } else {
            return (
              <div className="flex items-center space-x-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs">Incompleto</span>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};