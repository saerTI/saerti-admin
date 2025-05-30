// src/utils/previsionalUtils.ts
import * as XLSX from 'xlsx';
import { Previsional } from '../types/CC/previsional';

/**
 * Procesa un archivo Excel de previsionales y genera un array de objetos Previsional
 * @param file Archivo Excel a procesar
 * @returns Array de objetos Previsional
 */
export const handlePrevisionalExcelUpload = async (file: File): Promise<Previsional[]> => {
  try {
    // Leer el archivo Excel usando el método que ya funciona
    const data = await readExcelFile(file);
    
    // Procesar y transformar los datos
    const previsionales = processProvisionalesData(data, file.name);
    
    return previsionales;
  } catch (error) {
    // Re-lanzar el error para que sea manejado por el componente
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
        
        // Usar ArrayBuffer en lugar de binary string (evita la advertencia de deprecated)
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
    
    // Usar readAsArrayBuffer en lugar de readAsBinaryString
    reader.readAsArrayBuffer(file);
  });
};

// Función para procesar los datos de previsionales
export const processProvisionalesData = (data: any[], fileName: string, existingPrevisionales: Previsional[] = []): Previsional[] => {
  // Buscar encabezados
  let headerRowIndex = findHeaderRow(data);
  
  if (headerRowIndex === -1) {
    throw new Error("No se encontraron encabezados en el archivo");
  }
  
  // Mapear encabezados a índices de columna
  const headers = data[headerRowIndex] as any[];
  const getColumnIndex = (searchTerms: string[]) => {
    return headers.findIndex((header: any) => 
      header && typeof header === 'string' && 
      searchTerms.some(term => header.toUpperCase().includes(term.toUpperCase()))
    );
  };
  
  // Buscar índices de columnas con términos más específicos
  const nombreIndex = getColumnIndex(['NOMBRE']);
  const rutIndex = getColumnIndex(['RUT DEL TRABAJADOR', 'RUT TRABAJADOR', 'RUT']);
  const tipoIndex = getColumnIndex(['TIPO', 'TIPO PREVISIONAL']);
  const montoIndex = getColumnIndex(['MONTO', 'VALOR']);
  
  const centroCostoCodigoIndex = getColumnIndex(['CENTRO COSTO (COD)', 'CENTRO COSTO COD']);
  const centroCostoNombreIndex = getColumnIndex(['CENTRO COSTO']);
  const areaIndex = getColumnIndex(['ÁREA', 'AREA']);
  const mesIndex = getColumnIndex(['MES']);
  const añoIndex = getColumnIndex(['AÑO', 'ANO']);
  const descuentosLegalesIndex = getColumnIndex(['DESCUENTOS LEGALES', 'DESCUENTOS']);
  
  // Debug: Mostrar qué columnas se encontraron
  console.log('Índices encontrados para previsionales:', {
    nombre: nombreIndex,
    rut: rutIndex,
    tipo: tipoIndex,
    monto: montoIndex,
    headers: headers
  });
  
  // Verificar columnas requeridas
  if (nombreIndex === -1) {
    throw new Error("No se encontró la columna 'Nombre'");
  }
  
  if (rutIndex === -1) {
    throw new Error("No se encontró la columna 'RUT'");
  }
  
  if (tipoIndex === -1) {
    throw new Error("No se encontró la columna 'Tipo'");
  }
  
  if (montoIndex === -1) {
    throw new Error("No se encontró la columna 'Monto'");
  }
  
  // Procesar filas de datos
  const previsionales: Previsional[] = [];
  
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i] as any[];
    
    if (!row || !row[nombreIndex] || !row[rutIndex]) continue;
    
    // Extraer valores específicos de cada columna
    const monto = montoIndex !== -1 && row[montoIndex] !== undefined && row[montoIndex] !== null
      ? (typeof row[montoIndex] === 'number' 
          ? row[montoIndex] 
          : parseFloat(String(row[montoIndex]).replace(/[^0-9.-]/g, '')) || 0) 
      : 0;
    
    const descuentosLegales = descuentosLegalesIndex !== -1 && row[descuentosLegalesIndex] !== undefined && row[descuentosLegalesIndex] !== null
      ? (typeof row[descuentosLegalesIndex] === 'number' 
          ? row[descuentosLegalesIndex] 
          : parseFloat(String(row[descuentosLegalesIndex]).replace(/[^0-9.-]/g, '')) || 0) 
      : 0;
    
    // Debug: Mostrar valores extraídos para las primeras filas
    if (i <= headerRowIndex + 3) {
      console.log(`Fila ${i}:`, {
        nombreRaw: row[nombreIndex],
        rutRaw: row[rutIndex],
        tipoRaw: row[tipoIndex],
        montoRaw: row[montoIndex],
        montoParsed: monto
      });
    }
    
    // Extraer nombre y tipo
    const nombreCompleto = String(row[nombreIndex] || '');
    const rutTrabajador = String(row[rutIndex] || '');
    
    // Determinar el tipo de previsional
    let tipo = tipoIndex !== -1 ? String(row[tipoIndex] || '') : '';
    if (!tipo) {
      tipo = 'AFP'; // Valor por defecto
    } else {
      // Normalizar el tipo
      const tipoUpper = tipo.toUpperCase();
      if (tipoUpper.includes('AFP')) {
        tipo = 'AFP';
      } else if (tipoUpper.includes('ISAPRE') && tipoUpper.includes('7%')) {
        tipo = 'Isapre 7%';
      } else if (tipoUpper.includes('ISAPRE')) {
        tipo = 'Isapre';
      } else if (tipoUpper.includes('SEGURO') || tipoUpper.includes('CESANTIA')) {
        tipo = 'Seguro Cesantía';
      } else if (tipoUpper.includes('MUTUAL')) {
        tipo = 'Mutual';
      }
    }
    
    // Solo procesar si hay un nombre válido, RUT y monto
    if (nombreCompleto.trim() && rutTrabajador && monto > 0) {
      // Construir periodo desde mes y año
      let periodo = '';
      if (mesIndex !== -1 && añoIndex !== -1 && row[mesIndex] && row[añoIndex]) {
        const mes = String(row[mesIndex]).padStart(2, '0');
        const año = String(row[añoIndex]);
        periodo = `${mes}/${año}`;
      } else {
        periodo = extractPeriod(row, -1, fileName);
      }
      
      // Centro de Costo
      const centroCostoCodigo = centroCostoCodigoIndex !== -1 ? String(row[centroCostoCodigoIndex] || '') : '';
      const centroCostoNombre = centroCostoNombreIndex !== -1 ? String(row[centroCostoNombreIndex] || '') : '';
      
      // Área
      const area = areaIndex !== -1 ? String(row[areaIndex] || '') : '';
      
      // Crear ID único
      const newId = -(i); // ID negativo para indicar que es un registro nuevo
      
      // Crear objeto Previsional
      const previsional: Previsional = {
        id: newId,
        name: `${tipo} ${periodo} - ${nombreCompleto}`,
        employeeId: 0, // Valor temporal
        employeeName: nombreCompleto,
        employeeRut: rutTrabajador,
        type: tipo,
        amount: monto,
        descuentosLegales: descuentosLegales,
        date: periodo ? `${periodo.split('/')[1]}-${periodo.split('/')[0]}-01` : new Date().toISOString().split('T')[0],
        period: periodo,
        state: 'pending',
        companyId: 1,
        projectId: undefined,
        projectName: centroCostoNombre,
        projectCode: centroCostoCodigo,
        area: area,
        centroCosto: centroCostoCodigo,
        centroCostoNombre: centroCostoNombre,
        notes: ''
      };
      
      previsionales.push(previsional);
    }
  }
  
  console.log(`Procesados ${previsionales.length} registros de previsionales`);
  return previsionales;
};

