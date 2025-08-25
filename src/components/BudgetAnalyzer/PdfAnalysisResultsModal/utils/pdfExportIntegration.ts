// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/utils/pdfExportIntegration.ts
// INTEGRACIÓN SIMPLE DEL GENERADOR PDF EN EL MODAL EXISTENTE

import { generatePDFReport } from '@/services/pdfReportGenerator';
import type { PdfAnalysisResult } from '../../types/budgetAnalysis';

/**
 * ✅ FUNCIÓN SIMPLE para exportar PDF desde el análisis existente
 * Esta función transforma los datos del análisis al formato requerido por el generador PDF
 */
export const exportAnalysisToPDF = async (analysisResult: PdfAnalysisResult): Promise<void> => {
  try {
    console.log('📄 Iniciando exportación PDF...', analysisResult);

    // ✅ TRANSFORMAR datos del análisis al formato del generador PDF
    const analysis = analysisResult.analysis;
    
    // Calcular totales de costos directos
    const materialesTotal = analysis.materiales_detallados?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0;
    const manoObraTotal = analysis.mano_obra?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0;
    const equiposTotal = analysis.equipos_maquinaria?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0;
    const subcontratosTotal = 0; // Por ahora 0, se puede calcular si hay datos
    
    const costoDirectoTotal = materialesTotal + manoObraTotal + equiposTotal + subcontratosTotal;
    
    // Calcular costos indirectos (porcentajes estándar)
    const gastosGenerales = costoDirectoTotal * 0.12; // 12%
    const utilidad = (costoDirectoTotal + gastosGenerales) * 0.10; // 10%
    const contingencia = costoDirectoTotal * 0.05; // 5%
    const costosIndirectosTotal = gastosGenerales + utilidad + contingencia;
    
    // Calcular totales finales
    const subtotalNeto = costoDirectoTotal + costosIndirectosTotal;
    const iva = subtotalNeto * 0.19;
    const totalConIva = subtotalNeto + iva;
    
    // ✅ ESTRUCTURA COMPATIBLE con generatePDFReport
    const pdfData = {
      analysis: {
        resumen_ejecutivo: analysis.resumen_ejecutivo,
        cronograma_sugerido: analysis.cronograma_estimado,
        analisis_riesgos: analysis.analisis_riesgos?.map(riesgo => ({
          factor: riesgo.factor,
          probability: riesgo.probability,
          impact: riesgo.impact,
          mitigation: riesgo.mitigation
        })) || [],
        recomendaciones: analysis.recomendaciones || []
      },
      processedBudget: {
        costoDirecto: {
          materiales: materialesTotal,
          manoObra: manoObraTotal,
          equipos: equiposTotal,
          subcontratos: subcontratosTotal,
          total: costoDirectoTotal
        },
        costosIndirectos: {
          gastosGenerales: { monto: gastosGenerales, porcentaje: 12 },
          utilidad: { monto: utilidad, porcentaje: 10 },
          contingencia: { monto: contingencia, porcentaje: 5 },
          total: costosIndirectosTotal
        },
        presupuestoTotal: {
          costoDirectoTotal: costoDirectoTotal,
          costosIndirectosTotal: costosIndirectosTotal,
          subtotalNeto: subtotalNeto,
          iva: iva,
          totalConIva: totalConIva,
          totalUF: totalConIva / 36000, // Aproximación UF
          precioM2: totalConIva / 100 // Por defecto 100m², se puede ajustar
        }
      },
      projectInfo: {
        name: analysisResult.metadata?.originalFileName?.replace('.pdf', '') || 'Proyecto PDF',
        location: 'Chile', // Se puede extraer del análisis si está disponible
        area: 100 // Por defecto, se puede ajustar
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    console.log('📊 Datos transformados para PDF:', pdfData);

    // ✅ GENERAR PDF usando el servicio existente
    await generatePDFReport(pdfData);
    
    console.log('✅ PDF generado exitosamente');
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    
    // ✅ ERROR USER-FRIENDLY
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('jsPDF') || errorMessage.includes('autoTable')) {
      alert('Error en la generación del PDF. Verifique que las librerías estén instaladas correctamente.');
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      alert('Error de conexión. Verifique su internet e intente nuevamente.');
    } else {
      alert(`Error al generar el reporte PDF: ${errorMessage}`);
    }
    
    throw error;
  }
};

/**
 * ✅ FUNCIÓN HELPER para formatear moneda chilena
 */
export const formatChileanCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * ✅ FUNCIÓN HELPER para validar si el análisis tiene datos suficientes para el PDF
 */
export const validateAnalysisForPDF = (analysisResult: PdfAnalysisResult): { 
  isValid: boolean; 
  warnings: string[]; 
  canGenerate: boolean; 
} => {
  const warnings: string[] = [];
  let canGenerate = true;

  const analysis = analysisResult.analysis;

  // Verificar datos mínimos
  if (!analysis.resumen_ejecutivo || analysis.resumen_ejecutivo.trim().length < 10) {
    warnings.push('Resumen ejecutivo muy corto o ausente');
  }

  if (!analysis.materiales_detallados || analysis.materiales_detallados.length === 0) {
    warnings.push('No se encontraron materiales detallados');
  }

  if (!analysis.mano_obra || analysis.mano_obra.length === 0) {
    warnings.push('No se encontró información de mano de obra');
  }

  if (!analysis.presupuesto_estimado || !analysis.presupuesto_estimado.total_clp) {
    warnings.push('Presupuesto total no disponible');
    canGenerate = false;
  }

  // Verificar calidad del análisis
  if (analysis.confidence_score && analysis.confidence_score < 50) {
    warnings.push(`Confianza del análisis baja (${analysis.confidence_score}%)`);
  }

  // Verificar metadatos
  if (!analysisResult.metadata?.originalFileName) {
    warnings.push('Nombre del archivo original no disponible');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    canGenerate
  };
};

/**
 * ✅ FUNCIÓN para obtener estadísticas del análisis para mostrar en el PDF
 */
export const getAnalysisStats = (analysisResult: PdfAnalysisResult) => {
  const analysis = analysisResult.analysis;
  
  return {
    totalItems: (analysis.materiales_detallados?.length || 0) + 
                (analysis.mano_obra?.length || 0) + 
                (analysis.equipos_maquinaria?.length || 0),
    materialesCount: analysis.materiales_detallados?.length || 0,
    manoObraCount: analysis.mano_obra?.length || 0,
    equiposCount: analysis.equipos_maquinaria?.length || 0,
    proveedoresCount: analysis.proveedores_chile?.length || 0,
    riesgosCount: analysis.analisis_riesgos?.length || 0,
    recomendacionesCount: analysis.recomendaciones?.length || 0,
    confianza: Math.round(analysis.confidence_score || 0),
    chunksProcessed: analysis.chunks_procesados || 0,
    hasSchedule: !!(analysis.cronograma_estimado && analysis.cronograma_estimado.length > 50),
    hasRiskAnalysis: !!(analysis.analisis_riesgos && analysis.analisis_riesgos.length > 0),
    hasRecommendations: !!(analysis.recomendaciones && analysis.recomendaciones.length > 0)
  };
};