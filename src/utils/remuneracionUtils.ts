import * as XLSX from 'xlsx';
import { Remuneracion, RemuneracionCreateData } from '../types/CC/remuneracion';
import { createRemuneracionesBatch } from '../services/CC/remuneracionesService';

// Definir el tipo de respuesta esperada de la API
interface BatchCreateResponse {
  success: boolean;
  message: string;
  data: {
    ids: number[];
    created: number;
    errors: Array<{ index: number; item: any; error: string }>;
    total: number;
  };
}

// 🔧 También permitir que el servicio devuelva solo un array de IDs (para compatibilidad)
type BatchServiceResponse = BatchCreateResponse | number[];

/**
 * Procesa un archivo Excel de remuneraciones
 * @param file Archivo Excel a procesar
 * @returns Array de objetos Remuneracion guardados
 */
// Parte corregida del archivo remuneracionUtils.ts - función handleRemuneracionExcelUpload

/**
 * Procesa un archivo Excel de remuneraciones con manejo robusto de datos faltantes
 * 
 * Esta función ahora maneja elegantemente los casos donde los datos del Excel
 * pueden estar incompletos o mal formateados, proporcionando valores predeterminados
 * sensatos en lugar de fallar.
 */
export const handleRemuneracionExcelUpload = async (file: File): Promise<Remuneracion[]> => {
  try {
    // Leer el archivo Excel
    const data = await readExcelFile(file);
    
    // Procesar y transformar los datos
    const remuneracionesTemp = processRemuneracionesData(data, file.name);
    
    console.log(`Procesados ${remuneracionesTemp.length} registros, enviando a API...`);
    
    // ✅ CLAVE: Preparar array con manejo defensivo de datos faltantes
    const batchData: RemuneracionCreateData[] = remuneracionesTemp.map((remuneracion, index) => {
      
      // 🔧 Estrategia: Crear valores predeterminados inteligentes para datos críticos
      
      // Para el nombre, crear un valor predeterminado basado en información disponible
      const nombreFinal = remuneracion.employeeName || 
                         (remuneracion.employeeRut ? `Empleado ${remuneracion.employeeRut}` : '') || 
                         `Empleado ${index + 1}`;
      
      // Para el RUT, asegurar que siempre tengamos algo, aunque sea vacío
      const rutFinal = remuneracion.employeeRut || '';
      
      // Para el cargo, proporcionar un valor predeterminado profesional
      const cargoFinal = remuneracion.employeePosition || 'No especificado';
      
      // Debug para verificar transformación en casos problemáticos
      if (!remuneracion.employeeName || !remuneracion.employeeRut) {
        console.warn(`⚠️ Datos incompletos en registro ${index + 1}:`, {
          original: {
            employeeName: remuneracion.employeeName,
            employeeRut: remuneracion.employeeRut
          },
          corregido: {
            nombre: nombreFinal,
            rut: rutFinal
          }
        });
      }
      
      return {
        // ✅ CORREGIDO: Usar valores con garantía de no ser undefined
        rut: rutFinal,                    // ✅ Siempre string, nunca undefined
        nombre: nombreFinal,              // ✅ Siempre string, nunca undefined - ESTO RESUELVE EL ERROR
        cargo: cargoFinal,                // ✅ Siempre string, nunca undefined
        
        // Determinar tipo basado en los valores monetarios
        tipo: remuneracion.sueldoLiquido && remuneracion.sueldoLiquido > 0 ? 'REMUNERACION' : 'ANTICIPO',
        
        // Campos monetarios con valores predeterminados seguros
        sueldoLiquido: remuneracion.sueldoLiquido || 0,
        anticipo: remuneracion.anticipo || 0,
        
        // TODO: Implementar funcionalidad de proyectos
        // Cuando se implemente, descomentar:
        // proyectoId: remuneracion.projectId?.toString() || '',
        proyectoId: '', // TEMPORAL: Siempre vacío hasta implementar proyectos
        
        // Campos de fecha y estado con valores predeterminados
        fecha: remuneracion.date || new Date().toISOString().split('T')[0],
        estado: remuneracion.state || 'pending',
        diasTrabajados: remuneracion.workDays || 30,
        metodoPago: remuneracion.paymentMethod || 'Transferencia',
        
        // TEMPORAL: Usar estos campos para guardar info de centro de costo
        centroCosto: remuneracion.projectCode || '',
        centroCostoNombre: remuneracion.projectName || '',
        area: remuneracion.area || '',
        
        // Monto total con validación adicional
        montoTotal: remuneracion.amount || 0
      };
    });
    
    // ✅ Validación adicional: verificar que tenemos datos válidos antes de enviar
    const validRecords = batchData.filter(record => {
      const hasValidAmount = (record.montoTotal ?? 0) > 0 || 
      (record.sueldoLiquido ?? 0) > 0 || 
      (record.anticipo ?? 0) > 0;
      const hasValidName = record.nombre.trim().length > 0;
      
      if (!hasValidAmount || !hasValidName) {
        console.warn('⚠️ Registro inválido filtrado:', record);
        return false;
      }
      
      return true;
    });
    
    if (validRecords.length === 0) {
      throw new Error('No se encontraron registros válidos para importar. Verifique que el archivo contenga datos de empleados con montos mayores a cero.');
    }
    
    if (validRecords.length < batchData.length) {
      console.warn(`⚠️ Se filtraron ${batchData.length - validRecords.length} registros inválidos de ${batchData.length} total.`);
    }
    
    // Enviar datos a la API - manejar ambos formatos de respuesta
    const response: BatchServiceResponse = await createRemuneracionesBatch(validRecords);
    
    console.log(`Resultado API:`, response);
    
    // 🔧 Manejar diferentes formatos de respuesta con type guards
    let ids: number[] = [];
    
    if (Array.isArray(response)) {
      // Respuesta simple: array de IDs
      ids = response;
    } else if (response && typeof response === 'object' && 'data' in response) {
      // Respuesta completa: objeto con metadata
      const batchResponse = response as BatchCreateResponse;
      if (batchResponse.data && Array.isArray(batchResponse.data.ids)) {
        ids = batchResponse.data.ids;
      } else {
        throw new Error('Respuesta de API inválida: estructura de datos incorrecta');
      }
    } else {
      throw new Error('Respuesta de API inválida: formato no reconocido');
    }
    
    if (ids.length === 0) {
      throw new Error('No se crearon registros en el servidor');
    }
    
    // Crear objetos Remuneracion con IDs reales para devolver
    const savedRemuneraciones: Remuneracion[] = ids.map((id: number, index: number) => ({
      ...remuneracionesTemp[index],
      id: id
    }));
    
    return savedRemuneraciones;
  } catch (error) {
    console.error('Error en handleRemuneracionExcelUpload:', error);
    throw error;
  }
};

// Función para leer archivos Excel
export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        if (!e.target || !e.target.result) {
          throw new Error("Error al leer el archivo");
        }
        
        const data = e.target.result;
        const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
        
        // Asumimos que los datos están en la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON con encabezados
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        resolve(jsonData as any[]);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Función para procesar los datos de remuneraciones
export const processRemuneracionesData = (data: any[], fileName: string, existingRemuneraciones: Remuneracion[] = []): Remuneracion[] => {
  // Buscar encabezados
  let headerRowIndex = findHeaderRow(data);
  
  if (headerRowIndex === -1) {
    throw new Error("No se encontraron encabezados en el archivo. Verifique que el archivo tenga columnas como 'NOMBRE', 'RUT', 'SUELDO LIQUIDO' o 'ANTICIPO'.");
  }
  
  // Mapear encabezados a índices de columna
  const headers = data[headerRowIndex] as any[];
  console.log("Encabezados detectados:", headers);
  
  const getColumnIndex = (searchTerms: string[], exactMatch = false) => {
    return headers.findIndex((header: any) => {
      if (!header || typeof header !== 'string') return false;
      
      const headerUpper = header.toUpperCase().trim();
      
      if (exactMatch) {
        return searchTerms.some(term => headerUpper === term.toUpperCase().trim());
      } else {
        return searchTerms.some(term => headerUpper.includes(term.toUpperCase().trim()));
      }
    });
  };

  // Buscar columnas específicas - primero intentar coincidencia exacta, luego parcial
  // NOMBRE
  let nombreIndex = getColumnIndex(['NOMBRE', 'NOMBRE COMPLETO'], true);
  const apellidoPaternoIndex = getColumnIndex(['APELLIDO PATERNO'], true);
  const cargoIndex = getColumnIndex(['CARGO', 'POSITION', 'PUESTO'], true);

  if (nombreIndex === -1) {
    nombreIndex = getColumnIndex(['NOMBRE', 'TRABAJADOR', 'EMPLEADO']);
  }

  // RUT
  let rutIndex = getColumnIndex(['RUT'], true);
  if (rutIndex === -1) {
    rutIndex = getColumnIndex(['RUT TRABAJADOR', 'RUT DEL TRABAJADOR', 'CEDULA', 'IDENTIFICACION']);
  }

  // SUELDO LIQUIDO
  let sueldoLiquidoIndex = getColumnIndex(['SUELDO LIQUIDO A PAGO'], true);
  if (sueldoLiquidoIndex === -1) {
    sueldoLiquidoIndex = getColumnIndex(['SUELDO LIQUIDO', 'LIQUIDO A PAGO', 'SUELDO LÍQUIDO', 'REMUNERACION']);
  }

  // ANTICIPO
  let anticipoIndex = getColumnIndex(['ANTICIPOS'], true);
  if (anticipoIndex === -1) {
    anticipoIndex = getColumnIndex(['ANTICIPO', 'ADELANTO', 'AVANCE']);
  }

  // TOTAL
  let totalIndex = getColumnIndex(['SUELDO LIQUIDO MAS ANTICIPO', 'TOTAL'], true);
  if (totalIndex === -1) {
    totalIndex = getColumnIndex(['TOTAL', 'LIQUIDO TOTAL', 'MONTO TOTAL']);
  }

  // AREA
  const areaIndex = getColumnIndex(['AREA', 'ÁREA', 'DEPARTAMENTO']);

  // CENTRO DE COSTO
  const centroCostoIndex = getColumnIndex(['CENTRO COSTO', 'CENTRO DE COSTO', 'PROYECTO']);
  const centroCostoCodigoIndex = getColumnIndex(['CENTRO COSTO (COD)', 'CODIGO CENTRO COSTO', 'CENTRO COSTO COD', 'COD CENTRO COSTO']);

  // PERIODO
  const periodoIndex = getColumnIndex(['PERIODO', 'MES Y AÑO']);
  const mesIndex = getColumnIndex(['MES']);
  const anioIndex = getColumnIndex(['AÑO', 'ANO', 'YEAR']);
  
  // Mostrar columnas encontradas
  console.log('Columnas encontradas:', {
    nombre: nombreIndex >= 0 ? headers[nombreIndex] : 'NO ENCONTRADO',
    rut: rutIndex >= 0 ? headers[rutIndex] : 'NO ENCONTRADO',
    sueldoLiquido: sueldoLiquidoIndex >= 0 ? headers[sueldoLiquidoIndex] : 'NO ENCONTRADO',
    anticipo: anticipoIndex >= 0 ? headers[anticipoIndex] : 'NO ENCONTRADO',
    total: totalIndex >= 0 ? headers[totalIndex] : 'NO ENCONTRADO',
    area: areaIndex >= 0 ? headers[areaIndex] : 'NO ENCONTRADO',
    centroCosto: centroCostoIndex >= 0 ? headers[centroCostoIndex] : 'NO ENCONTRADO',
    centroCostoCodigo: centroCostoCodigoIndex >= 0 ? headers[centroCostoCodigoIndex] : 'NO ENCONTRADO',
    cargo: cargoIndex >= 0 ? headers[cargoIndex] : 'NO ENCONTRADO'
  });
  
  // Verificar columnas críticas
  const errores = [];
  
  if (nombreIndex === -1) {
    errores.push("No se encontró la columna 'Nombre'");
  }
  
  if (sueldoLiquidoIndex === -1 && anticipoIndex === -1 && totalIndex === -1) {
    errores.push("No se encontraron columnas con montos (Sueldo Líquido, Anticipo o Total)");
  }
  
  if (errores.length > 0) {
    throw new Error(`Errores en el archivo Excel: ${errores.join(', ')}. Encabezados encontrados: ${headers.join(', ')}`);
  }
  
  // Extraer periodo del nombre del archivo o la fecha actual
  const periodoPredeterminado = extractPeriodFromFileName(fileName) || getCurrentPeriod();
  
  // ✅ Timestamp base para IDs únicos
  const baseTimestamp = Date.now();
  
  // Procesar filas de datos
  const remuneraciones: Remuneracion[] = [];
  
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i] as any[];
    
    // Saltar filas vacías o sin datos críticos
    if (!row || row.length === 0) continue;
    
    // Extraer valores de las columnas
    // Extraer nombre y apellido
    const nombreCompleto = String(row[nombreIndex] || '');
    const apellidoPaterno = apellidoPaternoIndex !== -1 ? String(row[apellidoPaternoIndex] || '') : '';
    
    // Obtener solo el primer nombre
    const primerNombre = nombreCompleto.split(' ')[0];
    
    // Formatear nombre para mostrar: Primer nombre + Apellido paterno
    const nombreFormateado = apellidoPaterno ? `${primerNombre} ${apellidoPaterno}` : nombreCompleto;

    const nombre = nombreFormateado;
    const rut = rutIndex !== -1 && row[rutIndex] ? String(row[rutIndex]).trim() : '';
    const area = areaIndex !== -1 && row[areaIndex] ? String(row[areaIndex]).trim() : '';
    const cargo = cargoIndex !== -1 && row[cargoIndex] ? String(row[cargoIndex]).trim() : '';
    
    // Extraer montos (remuneración, anticipo y total)
    const sueldoLiquido = extractNumber(sueldoLiquidoIndex !== -1 ? row[sueldoLiquidoIndex] : null);
    const anticipo = extractNumber(anticipoIndex !== -1 ? row[anticipoIndex] : null);
    
    // ✅ Calcular total - usar el valor directo si existe, de lo contrario sumar sueldo + anticipo
    let total = 0;
    if (totalIndex !== -1 && row[totalIndex] !== undefined && row[totalIndex] !== null) {
      total = extractNumber(row[totalIndex]);      
    } else {
      total = sueldoLiquido + anticipo;
    }
    
    // Extraer centro de costo
    const centroCosto = centroCostoIndex !== -1 && row[centroCostoIndex] ? String(row[centroCostoIndex]).trim() : '';
    const centroCostoCodigo = centroCostoCodigoIndex !== -1 && row[centroCostoCodigoIndex] ? String(row[centroCostoCodigoIndex]).trim() : '';
    
    // Debug para centro de costo en primeras filas
    if (i <= headerRowIndex + 3) {
      console.log(`Fila ${i} - Centro de Costo:`, {
        centroCostoCol: centroCostoIndex !== -1 ? row[centroCostoIndex] : 'N/A',
        centroCostoCodigoCol: centroCostoCodigoIndex !== -1 ? row[centroCostoCodigoIndex] : 'N/A',
        centroCostoProcessed: centroCosto,
        centroCostoCodigoProcessed: centroCostoCodigo
      });
    }
    
    // Solo procesar si hay un nombre y algún monto
    if ((nombre || rut) && total > 0) {
      // Determinar periodo
      let periodo = '';
      
      if (periodoIndex !== -1 && row[periodoIndex]) {
        periodo = formatPeriod(String(row[periodoIndex]));
      } else if (mesIndex !== -1 && anioIndex !== -1 && row[mesIndex] && row[anioIndex]) {
        const mes = String(row[mesIndex]).padStart(2, '0');
        const anio = String(row[anioIndex]);
        periodo = `${mes}/${anio}`;
      } else {
        periodo = periodoPredeterminado;
      }
      
      // Crear fecha en formato YYYY-MM-DD para la API
      const fecha = formatDateFromPeriod(periodo);
      
      // ✅ ID único temporal basado en timestamp + índice
      const uniqueId = -(baseTimestamp + i);
      
      // Crear remuneración
      const remuneracion: Remuneracion = {
        id: uniqueId, // ✅ ID único temporal
        name: nombre || "Empleado",
        employeeId: 0,
        employeeName: nombre || "Empleado",
        employeeRut: rut,
        employeePosition: cargo || 'No especificado',
        area: area,
        period: periodo,
        date: fecha,
        sueldoLiquido: sueldoLiquido,
        anticipo: anticipo,
        amount: total, // ✅ Usar total calculado correctamente
        state: 'pending',
        companyId: 1,
        projectId: undefined, // ✅ No usar centroCosto como projectId
        projectName: centroCosto, // Guardar el centro de costo en projectName
        projectCode: centroCostoCodigo || centroCosto, // Guardar el código en projectCode
        workDays: 30,
        paymentMethod: 'Transferencia',
        paymentDate: ''
      };
      
      remuneraciones.push(remuneracion);
    }
  }
  
  console.log(`Procesados ${remuneraciones.length} registros de remuneraciones`);
  return remuneraciones;
};

// Función auxiliar para extraer números de cualquier formato
function extractNumber(value: any): number {
  if (value === undefined || value === null) return 0;
  
  // Si ya es un número
  if (typeof value === 'number') return value;
  
  // Si es string, limpiar y convertir
  if (typeof value === 'string') {
    // Eliminar todo excepto dígitos, punto y coma
    const cleanValue = value
      .replace(/[^\d.,\-]/g, '') // Mantener solo dígitos, puntos, comas y signo negativo
      .replace(/,/g, '.'); // Reemplazar comas por puntos
    
    // Convertir a número
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  }
  
  return 0;
}

// Función auxiliar para encontrar la fila de encabezados
function findHeaderRow(data: any[]): number {
  // Buscar en las primeras 15 filas
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    
    // Imprimir para depuración
    console.log(`Analizando fila ${i} para encabezados:`, row);
    
    // Buscar términos comunes en encabezados
    const hasRelevantTerms = row.some((cell: any) => {
      if (typeof cell !== 'string') return false;
      
      const cellUpper = cell.toUpperCase().trim();
      return ['NOMBRE', 'RUT', 'SUELDO', 'LIQUIDO', 'ANTICIPO', 'TOTAL'].some(term => 
        cellUpper.includes(term)
      );
    });
    
    if (hasRelevantTerms) {
      console.log(`Encabezados encontrados en la fila ${i}:`, row);
      return i;
    }
  }
  
  return -1;
}

