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
   * Analiza un PDF de presupuesto
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

      if (file.size > 15 * 1024 * 1024) {
        throw new Error('El archivo PDF no puede exceder 15MB');
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

      console.log('📄 Enviando PDF para análisis:', file.name);

      // Usar api service para consistencia, pero necesitamos FormData
      const response = await api.postFormData<ApiResponse<PdfAnalysisResult>>('/budget-analysis/pdf', formData);
      
      console.log('✅ Análisis PDF completado');
      
      return response.data;

    } catch (error: any) {
      console.error('Error en analyzePdfBudget:', error);
      
      if (error.response?.status === 413) {
        throw new Error('Archivo demasiado grande. Máximo 15MB permitido.');
      } else if (error.response?.status === 415) {
        throw new Error('Formato de archivo no soportado. Solo se permiten archivos PDF.');
      } else if (error.response?.status === 503) {
        throw new Error('Servicio de análisis temporalmente no disponible.');
      }
      
      throw new Error('Error analizando archivo PDF');
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
 * Hook personalizado para análisis de PDF
 */
export const usePdfAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState<PdfAnalysisProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const analyzePdf = async (file: File, config: PdfAnalysisConfig = {}) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setProgress({ stage: 'uploading', progress: 0, message: 'Preparando archivo...' });

      // Simular progreso mientras se procesa
      const progressSteps: PdfAnalysisProgress[] = [
        { stage: 'uploading', progress: 10, message: 'Enviando archivo...' },
        { stage: 'extracting', progress: 30, message: 'Extrayendo texto del PDF...' },
        { stage: 'chunking', progress: 50, message: 'Dividiendo documento...' },
        { stage: 'analyzing', progress: 80, message: 'Analizando contenido...' },
        { stage: 'consolidating', progress: 95, message: 'Finalizando análisis...' }
      ];

      // Simular progreso paso a paso
      for (const step of progressSteps) {
        setProgress(step);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = await budgetAnalysisService.analyzePdfBudget(file, config);
      
      setProgress({ stage: 'complete', progress: 100, message: 'Análisis completado' });
      setIsAnalyzing(false);
      return result;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsAnalyzing(false);
      throw err;
    }
  };

  const resetState = () => {
    setIsAnalyzing(false);
    setProgress(null);
    setError(null);
  };

  return {
    analyzePdf,
    isAnalyzing,
    progress,
    error,
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