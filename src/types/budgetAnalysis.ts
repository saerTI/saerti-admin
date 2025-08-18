// src/types/budgetAnalysis.ts

export interface ProjectData {
  id?: string;
  name?: string;
  type: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation';
  location: string;
  area: number;
  estimatedBudget?: number;
  description?: string;
  startDate?: string;
  client?: string;
  address?: string;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export interface AnalysisConfig {
  analysisDepth?: 'basic' | 'standard' | 'detailed';
  includeMarketData?: boolean;
  includeHistoricalData?: boolean;
  saveAnalysis?: boolean;
}

export interface BudgetBreakdown {
  porcentaje?: string;
  monto?: string;
  observaciones?: string;
}

export interface RegionalFactors {
  climaticos?: string;
  logisticos?: string;
  mano_obra?: string;
  normativos?: string;
}

export interface RiskAnalysis {
  riesgo: string;
  probabilidad: string;
  impacto: string;
  mitigacion: string;
}

// ✅ NUEVA: Estructura de análisis parseado del JSON
export interface ParsedAnalysis {
  resumen_ejecutivo: string;
  presupuesto_ajustado: string;
  desglose_detallado?: {
    estructura?: BudgetBreakdown;
    albañilería?: BudgetBreakdown;
    terminaciones?: BudgetBreakdown;
    instalaciones?: BudgetBreakdown;
    otros?: BudgetBreakdown;
    [key: string]: BudgetBreakdown | undefined; // Para permitir otras partidas
  };
  desglose_principal?: {
    estructura?: string;
    terminaciones?: string;
    instalaciones?: string;
    [key: string]: string | undefined;
  };
  factores_regionales?: RegionalFactors;
  analisis_riesgos?: RiskAnalysis[];
  factores_riesgo?: string[];
  recomendaciones?: string[];
  cronograma_sugerido?: string;
  contingencia_recomendada?: string;
}

// ✅ ACTUALIZADA: Estructura real que viene del backend
export interface BudgetAnalysis {
  // Campos que siempre vienen del backend
  resumen_ejecutivo: string;
  presupuesto_ajustado: string;
  nota: string;
  contenido_original: string; // ✅ AGREGADO: El JSON embebido en markdown
  
  // Campos opcionales que pueden venir directamente o parseados
  desglose_detallado?: {
    estructura?: BudgetBreakdown;
    albañilería?: BudgetBreakdown;
    terminaciones?: BudgetBreakdown;
    instalaciones?: BudgetBreakdown;
    otros?: BudgetBreakdown;
    [key: string]: BudgetBreakdown | undefined;
  };
  desglose_principal?: {
    estructura?: string;
    terminaciones?: string;
    instalaciones?: string;
    [key: string]: string | undefined;
  };
  factores_regionales?: RegionalFactors;
  analisis_riesgos?: RiskAnalysis[];
  factores_riesgo?: string[];
  recomendaciones?: string[];
  cronograma_sugerido?: string;
  contingencia_recomendada?: string;
  
