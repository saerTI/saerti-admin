// src/services/pdfReportGenerator.ts

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Declaración de tipos para jsPDF con autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
    getNumberOfPages(): number;
  }
}

interface PDFReportData {
  analysis: any;
  processedBudget: {
    costoDirecto: {
      materiales: number;
      manoObra: number;
      equipos: number;
      subcontratos: number;
      total: number;
    };
    costosIndirectos: {
      gastosGenerales: { monto: number; porcentaje: number };
      utilidad: { monto: number; porcentaje: number };
      contingencia: { monto: number; porcentaje: number };
      total: number;
    };
    presupuestoTotal: {
      costoDirectoTotal: number;
      costosIndirectosTotal: number;
      subtotalNeto: number;
      iva: number;
      totalConIva: number;
      totalUF: number;
      precioM2: number;
    };
  };
  projectInfo?: {
    name: string;
    location: string;
    area: number;
  };
  metadata?: {
    generatedAt: string;
    version: string;
  };
}

export const generatePDFReport = async (data: PDFReportData): Promise<void> => {
  try {
    // Crear nuevo documento PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configuración de fuentes y colores - Usando tuplas para TypeScript
    const primaryColor: [number, number, number] = [59, 130, 246]; // blue-600
    const secondaryColor: [number, number, number] = [107, 114, 128]; // gray-500
    const successColor: [number, number, number] = [16, 185, 129]; // green-500
    
    let yPosition = 20;

    // Función helper para formatear moneda
    const formatCLP = (amount: number): string => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
      }).format(amount);
    };

    // Función helper para formatear UF
    const formatUF = (amount: number): string => {
      return `UF ${new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)}`;
    };

    // =================
    // PÁGINA 1: PORTADA
    // =================
    
    // Logo o Título
    pdf.setFontSize(24);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('ANÁLISIS PRESUPUESTARIO', 105, yPosition, { align: 'center' });
    
    yPosition += 10;
    pdf.setFontSize(16);
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.text('Informe Detallado de Costos', 105, yPosition, { align: 'center' });
    
    // Información del proyecto
    yPosition += 20;
    if (data.projectInfo) {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Proyecto: ${data.projectInfo.name}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Ubicación: ${data.projectInfo.location}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Superficie: ${data.projectInfo.area} m²`, 20, yPosition);
    }
    
    // Fecha de generación
    yPosition += 15;
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const fecha = new Date().toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`Fecha de generación: ${fecha}`, 20, yPosition);
    
    // Cuadro de resumen principal
    yPosition += 20;
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(20, yPosition, 170, 60, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('PRESUPUESTO TOTAL', 105, yPosition + 15, { align: 'center' });
    
    pdf.setFontSize(24);
    pdf.text(formatCLP(data.processedBudget.presupuestoTotal.totalConIva), 105, yPosition + 30, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`(${formatUF(data.processedBudget.presupuestoTotal.totalUF)})`, 105, yPosition + 40, { align: 'center' });
    
    if (data.projectInfo?.area) {
      pdf.setFontSize(10);
      pdf.text(`Precio por m²: ${formatCLP(data.processedBudget.presupuestoTotal.precioM2)}`, 105, yPosition + 50, { align: 'center' });
    }
    
    // =================
    // PÁGINA 2: DESGLOSE DE COSTOS
    // =================
    pdf.addPage();
    yPosition = 20;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.text('Desglose Detallado de Costos', 20, yPosition);
    
    yPosition += 15;
    
    // Tabla de Costos Directos
    pdf.setFontSize(14);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('1. COSTOS DIRECTOS (CD)', 20, yPosition);
    
    yPosition += 10;
    
    const costosDirectosData: any[][] = [
      ['Materiales', formatCLP(data.processedBudget.costoDirecto.materiales)],
      ['Mano de Obra', formatCLP(data.processedBudget.costoDirecto.manoObra)],
      ['Equipos', formatCLP(data.processedBudget.costoDirecto.equipos)],
    ];
    
    if (data.processedBudget.costoDirecto.subcontratos > 0) {
      costosDirectosData.push(['Subcontratos', formatCLP(data.processedBudget.costoDirecto.subcontratos)]);
    }
    
    costosDirectosData.push([
      'TOTAL COSTOS DIRECTOS',
      formatCLP(data.processedBudget.costoDirecto.total)
    ]);
    
    pdf.autoTable({
      startY: yPosition,
      head: [['Concepto', 'Monto']],
      body: costosDirectosData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 70, halign: 'right' }
      },
      // Estilos para la última fila (total)
      didParseCell: function(data: any) {
        if (data.row.index === costosDirectosData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    yPosition = pdf.lastAutoTable.finalY + 15;
    
    // Tabla de Costos Indirectos
    pdf.setFontSize(14);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('2. COSTOS INDIRECTOS (CI)', 20, yPosition);
    
    yPosition += 10;
    
    const costosIndirectosData: any[][] = [
      [`Gastos Generales (${data.processedBudget.costosIndirectos.gastosGenerales.porcentaje}% CD)`, 
       formatCLP(data.processedBudget.costosIndirectos.gastosGenerales.monto)],
      [`Utilidad (${data.processedBudget.costosIndirectos.utilidad.porcentaje}% CD+GG)`, 
       formatCLP(data.processedBudget.costosIndirectos.utilidad.monto)],
      [`Contingencia (${data.processedBudget.costosIndirectos.contingencia.porcentaje}% CD)`, 
       formatCLP(data.processedBudget.costosIndirectos.contingencia.monto)],
      [
        'TOTAL COSTOS INDIRECTOS',
        formatCLP(data.processedBudget.costosIndirectos.total)
      ]
    ];
    
    pdf.autoTable({
      startY: yPosition,
      head: [['Concepto', 'Monto']],
      body: costosIndirectosData,
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234] }, // purple-600
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 70, halign: 'right' }
      },
      didParseCell: function(data: any) {
        if (data.row.index === costosIndirectosData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    yPosition = pdf.lastAutoTable.finalY + 15;
    
    // Tabla de Resumen Final
    pdf.setFontSize(14);
    pdf.setTextColor(successColor[0], successColor[1], successColor[2]);
    pdf.text('3. RESUMEN FINAL', 20, yPosition);
    
    yPosition += 10;
    
    const resumenFinalData: any[][] = [
      ['Total Costos Directos (CD)', formatCLP(data.processedBudget.presupuestoTotal.costoDirectoTotal)],
      ['Total Costos Indirectos (CI)', formatCLP(data.processedBudget.presupuestoTotal.costosIndirectosTotal)],
      ['SUBTOTAL NETO (CD + CI)', formatCLP(data.processedBudget.presupuestoTotal.subtotalNeto)],
      ['IVA (19%)', formatCLP(data.processedBudget.presupuestoTotal.iva)],
      ['TOTAL GENERAL', formatCLP(data.processedBudget.presupuestoTotal.totalConIva)]
    ];
    
    pdf.autoTable({
      startY: yPosition,
      head: [['Concepto', 'Monto']],
      body: resumenFinalData,
      theme: 'striped',
      headStyles: { fillColor: successColor },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 70, halign: 'right' }
      },
      didParseCell: function(data: any) {
        // Estilo para subtotal (índice 2) y total (índice 4)
        if (data.row.index === 2 || data.row.index === 4) {
          data.cell.styles.fontStyle = 'bold';
        }
        // Estilo especial para el total final
        if (data.row.index === 4) {
          data.cell.styles.fontSize = 14;
        }
      }
    });
    
    // =================
    // PÁGINA 3: CRONOGRAMA Y ANÁLISIS
    // =================
    if (data.analysis.cronograma_sugerido || data.analysis.analisis_riesgos?.length > 0) {
      pdf.addPage();
      yPosition = 20;
      
      // Cronograma
      if (data.analysis.cronograma_sugerido) {
        pdf.setFontSize(18);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Cronograma del Proyecto', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(11);
        
        const cronogramaLines = data.analysis.cronograma_sugerido.split('\n');
        cronogramaLines.forEach((line: string) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      }
      
      // Análisis de Riesgos
      if (data.analysis.analisis_riesgos?.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(18);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Análisis de Riesgos', 20, yPosition);
        
        yPosition += 10;
        
        const riesgosData = data.analysis.analisis_riesgos.map((riesgo: any) => {
          if (typeof riesgo === 'string') {
            return [riesgo, '-', '-', '-'];
          }
          return [
            riesgo.factor || '',
            riesgo.probability || '-',
            riesgo.impact || '-',
            riesgo.mitigation || '-'
          ];
        });
        
        pdf.autoTable({
          startY: yPosition,
          head: [['Factor de Riesgo', 'Probabilidad', 'Impacto', 'Mitigación']],
          body: riesgosData,
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68] }, // red-500
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 60 }
          }
        });
      }
    }
    
    // =================
    // PÁGINA 4: RECOMENDACIONES Y NOTAS
    // =================
    if (data.analysis.recomendaciones?.length > 0) {
      pdf.addPage();
      yPosition = 20;
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Recomendaciones', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(11);
      
      data.analysis.recomendaciones.forEach((rec: string, index: number) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${index + 1}. ${rec}`, 25, yPosition);
        yPosition += 8;
      });
    }
    
    // Notas finales
    yPosition += 15;
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(12);
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.text('NOTAS IMPORTANTES:', 20, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(10);
    const notas = [
      '• Los Gastos Generales (12%) y Utilidad (10%) son estándares de la industria chilena',
      '• El presupuesto incluye contingencia del 5% para imprevistos',
      '• Todos los valores incluyen IVA (19%)',
      '• Los valores son estimaciones basadas en proyectos similares',
      '• Se recomienda validar con cotizaciones actualizadas de proveedores'
    ];
    
    notas.forEach(nota => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(nota, 20, yPosition);
      yPosition += 6;
    });
    
    // Footer en todas las páginas
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text(
        `Página ${i} de ${pageCount} | Generado por Cash Flow Pro | ${fecha}`,
        105,
        290,
        { align: 'center' }
      );
    }
    
    // Guardar el PDF
    pdf.save(`presupuesto_${data.projectInfo?.name || 'proyecto'}_${new Date().getTime()}.pdf`);
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};

