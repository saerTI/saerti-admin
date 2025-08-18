// src/services/budgetAnalysisService.ts

import React from 'react';
import api from './apiService';
import type {
  ProjectData,
  AnalysisConfig,
  AnalysisResponse,
  ValidationResponse,
  HealthCheckResponse,
  AnalysisHistoryItem
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