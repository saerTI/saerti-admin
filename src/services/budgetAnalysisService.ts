// src/services/budgetAnalysisService.ts - VERSIÓN CORREGIDA SIN ERRORES

import React from 'react';
import api from './apiService';
import type {
  ProjectData,
  AnalysisConfig,
  AnalysisResponse,
  ValidationResponse,
  HealthCheckResponse,
  AnalysisHistoryItem,
  PdfAnalysisConfig,
  PdfAnalysisProgress,
  PdfAnalysisResult,
  CostStatus,
  UsageStats,
  FileValidationResult
} from '../components/BudgetAnalyzer/types/budgetAnalysis';

// Interfaces para respuestas de la API siguiendo el patrón del proyecto
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface ApiPaginatedResponse<T> {
  success: boolean;
  data: {
    analyses: T[];
    pagination: {
      total: number;
      has_more: boolean;
      current_page: number;
      per_page: number;
    };
  };
  message: string;
}

// 🔥 INTERFAZ CORREGIDA: Para manejar la respuesta del backend optimizado
interface BackendPdfResponse {
  success: boolean;
  message: string;
  data: {
    analysis: {
      resumen_ejecutivo: string;
      presupuesto_estimado: {
        total_clp: number;
        materials_percentage: number;
        labor_percentage: number;
        equipment_percentage: number;
        overhead_percentage?: number; // OPCIONAL
      };
      materiales_detallados: Array<{
        item: string;
        cantidad: number;
        unidad: string;
        precio_unitario: number;
        subtotal: number;
        categoria: string;
      }>;
      mano_obra: Array<{
        especialidad: string;
        cantidad_personas: number;
        horas_totales: number;
        tarifa_hora: number;
        subtotal: number;
      }>;
      equipos_maquinaria: Array<{
        tipo_equipo: string;
        tiempo_uso: string;
        tarifa_periodo: number;
        subtotal: number;
      }>;
      proveedores_chile: Array<{
        nombre: string;
        contacto: string;
        especialidad: string;
      }>;
      analisis_riesgos: Array<{
        factor: string;
        probability: string;
        impact: string;
        mitigation: string;
      }>;
      recomendaciones: string[];
      cronograma_estimado: string;
      confidence_score: number;
      chunks_procesados: number;
      chunks_exitosos?: number;
      processing_method?: string;
      desglose_costos?: {
        materiales: number;
        mano_obra: number;
        equipos: number;
        gastos_generales: number;
        utilidad: number;
        total: number;
      };
      factores_regionales?: {
        market_conditions: string;
        logistics: string;
        local_regulations: string;
        climate_impact: string;
      };
      extraction_metadata?: any;
    };
    metadata: {
      analysisId: string;
      originalFileSize: number;
      originalFileName: string;
      contentLength: number;
      processingTime: string;
      processingTimeMs?: number;
      extraction?: {
        method: string;
        confidence: number;
        chunks_processed: number;
        chunks_successful: number;
      };
      optimization?: {
        cost_estimate_usd: number;
        cost_estimate_clp: number;
        model_used: string;
        optimization_applied: boolean;
        cost_warning: string;
      };
    };
  };
  timestamp: string;
}

