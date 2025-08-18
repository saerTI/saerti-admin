// src/components/BudgetAnalyzer/BudgetAnalyzer.tsx

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, MapPin, Building, Calculator, FileText, AlertTriangle, Upload } from 'lucide-react';
import { budgetAnalysisService, useBudgetAnalysis } from '../../services/budgetAnalysisService';
import { AnalysisResults } from './AnalysisResults';
import PdfBudgetAnalyzer from './PdfBudgetAnalyzer';
import ChartTab from '../common/ChartTab';
import type { ProjectData, AnalysisConfig, PdfAnalysisResult } from '../../types/budgetAnalysis';

export const BudgetAnalyzer: React.FC = () => {
  // Estado de tabs
  const [activeTab, setActiveTab] = useState<string>('manual');
  
  // Estado del formulario manual
  const [formData, setFormData] = useState<ProjectData>({
    type: 'residential',
    location: '',
    area: 0,
    estimatedBudget: 0,
    description: ''
  });

  const [config, setConfig] = useState<AnalysisConfig>({
    analysisDepth: 'standard',
    includeMarketData: true,
    saveAnalysis: false
  });

  // Estado para resultado de PDF
  const [pdfAnalysisResult, setPdfAnalysisResult] = useState<PdfAnalysisResult | null>(null);

  // Hook personalizado para análisis manual
  const {
    isLoading,
    isValidating,
    analysis,
    error,
    validationResult,
    validateProject,
    generateAnalysis,
    clearError,
    clearAnalysis
  } = useBudgetAnalysis();

  // Estado de validación automática
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null);

  // Configuración de tabs
  const tabs = [
    { id: 'manual', label: 'Análisis Manual' },
    { id: 'pdf', label: 'Importar PDF' }
  ];

  // Validación automática mientras el usuario escribe
  useEffect(() => {
    if (activeTab !== 'manual') return;
    
    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    if (formData.type && formData.location && formData.area > 0) {
      const timer = setTimeout(() => {
        validateProject(formData);
      }, 1000); // Validar después de 1 segundo de inactividad

      setValidationTimer(timer);
    }

    return () => {
      if (validationTimer) {
        clearTimeout(validationTimer);
      }
    };
  }, [formData.type, formData.location, formData.area, activeTab]);

  const handleInputChange = (field: keyof ProjectData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    clearError();
  };

  const handleConfigChange = (field: keyof AnalysisConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.location || !formData.area) {
      return;
    }

    try {
      await generateAnalysis(formData, config);
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handlePdfAnalysisComplete = (result: PdfAnalysisResult) => {
    setPdfAnalysisResult(result);
    // Limpiar análisis manual previo
    clearAnalysis();
  };

  const handleTabChange = React.useCallback((tabId: string | ((prevState: string) => string)) => {
    const newTabId = typeof tabId === 'function' ? tabId(activeTab) : tabId;
    setActiveTab(newTabId);
    // Limpiar errores al cambiar de tab
    clearError();
  }, [activeTab, clearError]);

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getReadinessText = (level: string) => {
    const texts = {
      excellent: 'Excelente',
      good: 'Bueno',
      fair: 'Regular',
      poor: 'Insuficiente'
    };
    return texts[level as keyof typeof texts] || level;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Calculator className="inline-block mr-3 h-8 w-8 text-blue-600" />
          Análisis Presupuestario con IA
        </h1>
        <p className="text-gray-600">
          Genera estimaciones precisas para proyectos de construcción en Chile
        </p>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Selecciona el método de análisis</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FileText className="h-4 w-4" />
              <span>Análisis potenciado por IA</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ChartTab 
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />
        </div>
      </div>

      {/* Contenido según tab activa */}
      {activeTab === 'manual' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Datos del Proyecto
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Proyecto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Proyecto *
                </label>
                <select 
                  value={formData.type} 
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="residential">Residencial</option>
                  <option value="commercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="infrastructure">Infraestructura</option>
                  <option value="renovation">Renovación</option>
                </select>
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ej: Valdivia, Los Ríos"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Área y Presupuesto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área Construida (m²) *
                  </label>
                  <input
                    type="number"
                    placeholder="120"
                    value={formData.area || ''}
                    onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presupuesto Estimado (CLP)
                  </label>
                  <input
                    type="number"
                    placeholder="75000000"
                    value={formData.estimatedBudget || ''}
                    onChange={(e) => handleInputChange('estimatedBudget', parseFloat(e.target.value) || 0)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Proyecto
                </label>
                <textarea
                  placeholder="Casa habitacional 2 pisos, terreno en pendiente..."
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Configuración de Análisis */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-4">Configuración del Análisis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profundidad
                    </label>
                    <select 
                      value={config.analysisDepth} 
                      onChange={(e) => handleConfigChange('analysisDepth', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="basic">Básico</option>
                      <option value="standard">Estándar</option>
                      <option value="detailed">Detallado</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="marketData"
                      checked={config.includeMarketData}
                      onChange={(e) => handleConfigChange('includeMarketData', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="marketData" className="text-sm font-medium text-gray-700">
                      Datos de mercado
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="saveAnalysis"
                      checked={config.saveAnalysis}
                      onChange={(e) => handleConfigChange('saveAnalysis', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="saveAnalysis" className="text-sm font-medium text-gray-700">
                      Guardar análisis
                    </label>
                  </div>
                </div>
              </div>

              {/* Resultado de Validación */}
              {validationResult && (
                <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Estado de Preparación</h3>
                    <span 
                      className={`px-2 py-1 rounded text-white text-xs font-medium ${getConfidenceColor(validationResult.confidence_score)}`}
                    >
                      {validationResult.confidence_score}% confianza
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Nivel:</strong> {getReadinessText(validationResult.readiness_level)}
                    </p>
                    <p className="text-sm">
                      <strong>Calidad esperada:</strong> {validationResult.estimated_analysis_quality}
                    </p>
                    
                    {validationResult.suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Sugerencias:</p>
                        <ul className="text-xs space-y-1">
                          {validationResult.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-600 mr-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                  <div className="flex">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Botón de Análisis */}
              <button
                type="submit"
                disabled={isLoading || !formData.type || !formData.location || !formData.area || !validationResult?.is_analyzable}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analizando con IA...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Generar Análisis Presupuestario
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab de PDF */}
      {activeTab === 'pdf' && (
        <PdfBudgetAnalyzer 
          onAnalysisComplete={handlePdfAnalysisComplete}
          className="bg-white shadow rounded-lg"
        />
      )}

      {/* Resultado del Análisis Manual */}
      {analysis && activeTab === 'manual' && (
        <AnalysisResults 
          analysis={analysis}
          projectInfo={{
            name: formData.name || `Proyecto ${formData.type}`,
            location: formData.location,
            area: formData.area
          }}
        />
      )}

      {/* Resultado del Análisis PDF */}
      {pdfAnalysisResult && activeTab === 'pdf' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center">
                <Upload className="mr-2 h-5 w-5 text-green-600" />
                Resultado del Análisis PDF
              </h2>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Confianza: {pdfAnalysisResult.analysis.confidence_score}%
                </span>
                <span className="text-sm text-gray-500">
                  ID: {pdfAnalysisResult.analysisId}
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {/* Mostrar resumen ejecutivo del PDF */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Resumen Ejecutivo</h3>
                <p className="text-blue-800 text-sm">
                  {pdfAnalysisResult.analysis.resumen_ejecutivo}
                </p>
              </div>
              
              {pdfAnalysisResult.analysis.presupuesto_estimado && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Presupuesto Estimado</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                      minimumFractionDigits: 0
                    }).format(pdfAnalysisResult.analysis.presupuesto_estimado.total_clp)}
                  </p>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Análisis completado el {new Date(pdfAnalysisResult.metadata.processingTime).toLocaleString('es-CL')}
                </p>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => {
                    // TODO: Implementar vista detallada o exportación
                    console.log('Ver análisis completo:', pdfAnalysisResult);
                  }}
                >
                  Ver Análisis Completo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};