// Función auxiliar mejorada para encontrar la fila de encabezados
function findHeaderRow(data: any[]): number {
  // Buscar específicamente por "Rut" o "Nombre" que son columnas comunes
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (Array.isArray(row)) {
      const hasRut = row.some((cell: any) => 
        typeof cell === 'string' && 
        (cell.toUpperCase().includes('RUT DEL TRABAJADOR') || 
         cell.toUpperCase().includes('RUT TRABAJADOR') ||
         cell.toUpperCase() === 'RUT')
      );
      
      const hasNombre = row.some((cell: any) => 
        typeof cell === 'string' && 
        cell.toUpperCase() === 'NOMBRE'
      );
      
      if (hasRut || hasNombre) {
        console.log(`Encabezados encontrados en la fila ${i}:`, row);
        return i;
      }
    }
  }
  
  return -1;
}

// Función auxiliar para extraer periodo en formato correcto (MM/YYYY)
function extractPeriod(row: any[], periodoIndex: number, fileName: string): string {
  if (periodoIndex !== -1 && row[periodoIndex]) {
    const periodStr = String(row[periodoIndex]);
    
    // Primero intentamos detectar si es un formato incorrecto como "20/2504"
    if (/^\d{2}\/\d{4}$/.test(periodStr)) {
      return periodStr;
    }
    else if (/^\d{2}\/\d{2}$/.test(periodStr)) {
      // Formato MM/YY - convertir a MM/YYYY
      const [month, shortYear] = periodStr.split('/');
      const fullYear = parseInt(shortYear) < 50 ? `20${shortYear}` : `19${shortYear}`;
      return `${month}/${fullYear}`;
    }
    else if (/^\d{1,2}\/\d{4}$/.test(periodStr)) {
      // Ya es MM/YYYY pero aseguramos que mes tenga cero inicial
      const [month, year] = periodStr.split('/');
      return `${month.padStart(2, '0')}/${year}`;
    }
    else if (/^\d{4}-\d{1,2}$/.test(periodStr) || /^\d{4}\/\d{1,2}$/.test(periodStr)) {
      // Formato YYYY-MM o YYYY/MM
      const parts = periodStr.split(/[-\/]/);
      return `${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    else if (/^\d{1,2}-\d{4}$/.test(periodStr) || /^\d{1,2}\/\d{4}$/.test(periodStr)) {
      // Formato MM-YYYY o MM/YYYY
      const parts = periodStr.split(/[-\/]/);
      return `${parts[0].padStart(2, '0')}/${parts[1]}`;
    }
    else if (/^(20\d{2})(0[1-9]|1[0-2])$/.test(periodStr)) {
      // Formato YYYYMM (como 202505)
      const year = periodStr.substring(0, 4);
      const month = periodStr.substring(4, 6);
      return `${month}/${year}`;
    }
    
    // Si no coincide con ningún formato reconocido, intentamos extraer de una fecha
    try {
      const date = new Date(periodStr);
      if (!isNaN(date.getTime())) {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
    } catch (e) {
      // Ignorar error de parseo
    }
  }
  
  // Intentar extraer del nombre del archivo
  const match = fileName.match(/(\d{2})[-_]?(\d{4})/);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  
  // Usar fecha actual como último recurso
  const now = new Date();
  return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
}

// Función auxiliar para obtener el período actual en formato MM/YYYY
export const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
};

export default {
  handlePrevisionalExcelUpload,
  readExcelFile,
  processProvisionalesData,
  getCurrentPeriod
};