export const budgetAnalysisService = {
  /**
   * Verifica el estado del servicio de análisis
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const response = await api.get<ApiResponse<HealthCheckResponse>>('/budget-analysis/health');
      return response.data;
    } catch (error) {
      console.error('Error checking service health:', error);
      throw new Error('Error verificando estado del servicio');
    }
  },

  /**
   * Valida datos del proyecto antes del análisis
   */
  async validateProject(projectData: ProjectData): Promise<ValidationResponse> {
    try {
      const response = await api.post<ApiResponse<ValidationResponse>>('/budget-analysis/validate-project', projectData);
      return response.data;
    } catch (error) {
      console.error('Error validating project:', error);
      throw new Error('Error validando datos del proyecto');
    }
  },

  /**
   * Genera análisis rápido sin asociar a proyecto específico
   */
  async generateQuickAnalysis(
    projectData: ProjectData, 
    config: AnalysisConfig = {}
  ): Promise<AnalysisResponse> {
    try {
      const requestData = {
        ...projectData,
        ...config
      };

      console.log('🚀 Generando análisis rápido:', requestData);

      const response = await api.post<ApiResponse<AnalysisResponse>>('/budget-analysis/quick', requestData);
      
      console.log('✅ Análisis recibido:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en análisis rápido:', error);
      
      if (error.response?.status === 429) {
        throw new Error('Límite de análisis alcanzado. Intente nuevamente en unos minutos.');
      } else if (error.response?.status === 503) {
        throw new Error('Servicio de análisis temporalmente no disponible.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Datos del proyecto inválidos.');
      }
      
      throw new Error('Error generando análisis presupuestario');
    }
  },

  /**
   * Genera análisis para proyecto específico
   */
  async generateProjectAnalysis(
    projectId: string,
    projectData: ProjectData,
    config: AnalysisConfig = {}
  ): Promise<AnalysisResponse> {
    try {
      const requestData = {
        projectData,
        ...config
      };

      const response = await api.post<ApiResponse<AnalysisResponse>>(`/projects/${projectId}/budget-analysis`, requestData);
      return response.data;
    } catch (error: any) {
      console.error('Error en análisis de proyecto:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Proyecto no encontrado');
      }
      
      throw new Error('Error generando análisis del proyecto');
    }
  },

  /**
   * 🔥 FUNCIÓN CORREGIDA: Compatible con backend optimizado
   */
  async analyzePdfBudget(
    file: File,
    config: PdfAnalysisConfig = {}
  ): Promise<PdfAnalysisResult> {
    try {
      // Validar archivo
      if (!file) {
        throw new Error('Archivo PDF es requerido');
      }

      if (file.type !== 'application/pdf') {
        throw new Error('Solo se permiten archivos PDF');
      }

      if (file.size > 20 * 1024 * 1024) {
        throw new Error('El archivo PDF no puede exceder 20MB');
      }

      // Preparar FormData con nombres correctos del backend
      const formData = new FormData();
      formData.append('pdfFile', file);

      // Agregar configuración con nombres exactos del backend optimizado
      if (config.analysisDepth) formData.append('analysisDepth', config.analysisDepth);
      if (config.projectType) formData.append('projectType', config.projectType);
      if (config.projectLocation) formData.append('projectLocation', config.projectLocation);
      if (config.includeProviders !== undefined) formData.append('includeProviders', config.includeProviders.toString());
      if (config.maxCostEstimate) formData.append('maxCostEstimate', config.maxCostEstimate.toString());
      if (config.saveAnalysis !== undefined) formData.append('saveAnalysis', config.saveAnalysis.toString());

      console.log(`📄 Enviando PDF para análisis: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      try {
        const calculateTimeout = (fileSizeBytes: number): number => {
          const sizeMB = fileSizeBytes / (1024 * 1024);
          
          if (sizeMB < 5) {
            return 120000;
          } else if (sizeMB < 15) {
            return 300000;
          } else {
            return 420000;
          }
        };

        // Usar tipo any para la respuesta inicial para manejar diferentes estructuras
        const response: any = await api.postFormData(
          '/budget-analysis/pdf', 
          formData,
          {
            timeout: calculateTimeout(file.size),
          }
        );

        console.log('✅ Análisis PDF completado exitosamente');
        console.log('🔍 Respuesta del backend:', response);

        // 🔥 VALIDACIÓN CRÍTICA: Verificar que tenemos una respuesta válida
        if (!response) {
          throw new Error('No se recibió respuesta del servidor');
        }

        // 🔥 NORMALIZACIÓN DE RESPUESTA: Manejar diferentes estructuras posibles
        let normalizedResponse: BackendPdfResponse;

        // Determinar la estructura de la respuesta
        if (response && typeof response === 'object') {
          // Si la respuesta ya tiene la estructura esperada
          if (response.success === true && response.data && response.data.analysis) {
            console.log('✅ Respuesta con estructura estándar detectada');
            normalizedResponse = response;
          }
          // Si la respuesta viene anidada en data
          else if (response.data && response.data.success === true && response.data.data) {
            console.log('✅ Respuesta anidada detectada, extrayendo...');
            normalizedResponse = response.data;
          }
          // Si la respuesta tiene directamente analysis y metadata
          else if (response.analysis && response.metadata) {
            console.log('✅ Respuesta directa de análisis detectada');
            normalizedResponse = {
              success: true,
              message: 'Análisis completado',
              data: {
                analysis: response.analysis,
                metadata: response.metadata
              },
              timestamp: new Date().toISOString()
            };
          }
          // Si la respuesta es solo el objeto data
          else if (response.data && response.data.analysis && response.data.metadata) {
            console.log('✅ Respuesta con data directo detectada');
            normalizedResponse = {
              success: true,
              message: response.message || 'Análisis completado',
              data: response.data,
              timestamp: response.timestamp || new Date().toISOString()
            };
          }
          else {
            console.error('❌ Estructura de respuesta no reconocida:', response);
            throw new Error('Estructura de respuesta del servidor no reconocida');
          }
        } else {
          console.error('❌ Respuesta inválida:', response);
          throw new Error('Respuesta del servidor inválida');
        }

        // 🔥 LOG DETALLADO para debugging
        console.log('📊 Respuesta normalizada:', {
          hasSuccess: 'success' in normalizedResponse,
          success: normalizedResponse.success,
          hasData: 'data' in normalizedResponse,
          hasAnalysis: normalizedResponse.data?.analysis ? true : false,
          hasMetadata: normalizedResponse.data?.metadata ? true : false,
          message: normalizedResponse.message
        });

        // 🔥 VALIDACIÓN DE ÉXITO: Solo fallar si explícitamente es false
        if (normalizedResponse.success === false) {
          console.error('❌ El servidor indicó fallo:', normalizedResponse.message);
          
          // Caso especial: PDF sin contenido suficiente
          if (normalizedResponse.message?.includes('no contiene suficientes')) {
            const minimalResult: PdfAnalysisResult = {
              analysisId: `pdf_${Date.now()}`,
              analysis: {
                resumen_ejecutivo: 'El documento no contiene suficiente información presupuestaria.',
                presupuesto_estimado: {
                  total_clp: 0,
                  materials_percentage: 0,
                  labor_percentage: 0,
                  equipment_percentage: 0,
                  overhead_percentage: 0
                },
                materiales_detallados: [],
                mano_obra: [],
                equipos_maquinaria: [],
                proveedores_chile: [],
                analisis_riesgos: [],
                recomendaciones: [
                  'El documento parece ser un PDF escaneado',
                  'Se recomienda usar un PDF con texto seleccionable'
                ],
                cronograma_estimado: 'No disponible',
                chunks_procesados: 0,
                confidence_score: 0
              },
              metadata: {
                chunksProcessed: 0,
                originalFileSize: file.size,
                textLength: 0,
                processingTime: new Date().toISOString(),
                originalFileName: file.name
              }
            };
            
            return minimalResult;
          }
          
          throw new Error(normalizedResponse.message || 'Error en el análisis del servidor');
        }

        // 🔥 EXTRACCIÓN DE DATOS: Asegurar que tenemos los datos necesarios
        const analysisData = normalizedResponse.data?.analysis;
        const metadataData = normalizedResponse.data?.metadata;

        if (!analysisData) {
          console.error('❌ No se encontraron datos de análisis en la respuesta normalizada');
          throw new Error('Respuesta sin datos de análisis');
        }

        // 🔥 CONSTRUCCIÓN DEL RESULTADO FINAL
        const result: PdfAnalysisResult = {
          analysisId: metadataData?.analysisId || `pdf_${Date.now()}`,
          analysis: {
            resumen_ejecutivo: analysisData.resumen_ejecutivo || 'Análisis completado',
            presupuesto_estimado: {
              total_clp: analysisData.presupuesto_estimado?.total_clp || 0,
              materials_percentage: analysisData.presupuesto_estimado?.materials_percentage || 0,
              labor_percentage: analysisData.presupuesto_estimado?.labor_percentage || 0,
              equipment_percentage: analysisData.presupuesto_estimado?.equipment_percentage || 0,
              overhead_percentage: analysisData.presupuesto_estimado?.overhead_percentage || 15
            },
            materiales_detallados: Array.isArray(analysisData.materiales_detallados) 
              ? analysisData.materiales_detallados 
              : [],
            mano_obra: Array.isArray(analysisData.mano_obra) 
              ? analysisData.mano_obra 
              : [],
            equipos_maquinaria: Array.isArray(analysisData.equipos_maquinaria) 
              ? analysisData.equipos_maquinaria 
              : [],
            proveedores_chile: Array.isArray(analysisData.proveedores_chile) 
              ? analysisData.proveedores_chile 
              : [],
            analisis_riesgos: Array.isArray(analysisData.analisis_riesgos) 
              ? analysisData.analisis_riesgos 
              : [],
            recomendaciones: Array.isArray(analysisData.recomendaciones) 
              ? analysisData.recomendaciones 
              : ['Análisis completado exitosamente'],
            cronograma_estimado: analysisData.cronograma_estimado || 'Por determinar',
            chunks_procesados: analysisData.chunks_procesados || 0,
            confidence_score: analysisData.confidence_score || 0,
            // Campos opcionales
            chunks_exitosos: analysisData.chunks_exitosos,
            processing_method: analysisData.processing_method,
            desglose_costos: analysisData.desglose_costos,
            factores_regionales: analysisData.factores_regionales,
            extraction_metadata: analysisData.extraction_metadata
          },
          metadata: {
            chunksProcessed: analysisData.chunks_procesados || metadataData?.extraction?.chunks_processed || 0,
            originalFileSize: metadataData?.originalFileSize || file.size,
            textLength: metadataData?.contentLength || 0,
            processingTime: metadataData?.processingTime || new Date().toISOString(),
            originalFileName: metadataData?.originalFileName || file.name,
            processingTimeMs: metadataData?.processingTimeMs,
            extraction: metadataData?.extraction,
            optimization: metadataData?.optimization
          }
        };

        console.log('✅ Análisis transformado exitosamente:', {
          id: result.analysisId,
          confianza: result.analysis.confidence_score,
          materiales: result.analysis.materiales_detallados.length,
          manoObra: result.analysis.mano_obra.length,
          equipos: result.analysis.equipos_maquinaria.length,
          proveedores: result.analysis.proveedores_chile.length,
          presupuestoTotal: result.analysis.presupuesto_estimado.total_clp
        });
        
        // Advertencia si el análisis tiene baja confianza
        if (result.analysis.confidence_score === 0 && 
            result.analysis.materiales_detallados.length === 0 &&
            result.analysis.mano_obra.length === 0) {
          
          console.warn('⚠️ Análisis con confianza 0% - PDF posiblemente no analizable');
          
          result.analysis.recomendaciones = [
            'El PDF parece ser escaneado o contener principalmente imágenes',
            'No se pudo extraer información presupuestaria estructurada',
            'Use un PDF con texto seleccionable para mejores resultados'
          ];
          
          result.analysis.resumen_ejecutivo = 
            'Análisis limitado: El documento PDF no contiene suficiente información textual extraíble.';
        }
        
        return result;

      } catch (apiError: any) {
        console.error('❌ Error en API call:', apiError);
        
        // Manejo de errores específicos
        if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
          throw new Error(
            `⏱️ El análisis del PDF tomó demasiado tiempo.\n\n` +
            `Recomendaciones:\n` +
            `• Comprima el PDF o divídalo en secciones más pequeñas\n` +
            `• Use análisis 'básico' en lugar de 'detallado'\n` +
            `• Asegúrese de tener una conexión estable`
          );
        }

        if (apiError.response?.status === 400) {
          const errorData = apiError.response.data;
          if (errorData?.error_code === 'COST_LIMIT_EXCEEDED') {
            throw new Error(
              `💰 ${errorData.message}\n\n` +
              `Sugerencias:\n` +
              `${errorData.suggestions?.join('\n• ') || '• Use un archivo más pequeño'}`
            );
          } else if (errorData?.error_code === 'INVALID_FILE') {
            throw new Error(`📄 ${errorData.message}`);
          }
        }

        if (apiError.response?.status === 413) {
          throw new Error('Archivo demasiado grande. Máximo 20MB permitido.');
        } else if (apiError.response?.status === 415) {
          throw new Error('Formato de archivo no soportado. Solo se permiten archivos PDF.');
        } else if (apiError.response?.status === 503) {
          throw new Error('Servicio de análisis temporalmente no disponible.');
        } else if (apiError.response?.status === 429) {
          throw new Error('Límite de API alcanzado. Intente nuevamente más tarde.');
        }
        
        // Error genérico
        throw new Error(
          apiError.response?.data?.message || 
          apiError.message ||
          'Error analizando archivo PDF'
        );
      }

    } catch (error: any) {
      console.error('❌ Error en analyzePdfBudget:', error);
      throw error;
    }
  },

  /**
   * 🔥 NUEVA FUNCIÓN: Validar PDF antes de analizar
   */
  async validatePdfBeforeAnalysis(
    file: File,
    config: PdfAnalysisConfig = {}
  ): Promise<FileValidationResult> {
    try {
      const formData = new FormData();
      formData.append('pdfFile', file);
      
      Object.entries(config).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const response = await api.postFormData<any>('/budget-analysis/pdf/validate', formData);
      
      return {
        isValid: response.data?.file_validation?.isValid || false,
        warnings: response.data?.warnings || [],
        costEstimate: response.data?.cost_estimate || {},
        recommendation: response.data?.recommendation || 'ERROR'
      };
    } catch (error: any) {
      console.error('Error validando PDF:', error);
      return {
        isValid: false,
        warnings: ['Error validando archivo'],
        costEstimate: {
          estimated_cost_usd: 0,
          estimated_cost_clp: 0,
          cost_warning: 'Error',
          chunks_to_process: 0
        },
        recommendation: 'ERROR'
      };
    }
  },

  /**
   * Obtiene resultado de análisis PDF por ID
   */
  async getPdfAnalysisResult(analysisId: string): Promise<PdfAnalysisResult> {
    try {
      const response = await api.get<ApiResponse<PdfAnalysisResult>>(`/budget-analysis/pdf/${analysisId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error en getPdfAnalysisResult:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Análisis no encontrado');
      }
      
      throw new Error('Error obteniendo análisis PDF');
    }
  },

  /**
   * Compara múltiples análisis de PDF
   */
  async comparePdfAnalyses(
    analysisIds: string[],
    comparisonType: 'materials' | 'labor' | 'providers' | 'total_cost' = 'total_cost'
  ) {
    try {
      const response = await api.post<ApiResponse<any>>('/budget-analysis/pdf/compare', {
        analysisIds,
        comparisonType
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error en comparePdfAnalyses:', error);
      throw new Error('Error comparando análisis PDF');
    }
  },

  /**
   * Obtiene historial de análisis de un proyecto
   */
  async getAnalysisHistory(
    projectId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ analyses: AnalysisHistoryItem[]; total: number; has_more: boolean }> {
    try {
      const response = await api.get<ApiPaginatedResponse<AnalysisHistoryItem>>(`/projects/${projectId}/budget-analysis/history`, {
        params: { limit, offset }
      });
      
      return {
        analyses: response.data.analyses,
        total: response.data.pagination.total,
        has_more: response.data.pagination.has_more
      };
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw new Error('Error obteniendo historial de análisis');
    }
  },

  /**
   * Compara múltiples análisis
   */
  async compareAnalyses(projectId: string, analysisIds: string[]) {
    try {
      const response = await api.post<ApiResponse<any>>(`/projects/${projectId}/budget-analysis/compare`, {
        analysisIds
      });
      
      return response.data;
    } catch (error) {
      console.error('Error comparando análisis:', error);
      throw new Error('Error comparando análisis');
    }
  },

  /**
   * 🔥 NUEVA FUNCIÓN: Obtener estadísticas de uso
   */
  async getUsageStats(): Promise<UsageStats> {
    try {
      const response = await api.get<ApiResponse<UsageStats>>('/budget-analysis/usage/stats');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error('Error obteniendo estadísticas de uso');
    }
  },

  /**
   * 🔥 NUEVA FUNCIÓN: Obtener estado de costos
   */
  async getCostStatus(): Promise<CostStatus> {
    try {
      const response = await api.get<ApiResponse<CostStatus>>('/budget-analysis/cost-status');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estado de costos:', error);
      throw new Error('Error obteniendo estado de costos');
    }
  }
};

// Hook personalizado para manejo de estado
export const useBudgetAnalysis = () => {
  const [state, setState] = React.useState<{
    isLoading: boolean;
    isValidating: boolean;
    analysis: any | null;
    error: string | null;
    validationResult: any | null;
  }>({
    isLoading: false,
    isValidating: false,
    analysis: null,
    error: null,
    validationResult: null
  });

  const validateProject = async (projectData: ProjectData) => {
    setState(prev => ({ ...prev, isValidating: true, error: null }));
    
    try {
      const result = await budgetAnalysisService.validateProject(projectData);
      setState(prev => ({ 
        ...prev, 
        validationResult: result, 
        isValidating: false 
      }));
      return result;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message, 
        isValidating: false 
      }));
      throw error;
    }
  };

  const generateAnalysis = async (projectData: ProjectData, config?: AnalysisConfig) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await budgetAnalysisService.generateQuickAnalysis(projectData, config);
      setState(prev => ({ 
        ...prev, 
        analysis: result, 
        isLoading: false 
      }));
      return result;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message, 
        isLoading: false 
      }));
      throw error;
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const clearAnalysis = () => {
    setState(prev => ({ ...prev, analysis: null, validationResult: null }));
  };

  return {
    ...state,
    validateProject,
    generateAnalysis,
    clearError,
    clearAnalysis
  };
};

