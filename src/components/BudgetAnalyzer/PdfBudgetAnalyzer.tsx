// src/components/BudgetAnalyzer/PdfBudgetAnalyzer.tsx - VERSIÓN CORREGIDA SIN ERROR
import React, { useState, useRef, useCallback } from 'react';
import { 
  budgetAnalysisService,
  usePdfAnalysis, 
  validatePdfFile,
  estimateProcessingTime,
  useCostMonitoring
} from '../../services/budgetAnalysisService';
import type {
  PdfAnalysisConfig,
  PdfAnalysisResult 
} from './types/budgetAnalysis';
import Button from '../ui/button/Button';
import ComponentCard from '../common/ComponentCard';
import { PdfAnalysisResultsModal } from './PdfAnalysisResultsModal';

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
  const { costStatus, canAnalyze, remainingAnalyses, refreshCostStatus } = useCostMonitoring();

  const [config, setConfig] = useState<PdfAnalysisConfig>({
    analysisDepth: 'standard',
    includeProviders: true,
    projectType: 'residential',
    projectLocation: 'Santiago, Chile',
    saveAnalysis: true
  });

  // ✅ FUNCIÓN LOCAL para validar y corregir análisis
  const validarYCorregirAnalisis = (analysis: any): any => {
    console.log('🔍 Validando análisis del backend:', analysis);

    // Calcular totales reales de materiales, mano de obra y equipos
    const materialesTotal = analysis.materiales_detallados?.reduce(
      (sum: number, item: any) => sum + (item.subtotal || 0), 0
    ) || 0;

    const manoObraTotal = analysis.mano_obra?.reduce(
      (sum: number, item: any) => sum + (item.subtotal || 0), 0
    ) || 0;

    const equiposTotal = analysis.equipos_maquinaria?.reduce(
      (sum: number, item: any) => sum + (item.subtotal || 0), 0
    ) || 0;

    console.log('📊 Totales calculados:', {
      materiales: materialesTotal,
      manoObra: manoObraTotal,
      equipos: equiposTotal
    });

    // Calcular presupuesto con metodología estándar chilena
    const costosDirectos = materialesTotal + manoObraTotal + equiposTotal;
    const gastosGenerales = costosDirectos * 0.12; // 12%
    const baseUtilidad = costosDirectos + gastosGenerales;
    const utilidad = baseUtilidad * 0.10; // 10%
    const contingencia = costosDirectos * 0.05; // 5%
    const subtotal = costosDirectos + gastosGenerales + utilidad + contingencia;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    console.log('✅ Presupuesto corregido:', {
      costosDirectos,
      gastosGenerales,
      utilidad,
      contingencia,
      subtotal,
      iva,
      total
    });

    // Retornar análisis corregido
    return {
      ...analysis,
      presupuesto_estimado: {
        ...analysis.presupuesto_estimado,
        total_clp: total,
        materials_percentage: (materialesTotal / costosDirectos) * 100,
        labor_percentage: (manoObraTotal / costosDirectos) * 100,
        equipment_percentage: (equiposTotal / costosDirectos) * 100,
        overhead_percentage: ((gastosGenerales + utilidad + contingencia) / costosDirectos) * 100
      },
      desglose_costos: {
        materiales: materialesTotal,
        mano_obra: manoObraTotal,
        equipos: equiposTotal,
        gastos_generales: gastosGenerales,
        utilidad: utilidad,
        contingencia: contingencia,
        subtotal: subtotal,
        iva: iva,
        total: total
      }
    };
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    const validation = validatePdfFile(file);
    setFileValidation(validation);

    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
    resetState();
    
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('⚠️ Advertencias:', validation.warnings);
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

  // ✅ ANÁLISIS CORREGIDO con validación de datos
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    if (!canAnalyze) {
      alert('🛡️ Límites del sistema alcanzados. Intente más tarde.');
      await refreshCostStatus();
      return;
    }

    try {
      console.log('📄 Iniciando análisis de PDF...');
      const result = await analyzePdf(selectedFile, config);
      
      console.log('📊 Resultado recibido del backend:', result);
      
      // ✅ VALIDAR Y CORREGIR datos antes de guardar
      const correctedResult = {
        ...result,
        analysis: validarYCorregirAnalisis(result.analysis)
      };
      
      console.log('✅ Resultado corregido:', correctedResult);
      
      setAnalysisResult(correctedResult);
      setShowResults(true);
      onAnalysisComplete?.(correctedResult);
      
      await refreshCostStatus();
    } catch (err) {
      console.error('❌ Error analizando PDF:', err);
    }
  };

  // ✅ FUNCIÓN CORREGIDA para mostrar análisis existente 
  const handleViewAnalysis = () => {
    console.log('🔍 Intentando mostrar análisis:', analysisResult);
    
    if (analysisResult) {
      console.log('📄 Mostrando análisis existente:', analysisResult);
      setShowResults(true);
    } else {
      console.log('❌ No hay análisis para mostrar');
      alert('No hay análisis disponible. Realice un análisis primero.');
    }
  };

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

  const getFileInfo = () => {
    if (!selectedFile) return null;
    
    const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
    const timeEstimate = estimateProcessingTime(selectedFile);
    
    return { sizeMB, timeEstimate };
  };

  const getConfigRecommendation = () => {
    if (!selectedFile) return null;
    
    const sizeMB = selectedFile.size / (1024 * 1024);
    
    if (sizeMB > 10) {
      return {
        analysisDepth: 'basic',
        reason: 'Archivo grande - análisis básico recomendado'
      };
    } else if (sizeMB > 5) {
      return {
        analysisDepth: 'standard',
        reason: 'Archivo medio - análisis estándar óptimo'
      };
    } else {
      return {
        analysisDepth: 'detailed',
        reason: 'Archivo pequeño - análisis detallado disponible'
      };
    }
  };

  // ✅ FUNCIÓN para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // ✅ FUNCIÓN para obtener el total correcto del presupuesto
  const getTotalPresupuesto = (analysis: any) => {
    // Priorizar desglose_costos.total si existe, sino usar presupuesto_estimado.total_clp
    return analysis.desglose_costos?.total || analysis.presupuesto_estimado?.total_clp || 0;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Panel de estado del sistema */}
      {costStatus && (
        <ComponentCard title="🛡️ Estado del Sistema" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-blue-900 dark:text-blue-300">Uso Diario</div>
              <div className="text-lg font-bold text-blue-600">
                {costStatus.global_usage?.daily?.percentage_used || 0}%
              </div>
              <div className="text-xs text-blue-500">
                ${costStatus.global_usage?.daily?.remaining?.toFixed(2) || '0.00'} restante
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-900 dark:text-blue-300">Uso Horario</div>
              <div className="text-lg font-bold text-blue-600">
                {costStatus.global_usage?.hourly?.percentage_used || 0}%
              </div>
              <div className="text-xs text-blue-500">
                {remainingAnalyses.hourly} análisis restantes
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-900 dark:text-blue-300">Estado</div>
              <div className={`text-lg font-bold ${canAnalyze ? 'text-green-600' : 'text-red-600'}`}>
                {canAnalyze ? '✅ Disponible' : '🚫 Limitado'}
              </div>
            </div>
          </div>
        </ComponentCard>
      )}

      {/* ✅ INFORMACIÓN del análisis disponible */}
      {analysisResult && (
        <ComponentCard title="📊 Análisis Disponible" className="bg-green-50 border-green-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <h4 className="font-medium text-green-600">Archivo</h4>
              <p className="text-sm text-green-900 truncate">
                {analysisResult.metadata?.originalFileName || 'PDF analizado'}
              </p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-green-600">Presupuesto</h4>
              <p className="text-lg font-bold text-green-800">
                {formatCurrency(getTotalPresupuesto(analysisResult.analysis))}
              </p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-green-600">Confianza</h4>
              <p className="text-lg font-bold text-green-800">
                {Math.round(analysisResult.analysis.confidence_score || 0)}%
              </p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-green-600">Items</h4>
              <p className="text-lg font-bold text-green-800">
                {(analysisResult.analysis.materiales_detallados?.length || 0) +
                 (analysisResult.analysis.mano_obra?.length || 0) +
                 (analysisResult.analysis.equipos_maquinaria?.length || 0)}
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button
              onClick={handleViewAnalysis}
              className="bg-green-600 hover:bg-green-700"
            >
              🔍 Ver Análisis Detallado Completo
            </Button>
          </div>
        </ComponentCard>
      )}

      {/* Upload Zone */}
      <ComponentCard title="📄 Análisis de Presupuesto PDF" className="bg-white dark:bg-gray-800">
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
              ${!canAnalyze ? 'opacity-50 cursor-not-allowed' : ''}
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
                    {getFileInfo()?.sizeMB} MB • Máximo 20MB
                  </p>
                  
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
                    {canAnalyze ? 'Arrastra el proyecto en formato PDF aquí' : '🛡️ Sistema en modo conservación'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {canAnalyze ? 'o haz clic para seleccionar archivo' : 'Límites temporales alcanzados'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing || !canAnalyze}
                >
                  Seleccionar Archivo
                </Button>
                <p className="text-xs text-gray-400">
                  Máximo 20MB • Solo archivos PDF
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
            disabled={isAnalyzing || !canAnalyze}
          />

          {/* Configuración */}
          {selectedFile && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  ⚙️ Configuración del Análisis
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

              {getConfigRecommendation() && (
                <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    💡 Recomendación del sistema:
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    {getConfigRecommendation()?.reason}
                  </div>
                  {config.analysisDepth !== getConfigRecommendation()?.analysisDepth && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-blue-600 border-blue-300"
                      onClick={() => setConfig(prev => ({ 
                        ...prev, 
                        analysisDepth: getConfigRecommendation()?.analysisDepth as any
                      }))}
                    >
                      Aplicar recomendación
                    </Button>
                  )}
                </div>
              )}

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
          {selectedFile && (
            <div className="flex items-center gap-3">
              {!isAnalyzing && !analysisResult && (
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !fileValidation?.isValid || !canAnalyze}
                  className="flex-1"
                >
                  🤖 Analizar con IA
                </Button>
              )}
              
              {/* ✅ BOTÓN para análisis existente */}
              {analysisResult && !isAnalyzing && (
                <Button
                  onClick={handleViewAnalysis}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  📊 Ver Análisis Completo
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isAnalyzing}
              >
                Limpiar
              </Button>
            </div>
          )}

          {/* Progreso */}
          {isAnalyzing && progress && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="font-medium text-blue-900 dark:text-blue-300">
                    Sistema Procesando
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
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-red-800 dark:text-red-300 font-medium mb-2">
                    ❌ Error en el Sistema
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
              
              <div className="mt-4 flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing || !canAnalyze}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  🔄 Reintentar
                </Button>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* ✅ MODAL SIN formatFunction prop */}
      {showResults && analysisResult && (
        <PdfAnalysisResultsModal
          isOpen={showResults}
          onClose={() => {
            console.log('🔒 Cerrando modal pero manteniendo datos...');
            setShowResults(false);
          }}
          analysisResult={analysisResult}
        />
      )}
    </div>
  );
};

export default PdfBudgetAnalyzer;