// Función alternativa para exportar con html2canvas (para gráficos complejos)
export const generatePDFWithCharts = async (elementId: string, fileName: string = 'presupuesto'): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Elemento no encontrado');
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // Primera página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm
    
    // Agregar páginas adicionales si es necesario
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    
    pdf.save(`${fileName}_${new Date().getTime()}.pdf`);
    
  } catch (error) {
    console.error('Error generando PDF con gráficos:', error);
    throw error;
  }
};

// Función para generar PDF de cronograma Gantt
export const generateGanttPDF = async (ganttData: any): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const primaryColor: [number, number, number] = [59, 130, 246];
    let yPosition = 20;
    
    // Título
    pdf.setFontSize(20);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Cronograma del Proyecto - Diagrama Gantt', 148, yPosition, { align: 'center' });
    
    yPosition += 15;
    
    // Información del proyecto
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Duración Total: ${ganttData.duracionTotal.meses} meses`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Fecha de Inicio: ${ganttData.fechaInicio}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Fecha de Término: ${ganttData.fechaFin}`, 20, yPosition);
    
    yPosition += 15;
    
    // Tabla de fases
    const fasesData = ganttData.fases.map((fase: any) => [
      fase.nombre,
      fase.fechaInicio,
      fase.fechaFin,
      `${fase.duracionDias} días`,
      `${fase.porcentajeAvance}%`
    ]);
    
    pdf.autoTable({
      startY: yPosition,
      head: [['Fase', 'Inicio', 'Fin', 'Duración', 'Avance']],
      body: fasesData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 }
      }
    });
    
    yPosition = pdf.lastAutoTable.finalY + 15;
    
    // Hitos importantes
    if (ganttData.hitos && ganttData.hitos.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('Hitos Importantes', 20, yPosition);
      
      yPosition += 10;
      
      const hitosData = ganttData.hitos.map((hito: any) => [
        hito.nombre,
        hito.fecha,
        hito.descripcion
      ]);
      
      pdf.autoTable({
        startY: yPosition,
        head: [['Hito', 'Fecha', 'Descripción']],
        body: hitosData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }, // green-500
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 110 }
        }
      });
    }
    
    // Guardar
    pdf.save(`cronograma_gantt_${new Date().getTime()}.pdf`);
    
  } catch (error) {
    console.error('Error generando PDF de Gantt:', error);
    throw error;
  }
};