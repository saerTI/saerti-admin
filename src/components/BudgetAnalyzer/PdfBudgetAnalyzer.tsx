// src/components/BudgetAnalyzer/PdfBudgetAnalyzer.tsx
import React, { useState, useRef, useCallback } from 'react';
import { 
  budgetAnalysisService,
  usePdfAnalysis, 
  formatPdfAnalysisForDisplay,
  validatePdfFile,
  estimateProcessingTime
} from '../../services/budgetAnalysisService';
import type {
  PdfAnalysisConfig,
  PdfAnalysisResult 
} from '../../types/budgetAnalysis';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';
import ComponentCard from '../common/ComponentCard';

interface PdfBudgetAnalyzerProps {
  onAnalysisComplete?: (result: PdfAnalysisResult) => void;
  className?: string;
}

const PdfBudgetAnalyzer: React.FC<PdfBudgetAnalyzerProps> = ({
  onAnalysisComplete,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PdfAnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [fileValidation, setFileValidation] = useState<{ isValid: boolean; error?: string; warnings?: string[] } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { analyzePdf, isAnalyzing, progress, error, estimatedTime, resetState } = usePdfAnalysis();

  // Configuración del análisis
  const [config, setConfig] = useState<PdfAnalysisConfig>({
    analysisDepth: 'standard',
    includeProviders: true,
    projectType: 'residential',
    projectLocation: 'Santiago, Chile',
    saveAnalysis: true
  });

  // Manejadores de archivo
  const handleFileSelect = useCallback((file: File) => {
    if (!file) return;

    // 🔥 VALIDACIÓN MEJORADA usando la nueva función
    const validation = validatePdfFile(file);
    setFileValidation(validation);

    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
    resetState();
    
    // 🔥 MOSTRAR ADVERTENCIAS si las hay
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Advertencias del archivo:', validation.warnings);
      // Podrías mostrar las advertencias en el UI aquí
    }
  }, [resetState]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Iniciar análisis
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      const result = await analyzePdf(selectedFile, config);
      setAnalysisResult(result);
      setShowResults(true);
      onAnalysisComplete?.(result);
    } catch (err) {
      console.error('Error analizando PDF:', err);
      // El error ya se maneja en el hook usePdfAnalysis
    }
  };

  // Limpiar selección
  const handleClear = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setShowResults(false);
    setFileValidation(null);
    resetState();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 🔥 OBTENER INFORMACIÓN DEL ARCHIVO con estimación de tiempo
  const getFileInfo = () => {
    if (!selectedFile) return null;
    
    const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
    const timeEstimate = estimateProcessingTime(selectedFile);
    
    return { sizeMB, timeEstimate };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Zone */}
      <ComponentCard title="Análisis de Presupuesto PDF" className="bg-white dark:bg-gray-800">
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragOver 
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                : 'border-gray-300 dark:border-gray-600'
              }
              ${selectedFile ? 'bg-green-50 dark:bg-green-900/20 border-green-300' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full dark:bg-green-900/30">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getFileInfo()?.sizeMB} MB
                  </p>
                  {/* 🔥 MOSTRAR ESTIMACIÓN DE TIEMPO */}
                  {getFileInfo()?.timeEstimate && (
                    <div className="mt-2">
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${getFileInfo()?.timeEstimate.category === 'fast' ? 'bg-green-100 text-green-800' : ''}
                        ${getFileInfo()?.timeEstimate.category === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${getFileInfo()?.timeEstimate.category === 'slow' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {getFileInfo()?.timeEstimate.description}
                      </span>
                    </div>
                  )}
                  {/* 🔥 MOSTRAR ADVERTENCIAS si las hay */}
                  {fileValidation?.warnings && fileValidation.warnings.length > 0 && (
                    <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ {fileValidation.warnings[0]}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-red-500 hover:text-red-700"
                  disabled={isAnalyzing}
                >
                  Remover archivo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full dark:bg-gray-700">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Arrastra tu presupuesto PDF aquí
                  </p>
                  <p className="text-sm text-gray-500">
                    o haz clic para seleccionar archivo
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                >
                  Seleccionar Archivo
                </Button>
                <p className="text-xs text-gray-400">
                  Máximo 50MB - Solo archivos PDF
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isAnalyzing}
          />

          {/* Configuration Section */}
          {selectedFile && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Configuración del Análisis
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                  disabled={isAnalyzing}
                >
                  {showConfig ? 'Ocultar' : 'Configurar'}
                </Button>
              </div>

              {showConfig && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Profundidad del Análisis
                    </label>
                    <select
                      value={config.analysisDepth}
                      onChange={(e) => setConfig((prev: PdfAnalysisConfig) => ({ 
                        ...prev, 
                        analysisDepth: e.target.value as any 
                      }))}
                      className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      disabled={isAnalyzing}
                    >
                      <option value="basic">Básico - Rápido (30-60s)</option>
                      <option value="standard">Estándar - Equilibrado (1-2min)</option>
                      <option value="detailed">Detallado - Completo (2-3min)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Tipo de Proyecto
                    </label>
                    <select
                      value={config.projectType}
                      onChange={(e) => setConfig((prev: PdfAnalysisConfig) => ({ 
                        ...prev, 
                        projectType: e.target.value as any 
                      }))}
                      className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      disabled={isAnalyzing}
                    >
                      <option value="residential">Residencial</option>
                      <option value="commercial">Comercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="infrastructure">Infraestructura</option>
                      <option value="renovation">Renovación</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Ubicación del Proyecto
                    </label>
                    <input
                      type="text"
                      value={config.projectLocation}
                      onChange={(e) => setConfig((prev: PdfAnalysisConfig) => ({ 
                        ...prev, 
                        projectLocation: e.target.value 
                      }))}
                      className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      placeholder="Santiago, Chile"
                      disabled={isAnalyzing}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeProviders"
                      checked={config.includeProviders}
                      onChange={(e) => setConfig((prev: PdfAnalysisConfig) => ({ 
                        ...prev, 
                        includeProviders: e.target.checked 
                      }))}
                      className="mr-2"
                      disabled={isAnalyzing}
                    />
                    <label htmlFor="includeProviders" className="text-sm text-gray-700 dark:text-gray-300">
                      Incluir proveedores chilenos
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {selectedFile && !isAnalyzing && !analysisResult && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !fileValidation?.isValid}
                className="flex-1"
              >
                🤖 Analizar con Claude Vision
              </Button>
              
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isAnalyzing}
              >
                Limpiar
              </Button>
            </div>
          )}

          {/* 🔥 PROGRESO MEJORADO con más detalles */}
          {isAnalyzing && progress && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="font-medium text-blue-900 dark:text-blue-300">
                    Analizando Presupuesto
                  </span>
                </div>
                {estimatedTime && (
                  <span className="text-sm text-blue-700 dark:text-blue-400">
                    ~{Math.max(1, Math.round(estimatedTime * (1 - (progress?.progress || 0) / 100)))}min restante
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 dark:text-blue-300">
                    {progress.message}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {progress.progress}%
                  </span>
                </div>
                
                <div className="w-full bg-blue-200 rounded-full h-2 dark:bg-blue-800">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                
                {/* 🔥 INDICADORES DE ETAPA */}
                <div className="flex justify-between text-xs mt-3">
                  {[
                    { stage: 'uploading', label: '📤 Subida', threshold: 10 },
                    { stage: 'extracting', label: '🔍 Extracción', threshold: 30 },
                    { stage: 'analyzing', label: '🤖 Análisis', threshold: 70 },
                    { stage: 'consolidating', label: '📊 Finalización', threshold: 90 }
                  ].map(({ stage, label, threshold }) => (
                    <div
                      key={stage}
                      className={`flex flex-col items-center ${
                        progress.stage === stage 
                          ? 'text-blue-600 dark:text-blue-400 font-medium' 
                          : progress.progress > threshold 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-400'
                      }`}
                    >
                      <span className="text-lg">{label.split(' ')[0]}</span>
                      <span className="text-xs">{label.split(' ')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 🔥 TIPS DURANTE EL PROCESAMIENTO */}
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  💡 Mientras Claude analiza tu documento:
                </h5>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Identificando materiales, cantidades y precios</li>
                  <li>• Buscando proveedores chilenos mencionados</li>
                  <li>• Calculando totales y subtotales</li>
                  <li>• Generando recomendaciones específicas</li>
                </ul>
              </div>
            </div>
          )}

          {/* 🔥 ERROR MEJORADO con soluciones específicas */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-red-800 dark:text-red-300 font-medium mb-2">
                    ❌ Error en el Análisis
                  </h4>
                  <div className="text-red-700 dark:text-red-300 text-sm whitespace-pre-line">
                    {error}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetState()}
                  className="text-red-600 hover:text-red-800 ml-4"
                >
                  ✕
                </Button>
              </div>
              
              {/* 🔥 BOTÓN DE REINTENTO */}
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  🔄 Reintentar Análisis
                </Button>
                {error.includes('timeout') || error.includes('grande') ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Cambiar a análisis básico para archivos problemáticos
                      setConfig(prev => ({ ...prev, analysisDepth: 'basic' }));
                      handleAnalyze();
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ⚡ Análisis Rápido
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Results Modal */}
      {showResults && analysisResult && (
        <PdfAnalysisResultsModal
          isOpen={showResults}
          onClose={() => setShowResults(false)}
          analysisResult={analysisResult}
        />
      )}
    </div>
  );
};

// Componente separado para mostrar resultados
interface PdfAnalysisResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: PdfAnalysisResult;
}

const PdfAnalysisResultsModal: React.FC<PdfAnalysisResultsModalProps> = ({
  isOpen,
  onClose,
  analysisResult
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'materials' | 'labor' | 'equipment' | 'providers' | 'risks'>('summary');
  
  const formattedData = formatPdfAnalysisForDisplay(analysisResult.analysis);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const tabs = [
    { id: 'summary', label: 'Resumen', icon: '📊' },
    { id: 'materials', label: 'Materiales', icon: '🧱', count: formattedData.materials.items.length },
    { id: 'labor', label: 'Mano de Obra', icon: '👷', count: formattedData.labor.items.length },
    { id: 'equipment', label: 'Equipos', icon: '🚧', count: formattedData.equipment.items.length },
    { id: 'providers', label: 'Proveedores', icon: '🏢', count: formattedData.providers.items.length },
    { id: 'risks', label: 'Riesgos', icon: '⚠️', count: formattedData.risks.items.length }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📄 Análisis de Presupuesto PDF
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                ID: {analysisResult.analysisId} • 
                Confianza: {analysisResult.analysis.confidence_score}% •
                {analysisResult.metadata.chunksProcessed} secciones procesadas
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center
                  ${activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs dark:bg-gray-700 dark:text-gray-300">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900/20">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300">Presupuesto Total</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(formattedData.summary.budget)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg dark:bg-green-900/20">
                  <h4 className="font-medium text-green-900 dark:text-green-300">Materiales</h4>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(formattedData.materials.total)}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg dark:bg-yellow-900/20">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-300">Mano de Obra</h4>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(formattedData.labor.total)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg dark:bg-purple-900/20">
                  <h4 className="font-medium text-purple-900 dark:text-purple-300">Equipos</h4>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(formattedData.equipment.total)}
                  </p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-gray-50 p-6 rounded-lg dark:bg-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Resumen Ejecutivo
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {formattedData.summary.content}
                </p>
              </div>

              {/* Timeline */}
              {formattedData.timeline.content && (
                <div className="bg-blue-50 p-6 rounded-lg dark:bg-blue-900/20">
                  <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-300">
                    Cronograma Estimado
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    {formattedData.timeline.content}
                  </p>
                </div>
              )}

              {/* Key Recommendations */}
              {formattedData.recommendations.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    Recomendaciones Principales
                  </h3>
                  <ul className="space-y-2">
                    {formattedData.recommendations.items.slice(0, 5).map((rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Materiales Detallados ({formattedData.materials.items.length})
                </h3>
                <p className="text-lg font-bold text-green-600">
                  Total: {formatCurrency(formattedData.materials.total)}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unit.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {formattedData.materials.items.map((material: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {material.item}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {material.cantidad} {material.unidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatCurrency(material.precio_unitario)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(material.subtotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {material.categoria}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aquí puedes agregar los otros tabs: labor, equipment, providers, risks */}
          {activeTab !== 'summary' && activeTab !== 'materials' && (
            <div className="text-center py-8 text-gray-500">
              <p>Contenido de {activeTab} próximamente...</p>
              <p className="text-sm mt-2">Los datos están disponibles en formattedData.{activeTab}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Análisis completado: {new Date(analysisResult.metadata.processingTime).toLocaleString('es-CL')}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={() => {
                // TODO: Implementar exportación
                console.log('Exportar análisis:', analysisResult);
                alert('Función de exportación próximamente...');
              }}>
                📥 Exportar Resultados
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PdfBudgetAnalyzer;