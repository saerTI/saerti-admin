// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/utils/exportHandlers.ts

import type { PdfAnalysisResult } from '../../types/budgetAnalysis';

/**
 * Exporta los resultados del análisis como archivo JSON
 */
export const exportToJSON = (analysisResult: PdfAnalysisResult, filename: string = 'analisis-presupuesto') => {
  try {
    // Crear estructura de datos para exportar
    const exportData = {
      metadata: {
        analysisId: analysisResult.analysisId,
        exportedAt: new Date().toISOString(),
        exportedBy: 'SAER Budget Analyzer',
        version: '1.0'
      },
      analysis: {
        resumen_ejecutivo: analysisResult.analysis.resumen_ejecutivo,
        presupuesto_estimado: analysisResult.analysis.presupuesto_estimado,
        cronograma_estimado: analysisResult.analysis.cronograma_estimado,
        confidence_score: analysisResult.analysis.confidence_score
      },
      materiales: analysisResult.analysis.materiales_detallados || [],
      mano_obra: analysisResult.analysis.mano_obra || [],
      equipos: analysisResult.analysis.equipos_maquinaria || [],
      proveedores: analysisResult.analysis.proveedores_chile || [],
      riesgos: analysisResult.analysis.analisis_riesgos || [],
      recomendaciones: analysisResult.analysis.recomendaciones || [],
      processing_info: {
        chunks_procesados: analysisResult.metadata.chunksProcessed,
        tiempo_procesamiento: analysisResult.metadata.processingTime,
        tamaño_archivo_original: analysisResult.metadata.originalFileSize,
        longitud_texto: analysisResult.metadata.textLength
      }
    };

    // Convertir a JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Crear blob y descargar
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('✅ Análisis exportado como JSON exitosamente');
  } catch (error) {
    console.error('❌ Error exportando JSON:', error);
    throw new Error('Error al exportar archivo JSON');
  }
};

/**
 * Exporta los materiales y costos como archivo CSV
 */
export const exportToCSV = (analysisResult: PdfAnalysisResult, filename: string = 'analisis-presupuesto') => {
  try {
    const csvRows: string[] = [];
    
    // Headers principales
    csvRows.push('ANÁLISIS DE PRESUPUESTO - SAER');
    csvRows.push(`Análisis ID:,${analysisResult.analysisId}`);
    csvRows.push(`Fecha:,${new Date().toLocaleDateString('es-CL')}`);
    csvRows.push(`Presupuesto Total:,${analysisResult.analysis.presupuesto_estimado?.total_clp || 'N/A'}`);
    csvRows.push('');

    // Resumen ejecutivo
    csvRows.push('RESUMEN EJECUTIVO');
    csvRows.push(`"${analysisResult.analysis.resumen_ejecutivo || 'No disponible'}"`);
    csvRows.push('');

    // Materiales
    if (analysisResult.analysis.materiales_detallados?.length > 0) {
      csvRows.push('MATERIALES DETALLADOS');
      csvRows.push('Item,Cantidad,Unidad,Precio Unitario,Subtotal,Categoría');
      
      analysisResult.analysis.materiales_detallados.forEach(material => {
        csvRows.push([
          `"${material.item}"`,
          material.cantidad,
          `"${material.unidad}"`,
          material.precio_unitario,
          material.subtotal,
          `"${material.categoria}"`
        ].join(','));
      });
      csvRows.push('');
    }

    // Mano de obra
    if (analysisResult.analysis.mano_obra?.length > 0) {
      csvRows.push('MANO DE OBRA');
      csvRows.push('Especialidad,Cantidad Personas,Horas Totales,Tarifa por Hora,Subtotal');
      
      analysisResult.analysis.mano_obra.forEach(labor => {
        csvRows.push([
          `"${labor.especialidad}"`,
          labor.cantidad_personas,
          labor.horas_totales,
          labor.tarifa_hora,
          labor.subtotal
        ].join(','));
      });
      csvRows.push('');
    }

    // Equipos y maquinaria
    if (analysisResult.analysis.equipos_maquinaria?.length > 0) {
      csvRows.push('EQUIPOS Y MAQUINARIA');
      csvRows.push('Tipo Equipo,Tiempo de Uso,Tarifa por Período,Subtotal');
      
      analysisResult.analysis.equipos_maquinaria.forEach(equipo => {
        csvRows.push([
          `"${equipo.tipo_equipo}"`,
          `"${equipo.tiempo_uso}"`,
          equipo.tarifa_periodo,
          equipo.subtotal
        ].join(','));
      });
      csvRows.push('');
    }

    // Proveedores
    if (analysisResult.analysis.proveedores_chile?.length > 0) {
      csvRows.push('PROVEEDORES RECOMENDADOS');
      csvRows.push('Nombre,Contacto,Especialidad');
      
      analysisResult.analysis.proveedores_chile.forEach(proveedor => {
        csvRows.push([
          `"${proveedor.nombre}"`,
          `"${proveedor.contacto}"`,
          `"${proveedor.especialidad}"`
        ].join(','));
      });
      csvRows.push('');
    }

    // Análisis de riesgos
    if (analysisResult.analysis.analisis_riesgos?.length > 0) {
      csvRows.push('ANÁLISIS DE RIESGOS');
      csvRows.push('Factor,Probabilidad,Impacto,Mitigación');
      
      analysisResult.analysis.analisis_riesgos.forEach(riesgo => {
        csvRows.push([
          `"${riesgo.factor}"`,
          `"${riesgo.probability}"`,
          `"${riesgo.impact}"`,
          `"${riesgo.mitigation}"`
        ].join(','));
      });
      csvRows.push('');
    }

    // Recomendaciones
    if (analysisResult.analysis.recomendaciones?.length > 0) {
      csvRows.push('RECOMENDACIONES');
      analysisResult.analysis.recomendaciones.forEach((rec, index) => {
        csvRows.push(`${index + 1},"${rec}"`);
      });
      csvRows.push('');
    }

    // Información de procesamiento
    csvRows.push('INFORMACIÓN DE PROCESAMIENTO');
    csvRows.push(`Chunks procesados:,${analysisResult.metadata.chunksProcessed}`);
    csvRows.push(`Tiempo de procesamiento:,${analysisResult.metadata.processingTime}`);
    csvRows.push(`Tamaño archivo original:,${analysisResult.metadata.originalFileSize} bytes`);
    csvRows.push(`Confianza del análisis:,${analysisResult.analysis.confidence_score}%`);

    // Crear CSV string
    const csvString = csvRows.join('\n');
    
    // Agregar BOM para caracteres especiales en Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvString;
    
    // Crear blob y descargar
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('✅ Análisis exportado como CSV exitosamente');
  } catch (error) {
    console.error('❌ Error exportando CSV:', error);
    throw new Error('Error al exportar archivo CSV');
  }
};

/**
 * Exporta solo los materiales como CSV para importar en sistemas ERP
 */
export const exportMaterialsToERP = (materials: any[], filename: string = 'materiales-erp') => {
  try {
    const csvRows: string[] = [];
    
    // Header para ERP
    csvRows.push('codigo,descripcion,cantidad,unidad,precio_unitario,total,categoria,fecha_cotizacion');
    
    materials.forEach((material, index) => {
      csvRows.push([
        `MAT-${String(index + 1).padStart(4, '0')}`, // Código generado
        `"${material.item}"`,
        material.cantidad,
        `"${material.unidad}"`,
        material.precio_unitario,
        material.subtotal,
        `"${material.categoria}"`,
        new Date().toISOString().split('T')[0]
      ].join(','));
    });

    const csvString = csvRows.join('\n');
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvString;
    
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('✅ Materiales exportados para ERP exitosamente');
  } catch (error) {
    console.error('❌ Error exportando materiales para ERP:', error);
    throw new Error('Error al exportar materiales para ERP');
  }
};

/**
 * Exporta el cronograma como archivo de texto plano
 */
export const exportScheduleToTXT = (schedule: string, filename: string = 'cronograma') => {
  try {
    const content = `CRONOGRAMA DEL PROYECTO
Generado por: SAER Budget Analyzer
Fecha: ${new Date().toLocaleDateString('es-CL')}
================================================

${schedule}

================================================
Este cronograma es una estimación basada en el análisis 
automatizado del presupuesto. Se recomienda validar con 
especialistas en construcción.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('✅ Cronograma exportado exitosamente');
  } catch (error) {
    console.error('❌ Error exportando cronograma:', error);
    throw new Error('Error al exportar cronograma');
  }
};