// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/tabs/RisksTab.tsx

import React from 'react';
import { EmptyState } from '../components/EmptyState';

interface RisksTabProps {
  risks: {
    items: Array<{
      factor: string;
      probability: string;
      impact: string;
      mitigation: string;
    }>;
  };
}

export const RisksTab: React.FC<RisksTabProps> = ({ risks }) => {
  const getRiskLevel = (probability: string, impact: string) => {
    if (probability === 'high' && impact === 'high') return 'critical';
    if (probability === 'high' || impact === 'high') return 'high';
    if (probability === 'medium' || impact === 'medium') return 'medium';
    return 'low';
  };

  const getRiskColor = (level: string) => {
    const colors = {
      critical: 'bg-red-100 border-red-300 text-red-800',
      high: 'bg-orange-100 border-orange-300 text-orange-800',
      medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      low: 'bg-green-100 border-green-300 text-green-800'
    };
    return colors[level as keyof typeof colors] || colors.low;
  };

  if (risks.items.length === 0) {
    return <EmptyState 
      icon="🛡️"
      title="No se identificaron riesgos"
      message="El análisis no detectó factores de riesgo específicos"
    />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            ⚠️ Análisis de Riesgos ({risks.items.length})
          </h3>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Bajo</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Medio</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Alto</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Crítico</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {risks.items.map((risk, index) => {
            const level = getRiskLevel(risk.probability, risk.impact);
            const colorClass = getRiskColor(level);
            
            return (
              <div key={index} className={`p-5 rounded-lg border-2 ${colorClass}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">
                      {risk.factor}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="bg-white/60 p-2 rounded">
                        <span className="text-xs font-medium block mb-1">Probabilidad</span>
                        <span className="text-sm font-bold capitalize">{risk.probability}</span>
                      </div>
                      <div className="bg-white/60 p-2 rounded">
                        <span className="text-xs font-medium block mb-1">Impacto</span>
                        <span className="text-sm font-bold capitalize">{risk.impact}</span>
                      </div>
                      <div className="bg-white/60 p-2 rounded">
                        <span className="text-xs font-medium block mb-1">Nivel</span>
                        <span className="text-sm font-bold capitalize">{level}</span>
                      </div>
                    </div>
                    <div className="bg-white/40 p-3 rounded">
                      <span className="text-xs font-medium block mb-1">🛡️ Estrategia de Mitigación:</span>
                      <p className="text-sm">{risk.mitigation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Matriz de Riesgos Visual */}
        <div className="mt-6 p-5 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📊 Matriz de Riesgos</h4>
          <RiskMatrix risks={risks.items} />
        </div>
      </div>
    </div>
  );
};

const RiskMatrix: React.FC<{ risks: any[] }> = ({ risks }) => {
  const getCountForCell = (prob: string, impact: string) => {
    return risks.filter(r => r.probability === prob && r.impact === impact).length;
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-1 text-xs">
        <div className="font-medium text-right pr-2 pt-8">Alto</div>
        <div className="bg-yellow-200 p-4 text-center rounded relative">
          <span className="font-bold">{getCountForCell('high', 'low')}</span>
          <span className="block text-xs mt-1">Medio</span>
        </div>
        <div className="bg-orange-200 p-4 text-center rounded relative">
          <span className="font-bold">{getCountForCell('high', 'medium')}</span>
          <span className="block text-xs mt-1">Alto</span>
        </div>
        <div className="bg-red-200 p-4 text-center rounded relative">
          <span className="font-bold">{getCountForCell('high', 'high')}</span>
          <span className="block text-xs mt-1">Crítico</span>
        </div>
        
        <div className="font-medium text-right pr-2 pt-4">Medio</div>
        <div className="bg-green-200 p-4 text-center rounded relative">
          <span className="font-bold">{getCountForCell('medium', 'low')}</span>
          <span className="block text-xs mt-1">Bajo</span>
        </div>
        <div className="bg-yellow-200 p-4 text-center rounded relative">
          <span className="font-bold">{getCountForCell('medium', 'medium')}</span>
          <span className="block text-xs mt-1">Medio</span>
        </div>
        <div className="bg-orange-200 p-4 text-center rounded relative">
          <span className="font-bold">{getCountForCell('medium', 'high')}</span>
          <span className="block text-xs mt-1">Alto</span>
        </div>
        
        <div className="font-medium text-right pr-2 pt-4">Bajo</div>
        <div className="bg-green-100 p-4 text-center rounded relative">
          <span className="font-bold">{getCountForCell('low', 'low')}</span>
          <span className="block text-xs mt-1">Muy Bajo</span>
        </div>
        <div className="bg-green-200 p-4 text-center rounded relative">
          <span className="font-bold">{getCountForCell('low', 'medium')}</span>
          <span className="block text-xs mt-1">Bajo</span>
        </div>
        <div className="bg-yellow-200 p-4 text-center rounded relative">
          <span className="font-bold">{getCountForCell('low', 'high')}</span>
          <span className="block text-xs mt-1">Medio</span>
        </div>
        
        <div></div>
        <div className="text-center font-medium pt-2">Bajo</div>
        <div className="text-center font-medium pt-2">Medio</div>
        <div className="text-center font-medium pt-2">Alto</div>
      </div>
      <div className="text-center mt-2 text-sm font-medium text-gray-600">→ Impacto</div>
      <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-600">
        ↑ Probabilidad
      </div>
    </div>
  );
};