// Función para formatear una fecha a partir de un periodo MM/YYYY
function formatDateFromPeriod(period: string): string {
  if (!period || !period.includes('/')) {
    // Si el periodo no es válido, usar la fecha actual
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
  
  const parts = period.split('/');
  if (parts.length !== 2) return new Date().toISOString().split('T')[0];
  
  const month = parts[0].padStart(2, '0');
  const year = parts[1];
  
  return `${year}-${month}-01`;
}

// Función para formatear un periodo en formato MM/YYYY
function formatPeriod(periodStr: string): string {
  if (!periodStr) return '';
  
  // Formato MM/YYYY
  if (/^\d{2}\/\d{4}$/.test(periodStr)) {
    return periodStr;
  }
  
  // Formato MM/YY
  if (/^\d{2}\/\d{2}$/.test(periodStr)) {
    const [month, shortYear] = periodStr.split('/');
    const fullYear = parseInt(shortYear) < 50 ? `20${shortYear}` : `19${shortYear}`;
    return `${month}/${fullYear}`;
  }
  
  // Formato M/YYYY o MM/YYYY - asegurar que mes tenga 2 dígitos
  if (/^\d{1,2}\/\d{4}$/.test(periodStr)) {
    const [month, year] = periodStr.split('/');
    return `${month.padStart(2, '0')}/${year}`;
  }
  
  // Formato YYYY-MM o YYYY/MM
  if (/^\d{4}[-\/]\d{1,2}$/.test(periodStr)) {
    const parts = periodStr.split(/[-\/]/);
    return `${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  
  // Formato MM-YYYY o MM/YYYY
  if (/^\d{1,2}[-\/]\d{4}$/.test(periodStr)) {
    const parts = periodStr.split(/[-\/]/);
    return `${parts[0].padStart(2, '0')}/${parts[1]}`;
  }
  
  // Formato YYYYMM (como 202304)
  if (/^(20\d{2})(0[1-9]|1[0-2])$/.test(periodStr)) {
    const year = periodStr.substring(0, 4);
    const month = periodStr.substring(4, 6);
    return `${month}/${year}`;
  }
  
  // Intentar analizar como fecha
  try {
    const date = new Date(periodStr);
    if (!isNaN(date.getTime())) {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
  } catch (e) {
    // Ignorar error
  }
  
  // No se pudo formatear
  return '';
}

// Función para extraer periodo del nombre del archivo
function extractPeriodFromFileName(fileName: string): string {
  // Patrón para MM-YYYY, MM_YYYY, MMYYYY, etc.
  const patterns = [
    /(\d{2})[-_]?(\d{4})/,     // 04-2023, 04_2023, 042023
    /(\d{4})[-_]?(\d{2})/,     // 2023-04, 2023_04, 202304
    /remuneraciones?[_\s-]*(\d{2})[_\s-]*(\d{4})/i,  // remuneraciones_04_2023, remuneraciones-04-2023
    /(\d{2})[_\s-]*(\d{4})[_\s-]*remuneraciones?/i   // 04_2023_remuneraciones, 04-2023-remuneraciones
  ];
  
  for (const pattern of patterns) {
    const match = fileName.match(pattern);
    if (match) {
      // Determinar si es MM-YYYY o YYYY-MM según el patrón
      if (pattern.toString().startsWith('/\\(\\d{4}')) {
        // YYYY-MM
        return `${match[2].padStart(2, '0')}/${match[1]}`;
      } else {
        // MM-YYYY
        return `${match[1].padStart(2, '0')}/${match[2]}`;
      }
    }
  }
  
  // No se encontró un patrón de periodo
  return '';
}

// Función para obtener el periodo actual
export const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
};

export default {
  handleRemuneracionExcelUpload,
  readExcelFile,
  processRemuneracionesData,
  getCurrentPeriod
};