// src/components/BulkImportModal.tsx
import { useState } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import Alert from './Alert';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<{ success: boolean; message: string; data?: any }>;
  templateData: {
    columns: Array<{
      field: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'select';
      required?: boolean;
      options?: string[];
    }>;
    sheetName: string;
  };
  entityType: 'income' | 'expense';
}

export default function BulkImportModal({
  isOpen,
  onClose,
  onImport,
  templateData,
  entityType,
}: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string | React.ReactNode;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    // Hoja 1: Plantilla de datos
    const dataSheet = workbook.addWorksheet('Datos');

    // Configurar encabezados
    const headers = templateData.columns.map(col => ({
      header: `${col.label}${col.required ? ' *' : ''}`,
      key: col.field,
      width: 20
    }));

    dataSheet.columns = headers;

    // Estilo para los encabezados
    dataSheet.getRow(1).font = { bold: true };
    dataSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: entityType === 'income' ? 'FF16A34A' : 'FFEA580C' }
    };
    dataSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Agregar validación de datos (listas desplegables) para columnas con opciones
    templateData.columns.forEach((col, colIndex) => {
      if (col.type === 'select' && col.options && col.options.length > 0) {
        // Crear la lista de opciones - usar la fórmula directa
        const columnLetter = String.fromCharCode(65 + colIndex); // A, B, C, etc.

        // Agregar validación para las primeras 1000 filas
        for (let row = 2; row <= 1000; row++) {
          const cell = dataSheet.getCell(`${columnLetter}${row}`);

          cell.dataValidation = {
            type: 'list',
            allowBlank: !col.required,
            formulae: [`"${col.options.join(',')}"`],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Valor inválido',
            error: 'Por favor selecciona una opción válida de la lista desplegable',
            showInputMessage: true,
            promptTitle: col.label,
            prompt: `Opciones disponibles: ${col.options.slice(0, 3).join(', ')}${col.options.length > 3 ? '...' : ''}`
          };
        }
      }
    });

    // Hoja 2: Instrucciones y opciones
    const instructionsSheet = workbook.addWorksheet('Instrucciones');

    instructionsSheet.columns = [
      { header: 'Campo', key: 'field', width: 25 },
      { header: 'Tipo', key: 'type', width: 30 },
      { header: 'Descripción', key: 'description', width: 45 },
      { header: 'Requerido', key: 'required', width: 12 },
      { header: 'Opciones Válidas', key: 'options', width: 50 }
    ];

    // Estilo para encabezados de instrucciones
    instructionsSheet.getRow(1).font = { bold: true };
    instructionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    instructionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    templateData.columns.forEach(col => {
      instructionsSheet.addRow({
        field: col.label,
        type: col.type === 'text' ? 'Texto' :
              col.type === 'number' ? 'Número' :
              col.type === 'date' ? 'Fecha (AAAA-MM-DD)' :
              'Selección (Lista desplegable)',
        description: col.type === 'select' && col.options ?
          'Usa la lista desplegable en la hoja "Datos"' :
          `Campo de tipo ${col.type}`,
        required: col.required ? 'Sí' : 'No',
        options: col.options ? col.options.join(', ') : '-'
      });
    });

    // Hoja 3: Listas de opciones (para referencia)
    const listsSheet = workbook.addWorksheet('Listas');
    listsSheet.columns = [{ header: 'LISTAS DE OPCIONES DISPONIBLES', key: 'list', width: 50 }];
    listsSheet.getRow(1).font = { bold: true, size: 14 };

    let currentRow = 2;
    templateData.columns.forEach(col => {
      if (col.type === 'select' && col.options && col.options.length > 0) {
        listsSheet.getCell(`A${currentRow}`).value = `${col.label}:`;
        listsSheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow++;

        col.options.forEach(option => {
          listsSheet.getCell(`A${currentRow}`).value = option;
          currentRow++;
        });

        currentRow++; // Línea en blanco
      }
    });

    // Generar y descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantilla_${entityType === 'income' ? 'ingresos' : 'egresos'}_${templateData.sheetName}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setPreviewData(null); // Reset preview when new file is selected
    }
  };

  // Función para convertir el número serial de Excel a fecha YYYY-MM-DD
  const excelSerialToDate = (serial: number): string => {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + serial * 86400000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const processFile = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    try {
      setError(null);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Leer la hoja de datos
      const worksheet = workbook.Sheets['Datos'] || workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('El archivo no contiene datos');
      }

      // Transformar los datos al formato esperado
      const transformedData = jsonData.map((row: any, index: number) => {
        const transformedRow: any = { _rowNumber: index + 2 }; // +2 porque Excel empieza en 1 y la primera fila es el header

        templateData.columns.forEach(col => {
          const headerWithAsterisk = `${col.label} *`;
          let value = row[col.label] || row[headerWithAsterisk];

          if (col.required && !value) {
            throw new Error(`El campo "${col.label}" es requerido en la fila ${index + 2}`);
          }

          // Convertir números seriales de Excel a fechas
          if (col.type === 'date' && value && typeof value === 'number') {
            value = excelSerialToDate(value);
          }

          // Si el valor contiene " - " (como en "1 - Nombre"), extraer solo el ID
          if (col.type === 'select' && value && typeof value === 'string' && value.includes(' - ')) {
            value = parseInt(value.split(' - ')[0]);
          }

          transformedRow[col.field] = value;
        });

        return transformedRow;
      });

      setPreviewData(transformedData);
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Error al procesar el archivo');
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    try {
      setUploading(true);
      const result = await onImport(previewData);

      if (result.success) {
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Importación exitosa',
          message: result.message || `Se importaron ${previewData.length} registros exitosamente.`,
        });
        setFile(null);
        setPreviewData(null);
      } else {
        const errorDetails = result.data?.errors || [];
        setAlert({
          isOpen: true,
          type: errorDetails.length > 0 ? 'warning' : 'error',
          title: errorDetails.length > 0 ? 'Importación parcial' : 'Error en la importación',
          message: (
            <div>
              <p>{result.message}</p>
              {errorDetails.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto">
                  <p className="font-semibold text-sm mb-2">Errores encontrados:</p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {errorDetails.slice(0, 10).map((err: any, i: number) => (
                      <li key={i}>
                        Fila {err.row}: {err.errors.map((e: any) => e.message || e.field).join(', ')}
                      </li>
                    ))}
                    {errorDetails.length > 10 && (
                      <li>... y {errorDetails.length - 10} errores más</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ),
        });
      }
    } catch (err: any) {
      console.error('Error importing data:', err);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error en la importación',
        message: err.message || 'Ocurrió un error al importar los datos.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, isOpen: false });
    if (alert.type === 'success') {
      onClose();
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${
            previewData ? 'max-w-6xl' : 'max-w-2xl'
          } max-h-[90vh] overflow-hidden flex flex-col`}
        >
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Importación Masiva de {entityType === 'income' ? 'Ingresos' : 'Egresos'}
                {previewData && ` - ${previewData.length} registros`}
              </h2>
              <button
                onClick={handleCancel}
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-6">
            {!previewData ? (
              <>
                {/* Paso 1: Descargar plantilla */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Paso 1: Descarga la plantilla
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Descarga la plantilla Excel que contiene las columnas necesarias y las instrucciones
                    para completar los datos correctamente.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className={`px-4 py-2 ${
                      entityType === 'income'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    } text-white rounded-lg transition-colors flex items-center gap-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Plantilla Excel
                  </button>
                </div>

                {/* Paso 2: Cargar archivo */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Paso 2: Completa y carga el archivo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Completa la plantilla con tus datos y carga el archivo para previsualizar antes de importar.
                  </p>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {file ? file.name : 'Haz clic para seleccionar un archivo o arrástralo aquí'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Formatos soportados: .xlsx, .xls
                      </span>
                    </label>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  </div>
                )}

                {/* Advertencia */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Importante
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Asegúrate de completar todos los campos requeridos (marcados con *) y de usar
                        las opciones válidas para los campos de selección según se indica en la hoja de instrucciones.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Vista de previsualización */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Previsualización de datos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Revisa los datos antes de importar. Se mostrarán las primeras 5 columnas y hasta 10 filas.
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Fila
                          </th>
                          {templateData.columns.slice(0, 5).map((col) => (
                            <th
                              key={col.field}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              {col.label}
                              {col.required && <span className="text-red-500 ml-1">*</span>}
                            </th>
                          ))}
                          {templateData.columns.length > 5 && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              ...
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {previewData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                              {row._rowNumber}
                            </td>
                            {templateData.columns.slice(0, 5).map((col) => (
                              <td
                                key={col.field}
                                className="px-4 py-3 text-sm text-gray-900 dark:text-white"
                              >
                                {row[col.field] !== undefined && row[col.field] !== null
                                  ? String(row[col.field])
                                  : '-'}
                              </td>
                            ))}
                            {templateData.columns.length > 5 && (
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                ...
                              </td>
                            )}
                          </tr>
                        ))}
                        {previewData.length > 10 && (
                          <tr>
                            <td
                              colSpan={templateData.columns.slice(0, 5).length + 2}
                              className="px-4 py-3 text-sm text-center text-gray-500 dark:text-gray-400"
                            >
                              ... y {previewData.length - 10} filas más
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botones de acción */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
            {!previewData ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={processFile}
                  disabled={!file}
                  className={`px-4 py-2 ${
                    entityType === 'income'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Previsualizar Datos
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewData(null);
                    setFile(null);
                  }}
                  disabled={uploading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={uploading}
                  className={`px-4 py-2 ${
                    entityType === 'income'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {uploading ? 'Importando...' : `Importar ${previewData.length} registros`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alert Component */}
      <Alert
        isOpen={alert.isOpen}
        onClose={handleCloseAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </>
  );
}