/**
 * 🔥 HOOK CORREGIDO: Compatible con backend optimizado
 */
export const usePdfAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState<PdfAnalysisProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = React.useState<number | null>(null);

  const analyzePdf = async (file: File, config: PdfAnalysisConfig = {}) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const fileSizeMB = file.size / (1024 * 1024);
      const estimatedSeconds = fileSizeMB > 10 ? 120 : fileSizeMB > 5 ? 90 : 60;
      setEstimatedTime(estimatedSeconds);
      
      setProgress({ 
        stage: 'uploading', 
        progress: 0, 
        message: `Preparando archivo (${fileSizeMB.toFixed(1)}MB) para análisis optimizado...` 
      });

      const progressSteps: PdfAnalysisProgress[] = [
        { 
          stage: 'uploading', 
          progress: 5, 
          message: 'Enviando archivo al sistema optimizado...' 
        },
        { 
          stage: 'extracting', 
          progress: 15, 
          message: 'Validando archivo y estimando costos...'
        },
        { 
          stage: 'chunking', 
          progress: 25, 
          message: 'Aplicando chunking inteligente...' 
        },
        { 
          stage: 'analyzing', 
          progress: 45, 
          message: 'Analizando con Claude Vision (proceso optimizado)...' 
        },
        { 
          stage: 'analyzing', 
          progress: 70, 
          message: 'Extrayendo materiales y costos...' 
        },
        { 
          stage: 'consolidating', 
          progress: 90, 
          message: 'Consolidando resultados y aplicando optimizaciones...' 
        }
      ];

      const stepDuration = (estimatedSeconds * 1000) / progressSteps.length;
      
      let currentStepIndex = 0;
      const progressInterval = setInterval(() => {
        if (currentStepIndex < progressSteps.length) {
          setProgress(progressSteps[currentStepIndex]);
          currentStepIndex++;
        }
      }, stepDuration * 0.6);

      try {
        const result = await budgetAnalysisService.analyzePdfBudget(file, config);
        
        clearInterval(progressInterval);
        
        setProgress({ 
          stage: 'complete', 
          progress: 100, 
          message: 'Análisis completado con optimizaciones aplicadas' 
        });
        
        setTimeout(() => {
          setIsAnalyzing(false);
          setProgress(null);
          setEstimatedTime(null);
        }, 1500);
        
        return result;

      } catch (serviceError) {
        clearInterval(progressInterval);
        throw serviceError;
      }

    } catch (err: any) {
      console.error('❌ Error en análisis PDF optimizado:', err);
      
      let errorMessage = err.message;
      
      if (err.message.includes('COST_LIMIT') || err.message.includes('Límite diario')) {
        errorMessage = `🛡️ Sistema de protección de costos activado\n\n${err.message}`;
      } else if (err.message.includes('timeout') || err.message.includes('Timeout')) {
        errorMessage = `⏱️ Timeout del sistema optimizado\n\n${err.message}`;
      } else if (err.message.includes('HOURLY_ANALYSIS_LIMIT')) {
        errorMessage = `⏰ Límite horario alcanzado\n\n${err.message}`;
      } else if (err.message.includes('optimizado')) {
        errorMessage = err.message;
      } else if (err.message.includes('Network')) {
        errorMessage = '🌐 Error de conexión con el sistema optimizado. Verifique su internet e intente nuevamente.';
      } else if (err.message.includes('413') || err.message.includes('grande')) {
        errorMessage = `📁 Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 20MB con optimizaciones.`;
      }
      
      setError(errorMessage);
      setIsAnalyzing(false);
      setProgress(null);
      setEstimatedTime(null);
      throw new Error(errorMessage);
    }
  };

  const resetState = () => {
    setIsAnalyzing(false);
    setProgress(null);
    setError(null);
    setEstimatedTime(null);
  };

  return {
    analyzePdf,
    isAnalyzing,
    progress,
    error,
    estimatedTime,
    resetState
  };
};

/**
 * 🔥 FUNCIÓN CORREGIDA: Formatea resultados del backend optimizado
 */
export const formatPdfAnalysisForDisplay = (analysis: PdfAnalysisResult['analysis']) => {
  return {
    summary: {
      title: 'Resumen Ejecutivo',
      content: analysis.resumen_ejecutivo,
      budget: analysis.presupuesto_estimado?.total_clp || 0,
      confidence: analysis.confidence_score
    },
    materials: {
      title: 'Materiales Detallados',
      items: analysis.materiales_detallados || [],
      total: analysis.materiales_detallados?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0
    },
    labor: {
      title: 'Mano de Obra',
      items: analysis.mano_obra || [],
      total: analysis.mano_obra?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0
    },
    equipment: {
      title: 'Equipos y Maquinaria',
      items: analysis.equipos_maquinaria || [],
      total: analysis.equipos_maquinaria?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0
    },
    providers: {
      title: 'Proveedores Identificados',
      items: analysis.proveedores_chile || []
    },
    risks: {
      title: 'Análisis de Riesgos',
      items: analysis.analisis_riesgos || []
    },
    recommendations: {
      title: 'Recomendaciones',
      items: analysis.recomendaciones || []
    },
    timeline: {
      title: 'Cronograma Estimado',
      content: analysis.cronograma_estimado
    },
    optimization: {
      title: 'Optimizaciones Aplicadas',
      chunks_processed: analysis.chunks_procesados || 0,
      chunks_successful: analysis.chunks_exitosos || 0,
      processing_method: analysis.processing_method || 'standard',
      extraction_metadata: analysis.extraction_metadata || {}
    },
    costs: {
      title: 'Desglose de Costos',
      breakdown: analysis.desglose_costos || {},
      regional_factors: analysis.factores_regionales || {}
    }
  };
};

