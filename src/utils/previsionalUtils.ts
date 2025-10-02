import * as XLSX from 'xlsx';
import { PrevisionalType } from '../types/CC/previsional';

export interface PrevisionalImportData {
  rut: string;
  nombre: string;
  tipo_previsional: PrevisionalType;
  monto: number;
  mes: number;
  año: number;
  fecha_pago?: string;
  notas?: string;
}

/**
 * Procesa un archivo Excel de previsionales y genera un array de objetos para importar
 * @param file Archivo Excel a procesar
 * @returns Array de objetos PrevisionalImportData
 */
export const handlePrevisionalExcelUpload = async (file: File): Promise<PrevisionalImportData[]> => {
  try {
    const data = await readExcelFile(file);
    const previsionales = processProvisionalesDataForImport(data, file.name);
    return previsionales;
  } catch (error) {
    throw error;
  }
};

/**
 * Función para leer archivos Excel
 */
export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Función para procesar los datos de previsionales para importación masiva
 */
export const processProvisionalesDataForImport = (data: any[], fileName: string): PrevisionalImportData[] => {
  let headerRowIndex = findHeaderRow(data);
  
  if (headerRowIndex === -1) {
    throw new Error("No se encontraron encabezados en el archivo");
  }
  
  const headers = data[headerRowIndex] as any[];
  const getColumnIndex = (searchTerms: string[]) => {
    return headers.findIndex((header: any) => 
      header && typeof header === 'string' && 
      searchTerms.some(term => header.toUpperCase().includes(term.toUpperCase()))
    );
  };
  
  // Buscar índices de columnas específicos para la plantilla
  const rutIndex = getColumnIndex(['RUT']);
  const nombreIndex = getColumnIndex(['NOMBRE']);
  const tipoIndex = getColumnIndex(['TIPO PREVISIONAL', 'TIPO']);
  const montoIndex = getColumnIndex(['MONTO']);
  const mesIndex = getColumnIndex(['MES']);
  const añoIndex = getColumnIndex(['AÑO', 'ANO']);
  const fechaPagoIndex = getColumnIndex(['FECHA DE PAGO', 'FECHA PAGO']);
  const notasIndex = getColumnIndex(['NOTAS', 'OBSERVACIONES']);

  // Verificar columnas requeridas
  const requiredColumns = [
    { index: rutIndex, name: 'RUT' },
    { index: nombreIndex, name: 'NOMBRE' },
    { index: tipoIndex, name: 'TIPO PREVISIONAL' },
    { index: montoIndex, name: 'MONTO' },
    { index: mesIndex, name: 'MES' },
    { index: añoIndex, name: 'AÑO' }
  ];

  const missingColumns = requiredColumns.filter(col => col.index === -1);
  if (missingColumns.length > 0) {
    const missingNames = missingColumns.map(col => col.name).join(', ');
    throw new Error(`No se encontraron las columnas requeridas: ${missingNames}`);
  }
  
  const previsionales: PrevisionalImportData[] = [];
  
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i] as any[];
    
    if (!row || !row[nombreIndex] || !row[rutIndex]) continue;
    
    try {
      // Extraer y validar valores
      const rut = String(row[rutIndex] || '').trim();
      const nombre = String(row[nombreIndex] || '').trim();
      const tipoStr = String(row[tipoIndex] || '').toLowerCase().trim();
      const montoValue = parseFloat(String(row[montoIndex] || '0').replace(/[,\.]/g, ''));
      const mes = parseInt(String(row[mesIndex] || '0'));
      const año = parseInt(String(row[añoIndex] || new Date().getFullYear()));

      // Validar tipo previsional
      const validTypes: PrevisionalType[] = ['afp', 'isapre', 'isapre_7', 'fonasa', 'seguro_cesantia', 'mutual'];
      const tipo = validTypes.find(t => t === tipoStr) || 'afp';

      // Validar datos requeridos
      if (!rut || !nombre || isNaN(montoValue) || isNaN(mes) || isNaN(año)) {
        console.warn(`Fila ${i + 1} omitida: datos incompletos`);
        continue;
      }

      // Validar mes (1-12)
      if (mes < 1 || mes > 12) {
        console.warn(`Fila ${i + 1} omitida: mes inválido (${mes})`);
        continue;
      }

      // Datos opcionales
      const fechaPago = fechaPagoIndex !== -1 && row[fechaPagoIndex] ? 
        String(row[fechaPagoIndex]).trim() : undefined;
      const notas = notasIndex !== -1 && row[notasIndex] ? 
        String(row[notasIndex]).trim() : undefined;

      const previsional: PrevisionalImportData = {
        rut,
        nombre,
        tipo_previsional: tipo,
        monto: montoValue,
        mes,
        año,
        fecha_pago: fechaPago,
        notas
      };
      
      previsionales.push(previsional);
      
    } catch (error) {
      console.warn(`Error procesando fila ${i + 1}:`, error);
      continue;
    }
  }
  
  if (previsionales.length === 0) {
    throw new Error("No se pudieron procesar registros válidos del archivo");
  }
  
  console.log(`Procesados ${previsionales.length} registros válidos`);
  return previsionales;
};

/**
 * Función para encontrar la fila de encabezados
 */
function findHeaderRow(data: any[]): number {
  const commonHeaders = ['RUT', 'NOMBRE', 'TIPO', 'MONTO', 'MES', 'AÑO'];
  
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i] as any[];
    if (!row) continue;
    
    const headerCount = row.filter((cell: any) => {
      if (!cell || typeof cell !== 'string') return false;
      const cellUpper = cell.toUpperCase();
      return commonHeaders.some(header => cellUpper.includes(header));
    }).length;
    
    if (headerCount >= 3) {
      return i;
    }
  }
  
  return -1;
}

/**
 * Función auxiliar para obtener el período actual en formato MM/YYYY
 */
export const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
};

export default {
  handlePrevisionalExcelUpload,
  readExcelFile,
  processProvisionalesDataForImport,
  getCurrentPeriod
};