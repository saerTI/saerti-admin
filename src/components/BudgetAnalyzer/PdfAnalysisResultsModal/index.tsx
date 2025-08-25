// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/index.tsx

import React, { useState } from 'react';
import { Modal } from '../../ui/modal';
import { ModalHeader } from './components/ModalHeader';
import { ModalFooter } from './components/ModalFooter';
import { TabNavigation } from './components/TabNavigation';
import { SummaryTab } from './tabs/SummaryTab';
import { MaterialsTab } from './tabs/MaterialsTab';
import { LaborTab } from './tabs/LaborTab';
import { EquipmentTab } from './tabs/EquipmentTab';
import { ProvidersTab } from './tabs/ProvidersTab';
import { RisksTab } from './tabs/RisksTab';
import { OptimizationTab } from './tabs/OptimizationTab';
import { formatPdfAnalysisForDisplay } from './utils/dataHelpers';
import type { PdfAnalysisResult } from '../types/budgetAnalysis';

interface PdfAnalysisResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: PdfAnalysisResult;
}

export const PdfAnalysisResultsModal: React.FC<PdfAnalysisResultsModalProps> = ({
  isOpen,
  onClose,
  analysisResult
}) => {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const formattedData = formatPdfAnalysisForDisplay(analysisResult.analysis);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryTab data={formattedData} analysis={analysisResult.analysis} />;
      case 'materials':
        return <MaterialsTab materials={formattedData.materials} />;
      case 'labor':
        return <LaborTab labor={formattedData.labor} />;
      case 'equipment':
        return <EquipmentTab equipment={formattedData.equipment} />;
      case 'providers':
        return <ProvidersTab providers={formattedData.providers} />;
      case 'risks':
        return <RisksTab risks={formattedData.risks} />;
      case 'optimization':
        return <OptimizationTab 
          optimization={formattedData.optimization}
          metadata={analysisResult.metadata}
          analysis={analysisResult.analysis}
        />;
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        <ModalHeader 
          analysisResult={analysisResult}
          onClose={onClose}
        />
        
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          formattedData={formattedData}
        />
        
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-gray-50 dark:bg-gray-900">
          {renderTabContent()}
        </div>
        
        <ModalFooter 
          analysisResult={analysisResult}
          onClose={onClose}
        />
      </div>
    </Modal>
  );
};