/**
 * 🔥 FUNCIÓN CORREGIDA: Validador de archivos PDF
 */
export const validatePdfFile = (file: File): { isValid: boolean; error?: string; warnings?: string[] } => {
  const warnings: string[] = [];
  
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Solo se permiten archivos PDF' };
  }
  
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > 20) {
    return { isValid: false, error: 'El archivo no puede exceder 20MB (límite del sistema optimizado)' };
  }
  
  if (sizeMB > 15) {
    warnings.push('Archivo muy grande: se usará modelo más eficiente para reducir costos');
  } else if (sizeMB > 10) {
    warnings.push('Archivo grande: el procesamiento puede tomar 3-5 minutos');
  } else if (sizeMB > 5) {
    warnings.push('Archivo medio: procesamiento optimizado de 1-2 minutos');
  }
  
  if (file.name.length > 100) {
    warnings.push('Nombre de archivo muy largo');
  }
  
  return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
};

/**
 * 🔥 FUNCIÓN CORREGIDA: Estimador de tiempo con optimizaciones
 */
export const estimateProcessingTime = (file: File) => {
  const sizeMB = file.size / (1024 * 1024);
  
  if (sizeMB < 2) {
    return {
      estimatedSeconds: 30,
      category: 'fast' as const,
      description: 'Procesamiento rápido con chunking inteligente',
      optimizations: ['Pre-validación', 'Chunking optimizado', 'Modelo estándar']
    };
  } else if (sizeMB < 5) {
    return {
      estimatedSeconds: 60,
      category: 'medium' as const, 
      description: 'Procesamiento medio con optimizaciones aplicadas',
      optimizations: ['Chunking inteligente', 'Validación de contenido', 'Control de costos']
    };
  } else if (sizeMB < 10) {
    return {
      estimatedSeconds: 90,
      category: 'medium' as const,
      description: 'Procesamiento optimizado para archivo grande',
      optimizations: ['Chunking avanzado', 'Modelo eficiente', 'Límite de chunks']
    };
  } else {
    return {
      estimatedSeconds: 120,
      category: 'slow' as const,
      description: 'Procesamiento con máximas optimizaciones',
      optimizations: ['Modelo económico', 'Chunking máximo', 'Validación estricta', 'Control de costos activo']
    };
  }
};

