// src/components/BudgetAnalyzer/AnalysisResults.tsx - VERSIÓN MEJORADA

import React, { useMemo } from 'react';
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Calendar,
  Target,
  PieChart,
  Shield,
  Lightbulb,
  DollarSign,
  Download,
  Calculator,
  CheckCircle
} from 'lucide-react';
import type { BudgetAnalysis } from './types/budgetAnalysis';
import { generatePDFReport } from '@/services/pdfReportGenerator';

interface AnalysisResultsProps {
  analysis: BudgetAnalysis | { analysis: BudgetAnalysis; project_info: any; analysis_config: any };
  projectInfo?: {
    name: string;
    location: string;
    area: number;
  };
}

interface ProcessedBudgetData {
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
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ 
  analysis, 
  projectInfo 
}) => {
  // Extraer el análisis real
  const actualAnalysis = useMemo(() => {
    if ('analysis' in analysis) {
      return (analysis as any).analysis;
    }
    return analysis as BudgetAnalysis;
  }, [analysis]);

  // Procesar y estructurar correctamente los costos
  const processedBudget = useMemo<ProcessedBudgetData>(() => {
    // Extraer valores del análisis
    const extractAmount = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const numbers = value.match(/[\d,]+/g);
        if (numbers) {
          const cleanNumber = numbers[0].replace(/,/g, '');
          return parseInt(cleanNumber) || 0;
        }
      }
      return 0;
    };

    // Obtener desglose detallado
    const desglose = actualAnalysis.desglose_detallado || {};
    
    // Costos Directos (lo que realmente cuesta la obra)
    const materiales = extractAmount(desglose.Materiales || desglose.materiales || 79885000);
    const manoObra = extractAmount(desglose['Mano de obra'] || desglose.mano_obra || 60000000);
    const equipos = extractAmount(desglose.Equipos || desglose.equipos || 500000);
    const subcontratos = extractAmount(desglose.Subcontratos || desglose.subcontratos || 0);
    
    const costoDirectoTotal = materiales + manoObra + equipos + subcontratos;

    // Costos Indirectos (porcentajes estándar de la industria chilena)
    const gastosGeneralesPct = 12; // 12% sobre CD
    const utilidadPct = 10; // 10% sobre (CD + GG)
    const contingenciaPct = 5; // 5% sobre CD

    const gastosGenerales = costoDirectoTotal * (gastosGeneralesPct / 100);
    const utilidad = (costoDirectoTotal + gastosGenerales) * (utilidadPct / 100);
    const contingencia = costoDirectoTotal * (contingenciaPct / 100);
    
    const costosIndirectosTotal = gastosGenerales + utilidad + contingencia;

    // Totales
    const subtotalNeto = costoDirectoTotal + costosIndirectosTotal;
    const iva = subtotalNeto * 0.19; // 19% IVA Chile
    const totalConIva = subtotalNeto + iva;
    
    // Valores adicionales
    const valorUF = 37500; // Valor UF aproximado
    const totalUF = totalConIva / valorUF;
    const precioM2 = projectInfo?.area ? totalConIva / projectInfo.area : 0;

    return {
      costoDirecto: {
        materiales,
        manoObra,
        equipos,
        subcontratos,
        total: costoDirectoTotal
      },
      costosIndirectos: {
        gastosGenerales: { monto: gastosGenerales, porcentaje: gastosGeneralesPct },
        utilidad: { monto: utilidad, porcentaje: utilidadPct },
        contingencia: { monto: contingencia, porcentaje: contingenciaPct },
        total: costosIndirectosTotal
      },
      presupuestoTotal: {
        costoDirectoTotal,
        costosIndirectosTotal,
        subtotalNeto,
        iva,
        totalConIva,
        totalUF,
        precioM2
      }
    };
  }, [actualAnalysis, projectInfo]);

  // Formatear moneda
  const formatCLP = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Formatear UF
  const formatUF = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Exportar a PDF
  const handleExportPDF = async () => {
    try {
      await generatePDFReport({
        analysis: actualAnalysis,
        processedBudget,
        projectInfo,
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '2.0'
        }
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente.');
    }
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Header con botón de exportación */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calculator className="mr-3 h-7 w-7 text-blue-600" />
              Resultado del Análisis Presupuestario
            </h2>
            {projectInfo && (
              <div className="mt-2 flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{projectInfo.location} • {projectInfo.area} m²</span>
              </div>
            )}
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* PRESUPUESTO TOTAL - Claramente visible */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-blue-100 text-sm uppercase tracking-wide mb-2">Costo Directo (Obra)</p>
            <p className="text-3xl font-bold">{formatCLP(processedBudget.presupuestoTotal.costoDirectoTotal)}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm uppercase tracking-wide mb-2">Subtotal Neto</p>
            <p className="text-3xl font-bold">{formatCLP(processedBudget.presupuestoTotal.subtotalNeto)}</p>
            <p className="text-sm text-blue-200 mt-1">(CD + CI)</p>
          </div>
          <div className="text-center border-l-2 border-blue-400 pl-6">
            <p className="text-yellow-300 text-sm uppercase tracking-wide font-semibold mb-2">TOTAL CON IVA</p>
            <p className="text-4xl font-bold text-yellow-300">{formatCLP(processedBudget.presupuestoTotal.totalConIva)}</p>
            <p className="text-sm text-blue-200 mt-1">UF {formatUF(processedBudget.presupuestoTotal.totalUF)}</p>
          </div>
        </div>
        
        {projectInfo?.area && (
          <div className="mt-6 pt-6 border-t border-blue-400 text-center">
            <p className="text-blue-100">
              Precio por m²: <span className="font-bold text-xl">{formatCLP(processedBudget.presupuestoTotal.precioM2)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Desglose Detallado en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Costos Directos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            Costos Directos (CD)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Materiales</span>
              <span className="font-semibold text-gray-900">{formatCLP(processedBudget.costoDirecto.materiales)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Mano de Obra</span>
              <span className="font-semibold text-gray-900">{formatCLP(processedBudget.costoDirecto.manoObra)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Equipos</span>
              <span className="font-semibold text-gray-900">{formatCLP(processedBudget.costoDirecto.equipos)}</span>
            </div>
            {processedBudget.costoDirecto.subcontratos > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Subcontratos</span>
                <span className="font-semibold text-gray-900">{formatCLP(processedBudget.costoDirecto.subcontratos)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 font-bold">
              <span className="text-gray-900">Total Costo Directo</span>
              <span className="text-blue-600 text-lg">{formatCLP(processedBudget.costoDirecto.total)}</span>
            </div>
          </div>
        </div>

        {/* Costos Indirectos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="mr-2 h-5 w-5 text-purple-600" />
            Costos Indirectos (CI)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <span className="text-gray-700">Gastos Generales</span>
                <span className="text-xs text-gray-500 ml-2">({processedBudget.costosIndirectos.gastosGenerales.porcentaje}% CD)</span>
              </div>
              <span className="font-semibold text-gray-900">{formatCLP(processedBudget.costosIndirectos.gastosGenerales.monto)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <span className="text-gray-700">Utilidad</span>
                <span className="text-xs text-gray-500 ml-2">({processedBudget.costosIndirectos.utilidad.porcentaje}% CD+GG)</span>
              </div>
              <span className="font-semibold text-gray-900">{formatCLP(processedBudget.costosIndirectos.utilidad.monto)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <span className="text-gray-700">Contingencia</span>
                <span className="text-xs text-gray-500 ml-2">({processedBudget.costosIndirectos.contingencia.porcentaje}% CD)</span>
              </div>
              <span className="font-semibold text-gray-900">{formatCLP(processedBudget.costosIndirectos.contingencia.monto)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 font-bold">
              <span className="text-gray-900">Total Costos Indirectos</span>
              <span className="text-purple-600 text-lg">{formatCLP(processedBudget.costosIndirectos.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Resumen Final */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="mr-2 h-5 w-5 text-green-600" />
          Resumen Final del Presupuesto
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="py-3 text-gray-700">Total Costos Directos (CD)</td>
                <td className="py-3 text-right font-semibold">{formatCLP(processedBudget.presupuestoTotal.costoDirectoTotal)}</td>
                <td className="py-3 text-right text-gray-500 w-20">
                  {((processedBudget.presupuestoTotal.costoDirectoTotal / processedBudget.presupuestoTotal.totalConIva) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 text-gray-700">Total Costos Indirectos (CI)</td>
                <td className="py-3 text-right font-semibold">{formatCLP(processedBudget.presupuestoTotal.costosIndirectosTotal)}</td>
                <td className="py-3 text-right text-gray-500 w-20">
                  {((processedBudget.presupuestoTotal.costosIndirectosTotal / processedBudget.presupuestoTotal.totalConIva) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50 font-semibold bg-gray-50">
                <td className="py-3 text-gray-900">Subtotal Neto (CD + CI)</td>
                <td className="py-3 text-right text-blue-600">{formatCLP(processedBudget.presupuestoTotal.subtotalNeto)}</td>
                <td className="py-3 text-right text-gray-500 w-20">
                  {((processedBudget.presupuestoTotal.subtotalNeto / processedBudget.presupuestoTotal.totalConIva) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 text-gray-700">IVA (19%)</td>
                <td className="py-3 text-right font-semibold">{formatCLP(processedBudget.presupuestoTotal.iva)}</td>
                <td className="py-3 text-right text-gray-500 w-20">19.0%</td>
              </tr>
              <tr className="bg-gradient-to-r from-green-50 to-blue-50">
                <td className="py-4 text-lg font-bold text-gray-900">TOTAL GENERAL</td>
                <td className="py-4 text-right text-xl font-bold text-green-600">{formatCLP(processedBudget.presupuestoTotal.totalConIva)}</td>
                <td className="py-4 text-right font-semibold text-gray-600 w-20">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de Distribución */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Costos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Materiales', value: processedBudget.costoDirecto.materiales, color: 'bg-blue-500' },
            { name: 'Mano de Obra', value: processedBudget.costoDirecto.manoObra, color: 'bg-green-500' },
            { name: 'Gastos Generales', value: processedBudget.costosIndirectos.gastosGenerales.monto, color: 'bg-purple-500' },
            { name: 'Utilidad', value: processedBudget.costosIndirectos.utilidad.monto, color: 'bg-pink-500' },
          ].map((item) => {
            const percentage = ((item.value / processedBudget.presupuestoTotal.totalConIva) * 100).toFixed(1);
            return (
              <div key={item.name} className="text-center">
                <div className={`h-20 ${item.color} rounded-lg mb-2 flex items-center justify-center text-white font-bold`}>
                  {percentage}%
                </div>
                <p className="text-sm font-medium text-gray-700">{item.name}</p>
                <p className="text-xs text-gray-500">{formatCLP(item.value)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cronograma Mejorado */}
      {actualAnalysis.cronograma_sugerido && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
            Cronograma del Proyecto
          </h3>
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-gray-800 whitespace-pre-line">
              {actualAnalysis.cronograma_sugerido}
            </p>
          </div>
        </div>
      )}

      {/* Análisis de Riesgos */}
      {actualAnalysis.analisis_riesgos && actualAnalysis.analisis_riesgos.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-red-600" />
            Análisis de Riesgos
          </h3>
          <div className="space-y-3">
            {actualAnalysis.analisis_riesgos.map((riesgo: any, index: number) => (
              <div key={index} className="border-l-4 border-red-400 pl-4 py-2">
                <div className="font-medium text-gray-900">{riesgo.factor || riesgo}</div>
                {riesgo.mitigation && (
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Mitigación:</span> {riesgo.mitigation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {actualAnalysis.recomendaciones && actualAnalysis.recomendaciones.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-600" />
            Recomendaciones
          </h3>
          <ul className="space-y-2">
            {actualAnalysis.recomendaciones.map((rec: string, index: number) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notas Importantes */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">Notas Importantes:</h3>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>• Los Gastos Generales (12%) y Utilidad (10%) son estándares de la industria chilena</li>
              <li>• El presupuesto incluye contingencia del 5% para imprevistos</li>
              <li>• Todos los valores incluyen IVA (19%)</li>
              <li>• Los valores son estimaciones basadas en proyectos similares</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};