// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/tabs/ProvidersTab.tsx

import React, { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import Button from '../../../ui/button/Button';

interface ProvidersTabProps {
  providers: {
    items: Array<{
      nombre: string;
      contacto: string;
      especialidad: string;
    }>;
  };
}

export const ProvidersTab: React.FC<ProvidersTabProps> = ({ providers }) => {
  const [copiedProvider, setCopiedProvider] = useState<string>('');

  const copyToClipboard = (text: string, providerName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedProvider(providerName);
      setTimeout(() => setCopiedProvider(''), 2000);
    });
  };

  const searchProvider = (providerName: string) => {
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(providerName + ' Chile')}`,
      '_blank'
    );
  };

  if (providers.items.length === 0) {
    return <EmptyState 
      icon="🏢"
      title="No se identificaron proveedores"
      message="El documento no contiene información específica de proveedores"
    />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            🏢 Proveedores Identificados ({providers.items.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const list = providers.items
                .map(p => `${p.nombre} - ${p.especialidad} - ${p.contacto}`)
                .join('\n');
              navigator.clipboard.writeText(list);
            }}
          >
            📋 Copiar Lista
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.items.map((provider, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🏢</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {provider.nombre}
                  </h4>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Especialidad:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
                        {provider.especialidad}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Contacto:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {provider.contacto}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => copyToClipboard(provider.contacto, provider.nombre)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      {copiedProvider === provider.nombre ? '✓ Copiado' : 'Copiar contacto'}
                    </button>
                    <button
                      onClick={() => searchProvider(provider.nombre)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    >
                      Buscar en Google
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};