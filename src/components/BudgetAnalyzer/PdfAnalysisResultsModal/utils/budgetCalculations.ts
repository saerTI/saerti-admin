// CORRECCIÓN 1: Función para calcular presupuesto de manera consistente
// src/utils/budgetCalculations.ts

export interface PresupuestoDetallado {
  costosDirectos: {
    materiales: number;
    manoObra: number;
    equipos: number;
    subcontratos: number;
    total: number;
  };
  costosIndirectos: {
    gastosGenerales: number;
    utilidad: number;
    contingencia: number;
    total: number;
  };
  presupuestoFinal: {
    subtotal: number;
    iva: number;
    total: number;
    totalUF: number;
    precioM2: number;
  };
}

/**
 * ✅ FUNCIÓN CORREGIDA para calcular presupuesto de manera consistente
 * Usa la metodología estándar chilena de construcción
 */
export const calcularPresupuestoCompleto = (
  materiales: number,
  manoObra: number,
  equipos: number,
  subcontratos: number = 0,
  areaM2: number = 100
): PresupuestoDetallado => {
  
  // PASO 1: Costos directos
  const costosDirectos = {
    materiales,
    manoObra,
    equipos,
    subcontratos,
    total: materiales + manoObra + equipos + subcontratos
  };

  // PASO 2: Costos indirectos (metodología estándar chilena)
  // Gastos generales: 12% sobre costos directos
  const gastosGenerales = costosDirectos.total * 0.12;
  
  // Utilidad: 10% sobre (costos directos + gastos generales)
  const baseUtilidad = costosDirectos.total + gastosGenerales;
  const utilidad = baseUtilidad * 0.10;
  
  // Contingencia: 5% sobre costos directos
  const contingencia = costosDirectos.total * 0.05;

  const costosIndirectos = {
    gastosGenerales,
    utilidad,
    contingencia,
    total: gastosGenerales + utilidad + contingencia
  };

  // PASO 3: Presupuesto final
  const subtotal = costosDirectos.total + costosIndirectos.total;
  const iva = subtotal * 0.19;
  const total = subtotal + iva;
  const totalUF = total / 36000; // Aproximación UF
  const precioM2 = total / areaM2;

  const presupuestoFinal = {
    subtotal,
    iva,
    total,
    totalUF,
    precioM2
  };

  return {
    costosDirectos,
    costosIndirectos,
    presupuestoFinal
  };
};

/**
 * ✅ FUNCIÓN para validar y corregir datos del backend
 */
export const validarYCorregirAnalisis = (analysis: any): any => {
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

  // Calcular presupuesto corregido
  const presupuestoCorregido = calcularPresupuestoCompleto(
    materialesTotal,
    manoObraTotal,
    equiposTotal,
    0, // subcontratos
    100 // área por defecto
  );

  console.log('✅ Presupuesto corregido:', presupuestoCorregido);

  // Actualizar analysis con valores corregidos
  const analysisCorrected = {
    ...analysis,
    presupuesto_estimado: {
      total_clp: presupuestoCorregido.presupuestoFinal.total,
      materials_percentage: (materialesTotal / presupuestoCorregido.costosDirectos.total) * 100,
      labor_percentage: (manoObraTotal / presupuestoCorregido.costosDirectos.total) * 100,
      equipment_percentage: (equiposTotal / presupuestoCorregido.costosDirectos.total) * 100,
      overhead_percentage: (presupuestoCorregido.costosIndirectos.total / presupuestoCorregido.costosDirectos.total) * 100
    },
    desglose_costos: {
      materiales: materialesTotal,
      mano_obra: manoObraTotal,
      equipos: equiposTotal,
      gastos_generales: presupuestoCorregido.costosIndirectos.gastosGenerales,
      utilidad: presupuestoCorregido.costosIndirectos.utilidad,
      contingencia: presupuestoCorregido.costosIndirectos.contingencia,
      subtotal: presupuestoCorregido.presupuestoFinal.subtotal,
      iva: presupuestoCorregido.presupuestoFinal.iva,
      total: presupuestoCorregido.presupuestoFinal.total
    },
    // Agregar información adicional para el frontend
    presupuesto_detallado: presupuestoCorregido
  };

  return analysisCorrected;
};

/**
 * ✅ FUNCIÓN para formatear los datos para el display
 */
export const formatearDatosParaDisplay = (analysis: any) => {
  // Primero validar y corregir el análisis
  const analysisCorrected = validarYCorregirAnalisis(analysis);
  
  return {
    summary: {
      title: 'Resumen Ejecutivo',
      content: analysisCorrected.resumen_ejecutivo,
      budget: analysisCorrected.desglose_costos?.total || analysisCorrected.presupuesto_estimado?.total_clp || 0,
      confidence: analysisCorrected.confidence_score
    },
    budget: {
      total: analysisCorrected.desglose_costos?.total || analysisCorrected.presupuesto_estimado?.total_clp || 0,
      materials: analysisCorrected.desglose_costos?.materiales || 0,
      labor: analysisCorrected.desglose_costos?.mano_obra || 0,
      equipment: analysisCorrected.desglose_costos?.equipos || 0,
      overhead: analysisCorrected.desglose_costos?.gastos_generales || 0,
      profit: analysisCorrected.desglose_costos?.utilidad || 0,
      contingency: analysisCorrected.desglose_costos?.contingencia || 0,
      subtotal: analysisCorrected.desglose_costos?.subtotal || 0,
      iva: analysisCorrected.desglose_costos?.iva || 0,
      pricePerM2: analysisCorrected.presupuesto_detallado?.presupuestoFinal?.precioM2 || 0
    },
    materials: {
      title: 'Materiales Detallados',
      items: analysisCorrected.materiales_detallados || [],
      total: analysisCorrected.desglose_costos?.materiales || 0
    },
    labor: {
      title: 'Mano de Obra',
      items: analysisCorrected.mano_obra || [],
      total: analysisCorrected.desglose_costos?.mano_obra || 0
    },
    equipment: {
      title: 'Equipos y Maquinaria',
      items: analysisCorrected.equipos_maquinaria || [],
      total: analysisCorrected.desglose_costos?.equipos || 0
    },
    providers: {
      title: 'Proveedores Identificados',
      items: analysisCorrected.proveedores_chile || []
    },
    risks: {
      title: 'Análisis de Riesgos',
      items: analysisCorrected.analisis_riesgos || []
    },
    recommendations: {
      title: 'Recomendaciones',
      items: analysisCorrected.recomendaciones || []
    },
    timeline: {
      title: 'Cronograma Estimado',
      content: analysisCorrected.cronograma_estimado
    },
    optimization: {
      title: 'Optimizaciones Aplicadas',
      chunks_processed: analysisCorrected.chunks_procesados || 0,
      chunks_successful: analysisCorrected.chunks_exitosos || 0,
      processing_method: analysisCorrected.processing_method || 'standard',
      extraction_metadata: analysisCorrected.extraction_metadata || {}
    },
    costs: {
      title: 'Desglose de Costos',
      breakdown: analysisCorrected.desglose_costos || {},
      regional_factors: analysisCorrected.factores_regionales || {}
    }
  };
};