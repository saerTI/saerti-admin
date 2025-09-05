// src/components/BudgetAnalyzer/PdfAnalysisResultsModal/components/ModalHeader.tsx

import React from 'react';
import Button from '../../../ui/button/Button';
import type { PdfAnalysisResult } from '../../types/budgetAnalysis';

interface ModalHeaderProps {
  analysisResult: PdfAnalysisResult;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ analysisResult, onClose }) => {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🛡️ Análisis PDF Optimizado
            {analysisResult.analysis.confidence_score >= 80 && (
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Alta Confianza
              </span>
            )}
          </h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>ID: {analysisResult.analysisId}</span>
            <span>•</span>
            <span className="font-medium">
              Confianza: {analysisResult.analysis.confidence_score}%
            </span>
            <span>•</span>
            <span>{analysisResult.analysis.chunks_procesados} chunks procesados</span>
            {analysisResult.analysis.processing_method && (
              <>
                <span>•</span>
                <span className="text-green-600 dark:text-green-400">
                  {analysisResult.analysis.processing_method}
                </span>
              </>
            )}
          </div>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>
  );
};