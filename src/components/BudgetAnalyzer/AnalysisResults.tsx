// src/components/BudgetAnalyzer/AnalysisResults.tsx

import React from 'react';
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Calendar,
  Target,
  PieChart,
  Shield,
  Lightbulb,
  DollarSign
} from 'lucide-react';
import type { 
  BudgetAnalysis, 
  BudgetBreakdown, 
  RiskAnalysis,
  parseAnalysisContent 
} from './types/budgetAnalysis';

interface AnalysisResultsProps {
  analysis: BudgetAnalysis | { analysis: BudgetAnalysis; project_info: any; analysis_config: any }; // Manejar ambos formatos
  projectInfo?: {
    name: string;
    location: string;
    area: number;
  };
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ 
  analysis, 
  projectInfo 
}) => {
  // 🔧 FUNCIÓN DE PARSING MEJORADA CON TIPOS
  const parseRealAnalysis = React.useMemo(() => {
    try {
      // Detectar si se pasó la respuesta completa o solo analysis
      let actualAnalysis: BudgetAnalysis;
      if ('analysis' in analysis) {
        // Se pasó la respuesta completa
        actualAnalysis = (analysis as any).analysis;
        console.log('🔍 Detectada respuesta completa, extrayendo analysis:', actualAnalysis);
      } else {
        // Se pasó solo el analysis
        actualAnalysis = analysis as BudgetAnalysis;
        console.log('🔍 Parseando análisis directo:', actualAnalysis);
      }
      
      // Si tiene contenido_original, extraer el JSON de ahí
      if (actualAnalysis.contenido_original && typeof actualAnalysis.contenido_original === 'string') {
        const jsonMatch = actualAnalysis.contenido_original.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[1]);
          console.log('✅ JSON parseado exitosamente:', parsedData);
          return parsedData;
        }
      }
      
      // Si ya tiene la estructura correcta, usarla directamente
      if (actualAnalysis.desglose_detallado || actualAnalysis.presupuesto_ajustado) {
        return {
          resumen_ejecutivo: actualAnalysis.resumen_ejecutivo,
          presupuesto_ajustado: actualAnalysis.presupuesto_ajustado,
          desglose_detallado: actualAnalysis.desglose_detallado,
          factores_regionales: actualAnalysis.factores_regionales,
          analisis_riesgos: actualAnalysis.analisis_riesgos,
          recomendaciones: actualAnalysis.recomendaciones,
          cronograma_sugerido: actualAnalysis.cronograma_sugerido,
          contingencia_recomendada: actualAnalysis.contingencia_recomendada
        };
      }
      
      // Fallback: estructura vacía
      return {
        resumen_ejecutivo: "Análisis en proceso",
        presupuesto_ajustado: "Por determinar",
        desglose_detallado: {},
        factores_regionales: {},
        analisis_riesgos: [],
        recomendaciones: [],
        contingencia_recomendada: "20%",
        cronograma_sugerido: "En desarrollo"
      };
    } catch (error) {
      console.error('❌ Error parseando análisis:', error);
      return {
        resumen_ejecutivo: "Error en análisis",
        presupuesto_ajustado: "Por revisar",
        desglose_detallado: {},
        factores_regionales: {},
        analisis_riesgos: [],
        recomendaciones: [],
        contingencia_recomendada: "20%",
        cronograma_sugerido: "Error"
      };
    }
  }, [analysis]);

  // Extraer metadatos de manera segura
  const metadata = React.useMemo(() => {
    if ('analysis' in analysis) {
      // Respuesta completa
      return (analysis as any).analysis.metadata;
    } else {
      // Solo analysis
      return (analysis as BudgetAnalysis).metadata;
    }
  }, [analysis]);

  // Función para extraer números de strings de presupuesto
  const extractAmount = (budgetString: string): number => {
    if (!budgetString || typeof budgetString !== 'string') return 0;
    
    const match = budgetString.match(/[\d.,]+/g);
    if (match) {
      // Encontrar el número más grande (probablemente el presupuesto principal)
      const numbers = match.map(num => {
        const cleaned = num.replace(/[.,]/g, '');
        return parseInt(cleaned) || 0;
      });
      return Math.max(...numbers);
    }
    return 0;
  };

  // Función para formatear moneda chilena
  const formatCLP = (amount: number): string => {
    if (amount === 0) return 'Por determinar';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para extraer porcentajes
  const extractPercentage = (percentString: string): number => {
    if (!percentString || typeof percentString !== 'string') return 0;
    const match = percentString.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  };

  const totalBudget = extractAmount(parseRealAnalysis.presupuesto_ajustado || '');

  console.log('🎯 Datos para renderizar:', {
    parseRealAnalysis,
    totalBudget,
    hasDesglose: Object.keys(parseRealAnalysis.desglose_detallado || {}).length
  });

  return (
    <div className="space-y-6">
      {/* Header con información del proyecto */}
      {projectInfo && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">{projectInfo.name}</h2>
              <div className="flex items-center space-x-4 text-blue-100">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {projectInfo.location}
                </span>
                <span className="flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  {projectInfo.area} m²
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Presupuesto Estimado</p>
              <p className="text-2xl font-bold">
                {totalBudget > 0 ? formatCLP(totalBudget) : parseRealAnalysis.presupuesto_ajustado}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resumen Ejecutivo */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blue-600" />
            Resumen Ejecutivo
          </h3>
        </div>
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">
            {parseRealAnalysis.resumen_ejecutivo || "Análisis presupuestario completado exitosamente."}
          </p>
        </div>
      </div>

      {/* Desglose Presupuestario */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center">
            <PieChart className="mr-2 h-5 w-5 text-green-600" />
            Desglose Presupuestario
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {parseRealAnalysis.desglose_detallado && Object.keys(parseRealAnalysis.desglose_detallado).length > 0 ? (
              // Desglose detallado con tipos seguros
              (Object.entries(parseRealAnalysis.desglose_detallado) as [string, BudgetBreakdown | undefined][]).map(([category, details]) => {
                if (!details) return null;
                
                const percentage = extractPercentage(details.porcentaje || '0%');
                
                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium capitalize">{category.replace('_', ' ')}</h4>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {details.porcentaje || 'N/A'}
                        </span>
                        <p className="text-sm font-semibold text-green-600">{details.monto || 'N/A'}</p>
                      </div>
                    </div>
                    {/* Progress bar manual */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    {details.observaciones && (
                      <p className="text-xs text-gray-600">{details.observaciones}</p>
                    )}
                  </div>
                );
              })
            ) : parseRealAnalysis.desglose_principal ? (
              // Desglose principal simple
              (Object.entries(parseRealAnalysis.desglose_principal) as [string, string | undefined][]).map(([category, value]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium capitalize">{category}</span>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                    {value || 'N/A'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 italic">Desglose detallado en proceso de análisis</p>
                <p className="text-sm text-gray-400 mt-1">Consulte el presupuesto ajustado arriba</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Factores Regionales */}
      {parseRealAnalysis.factores_regionales && Object.keys(parseRealAnalysis.factores_regionales).length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-orange-600" />
              Factores Regionales
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(parseRealAnalysis.factores_regionales) as [string, string | undefined][]).map(([factor, description]) => (
                <div key={factor} className="border-l-4 border-orange-400 pl-4">
                  <h4 className="font-medium capitalize text-orange-700">
                    {factor.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{description || 'Sin información'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Análisis de Riesgos */}
      {parseRealAnalysis.analisis_riesgos && parseRealAnalysis.analisis_riesgos.length > 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
              Análisis de Riesgos
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {parseRealAnalysis.analisis_riesgos.map((risk: RiskAnalysis, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-red-800">{risk.riesgo}</h4>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        risk.probabilidad?.toLowerCase().includes('alta') ? 'bg-red-100 text-red-800' :
                        risk.probabilidad?.toLowerCase().includes('media') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {risk.probabilidad || 'N/A'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        risk.impacto?.toLowerCase().includes('alto') ? 'bg-red-100 text-red-800' :
                        risk.impacto?.toLowerCase().includes('medio') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {risk.impacto || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{risk.mitigacion || 'Sin mitigación especificada'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : parseRealAnalysis.factores_riesgo ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
              Factores de Riesgo
            </h3>
          </div>
          <div className="p-6">
            <ul className="space-y-2">
              {parseRealAnalysis.factores_riesgo.map((risk: string, index: number) => (
                <li key={index} className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Recomendaciones */}
      {parseRealAnalysis.recomendaciones && parseRealAnalysis.recomendaciones.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-600" />
              Recomendaciones
            </h3>
          </div>
          <div className="p-6">
            <ul className="space-y-3">
              {parseRealAnalysis.recomendaciones.map((recommendation: string, index: number) => (
                <li key={index} className="flex items-start">
                  <div className="bg-yellow-100 rounded-full p-1 mr-3 mt-0.5">
                    <Lightbulb className="h-3 w-3 text-yellow-600" />
                  </div>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Contingencia y Cronograma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contingencia */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center">
              <Shield className="mr-2 h-5 w-5 text-purple-600" />
              Contingencia
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {parseRealAnalysis.contingencia_recomendada || "20%"}
              </div>
              <p className="text-sm text-gray-600">Recomendada para este proyecto</p>
              {totalBudget > 0 && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium">Monto de contingencia:</p>
                  <p className="text-lg font-bold text-purple-700">
                    {formatCLP(totalBudget * (extractPercentage(parseRealAnalysis.contingencia_recomendada || "20%") / 100))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cronograma */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-600" />
              Cronograma
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-700">
              {parseRealAnalysis.cronograma_sugerido || "Cronograma en desarrollo según especificaciones del proyecto"}
            </p>
          </div>
        </div>
      </div>

      {/* Metadatos del Análisis */}
      {metadata && (
        <div className="bg-gray-50 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">Información del Análisis</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="font-medium text-gray-500">Modelo IA</p>
                <p>{metadata.model_used || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Confianza</p>
                <p>{metadata.confidence_score || 0}%</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Tokens usados</p>
                <p>{(metadata.api_cost_estimate?.input_tokens || 0) + (metadata.api_cost_estimate?.output_tokens || 0) || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Generado</p>
                <p>{new Date(metadata.generated_at).toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <button 
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Imprimir Análisis
            </button>
            
            <button 
              onClick={() => {
                const dataStr = JSON.stringify({
                  analysis: parseRealAnalysis,
                  metadata: metadata,
                  projectInfo
                }, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = `analisis-${Date.now()}.json`;
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Exportar Datos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};