  // Metadatos del análisis
  metadata?: {
    generated_at: string;
    model_used: string;
    project_id: string | null;
    confidence_score: number;
    api_cost_estimate: {
      input_tokens: number;
      output_tokens: number;
      estimated_cost_usd: number;
      estimated_cost_clp: number;
    };
  };
}

// ✅ ACTUALIZADA: Respuesta completa del servicio
export interface AnalysisResponse {
  success: boolean;
  message: string;
  data: {
    analysis: BudgetAnalysis;
    project_info: {
      id: string;
      name: string;
      location: string;
      estimated_budget?: number;
    };
    analysis_config: AnalysisConfig;
  };
  timestamp: string;
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  data: {
    confidence_score: number;
    is_analyzable: boolean;
    readiness_level: 'excellent' | 'good' | 'fair' | 'poor';
    suggestions: string[];
    estimated_analysis_quality: 'high' | 'medium' | 'basic';
  };
  timestamp: string;
}

export interface AnalysisHistoryItem {
  id: string;
  created_at: string;
  confidence_score: number;
  estimated_budget: number;
  summary: string;
}

export interface HealthCheckResponse {
  success: boolean;
  service: string;
  status: 'healthy' | 'unhealthy';
  checks: {
    api_key_configured: boolean;
    anthropic_service: string;
    database_connection: string;
  };
  capabilities: string[];
  supported_regions: string[];
  timestamp: string;
}

// Estados de loading y error
export interface BudgetAnalysisState {
  isLoading: boolean;
  isValidating: boolean;
  analysis: BudgetAnalysis | null;
  error: string | null;
  validationResult: ValidationResponse['data'] | null;
}

// Para formularios
export interface BudgetAnalysisFormData extends ProjectData {
  analysisDepth: 'basic' | 'standard' | 'detailed';
  includeMarketData: boolean;
  saveAnalysis: boolean;
}

// ✅ TIPOS PARA PDF ANALYSIS - AGREGADOS
export interface PdfAnalysisConfig {
  analysisDepth?: 'basic' | 'standard' | 'detailed';
  includeProviders?: boolean;
  projectType?: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation';
  projectLocation?: string;
  maxCostEstimate?: number;
  saveAnalysis?: boolean;
}

export interface PdfAnalysisProgress {
  stage: 'uploading' | 'extracting' | 'chunking' | 'analyzing' | 'consolidating' | 'complete';
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
  message: string;
}

export interface PdfAnalysisResult {
  analysisId: string;
  analysis: {
    resumen_ejecutivo: string;
    presupuesto_estimado: {
      total_clp: number;
      materials_percentage: number;
      labor_percentage: number;
      equipment_percentage: number;
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
    chunks_procesados: number;
    confidence_score: number;
  };
  metadata: {
    chunksProcessed: number;
    originalFileSize: number;
    textLength: number;
    processingTime: string;
  };
}

// ✅ NUEVA: Type guards para verificar estructura
export function isParsedAnalysis(analysis: any): analysis is ParsedAnalysis {
  return analysis && 
         typeof analysis === 'object' && 
         typeof analysis.resumen_ejecutivo === 'string' &&
         typeof analysis.presupuesto_ajustado === 'string';
}

export function hasDetailedBreakdown(analysis: ParsedAnalysis): boolean {
  return !!(analysis.desglose_detallado && 
            Object.keys(analysis.desglose_detallado).length > 0);
}

export function hasRiskAnalysis(analysis: ParsedAnalysis): boolean {
  return !!(analysis.analisis_riesgos && 
            Array.isArray(analysis.analisis_riesgos) && 
            analysis.analisis_riesgos.length > 0);
}

export function hasRecommendations(analysis: ParsedAnalysis): boolean {
  return !!(analysis.recomendaciones && 
            Array.isArray(analysis.recomendaciones) && 
            analysis.recomendaciones.length > 0);
}

// ✅ NUEVA: Helper para extraer y parsear contenido
export function parseAnalysisContent(analysis: BudgetAnalysis): ParsedAnalysis {
  try {
    // Si tiene contenido_original, extraer el JSON
    if (analysis.contenido_original && typeof analysis.contenido_original === 'string') {
      const jsonMatch = analysis.contenido_original.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[1]);
        return parsedData as ParsedAnalysis;
      }
    }
    
    // Si ya tiene la estructura correcta, usarla directamente
    if (analysis.desglose_detallado || analysis.presupuesto_ajustado) {
      return {
        resumen_ejecutivo: analysis.resumen_ejecutivo,
        presupuesto_ajustado: analysis.presupuesto_ajustado,
        desglose_detallado: analysis.desglose_detallado,
        factores_regionales: analysis.factores_regionales,
        analisis_riesgos: analysis.analisis_riesgos,
        recomendaciones: analysis.recomendaciones,
        cronograma_sugerido: analysis.cronograma_sugerido,
        contingencia_recomendada: analysis.contingencia_recomendada
      };
    }
    
    // Fallback: estructura básica
    return {
      resumen_ejecutivo: analysis.resumen_ejecutivo || "Análisis en proceso",
      presupuesto_ajustado: analysis.presupuesto_ajustado || "Por determinar",
      contingencia_recomendada: "20%"
    };
  } catch (error) {
    console.error('Error parseando análisis:', error);
    return {
      resumen_ejecutivo: "Error en análisis",
      presupuesto_ajustado: "Por revisar",
      contingencia_recomendada: "20%"
    };
  }
}