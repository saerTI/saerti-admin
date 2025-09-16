// saer-frontend/src/components/CC/ImportRemuneracionesModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { importRemuneraciones, type ImportResponse } from '../../services/CC/remuneracionesService';
import { handleRemuneracionImportWithEmployeeCreation } from '../../utils/remuneracionUtils';
import { generateRemuneracionTemplateWithInstructions } from '../../utils/remuneracionesExcelTemplateGenerator';
import Button from '../ui/button/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportRemuneracionesModal: React.FC<Props> = ({ isOpen, onClose, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handler para cerrar el modal con la tecla Escape
  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  // Añadir/remover event listener para la tecla Escape
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscKey]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo para importar.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportResult(null);

    try {
      // Usar la función de importación con creación automática de empleados
      const response = await handleRemuneracionImportWithEmployeeCreation(selectedFile);
      setImportResult(response);

      if (response.success || (response.results?.success ?? 0) > 0) {
        onImportSuccess();
      }

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al procesar el archivo.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadTemplate = () => {
    generateRemuneracionTemplateWithInstructions();
  };

  // Handler para cerrar el modal cuando se hace clic en el fondo
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Importación Masiva de Remuneraciones
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Información de creación automática de empleados */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Creación Automática de Empleados
                  </h4>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Si un empleado no existe (por RUT), se creará automáticamente</li>
                      <li>Los campos CARGO, DEPARTAMENTO y SUELDO BASE se usarán para el perfil</li>
                      <li>Solo se requiere RUT, NOMBRE, TIPO, MONTO, MES y AÑO</li>
                      <li>Los demás campos son opcionales y tienen valores por defecto</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón para descargar plantilla */}
            <div className="flex justify-end">
              <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
                Descargar Plantilla Completa
              </Button>
            </div>

            {/* Selector de archivo */}
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar archivo (.xlsx)
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="p-4 rounded-md bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Resultado de la importación */}
            {importResult && (
              <div className={`p-4 rounded-md border ${
                importResult.success 
                  ? 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {importResult.success ? (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {importResult.message}
                    </h4>
                    {importResult.results && (
                      <div className="mt-2">
                        <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          <li>Total de filas procesadas: {importResult.results.total}</li>
                          <li className="text-green-700 dark:text-green-300">Remuneraciones exitosas: {importResult.results.success}</li>
                          <li className="text-blue-700 dark:text-blue-300">Empleados creados: {importResult.results.createdEmployees?.length || 0}</li>
                          <li className="text-red-700 dark:text-red-300">Registros fallidos: {importResult.results.failed}</li>
                        </ul>
                        
                        {/* Mostrar empleados creados */}
                        {importResult.results?.createdEmployees && importResult.results.createdEmployees.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Empleados creados:</h5>
                            <div className="max-h-32 overflow-y-auto bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                              <ul className="list-disc pl-5 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                {importResult.results.createdEmployees.map(emp => (
                                  <li key={emp.id}>
                                    <span className="font-medium">{emp.nombre}</span> (RUT: {emp.rut})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Mostrar errores */}
                        {importResult.results?.errors && importResult.results.errors.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Detalle de errores:</h5>
                            <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded p-3">
                              <ul className="list-decimal pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                {importResult.results.errors.map(err => (
                                  <li key={err.row}>
                                    <span className="font-medium">Fila {err.row}:</span> {err.error}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button onClick={onClose} variant="outline" className="px-6">
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isLoading || !selectedFile}
              className="bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 disabled:cursor-not-allowed px-6"
            >
              {isLoading ? 'Importando...' : 'Importar Remuneraciones'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};