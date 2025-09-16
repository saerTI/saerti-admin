// src/utils/remuneracionesExcelTemplateGenerator.ts
import * as XLSX from 'xlsx';

export interface ExcelTemplateColumn {
  header: string;
  key: string;
  width?: number;
  example?: string;
}

/**
 * Genera una plantilla Excel con las columnas especificadas
 * @param columns - Configuración de columnas
 * @param sheetName - Nombre de la hoja
 * @param fileName - Nombre del archivo
 */
export const generateExcelTemplate = (
  columns: ExcelTemplateColumn[],
  sheetName: string = 'Datos',
  fileName: string = 'plantilla.xlsx'
): void => {
  try {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Preparar datos para la hoja
    const headers = columns.map(col => col.header);
    const exampleRow = columns.map(col => col.example || '');

    // Crear datos: encabezados + fila de ejemplo
    const worksheetData = [
      headers,
      exampleRow
    ];

    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Configurar anchos de columna
    const colWidths = columns.map(col => ({
      wch: col.width || 15
    }));
    worksheet['!cols'] = colWidths;

    // Aplicar estilo a los encabezados (si es posible)
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[headerCell]) {
        worksheet[headerCell].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFCCCCCC" } }
        };
      }
    }

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generar y descargar el archivo
    XLSX.writeFile(workbook, fileName);

  } catch (error) {
    console.error('Error al generar plantilla Excel:', error);
    throw new Error('No se pudo generar la plantilla Excel');
  }
};

/**
 * Configuración específica para la plantilla de remuneraciones
 */
export const generateRemuneracionTemplate = (): void => {
  const remuneracionesColumns: ExcelTemplateColumn[] = [
    {
      header: 'RUT',
      key: 'rut',
      width: 15,
      example: '12345678-9'
    },
    {
      header: 'NOMBRE',
      key: 'nombre',
      width: 25,
      example: 'Juan Pérez González'
    },
    {
      header: 'TIPO',
      key: 'tipo',
      width: 15,
      example: 'sueldo'
    },
    {
      header: 'MONTO',
      key: 'monto',
      width: 15,
      example: '800000'
    },
    {
      header: 'MES',
      key: 'mes',
      width: 10,
      example: '12'
    },
    {
      header: 'AÑO',
      key: 'año',
      width: 10,
      example: '2024'
    },
    {
      header: 'CARGO',
      key: 'cargo',
      width: 20,
      example: 'Desarrollador'
    },
    {
      header: 'DEPARTAMENTO',
      key: 'departamento',
      width: 20,
      example: 'Tecnología'
    },
    {
      header: 'SUELDO BASE',
      key: 'sueldoBase',
      width: 15,
      example: '750000'
    },
    {
      header: 'SUELDO LIQUIDO',
      key: 'sueldoLiquido',
      width: 15,
      example: '650000'
    },
    {
      header: 'ANTICIPO',
      key: 'anticipo',
      width: 15,
      example: '100000'
    },
    {
      header: 'DIAS TRABAJADOS',
      key: 'diasTrabajados',
      width: 15,
      example: '30'
    },
    {
      header: 'METODO PAGO',
      key: 'metodoPago',
      width: 15,
      example: 'transferencia'
    },
    {
      header: 'ESTADO',
      key: 'estado',
      width: 15,
      example: 'pendiente'
    },
    {
      header: 'FECHA PAGO',
      key: 'fechaPago',
      width: 15,
      example: '2024-12-30'
    },
    {
      header: 'NOTAS',
      key: 'notas',
      width: 30,
      example: 'Observaciones adicionales'
    }
  ];

  generateExcelTemplate(
    remuneracionesColumns,
    'Remuneraciones',
    'plantilla_remuneraciones.xlsx'
  );
};

/**
 * Genera una plantilla simplificada con solo campos esenciales
 */
export const generateRemuneracionSimpleTemplate = (): void => {
  const remuneracionesColumns: ExcelTemplateColumn[] = [
    {
      header: 'RUT',
      key: 'rut',
      width: 15,
      example: '12345678-9'
    },
    {
      header: 'NOMBRE',
      key: 'nombre',
      width: 25,
      example: 'Juan Pérez González'
    },
    {
      header: 'TIPO',
      key: 'tipo',
      width: 15,
      example: 'sueldo'
    },
    {
      header: 'MONTO',
      key: 'monto',
      width: 15,
      example: '800000'
    },
    {
      header: 'MES',
      key: 'mes',
      width: 10,
      example: '12'
    },
    {
      header: 'AÑO',
      key: 'año',
      width: 10,
      example: '2024'
    }
  ];

  generateExcelTemplate(
    remuneracionesColumns,
    'Remuneraciones',
    'plantilla_remuneraciones_simple.xlsx'
  );
};

/**
 * Genera una plantilla con instrucciones detalladas
 */
