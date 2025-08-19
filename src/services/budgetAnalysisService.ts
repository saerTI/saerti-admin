// src/services/budgetAnalysisService.ts

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
  PdfAnalysisResult
} from '../types/budgetAnalysis';

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
      
      // Mejorar manejo de errores
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
   * 🔥 FUNCIÓN ACTUALIZADA: Analiza un PDF de presupuesto con timeout extendido
   * Compatible con tu servicio API existente
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

      // 🔥 LÍMITE AUMENTADO: 50MB para PDFs grandes
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('El archivo PDF no puede exceder 50MB');
      }

      // Preparar FormData
      const formData = new FormData();
      formData.append('pdfFile', file);
      
      // Agregar configuración
      Object.entries(config).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      console.log(`📄 Enviando PDF para análisis: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // 🔥 USAR TU SERVICIO API EXISTENTE con timeout personalizado
      try {
        const calculateTimeout = (fileSizeBytes: number): number => {
        const sizeMB = fileSizeBytes / (1024 * 1024);
        
        if (sizeMB < 5) {
          return 120000; // 2 minutes for small files
        } else if (sizeMB < 15) {
          return 360000; // 6 minutes for medium files (your case)
        } else {
          return 480000; // 8 minutes for large files
        }
      };

      const response = await api.postFormData<ApiResponse<PdfAnalysisResult>>(
        '/budget-analysis/pdf', 
        formData,
        {
          timeout: calculateTimeout(file.size),
        }
      );

        console.log('✅ Análisis PDF completado exitosamente');
        return response.data || response; // Manejar diferentes formatos de respuesta

      } catch (apiError: any) {
        console.error('❌ Error en API call:', apiError);
        
        // Manejar errores específicos de tu API service
        if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
          throw new Error(
            `⏱️ El análisis del PDF tomó más de ${file.size > 10 * 1024 * 1024 ? '3' : '1.5'} minutos.\n\n` +
            `Recomendaciones:\n` +
            `• El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB)\n` +
            `• Comprima el PDF o divídalo en partes más pequeñas\n` +
            `• Asegúrese de tener una conexión estable\n` +
            `• Intente nuevamente en unos minutos`
          );
        }

        if (apiError.response?.status === 413) {
          throw new Error('Archivo demasiado grande. Máximo 50MB permitido.');
        } else if (apiError.response?.status === 415) {
          throw new Error('Formato de archivo no soportado. Solo se permiten archivos PDF.');
        } else if (apiError.response?.status === 503) {
          throw new Error('Servicio de análisis temporalmente no disponible.');
        } else if (apiError.response?.status === 429) {
          throw new Error('Límite de API alcanzado. Intente en unos minutos.');
        }
        
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
 * 🔥 HOOK ACTUALIZADO: Hook personalizado para análisis de PDF compatible con tus tipos
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
      
      // 🔥 ESTIMACIÓN DE TIEMPO basada en tamaño del archivo
      const fileSizeMB = file.size / (1024 * 1024);
      const estimatedSeconds = fileSizeMB > 10 ? 180 : 90; // 3min para archivos grandes, 1.5min para pequeños
      setEstimatedTime(estimatedSeconds);
      
      setProgress({ 
        stage: 'uploading', 
        progress: 0, 
        message: `Preparando archivo (${fileSizeMB.toFixed(1)}MB)...` 
      });

      // 🔥 PROGRESO REALISTA basado en el tamaño del archivo
      const progressSteps: PdfAnalysisProgress[] = [
        { 
          stage: 'uploading', 
          progress: 5, 
          message: 'Enviando archivo al servidor...' 
        },
        { 
          stage: 'extracting', 
          progress: 15, 
          message: fileSizeMB > 5 ? 'Convirtiendo PDF a imágenes (esto puede tomar un momento)...' : 'Extrayendo texto del PDF...'
        },
        { 
          stage: 'chunking', 
          progress: 25, 
          message: 'Procesando páginas del documento...' 
        },
        { 
          stage: 'analyzing', 
          progress: 45, 
          message: 'Analizando con Claude Vision AI...' 
        },
        { 
          stage: 'analyzing', 
          progress: 70, 
          message: 'Identificando materiales y costos...' 
        },
        { 
          stage: 'consolidating', 
          progress: 90, 
          message: 'Consolidando análisis final...' 
        }
      ];

      // 🔥 PROGRESO CON TIMING REALISTA
      const stepDuration = (estimatedSeconds * 1000) / progressSteps.length;
      
      // Ejecutar pasos de progreso en paralelo con la llamada real
      let currentStepIndex = 0;
      const progressInterval = setInterval(() => {
        if (currentStepIndex < progressSteps.length) {
          setProgress(progressSteps[currentStepIndex]);
          currentStepIndex++;
        }
      }, stepDuration * 0.4); // Progreso más lento que el tiempo real

      try {
        // Llamar al servicio real
        const result = await budgetAnalysisService.analyzePdfBudget(file, config);
        
        // Limpiar interval de progreso
        clearInterval(progressInterval);
        
        setProgress({ 
          stage: 'complete', 
          progress: 100, 
          message: 'Análisis completado exitosamente' 
        });
        
        // Mantener el progreso completo por un momento antes de limpiar
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
      console.error('❌ Error en análisis PDF:', err);
      
      // 🔥 MENSAJES DE ERROR ESPECÍFICOS Y ÚTILES
      let errorMessage = err.message;
      
      if (err.message.includes('timeout') || err.message.includes('Timeout')) {
        errorMessage = `⏱️ El análisis tomó demasiado tiempo.\n\n` +
          `Recomendaciones:\n` +
          `• El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB)\n` +
          `• Comprima el PDF o divídalo en partes más pequeñas\n` +
          `• Asegúrese de tener una conexión estable\n` +
          `• Intente nuevamente en unos minutos`;
      } else if (err.message.includes('Network')) {
        errorMessage = '🌐 Error de conexión. Verifique su internet e intente nuevamente.';
      } else if (err.message.includes('413') || err.message.includes('grande')) {
        errorMessage = `📁 Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 50MB.`;
      } else if (err.message.includes('415') || err.message.includes('formato')) {
        errorMessage = '📄 Solo se permiten archivos PDF válidos.';
      } else if (err.message.includes('429') || err.message.includes('límite')) {
        errorMessage = '🚦 Límite de análisis alcanzado. Intente nuevamente en unos minutos.';
      } else if (err.message.includes('503') || err.message.includes('no disponible')) {
        errorMessage = '🔧 Servicio temporalmente no disponible. Intente nuevamente en unos minutos.';
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
 * Formatea resultados para visualización
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
    }
  };
};

/**
 * 🔥 NUEVA FUNCIÓN: Validador de archivos PDF antes de subir
 */
export const validatePdfFile = (file: File): { isValid: boolean; error?: string; warnings?: string[] } => {
  const warnings: string[] = [];
  
  // Validar tipo de archivo
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Solo se permiten archivos PDF' };
  }
  
  // Validar tamaño
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > 50) {
    return { isValid: false, error: 'El archivo no puede exceder 50MB' };
  }
  
  // Advertencias para archivos grandes
  if (sizeMB > 20) {
    warnings.push('Archivo grande: el procesamiento puede tomar varios minutos');
  }
  
  if (sizeMB > 10) {
    warnings.push('Para mejor rendimiento, considere comprimir el PDF');
  }
  
  // Validar nombre del archivo
  if (file.name.length > 100) {
    warnings.push('Nombre de archivo muy largo');
  }
  
  return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
};

/**
 * 🔥 NUEVA FUNCIÓN: Estimador de tiempo de procesamiento
 */
export const estimateProcessingTime = (file: File): { 
  estimatedSeconds: number; 
  category: 'fast' | 'medium' | 'slow';
  description: string;
} => {
  const sizeMB = file.size / (1024 * 1024);
  
  if (sizeMB < 2) {
    return {
      estimatedSeconds: 30,
      category: 'fast',
      description: 'Procesamiento rápido (menos de 1 minuto)'
    };
  } else if (sizeMB < 10) {
    return {
      estimatedSeconds: 90,
      category: 'medium', 
      description: 'Procesamiento medio (1-2 minutos)'
    };
  } else {
    return {
      estimatedSeconds: 180,
      category: 'slow',
      description: 'Procesamiento lento (2-3 minutos)'
    };
  }
};