import * as XLSX from 'xlsx';
import { Remuneracion } from '../types/CC/remuneracion';

// Función principal para manejar la carga y procesamiento de archivos
export const handleExcelUpload = async (file: File): Promise<Remuneracion[]> => {
  try {
    // Leer el archivo Excel
    const data = await readExcelFile(file);
    
    // Procesar y transformar los datos
    const remuneraciones = processRemuneracionesData(data, file.name);
    
    return remuneraciones;
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

const generateUniqueId = (existingIds: number[]): number => {
  // Obtener el ID más alto existente
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  
  // Generar un nuevo ID basado en timestamp y el ID más alto
  const timestamp = Date.now();
  const newId = Math.max(timestamp, maxId + 1);
  
  return newId;
};

// Función corregida para procesar los datos de remuneraciones
export const processRemuneracionesData = (data: any[], fileName: string, existingRemuneraciones: Remuneracion[] = []): Remuneracion[] => {
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
  const apellidoPaternoIndex = getColumnIndex(['APELLIDO PATERNO']);
  const rutIndex = getColumnIndex(['RUT DEL TRABAJADOR', 'RUT TRABAJADOR']);
  
  // CORRECCIÓN: Buscar específicamente cada columna
  const sueldoLiquidoIndex = getColumnIndex(['SUELDO LIQUIDO A PAGO', 'SUELDO LÍQUIDO A PAGO', 'SUELDO LIQUIDO', 'LIQUIDO A PAGO']);
  const anticipoIndex = getColumnIndex(['ANTICIPOS']);
  
  const centroCostoCodigoIndex = getColumnIndex(['CENTRO COSTO (COD)', 'CENTRO COSTO COD']);
  const centroCostoNombreIndex = getColumnIndex(['CENTRO COSTO']);
  const areaIndex = getColumnIndex(['ÁREA', 'AREA']);
  const mesIndex = getColumnIndex(['MES']);
  const añoIndex = getColumnIndex(['AÑO', 'ANO']);
  
  // Debug: Mostrar qué columnas se encontraron
  console.log('Índices encontrados:', {
    sueldoLiquido: sueldoLiquidoIndex,
    anticipo: anticipoIndex,
    headers: headers
  });
  
  // Verificar columnas requeridas
  if (nombreIndex === -1) {
    throw new Error("No se encontró la columna 'Nombre'");
  }
  
  if (sueldoLiquidoIndex === -1 && anticipoIndex === -1) {
    throw new Error("No se encontraron columnas 'Sueldo Líquido' ni 'Anticipo'");
  }
  
  // Obtener todos los IDs existentes
  const existingIds = existingRemuneraciones.map(r => r.id);
  
  // Procesar filas de datos
  const remuneraciones: Remuneracion[] = [];
  
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i] as any[];
    
    if (!row || !row[nombreIndex]) continue;
    
    // CORRECCIÓN: Extraer valores específicos de cada columna
    const sueldoLiquido = sueldoLiquidoIndex !== -1 && row[sueldoLiquidoIndex] !== undefined && row[sueldoLiquidoIndex] !== null
      ? (typeof row[sueldoLiquidoIndex] === 'number' 
          ? row[sueldoLiquidoIndex] 
          : parseFloat(String(row[sueldoLiquidoIndex]).replace(/[^0-9.-]/g, '')) || 0) 
      : 0;
      
    const anticipo = anticipoIndex !== -1 && row[anticipoIndex] !== undefined && row[anticipoIndex] !== null
      ? (typeof row[anticipoIndex] === 'number' 
          ? row[anticipoIndex] 
          : parseFloat(String(row[anticipoIndex]).replace(/[^0-9.-]/g, '')) || 0) 
      : 0;
    
    // Debug: Mostrar valores extraídos para las primeras filas
    if (i <= headerRowIndex + 3) {
      console.log(`Fila ${i}:`, {
        sueldoLiquidoRaw: row[sueldoLiquidoIndex],
        anticipoRaw: row[anticipoIndex],
        sueldoLiquidoParsed: sueldoLiquido,
        anticipoParsed: anticipo
      });
    }
    
    // Calcular monto total solo si hay al menos uno de los valores
    const amount = sueldoLiquido + anticipo;
    
    // Extraer nombre y apellido
    const nombreCompleto = String(row[nombreIndex] || '');
    const apellidoPaterno = apellidoPaternoIndex !== -1 ? String(row[apellidoPaternoIndex] || '') : '';
    
    // Obtener solo el primer nombre
    const primerNombre = nombreCompleto.split(' ')[0];
    
    // Formatear nombre para mostrar: Primer nombre + Apellido paterno
    const nombreFormateado = apellidoPaterno ? `${primerNombre} ${apellidoPaterno}` : primerNombre;
    
    // Solo procesar si hay un nombre válido
    if (nombreCompleto.trim() && (sueldoLiquido > 0 || anticipo > 0)) {
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
      
      // RUT del trabajador
      const rutTrabajador = rutIndex !== -1 ? String(row[rutIndex] || '') : '';
      
      // Crear ID único garantizado
      const newId = generateUniqueId([...existingIds, ...remuneraciones.map(r => r.id)]);
      
      // CORRECCIÓN: Crear objeto con valores específicos
      const remuneracion: Remuneracion = {
        id: newId,
        name: `Remuneración ${periodo} - ${nombreFormateado}`,
        employeeId: newId,
        employeeName: `${nombreCompleto}${apellidoPaterno && !nombreCompleto.includes(apellidoPaterno) ? ' ' + apellidoPaterno : ''}`,
        employeeRut: rutTrabajador,
        area: area,
        period: periodo,
        workDays: 0,
        date: new Date().toISOString(),
        sueldoLiquido: sueldoLiquido,  // Valor específico del sueldo líquido
        anticipo: anticipo,             // Valor específico del anticipo
        amount: amount,                 // Total de ambos
        state: 'draft',
        companyId: 1,
        projectCode: centroCostoCodigo,
        projectName: centroCostoNombre,
        paymentMethod: 'Transferencia'
      };
      
      remuneraciones.push(remuneracion);
    }
  }
  
  console.log(`Procesados ${remuneraciones.length} registros`);
  return remuneraciones;
};

// Función auxiliar mejorada para encontrar la fila de encabezados
function findHeaderRow(data: any[]): number {
  // Buscar específicamente por "Rut del Trabajador" que es único
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (Array.isArray(row)) {
      const hasRutTrabajador = row.some((cell: any) => 
        typeof cell === 'string' && 
        (cell.toUpperCase().includes('RUT DEL TRABAJADOR') || 
         cell.toUpperCase().includes('RUT TRABAJADOR'))
      );
      
      if (hasRutTrabajador) {
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