/**
 * 🔥 Hook para monitorear costos del sistema
 */
export const useCostMonitoring = () => {
  const [costStatus, setCostStatus] = React.useState<CostStatus | null>(null);
  const [usageStats, setUsageStats] = React.useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshCostStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [costs, usage] = await Promise.all([
        budgetAnalysisService.getCostStatus(),
        budgetAnalysisService.getUsageStats()
      ]);
      
      setCostStatus(costs);
      setUsageStats(usage);
    } catch (err: any) {
      setError(err.message);
      console.error('Error obteniendo estado de costos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const canAnalyze = React.useMemo(() => {
    if (!costStatus) return true;
    
    const dailyUsage = parseFloat(costStatus.global_usage?.daily?.percentage_used || '0');
    const hourlyUsage = parseFloat(costStatus.global_usage?.hourly?.percentage_used || '0');
    const userUsage = parseFloat(costStatus.user_usage?.percentage_used || '0');
    
    return dailyUsage < 90 && hourlyUsage < 90 && userUsage < 90;
  }, [costStatus]);

  const getRemainingAnalyses = React.useMemo(() => {
    if (!costStatus) return { daily: '∞', hourly: '∞', user: '∞' };
    
    return {
      daily: costStatus.global_usage?.daily?.remaining || 0,
      hourly: costStatus.global_usage?.hourly?.remaining || 0,
      user: costStatus.user_usage?.remaining || 0
    };
  }, [costStatus]);

  React.useEffect(() => {
    refreshCostStatus();
    
    const interval = setInterval(refreshCostStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    costStatus,
    usageStats,
    isLoading,
    error,
    canAnalyze,
    remainingAnalyses: getRemainingAnalyses,
    refreshCostStatus
  };
};

/**
 * 🔥 Hook para pre-validación
 */
export const usePreValidation = () => {
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<FileValidationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const validateFile = async (file: File, config: PdfAnalysisConfig = {}) => {
    try {
      setIsValidating(true);
      setError(null);
      
      const result = await budgetAnalysisService.validatePdfBeforeAnalysis(file, config);
      setValidationResult(result);
      
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsValidating(false);
    }
  };

  const clearValidation = () => {
    setValidationResult(null);
    setError(null);
  };

  return {
    validateFile,
    isValidating,
    validationResult,
    error,
    clearValidation
  };
};

export default budgetAnalysisService;