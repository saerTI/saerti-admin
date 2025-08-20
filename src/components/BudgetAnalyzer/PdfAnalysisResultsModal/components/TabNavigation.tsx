// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/components/TabNavigation.tsx

import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  formattedData: any;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  formattedData 
}) => {
  const tabs = [
    { id: 'summary', label: 'Resumen', icon: '📊' },
    { id: 'materials', label: 'Materiales', icon: '🧱', count: formattedData.materials?.items?.length },
    { id: 'labor', label: 'Mano de Obra', icon: '👷', count: formattedData.labor?.items?.length },
    { id: 'equipment', label: 'Equipos', icon: '🚧', count: formattedData.equipment?.items?.length },
    { id: 'providers', label: 'Proveedores', icon: '🏢', count: formattedData.providers?.items?.length },
    { id: 'risks', label: 'Riesgos', icon: '⚠️', count: formattedData.risks?.items?.length },
    { id: 'optimization', label: 'Optimizaciones', icon: '🛡️' }
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <nav className="flex space-x-1 px-6 py-2 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-3 px-4 rounded-t-lg font-medium text-sm whitespace-nowrap flex items-center transition-all
              ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <span className="mr-2 text-lg">{tab.icon}</span>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold
                ${activeTab === tab.id 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};