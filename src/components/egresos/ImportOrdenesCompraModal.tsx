// src/components/egresos/ImportOrdenesCompraModal.tsx
import React, { useState, useRef } from 'react';
import Button from '../ui/button/Button';
import { 
  handleConsolidatedExcelUpload, 
  getMainOrdersPreview,
  getDetailOrdersPreview,
  getConsolidatedPreview
} from '../../utils/ordenCompraUtils';
import { Modal } from '../ui/modal';

interface ImportOrdenesCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number, type: string) => void;
}

interface FileUploadState {
  file: File | null;
  uploading: boolean;
  error: string | null;
  preview: any | null;
  dragOver: boolean;
}

const ImportOrdenesCompraModal: React.FC<ImportOrdenesCompraModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [importing, setImporting] = useState(false);
  const [consolidatedPreview, setConsolidatedPreview] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  
  // Estados para archivo principal (órdenes principales)
  const [mainFile, setMainFile] = useState<FileUploadState>({
    file: null,
    uploading: false,
    error: null,
    preview: null,
    dragOver: false
  });

  // Estados para archivo de detalles
  const [detailFile, setDetailFile] = useState<FileUploadState>({
    file: null,
    uploading: false,
    error: null,
    preview: null,
    dragOver: false
  });

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // Función para validar archivo
  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type)) {
      return false;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
      return false;
    }
    
    return true;
  };

  // Función para manejar carga de archivo principal
  const handleMainFileSelect = async (file: File) => {
    if (!validateFile(file)) {
      setMainFile(prev => ({ ...prev, error: 'Archivo Excel inválido o demasiado grande' }));
      return;
    }

    setMainFile(prev => ({ ...prev, file, uploading: true, error: null }));

    try {
      const preview = await getMainOrdersPreview(file);
      setMainFile(prev => ({ ...prev, preview, uploading: false }));
      
      // Si tenemos ambos archivos, generar preview consolidado
      if (detailFile.file) {
        await generateConsolidatedPreview(file, detailFile.file);
      }
    } catch (error) {
      setMainFile(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al procesar archivo',
        uploading: false 
      }));
    }
  };

  // Función para manejar carga de archivo de detalles
  const handleDetailFileSelect = async (file: File) => {
    if (!validateFile(file)) {
      setDetailFile(prev => ({ ...prev, error: 'Archivo Excel inválido o demasiado grande' }));
      return;
    }

    setDetailFile(prev => ({ ...prev, file, uploading: true, error: null }));

    try {
      const preview = await getDetailOrdersPreview(file);
      setDetailFile(prev => ({ ...prev, preview, uploading: false }));
      
      // Si tenemos ambos archivos, generar preview consolidado
      if (mainFile.file) {
        await generateConsolidatedPreview(mainFile.file, file);
      }
    } catch (error) {
      setDetailFile(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al procesar archivo',
        uploading: false 
      }));
    }
  };

  // Función para generar preview consolidado
  const generateConsolidatedPreview = async (mainFileParam: File, detailFileParam: File) => {
    try {
      const preview = await getConsolidatedPreview(mainFileParam, detailFileParam);
      setConsolidatedPreview(preview);
      setStep('preview');
    } catch (error) {
      console.error('Error generando preview consolidado:', error);
      setMainFile(prev => ({ ...prev, error: 'Error al generar preview consolidado' }));
    }
  };

  // Manejadores para el archivo principal
  const handleMainFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleMainFileSelect(file);
    }
  };

  const handleMainDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setMainFile(prev => ({ ...prev, dragOver: true }));
  };

  const handleMainDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setMainFile(prev => ({ ...prev, dragOver: false }));
  };

  const handleMainDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setMainFile(prev => ({ ...prev, dragOver: false }));
    const file = e.dataTransfer.files[0];
    if (file) {
      handleMainFileSelect(file);
    }
  };

  // Manejadores para el archivo de detalles
  const handleDetailFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleDetailFileSelect(file);
    }
  };

  const handleDetailDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDetailFile(prev => ({ ...prev, dragOver: true }));
  };

  const handleDetailDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDetailFile(prev => ({ ...prev, dragOver: false }));
  };

  const handleDetailDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDetailFile(prev => ({ ...prev, dragOver: false }));
    const file = e.dataTransfer.files[0];
    if (file) {
      handleDetailFileSelect(file);
    }
  };

  // Función para importar archivos consolidados
  const handleImport = async () => {
    if (!mainFile.file || !detailFile.file) {
      return;
    }

    try {
      setImporting(true);
      setStep('processing');
      
      // Usar la función consolidada
      const ordenesCreadas = await handleConsolidatedExcelUpload(mainFile.file, detailFile.file);

      setStep('complete');
      onSuccess(ordenesCreadas.length, 'consolidado');
      
      // Cerrar modal después de un delay
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error importing consolidated órdenes de compra:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al importar los archivos';
      setMainFile(prev => ({ ...prev, error: errorMsg }));
      setDetailFile(prev => ({ ...prev, error: errorMsg }));
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const resetStates = () => {
    setMainFile({
      file: null,
      uploading: false,
      error: null,
      preview: null,
      dragOver: false
    });
    setDetailFile({
      file: null,
      uploading: false,
      error: null,
      preview: null,
      dragOver: false
    });
    setConsolidatedPreview(null);
    setStep('upload');
  };

  const handleClose = () => {
    if (!importing) {
      resetStates();
      onClose();
    }
  };

  const openMainFileDialog = () => {
    mainFileInputRef.current?.click();
  };

  const openDetailFileDialog = () => {
    detailFileInputRef.current?.click();
  };

  const canImport = () => {
    return mainFile.file && detailFile.file && 
           !mainFile.error && !detailFile.error && 
           !mainFile.uploading && !detailFile.uploading;
  };

  // Componente para mostrar preview de datos
  const renderPreview = (preview: any, title: string) => {
    if (!preview) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {title} - Preview ({preview.totalRows} filas)
        </h4>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Campos detectados:</strong></p>
          {Object.entries(preview.mappedFields).map(([field, header]) => (
            <span key={field} className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mr-2 mb-1">
              {String(header)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      className="max-w-6xl mx-4 sm:mx-auto my-8"
    >
      <div className="p-6 sm:p-8">
        {/* Título del modal */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Importar Órdenes de Compra Consolidadas
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Carga ambos archivos Excel para crear órdenes de compra consolidadas sin duplicados
          </p>
        </div>

        {/* Paso 1: Subir archivos */}
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Mensaje explicativo */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Importación Consolidada
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Los archivos se consolidarán automáticamente usando el campo <strong>"N° OC"</strong>. 
                    Se creará una orden única por cada N° OC, combinando los datos de ambos archivos.
                  </p>
                </div>
              </div>
            </div>

            {/* Áreas de carga para ambos archivos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Archivo Principal */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  📋 Archivo Principal (oc_1.xlsx)
                </h3>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    mainFile.dragOver
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  onDragOver={handleMainDragOver}
                  onDragLeave={handleMainDragLeave}
                  onDrop={handleMainDrop}
                >
                  <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  
                  <div className="mt-3">
                    {mainFile.file ? (
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          ✓ {mainFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Archivo cargado correctamente
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {mainFile.uploading ? 'Procesando...' : 'Datos básicos de órdenes'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          N° OC, Nombre OC, Fecha, Obra, Proveedor, Condición de pago, Monto
                        </p>
                        <button
                          type="button"
                          onClick={openMainFileDialog}
                          disabled={mainFile.uploading}
                          className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50 text-sm"
                        >
                          Seleccionar archivo
                        </button>
                      </div>
                    )}
                  </div>

                  {mainFile.uploading && (
                    <div className="mt-2">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>

                {mainFile.preview && renderPreview(mainFile.preview, 'Principales')}

                {mainFile.error && (
                  <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {mainFile.error}
                    </p>
                  </div>
                )}
              </div>

              {/* Archivo de Detalles */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  📝 Archivo de Detalles (oc_2.xlsx)
                </h3>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    detailFile.dragOver
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  onDragOver={handleDetailDragOver}
                  onDragLeave={handleDetailDragLeave}
                  onDrop={handleDetailDrop}
                >
                  <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  
                  <div className="mt-3">
                    {detailFile.file ? (
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          ✓ {detailFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Archivo cargado correctamente
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {detailFile.uploading ? 'Procesando...' : 'Detalles contables'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          N° OC (puede repetirse), Código C.C., Cuenta de Costo
                        </p>
                        <button
                          type="button"
                          onClick={openDetailFileDialog}
                          disabled={detailFile.uploading}
                          className="text-green-600 hover:text-green-500 font-medium disabled:opacity-50 text-sm"
                        >
                          Seleccionar archivo
                        </button>
                      </div>
                    )}
                  </div>

                  {detailFile.uploading && (
                    <div className="mt-2">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    </div>
                  )}
                </div>

                {detailFile.preview && renderPreview(detailFile.preview, 'Detalles')}

                {detailFile.error && (
                  <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {detailFile.error}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs ocultos para archivos */}
            <input
              ref={mainFileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleMainFileInputChange}
              disabled={mainFile.uploading}
              className="hidden"
            />
            
            <input
              ref={detailFileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleDetailFileInputChange}
              disabled={detailFile.uploading}
              className="hidden"
            />

            {/* Información del estado */}
            <div className="text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {canImport() 
                  ? '✅ Ambos archivos cargados - Revisa el preview y procesa'
                  : `${mainFile.file ? '✅' : '⭕'} Principal ${detailFile.file ? '✅' : '⭕'} Detalles`
                }
              </span>
            </div>
          </div>
        )}

        {/* Paso 2: Preview */}
        {step === 'preview' && consolidatedPreview && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Estadísticas de Consolidación</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{consolidatedPreview.stats.totalBasicas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Órdenes Básicas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{consolidatedPreview.stats.totalDetalles}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Detalles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{consolidatedPreview.stats.totalConsolidadas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Consolidadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{consolidatedPreview.stats.ordenesConDetalles}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Con Detalles</div>
                </div>
              </div>
            </div>

            {/* Preview de órdenes consolidadas */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Vista Previa de Órdenes Consolidadas</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">N° OC</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Proveedor</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Monto</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Obra</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Código CC</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consolidatedPreview.consolidadas.map((orden: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">
                          {orden.nOC}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                          {orden.proveedor}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">
                          ${orden.monto.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                          {orden.obra}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">
                          {orden.codigoCC}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                          <div className="text-sm">
                            {orden.detalles.length} detalle(s)
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between">
              <button
                onClick={resetStates}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cambiar Archivos
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Procesando...' : 'Procesar Archivos'}
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Procesando */}
        {step === 'processing' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Procesando Archivos</h3>
            <p className="text-gray-600 dark:text-gray-400">Consolidando datos y creando órdenes de compra...</p>
          </div>
        )}

        {/* Paso 4: Completado */}
        {step === 'complete' && (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 text-green-600">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-green-800 dark:text-green-200">
              ¡Procesamiento Completado!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Las órdenes de compra se han consolidado e importado exitosamente
            </p>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Se han creado las órdenes de compra consolidadas sin duplicados
              </p>
            </div>

            <button
              onClick={resetStates}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Procesar Más Archivos
            </button>
          </div>
        )}

        {/* Mostrar errores */}
        {(mainFile.error || detailFile.error) && step !== 'complete' && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="text-red-600 dark:text-red-400 flex-shrink-0 mt-1" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Error en el procesamiento</h3>
                {mainFile.error && (
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                    <strong>Archivo Principal:</strong> {mainFile.error}
                  </p>
                )}
                {detailFile.error && (
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Archivo Detalles:</strong> {detailFile.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción generales */}
        {step === 'upload' && (
          <div className="flex justify-between items-center space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {canImport() 
                  ? '✅ Listo para procesar'
                  : 'Selecciona ambos archivos para continuar'
                }
              </span>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={importing}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Instrucciones detalladas */}
        {step === 'upload' && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Estructura esperada de los archivos
            </h3>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
              <div>
                <p><strong>📋 Archivo Principal (oc_1.xlsx):</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                  <li><strong>N° OC:</strong> Número único de la orden de compra</li>
                  <li><strong>Nombre OC:</strong> Nombre descriptivo de la orden</li>
                  <li><strong>Fecha:</strong> Fecha de la orden (DD/MM/YYYY)</li>
                  <li><strong>Obra:</strong> Nombre del proyecto o centro de gestión</li>
                  <li><strong>Proveedor:</strong> Nombre o razón social del proveedor</li>
                  <li><strong>Condición de pago:</strong> Términos de pago (ej: "30 días", "contado")</li>
                  <li><strong>Monto:</strong> Valor total de la orden</li>
                </ul>
              </div>
              
              <div>
                <p><strong>📝 Archivo de Detalles (oc_2.xlsx):</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                  <li><strong>N° OC:</strong> Número de la orden (puede repetirse)</li>
                  <li><strong>Código C.C.:</strong> Código del centro de costo (debe ser igual para la misma N° OC)</li>
                  <li><strong>Cuenta de Costo:</strong> Nombre de la cuenta contable</li>
                  <li><strong>Descripción:</strong> Descripción del ítem (opcional)</li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200">
                  <strong>🔗 Consolidación:</strong> Se creará una orden única por cada N° OC, 
                  combinando los datos del archivo principal con el Código C.C. del archivo de detalles.
                </p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Requisitos:</strong> Primera fila con encabezados • Montos numéricos • 
                Fechas en formato DD/MM/YYYY • Máximo 50MB por archivo
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportOrdenesCompraModal;