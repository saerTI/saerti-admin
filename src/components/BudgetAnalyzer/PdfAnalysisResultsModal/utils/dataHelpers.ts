// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/utils/dataHelpers.ts

import type { PdfAnalysisResult } from '../../types/budgetAnalysis';

export const formatPdfAnalysisForDisplay = (analysis: PdfAnalysisResult['analysis']) => {
  return {
    summary: {
      content: analysis.resumen_ejecutivo,
      budget: analysis.presupuesto_estimado?.total_clp || 0,
      confidence: analysis.confidence_score,
      breakdown: analysis.presupuesto_estimado
    },
    materials: {
      items: analysis.materiales_detallados || [],
      total: (analysis.materiales_detallados || []).reduce(
        (sum, item) => sum + (item.subtotal || 0), 0
      )
    },
    labor: {
      items: analysis.mano_obra || [],
      total: (analysis.mano_obra || []).reduce(
        (sum, item) => sum + (item.subtotal || 0), 0
      )
    },
    equipment: {
      items: analysis.equipos_maquinaria || [],
      total: (analysis.equipos_maquinaria || []).reduce(
        (sum, item) => sum + (item.subtotal || 0), 0
      )
    },
    providers: {
      items: analysis.proveedores_chile || []
    },
    risks: {
      items: analysis.analisis_riesgos || []
    },
    recommendations: {
      items: analysis.recomendaciones || []
    },
    timeline: {
      content: analysis.cronograma_estimado
    },
    optimization: {
      chunks_processed: analysis.chunks_procesados,
      chunks_successful: analysis.chunks_exitosos,
      processing_method: analysis.processing_method,
      extraction_metadata: analysis.extraction_metadata
    },
    costs: {
      breakdown: analysis.desglose_costos,
      regional_factors: analysis.factores_regionales
    }
  };
};