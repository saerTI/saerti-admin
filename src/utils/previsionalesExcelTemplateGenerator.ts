// src/utils/excelTemplateGenerator.ts
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
 * Configuración específica para la plantilla de previsionales
 */
export const generatePrevisionalTemplate = (): void => {
  const previsionalesColumns: ExcelTemplateColumn[] = [
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
      header: 'TIPO PREVISIONAL',
      key: 'tipo_previsional',
      width: 20,
      example: 'afp'
    },
    {
      header: 'CENTRO DE COSTO',
      key: 'centro_costo',
      width: 20,
      example: 'Administración'
    },
    {
      header: 'MONTO',
      key: 'monto',
      width: 15,
      example: '150000'
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
      header: 'FECHA DE PAGO',
      key: 'fecha_pago',
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
    previsionalesColumns,
    'Previsionales',
    'plantilla_previsionales.xlsx'
  );
};

/**
 * Genera una plantilla con instrucciones detalladas
 */
export const generatePrevisionalTemplateWithInstructions = (): void => {
  try {
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Datos
    const dataHeaders = [
      'RUT', 'NOMBRE', 'TIPO PREVISIONAL', 'CENTRO DE COSTO', 
      'MONTO', 'MES', 'AÑO', 'FECHA DE PAGO', 'NOTAS'
    ];
    const exampleData = [
      '12345678-9', 'Juan Pérez González', 'afp', 'Administración', 
      150000, 12, 2024, '2024-12-30', 'Ejemplo de registro'
    ];

    const dataSheet = XLSX.utils.aoa_to_sheet([dataHeaders, exampleData]);
    dataSheet['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 },
      { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 30 }
    ];

    // Hoja 2: Instrucciones
    const instructions = [
      ['INSTRUCCIONES PARA CARGA MASIVA DE PREVISIONALES'],
      [''],
      ['COLUMNAS REQUERIDAS:'],
      ['RUT', 'Formato: 12345678-9 (con guión)'],
      ['NOMBRE', 'Nombre completo del empleado'],
      ['TIPO PREVISIONAL', 'Valores permitidos: afp, isapre, isapre_7, fonasa, seguro_cesantia, mutual'],
      ['CENTRO DE COSTO', 'Nombre exacto del centro de costo existente'],
      ['MONTO', 'Valor numérico sin puntos ni comas (ej: 150000)'],
      ['MES', 'Número del mes (1-12)'],
      ['AÑO', 'Año en formato YYYY (ej: 2024)'],
      ['FECHA DE PAGO', 'Formato: YYYY-MM-DD (ej: 2024-12-30) - Opcional'],
      ['NOTAS', 'Observaciones adicionales - Opcional'],
      [''],
      ['IMPORTANTE:'],
      ['• Los empleados deben existir en el sistema'],
      ['• Los centros de costo deben existir previamente'],
      ['• El RUT debe coincidir exactamente con el registrado'],
      ['• Los tipos previsionales deben ser exactos (en minúsculas)'],
      ['• Complete todos los datos en la hoja "Datos"'],
      ['• Elimine la fila de ejemplo antes de importar']
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 30 }, { wch: 50 }];

    // Agregar hojas al libro
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos');
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');

    // Descargar archivo
    XLSX.writeFile(workbook, 'plantilla_previsionales_completa.xlsx');

  } catch (error) {
    console.error('Error al generar plantilla con instrucciones:', error);
    throw new Error('No se pudo generar la plantilla Excel');
  }
};