export const generateRemuneracionTemplateWithInstructions = (): void => {
  try {
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Datos
    const dataHeaders = [
      'RUT', 'NOMBRE', 'TIPO', 'MONTO', 'MES', 'AÑO', 
      'CARGO', 'DEPARTAMENTO', 'SUELDO BASE', 'SUELDO LIQUIDO', 
      'ANTICIPO', 'DIAS TRABAJADOS', 'METODO PAGO', 'ESTADO', 
      'FECHA PAGO', 'NOTAS'
    ];
    const exampleData = [
      '12345678-9', 'Juan Pérez González', 'sueldo', 800000, 12, 2024, 
      'Desarrollador', 'Tecnología', 750000, 650000, 
      100000, 30, 'transferencia', 'pendiente', 
      '2024-12-30', 'Ejemplo de registro'
    ];

    const dataSheet = XLSX.utils.aoa_to_sheet([dataHeaders, exampleData]);
    dataSheet['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, 
      { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
    ];

    // Hoja 2: Instrucciones
    const instructions = [
      ['INSTRUCCIONES PARA CARGA MASIVA DE REMUNERACIONES'],
      [''],
      ['COLUMNAS REQUERIDAS:'],
      ['RUT', 'Formato: 12345678-9 (con guión). Si no existe, se creará el empleado automáticamente.'],
      ['NOMBRE', 'Nombre completo del empleado (requerido para crear nuevos empleados)'],
      ['TIPO', 'Tipo de remuneración: sueldo, anticipo, bono, comision, horas_extra'],
      ['MONTO', 'Valor numérico sin puntos ni comas (ej: 800000)'],
      ['MES', 'Número del mes (1-12)'],
      ['AÑO', 'Año en formato YYYY (ej: 2024)'],
      [''],
      ['COLUMNAS OPCIONALES:'],
      ['CARGO', 'Cargo/posición del empleado (solo para empleados nuevos)'],
      ['DEPARTAMENTO', 'Departamento del empleado (solo para empleados nuevos)'],
      ['SUELDO BASE', 'Sueldo base del empleado (solo para empleados nuevos)'],
      ['SUELDO LIQUIDO', 'Sueldo líquido después de descuentos'],
      ['ANTICIPO', 'Monto de anticipo otorgado'],
      ['DIAS TRABAJADOS', 'Número de días trabajados (1-31), por defecto 30'],
      ['METODO PAGO', 'Método de pago: transferencia, cheque, efectivo'],
      ['ESTADO', 'Estado: pendiente, aprobado, pagado, rechazado, cancelado'],
      ['FECHA PAGO', 'Fecha de pago en formato YYYY-MM-DD (ej: 2024-12-30)'],
      ['NOTAS', 'Observaciones adicionales'],
      [''],
      ['CREACIÓN AUTOMÁTICA DE EMPLEADOS:'],
      ['• Si el RUT no existe en el sistema, se creará automáticamente un empleado'],
      ['• Para empleados nuevos, NOMBRE es obligatorio'],
      ['• CARGO, DEPARTAMENTO y SUELDO BASE se usarán para el perfil del empleado'],
      ['• Si no se proporciona SUELDO BASE, se usará el MONTO como referencia'],
      [''],
      ['IMPORTANTE:'],
      ['• Complete todos los datos en la hoja "Datos"'],
      ['• Elimine la fila de ejemplo antes de importar'],
      ['• Los montos deben ser números sin formato (sin puntos ni comas)'],
      ['• Los campos CARGO y DEPARTAMENTO solo se usan para empleados nuevos'],
      ['• El sistema validará y reportará errores por fila si los hay']
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 25 }, { wch: 70 }];

    // Hoja 3: Valores permitidos
    const valoresPermitidos = [
      ['VALORES PERMITIDOS'],
      [''],
      ['TIPO DE REMUNERACIÓN:'],
      ['sueldo', 'Sueldo mensual regular'],
      ['anticipo', 'Anticipo de sueldo'],
      ['bono', 'Bonificación adicional'],
      ['comision', 'Comisión por ventas'],
      ['horas_extra', 'Pago por horas extra'],
      [''],
      ['MÉTODO DE PAGO:'],
      ['transferencia', 'Transferencia bancaria (por defecto)'],
      ['cheque', 'Pago con cheque'],
      ['efectivo', 'Pago en efectivo'],
      [''],
      ['ESTADO:'],
      ['pendiente', 'Pendiente de aprobación (por defecto)'],
      ['aprobado', 'Aprobado para pago'],
      ['pagado', 'Ya fue pagado'],
      ['rechazado', 'Rechazado'],
      ['cancelado', 'Cancelado']
    ];

    const valoresSheet = XLSX.utils.aoa_to_sheet(valoresPermitidos);
    valoresSheet['!cols'] = [{ wch: 20 }, { wch: 50 }];

    // Agregar hojas al libro
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos');
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
    XLSX.utils.book_append_sheet(workbook, valoresSheet, 'Valores Permitidos');

    // Descargar archivo
    XLSX.writeFile(workbook, 'plantilla_remuneraciones_completa.xlsx');

  } catch (error) {
    console.error('Error al generar plantilla con instrucciones:', error);
    throw new Error('No se pudo generar la plantilla Excel');
  }
};

/**
 * Exportar funciones principales
 */
export default {
  generateRemuneracionTemplate,
  generateRemuneracionSimpleTemplate,
  generateRemuneracionTemplateWithInstructions,
  generateExcelTemplate
};