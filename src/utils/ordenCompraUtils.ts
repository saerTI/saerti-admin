// src/utils/ordenCompraUtils.ts
import * as XLSX from 'xlsx';
import { OrdenCompra, OrdenCompraCreateData, OrdenCompraEstado, OrdenCompraBatchCreateResponse } from '../types/CC/ordenCompra.ts';
import { createOrdenesCompraBatch } from '../services/CC/ordenesCompraService.ts';
import { getReferenceData } from '../services/CC/ordenesCompraItemService.ts';

// Definir interfaces para los datos de cada archivo
interface OrdenCompraBasica {
  nOC: string;
  nombreOC?: string;
  fecha: string;
  obra: string;
  proveedor: string;
  condicionPago: string;
  monto: number;
}

interface OrdenCompraDetalle {
  nOC: string;
  codigoCC: string;
  cuentaCosto: string;
  descripcion?: string;
  glosa?: string; // ✅ NUEVO: Campo para glosa del Excel
  monto?: number; // ✅ NUEVO: Campo para monto del detalle
}

interface OrdenCompraConsolidada extends OrdenCompraBasica {
  detalles: OrdenCompraDetalle[];
  // Campos consolidados del primer detalle
  codigoCC?: string;
  cuentaCosto?: string;
}

export interface ProcessingStats {
  total: number;
  created: number;
  updated: number;
  errors: number;
  processed: number;
  successRate: number;
}

// Mapeo de columnas para archivo principal (oc_1.xlsx)
const MAIN_COLUMNS = {
  nOC: ['N OC', 'NUMERO OC', 'OC', 'NÚMERO OC', 'N° OC', 'No OC', 'NO OC'],
  nombreOC: ['NOMBRE OC', 'NOMBRE', 'DESCRIPCION OC', 'DESCRIPCIÓN OC', 'NOMBRE DE LA OC'],
  fecha: ['FECHA', 'DATE', 'FECHA OC'],
  obra: ['OBRA', 'CENTRO DE GESTION', 'CENTRO DE GESTIÓN', 'PROYECTO', 'CENTRO DE GESTIÓN'],
  proveedor: ['PROVEEDOR', 'SUPPLIER', 'PROVIDER'], 
  condicionPago: ['CONDICION DE PAGO', 'CONDICIÓN DE PAGO', 'TERMINOS DE PAGO', 'PAYMENT TERMS', 'CONDICIÓN PAGO'],
  monto: ['MONTO', 'VALOR', 'TOTAL', 'AMOUNT']
};

// Mapeo de columnas para archivo de detalles (oc_2.xlsx)
const DETAIL_COLUMNS = {
  nOC: ['N OC', 'NUMERO OC', 'OC', 'NÚMERO OC', 'N° OC', 'No OC', 'NO OC'],
  codigoCC: ['CODIGO C.C.', 'CÓDIGO C.C.', 'CC', 'CODIGO CC', 'CÓDIGO CC', 'CÓDIGO DE C.C.'],
  cuentaCosto: ['CUENTA DE COSTO', 'CUENTA COSTO', 'CUENTA CONTABLE', 'CUENTA', 'CATEGORY'],
  descripcion: ['DESCRIPCION', 'DESCRIPCIÓN', 'DESCRIPTION', 'DESC', 'DETALLE'],
  glosa: ['GLOSA', 'GLOSSA', 'OBSERVACION', 'OBSERVACIÓN', 'COMENTARIO', 'OBSERVACIONES'],
  monto: ['MONTO', 'VALOR', 'TOTAL', 'AMOUNT', 'SUB TOTAL', 'SUBTOTAL']
};

/**
 * Funciones auxiliares para buscar IDs de referencia
 */
async function findCostCenterId(centroCostoNombre: string, costCenters: any[]): Promise<number | null> {
  if (!centroCostoNombre || !costCenters || costCenters.length === 0) return null;
  
  const normalized = centroCostoNombre.trim().toLowerCase();
  
  // Buscar por nombre exacto
  let found = costCenters.find(cc => 
    cc.name?.toLowerCase().trim() === normalized
  );
  
  if (found) {
    console.log(`✅ Centro de costo encontrado por nombre: "${centroCostoNombre}" -> ID ${found.id}`);
    return found.id;
  }
  
  // Buscar por código
  found = costCenters.find(cc => 
    cc.code?.toLowerCase().trim() === normalized
  );
  
  if (found) {
    console.log(`✅ Centro de costo encontrado por código: "${centroCostoNombre}" -> ID ${found.id}`);
    return found.id;
  }
  
  // Búsqueda parcial por nombre
  found = costCenters.find(cc => 
    cc.name?.toLowerCase().includes(normalized) || 
    normalized.includes(cc.name?.toLowerCase())
  );
  
  if (found) {
    console.log(`✅ Centro de costo encontrado por coincidencia parcial: "${centroCostoNombre}" -> ID ${found.id}`);
    return found.id;
  }
  
  console.log(`⚠️ Centro de costo NO encontrado: "${centroCostoNombre}"`);
  return null;
}

async function findAccountCategoryId(cuentaCosto: string | undefined, accountCategories: any[]): Promise<number | null> {
  if (!cuentaCosto || !accountCategories || accountCategories.length === 0) return null;
  
  const normalized = cuentaCosto.trim().toLowerCase();
  
  // Buscar por código exacto
  let found = accountCategories.find(ac => 
    ac.code?.toLowerCase().trim() === normalized
  );
  
  if (found) {
    console.log(`✅ Categoría contable encontrada por código: "${cuentaCosto}" -> ID ${found.id}`);
    return found.id;
  }
  
  // Buscar por nombre exacto
  found = accountCategories.find(ac => 
    ac.name?.toLowerCase().trim() === normalized
  );
  
  if (found) {
    console.log(`✅ Categoría contable encontrada por nombre: "${cuentaCosto}" -> ID ${found.id}`);
    return found.id;
  }
  
  // Buscar por grupo
  found = accountCategories.find(ac => 
    ac.group_name?.toLowerCase().trim() === normalized
  );
  
  if (found) {
    console.log(`✅ Categoría contable encontrada por grupo: "${cuentaCosto}" -> ID ${found.id}`);
    return found.id;
  }
  
  // Búsqueda parcial
  found = accountCategories.find(ac => 
    ac.name?.toLowerCase().includes(normalized) || 
    ac.code?.toLowerCase().includes(normalized) ||
    normalized.includes(ac.name?.toLowerCase()) ||
    normalized.includes(ac.code?.toLowerCase())
  );
  
  if (found) {
    console.log(`✅ Categoría contable encontrada por coincidencia parcial: "${cuentaCosto}" -> ID ${found.id}`);
    return found.id;
  }
  
  console.log(`⚠️ Categoría contable NO encontrada: "${cuentaCosto}"`);
  return null;
}

/**
 * Lee archivo Excel y devuelve los datos de la primera hoja
 */
async function readExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Encuentra el mapeo de columnas en el archivo Excel
 */
function findColumnMapping(headers: string[], columnMap: Record<string, string[]>): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  console.log('🔍 Headers encontrados:', headers);
  
  Object.entries(columnMap).forEach(([field, possibleNames]) => {
    const columnIndex = headers.findIndex(header => {
      if (!header) return false;
      
      const headerNormalized = header.toString().toUpperCase().trim();
      return possibleNames.some(name => 
        headerNormalized === name.toUpperCase().trim()
      );
    });
    
    if (columnIndex !== -1) {
      mapping[field] = columnIndex;
      console.log(`✅ Campo '${field}' mapeado a columna ${columnIndex} (${headers[columnIndex]})`);
    } else {
      console.log(`❌ Campo '${field}' NO encontrado`);
    }
  });
  
  return mapping;
}

/**
 * Encuentra la fila de headers reales en el archivo Excel
 */
function findHeaderRow(data: any[], expectedFields: string[][]): number {
  console.log('🔍 Buscando fila de headers en', data.length, 'filas...');
  
  for (let rowIndex = 0; rowIndex < Math.min(data.length, 20); rowIndex++) {
    const row = data[rowIndex];
    if (!row || !Array.isArray(row)) continue;
    
    const headers = row.map((header: any) => header?.toString().toUpperCase().trim() || '');
    
    let matchCount = 0;
    expectedFields.forEach((fieldGroup: string[]) => {
      const foundInGroup = fieldGroup.some((fieldName: string) => 
        headers.some(header => header === fieldName.toUpperCase().trim())
      );
      if (foundInGroup) matchCount++;
    });
    
    const validColumnsCount = headers.filter(h => h.length > 0).length;
    const minRequiredMatches = Math.ceil(expectedFields.length / 2);
    
    if (matchCount >= minRequiredMatches && validColumnsCount >= 3) {
      console.log(`✅ Headers encontrados en fila ${rowIndex}`);
      return rowIndex;
    }
  }
  
  return -1;
}

/**
 * Formatea fecha
 */
function formatDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  if (typeof dateValue === 'number') {
    const date = XLSX.SSF.parse_date_code(dateValue);
    return `${date.y}-${date.m.toString().padStart(2, '0')}-${date.d.toString().padStart(2, '0')}`;
  }
  
  if (typeof dateValue === 'string') {
    const cleanDate = dateValue.trim();
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(cleanDate)) {
      const parts = cleanDate.split(/[-/]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

/**
 * Formatea monto
 */
function formatAmount(amountValue: any): number {
  if (typeof amountValue === 'number') {
    return amountValue;
  }
  
  if (typeof amountValue === 'string') {
    const cleanAmount = amountValue
      .replace(/[$\s]/g, '')
      .replace(/,/g, '.');
    
    return parseFloat(cleanAmount) || 0;
  }
  
  return 0;
}


/**
 * Procesa archivo de órdenes básicas (oc_1.xlsx)
 */
function processOrdenesBasicas(data: any[], fileName: string): OrdenCompraBasica[] {
  const expectedFieldGroups = Object.values(MAIN_COLUMNS);
  const headerRowIndex = findHeaderRow(data, expectedFieldGroups);
  
  if (headerRowIndex === -1) {
    throw new Error('No se encontraron headers válidos en el archivo principal');
  }
  
  const headers = data[headerRowIndex].map((header: any) => header?.toString() || '');
  const rows = data.slice(headerRowIndex + 1);
  const columnMapping = findColumnMapping(headers, MAIN_COLUMNS);
  
  // Verificar campos requeridos
  const requiredFields = ['nOC', 'proveedor', 'monto'];
  const missingFields = requiredFields.filter(field => !(field in columnMapping));
  
  if (missingFields.length > 0) {
    throw new Error(`Columnas requeridas no encontradas: ${missingFields.join(', ')}`);
  }
  
  return rows
    .filter((row: any[]) => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
    .map((row: any[]) => ({
      nOC: row[columnMapping.nOC]?.toString().trim() || '',
      nombreOC: row[columnMapping.nombreOC]?.toString().trim(),
      fecha: formatDate(row[columnMapping.fecha]),
      obra: row[columnMapping.obra]?.toString().trim() || '',
      proveedor: row[columnMapping.proveedor]?.toString().trim() || '',
      condicionPago: row[columnMapping.condicionPago]?.toString().trim() || '',
      monto: formatAmount(row[columnMapping.monto])
    }))
    .filter(orden => orden.nOC && orden.proveedor && orden.monto > 0);
}

/**
 * Procesa archivo de detalles (oc_2.xlsx)
 */
function processOrdenesDetalles(data: any[], fileName: string): OrdenCompraDetalle[] {
  const expectedFieldGroups = Object.values(DETAIL_COLUMNS);
  const headerRowIndex = findHeaderRow(data, expectedFieldGroups);
  
  if (headerRowIndex === -1) {
    throw new Error('No se encontraron headers válidos en el archivo de detalles');
  }
  
  const headers = data[headerRowIndex].map((header: any) => header?.toString() || '');
  const rows = data.slice(headerRowIndex + 1);
  const columnMapping = findColumnMapping(headers, DETAIL_COLUMNS);

  // ====== NUEVO: Logs detallados de lo leído ======
  try {
    const headerStrings = headers.map((h: any) => (h ?? '').toString());
    console.log(`🧭 [Detalles] Archivo: ${fileName}`);
    console.log(`🧭 [Detalles] Fila de headers detectada: ${headerRowIndex}`);
    console.log('🧭 [Detalles] Headers:', headerStrings);

    console.log(`📚 [Detalles] Total de filas leídas (excluyendo headers): ${rows.length}`);

    // Log de cada fila como arreglo crudo
    rows.forEach((row: any[], i: number) => {
      console.log(`➡️ [Detalles] Fila #${headerRowIndex + 1 + i + 1}:`, row);
    });

    // Log tabular mapeando cada columna por índice y nombre de header
    const rowsAsObjects = rows.map((row: any[], i: number) => {
      const obj: Record<string, any> = { '#fila': headerRowIndex + 1 + i + 1 };
      headerStrings.forEach((h: string, idx: number) => {
        obj[`[${idx}] ${h || '(sin header)'}`] = row?.[idx];
      });
      return obj;
    });
    console.log('📋 [Detalles] Tabla completa leída:');
      // ====== NUEVO: Logs detallados de lo leído ======
  try {
    const headerStrings = headers.map((h: any) => (h ?? '').toString());
    console.log(`🧭 [Detalles] Archivo: ${fileName}`);
    console.log(`🧭 [Detalles] Fila de headers detectada: ${headerRowIndex}`);
    console.log('🧭 [Detalles] Headers:', headerStrings);

    console.log(`📚 [Detalles] Total de filas leídas (excluyendo headers): ${rows.length}`);

    // Log de cada fila como arreglo crudo
    rows.forEach((row: any[], i: number) => {
      console.log(`➡️ [Detalles] Fila #${headerRowIndex + 1 + i + 1}:`, row);
    });

    // Log tabular mapeando cada columna por índice y nombre de header
    const rowsAsObjects = rows.map((row: any[], i: number) => {
      const obj: Record<string, any> = { '#fila': headerRowIndex + 1 + i + 1 };
      headerStrings.forEach((h: string, idx: number) => {
        obj[`[${idx}] ${h || '(sin header)'}`] = row?.[idx];
      });
      return obj;
    });
    console.log('📋 [Detalles] Tabla completa leída:');
    console.table(rowsAsObjects);
  } catch (logErr) {
    console.warn('⚠️ [Detalles] Error al generar logs detallados:', logErr);
  }
  // ====== FIN NUEVO ======ble(rowsAsObjects);
  } catch (logErr) {
    console.warn('⚠️ [Detalles] Error al generar logs detallados:', logErr);
  }
  // ====== FIN NUEVO ======
  
  // Verificar campos requeridos
  const requiredFields = ['nOC', 'codigoCC'];
  const missingFields = requiredFields.filter(field => !(field in columnMapping));
  
  if (missingFields.length > 0) {
    throw new Error(`Columnas requeridas no encontradas: ${missingFields.join(', ')}`);
  }
  
  // ✅ NUEVO: Log del mapeo de columnas incluyendo glosa y monto
  console.log('🗂️ [Detalles] Mapeo de columnas:', {
    nOC: columnMapping.nOC !== undefined ? `Columna ${columnMapping.nOC}` : 'NO ENCONTRADA',
    codigoCC: columnMapping.codigoCC !== undefined ? `Columna ${columnMapping.codigoCC}` : 'NO ENCONTRADA', 
    cuentaCosto: columnMapping.cuentaCosto !== undefined ? `Columna ${columnMapping.cuentaCosto}` : 'NO ENCONTRADA',
    descripcion: columnMapping.descripcion !== undefined ? `Columna ${columnMapping.descripcion}` : 'NO ENCONTRADA',
    glosa: columnMapping.glosa !== undefined ? `Columna ${columnMapping.glosa}` : 'NO ENCONTRADA',
    monto: columnMapping.monto !== undefined ? `Columna ${columnMapping.monto}` : 'NO ENCONTRADA'
  });
  
  return rows
    .filter((row: any[]) => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
    .map((row: any[]) => ({
      nOC: row[columnMapping.nOC]?.toString().trim() || '',
      codigoCC: row[columnMapping.codigoCC]?.toString().trim() || '',
      cuentaCosto: row[columnMapping.cuentaCosto]?.toString().trim() || '',
      descripcion: row[columnMapping.descripcion]?.toString().trim(),
      glosa: row[columnMapping.glosa]?.toString().trim(), // ✅ NUEVO: Capturar glosa del Excel
      monto: columnMapping.monto !== undefined ? formatAmount(row[columnMapping.monto]) : undefined // ✅ NUEVO: Capturar monto del detalle
    }))
    .filter(detalle => detalle.nOC && detalle.codigoCC);
}

/**
 * Consolida datos de ambos archivos
 */
function consolidateOrderData(
  ordenesBasicas: OrdenCompraBasica[], 
  ordenesDetalles: OrdenCompraDetalle[]
): OrdenCompraConsolidada[] {
  console.log('🔄 Consolidando datos...');
  console.log('📊 Órdenes básicas:', ordenesBasicas.length);
  console.log('📊 Órdenes detalles:', ordenesDetalles.length);
  
  // Agrupar detalles por N OC
  const detallesPorOC = ordenesDetalles.reduce((acc, detalle) => {
    if (!acc[detalle.nOC]) {
      acc[detalle.nOC] = [];
    }
    acc[detalle.nOC].push(detalle);
    return acc;
  }, {} as Record<string, OrdenCompraDetalle[]>);
  
  // Crear Map para evitar duplicados en órdenes básicas
  const ordenesBasicasMap = new Map<string, OrdenCompraBasica>();
  ordenesBasicas.forEach(orden => {
    ordenesBasicasMap.set(orden.nOC, orden);
  });
  
  console.log('📊 Órdenes básicas únicas:', ordenesBasicasMap.size);
  console.log('📊 Grupos de detalles:', Object.keys(detallesPorOC).length);
  
  // Validar que todos los detalles de la misma OC tengan el mismo Código CC
  for (const [nOC, detalles] of Object.entries(detallesPorOC)) {
    const codigoCC = detalles[0]?.codigoCC;
    const todosIguales = detalles.every(d => d.codigoCC === codigoCC);
    
    if (!todosIguales) {
      // console.warn(`⚠️ OC ${nOC} tiene diferentes Códigos CC:`, detalles.map(d => d.codigoCC));
    } else {
      // console.log(`✅ OC ${nOC} tiene Código CC consistente: ${codigoCC}`);
    }
  }
  

  // Consolidar datos
  const consolidadas: OrdenCompraConsolidada[] = [];
  
  // Procesar órdenes básicas
  for (const [nOC, ordenBasica] of ordenesBasicasMap) {
    const detalles = detallesPorOC[nOC] || [];
    
    // Usar el primer detalle para campos adicionales (ya que todos deberían ser iguales)
    const primerDetalle = detalles[0];
    
    consolidadas.push({
      ...ordenBasica,
      detalles: detalles,
      codigoCC: primerDetalle?.codigoCC || '',
      cuentaCosto: primerDetalle?.cuentaCosto || ''
    });    
  }
  
  // Procesar detalles que no tienen orden básica (crear órdenes básicas)
  for (const [nOC, detalles] of Object.entries(detallesPorOC)) {
    if (!ordenesBasicasMap.has(nOC)) {
      const primerDetalle = detalles[0];
      
      console.log(`⚠️ Creando orden básica para OC: ${nOC} (solo tiene detalles)`);
      
      consolidadas.push({
        nOC,
        nombreOC: primerDetalle.descripcion || `Orden ${nOC}`,
        fecha: new Date().toISOString().split('T')[0],
        obra: 'Por definir',
        proveedor: 'Por definir',
        condicionPago: 'Por definir',
        monto: 1, // Monto mínimo para evitar errores
        detalles: detalles,
        codigoCC: primerDetalle.codigoCC,
        cuentaCosto: primerDetalle.cuentaCosto
      });
    }
  }
  
  console.log('✅ Total consolidadas:', consolidadas.length);
  return consolidadas;
}

/**
 * Convierte datos consolidados a formato para API
 */
async function convertToApiFormat(
  consolidadas: OrdenCompraConsolidada[], 
  costCenters: any[], 
  accountCategories: any[]
): Promise<OrdenCompraCreateData[]> {
  const results: OrdenCompraCreateData[] = [];
  
  for (const orden of consolidadas) {
    // Buscar IDs de referencia
    const costCenterId = await findCostCenterId(orden.obra, costCenters);
    const accountCategoryId = await findAccountCategoryId(orden.cuentaCosto || orden.codigoCC, accountCategories);
    
    results.push({
      name: orden.nombreOC || `Orden ${orden.nOC}`,
      orderNumber: orden.nOC,
      supplierName: orden.proveedor,
      providerId: 0,
      amount: orden.monto,
      date: orden.fecha,
      state: 'draft' as OrdenCompraEstado,
      cuentaContable: orden.codigoCC || '',
      grupoCuenta: orden.cuentaCosto || '',
      centroCostoId: costCenterId || undefined,
      centroCostoNombre: orden.obra,
      accountCategoryId: accountCategoryId || undefined, // ✅ NUEVO
      deliveryDate: undefined,
      paymentTerms: orden.condicionPago,
      tieneFactura: false,
      estadoPago: 'pendiente',
      fechaVencimiento: undefined,
      notes: `Consolidado de ${orden.detalles.length} detalles: ${orden.detalles.map(d => d.codigoCC).join(', ')}`
    });
  }
  
  return results;
}

/**
 * Función principal para procesar ambos archivos Excel con búsqueda automática de IDs
 * 
 * ✅ NUEVAS FUNCIONALIDADES:
 * - Carga automática de datos de referencia (centros de costo y categorías contables)
 * - Búsqueda inteligente de IDs basada en códigos/nombres del Excel
 * - Asignación automática de cost_center_id y account_category_id
 * - Creación de items detallados con IDs de referencia
 * - Logging detallado del proceso de búsqueda y asignación
 * 
 * @param mainFile - Archivo Excel principal con datos básicos de órdenes
 * @param detailFile - Archivo Excel con detalles y códigos de centros de costo
 * @returns Promise<OrdenCompra[]> - Órdenes creadas con información de IDs asignados
 */
export const handleConsolidatedExcelUpload = async (
  mainFile: File,
  detailFile: File
): Promise<OrdenCompra[]> => {
  try {
    console.log('🚀 Iniciando procesamiento consolidado...');
    console.log('📄 Archivo principal:', mainFile.name);
    console.log('📄 Archivo detalles:', detailFile.name);
    
    // ✅ NUEVO: Cargar datos de referencia al inicio
    console.log('📚 Cargando datos de referencia...');
    const referenceData = await getReferenceData();
    const { costCenters, accountCategories } = referenceData;
    
    console.log(`✅ Cargados ${costCenters.length} centros de costo y ${accountCategories.length} categorías contables`);
    
    // Leer ambos archivos
    const [mainData, detailData] = await Promise.all([
      readExcelFile(mainFile),
      readExcelFile(detailFile)
    ]);
    
    // Procesar datos de cada archivo
    const ordenesBasicas = processOrdenesBasicas(mainData, mainFile.name);
    const ordenesDetalles = processOrdenesDetalles(detailData, detailFile.name);
    
    // Consolidar datos
    const consolidadas = consolidateOrderData(ordenesBasicas, ordenesDetalles);
    
    if (consolidadas.length === 0) {
      throw new Error('No se encontraron órdenes válidas para consolidar');
    }
    
    // ✅ ACTUALIZADO: Convertir a formato API con búsqueda de IDs
    const apiData = await convertToApiFormat(consolidadas, costCenters, accountCategories);
    
    console.log(`✅ Procesadas ${apiData.length} órdenes consolidadas, enviando a API...`);
    
    // ✅ ENVIAR A API CON SOPORTE PARA UPSERT
    const response = await createOrdenesCompraBatch(apiData);
    
    let ids: number[] = [];
    let created = 0;
    let updated = 0;
    
    if (Array.isArray(response)) {
      // Respuesta simple (array de IDs)
      ids = response;
      created = response.length;
      updated = 0;
    } else if (response && typeof response === 'object' && 'data' in response) {
      // Respuesta completa con información de upsert
      ids = response.data?.ids || [];
      created = response.data?.created || 0;
      updated = response.data?.updated || 0;
      
      console.log('📊 Estadísticas de procesamiento:', {
        total: response.data?.total || 0,
        created,
        updated,
        processed: response.data?.processed || 0,
        errors: response.data?.errors?.length || 0
      });
    }
    
    if (ids.length === 0) {
      throw new Error('No se crearon registros en el servidor');
    }

    // ✅ NUEVO: CREAR ITEMS DE DETALLE PARA CADA ORDEN
    console.log('🔧 Creando items de detalle para las órdenes...');
    
    // Importar servicio de items dinámicamente para evitar problemas de importación circular
    const { bulkCreateItems } = await import('../services/CC/ordenesCompraItemService');
    
    let totalItemsCreated = 0;
    const itemCreationErrors: string[] = [];
    
    // Procesar cada orden con sus detalles
    for (let i = 0; i < ids.length; i++) {
      const purchaseOrderId = ids[i];
      const consolidada = consolidadas[i];
      
      if (consolidada && consolidada.detalles && consolidada.detalles.length > 0) {
        try {
          // ✅ NUEVO: Buscar IDs para cada detalle
          const itemsPromises = consolidada.detalles.map(async (detalle) => {
            const detalleCostCenterId = await findCostCenterId(consolidada.obra, costCenters);
            const detalleAccountCategoryId = await findAccountCategoryId(detalle.cuentaCosto || detalle.codigoCC, accountCategories);
            
            // ✅ Log para verificar glosa y monto
            const glosaSaved = detalle.glosa || `Código CC: ${detalle.codigoCC} | Cuenta: ${detalle.cuentaCosto}`;
            const itemTotal = detalle.monto && detalle.monto > 0 
              ? detalle.monto 
              : Math.round(consolidada.monto / consolidada.detalles.length);
            
            console.log(`📝 [Item] OC ${detalle.nOC}: Glosa = "${glosaSaved}" ${detalle.glosa ? '(del Excel)' : '(generada)'}, Monto = ${itemTotal} ${detalle.monto ? '(del detalle)' : '(distribuido)'}`);
            
            return {
              cost_center_id: detalleCostCenterId,
              account_category_id: detalleAccountCategoryId,
              date: consolidada.fecha,
              description: detalle.descripcion || `${detalle.codigoCC} - ${detalle.cuentaCosto}`,
              glosa: glosaSaved, // ✅ ACTUALIZADO: Usar glosa del Excel
              currency: 'CLP',
              total: itemTotal // ✅ ACTUALIZADO: Usar monto del detalle o distribuir
            };
          });
          
          // Esperar a que se resuelvan todas las búsquedas de IDs
          const items = await Promise.all(itemsPromises);
          
          const itemsResult = await bulkCreateItems(purchaseOrderId, items);
          totalItemsCreated += itemsResult.inserted;
          
          console.log(`✅ Creados ${itemsResult.inserted} items para OC ${consolidada.nOC} (ID: ${purchaseOrderId})`);
          
        } catch (error) {
          const errorMsg = `Error creando items para OC ${consolidada.nOC}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
          console.error('❌', errorMsg);
          itemCreationErrors.push(errorMsg);
        }
      }
    }
    
    console.log(`🎯 Resumen de items: ${totalItemsCreated} items creados en total`);
    if (itemCreationErrors.length > 0) {
      console.warn('⚠️ Errores en creación de items:', itemCreationErrors);
    }
    
    // ✅ CREAR OBJETOS OrdenCompra CON INFORMACIÓN DE UPSERT E ITEMS
    const savedOrdenesCompra: OrdenCompra[] = ids.map((id: number, index: number) => {
      const apiItem = apiData[index];
      const consolidada = consolidadas[index];
      
      // ✅ DETERMINAR SI FUE ACTUALIZACIÓN BASADO EN LA RESPUESTA
      let isUpdate = false;
      if (response && typeof response === 'object' && 'data' in response && response.data?.details) {
        isUpdate = response.data.details.updatedIds?.includes(id) || false;
      }
      
      // Contar items de detalle para esta orden
      const itemsCount = consolidada?.detalles?.length || 0;
      
      return {
        id: id,
        name: apiItem.name,
        orderNumber: apiItem.orderNumber,
        supplierName: apiItem.supplierName,
        providerId: apiItem.providerId || 0,
        amount: apiItem.amount,
        date: apiItem.date,
        state: apiItem.state,
        cuentaContable: apiItem.cuentaContable || '',
        grupoCuenta: apiItem.grupoCuenta || '',
        centroCostoId: apiItem.centroCostoId,
        centroCostoNombre: apiItem.centroCostoNombre,
        deliveryDate: apiItem.deliveryDate,
        paymentTerms: apiItem.paymentTerms,
        tieneFactura: apiItem.tieneFactura || false,
        estadoPago: apiItem.estadoPago || 'pendiente',
        fechaVencimiento: apiItem.fechaVencimiento,
        notes: `${apiItem.notes} | Items creados: ${itemsCount}`,
        companyId: 1, // Valor por defecto
        isUpdate: isUpdate, // ✅ INDICADOR DE SI FUE ACTUALIZACIÓN
        itemsCount: itemsCount // ✅ NUEVO: Número de items de detalle creados
      } as OrdenCompra & { isUpdate?: boolean; itemsCount?: number };
    });
    
    console.log('✅ Procesamiento consolidado completado:', {
      total: savedOrdenesCompra.length,
      created: created,
      updated: updated,
      'órdenes procesadas': savedOrdenesCompra.length,
      'items creados': totalItemsCreated,
      'errores de items': itemCreationErrors.length
    });
    
    return savedOrdenesCompra;
    
  } catch (error) {
    console.error('❌ Error en procesamiento consolidado:', error);
    throw error;
  }
};

export const calculateProcessingStats = (
  response: OrdenCompraBatchCreateResponse
): ProcessingStats => {
  const { data } = response;
  
  return {
    total: data.total,
    created: data.created,
    updated: data.updated || 0,
    errors: data.errors.length,
    processed: data.processed || (data.created + (data.updated || 0)),
    successRate: data.total > 0 ? ((data.created + (data.updated || 0)) / data.total) * 100 : 0
  };
};


/**
 * Función para obtener preview de datos consolidados
 */
export const getConsolidatedPreview = async (
  mainFile: File,
  detailFile: File
): Promise<{
  ordenesBasicas: OrdenCompraBasica[];
  ordenesDetalles: OrdenCompraDetalle[];
  consolidadas: OrdenCompraConsolidada[];
  stats: {
    totalBasicas: number;
    totalDetalles: number;
    totalConsolidadas: number;
    ordenesConDetalles: number;
    ordenesNuevasDesdeDetalles: number;
  };
}> => {
  try {
    // Leer archivos
    const [mainData, detailData] = await Promise.all([
      readExcelFile(mainFile),
      readExcelFile(detailFile)
    ]);
    
    // Procesar datos
    const ordenesBasicas = processOrdenesBasicas(mainData, mainFile.name);
    const ordenesDetalles = processOrdenesDetalles(detailData, detailFile.name);
    const consolidadas = consolidateOrderData(ordenesBasicas, ordenesDetalles);
    
    // Calcular estadísticas
    const ordenesConDetalles = consolidadas.filter(o => o.detalles.length > 0).length;
    const ordenesNuevasDesdeDetalles = consolidadas.filter(o => !ordenesBasicas.find(b => b.nOC === o.nOC)).length;
    
    return {
      ordenesBasicas: ordenesBasicas.slice(0, 5), // Solo primeras 5 para preview
      ordenesDetalles: ordenesDetalles.slice(0, 10), // Solo primeras 10 para preview
      consolidadas: consolidadas.slice(0, 5), // Solo primeras 5 para preview
      stats: {
        totalBasicas: ordenesBasicas.length,
        totalDetalles: ordenesDetalles.length,
        totalConsolidadas: consolidadas.length,
        ordenesConDetalles,
        ordenesNuevasDesdeDetalles
      }
    };
  } catch (error) {
    console.error('❌ Error en preview consolidado:', error);
    throw error;
  }
};

/**
 * Función para obtener preview de archivo principal
 */
export const getMainOrdersPreview = async (file: File): Promise<{
  headers: string[];
  mappedFields: Record<string, string>;
  sampleData: OrdenCompraBasica[];
  totalRows: number;
}> => {
  try {
    const data = await readExcelFile(file);
    
    // Buscar la fila de headers reales
    const expectedFieldGroups: string[][] = Object.values(MAIN_COLUMNS);
    const headerRowIndex = findHeaderRow(data, expectedFieldGroups);
    
    if (headerRowIndex === -1) {
      throw new Error('No se encontraron headers válidos en el archivo principal');
    }
    
    const headers = data[headerRowIndex]?.map((header: any) => header?.toString() || '') || [];
    const columnMapping = findColumnMapping(headers, MAIN_COLUMNS);
    
    const mappedFields: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([field, columnIndex]) => {
      mappedFields[field] = headers[columnIndex];
    });
    
    const rows = data.slice(headerRowIndex + 1, headerRowIndex + 6); // Primeras 5 filas para preview
    const sampleData: OrdenCompraBasica[] = rows
      .filter((row: any[]) => row && row.length > 0)
      .map((row: any[]) => ({
        nOC: row[columnMapping.nOC]?.toString() || '',
        nombreOC: row[columnMapping.nombreOC]?.toString() || '',
        fecha: formatDate(row[columnMapping.fecha]),
        obra: row[columnMapping.obra]?.toString() || '',
        proveedor: row[columnMapping.proveedor]?.toString() || '',
        condicionPago: row[columnMapping.condicionPago]?.toString() || '',
        monto: formatAmount(row[columnMapping.monto])
      }));
    
    return {
      headers,
      mappedFields,
      sampleData,
      totalRows: data.length - headerRowIndex - 1
    };
  } catch (error) {
    console.error('❌ Error en preview principal:', error);
    throw error;
  }
};

/**
 * Función para obtener preview de archivo de detalles
 */
export const getDetailOrdersPreview = async (file: File): Promise<{
  headers: string[];
  mappedFields: Record<string, string>;
  sampleData: OrdenCompraDetalle[];
  totalRows: number;
}> => {
  try {
    const data = await readExcelFile(file);
    
    // Buscar la fila de headers reales
    const expectedFieldGroups: string[][] = Object.values(DETAIL_COLUMNS);
    const headerRowIndex = findHeaderRow(data, expectedFieldGroups);
    
    if (headerRowIndex === -1) {
      throw new Error('No se encontraron headers válidos en el archivo de detalles');
    }
    
    const headers = data[headerRowIndex]?.map((header: any) => header?.toString() || '') || [];
    const columnMapping = findColumnMapping(headers, DETAIL_COLUMNS);
    
    const mappedFields: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([field, columnIndex]) => {
      mappedFields[field] = headers[columnIndex];
    });
    
    const rows = data.slice(headerRowIndex + 1, headerRowIndex + 6); // Primeras 5 filas para preview
    const sampleData: OrdenCompraDetalle[] = rows
      .filter((row: any[]) => row && row.length > 0)
      .map((row: any[]) => ({
        nOC: row[columnMapping.nOC]?.toString() || '',
        codigoCC: row[columnMapping.codigoCC]?.toString() || '',
        cuentaCosto: row[columnMapping.cuentaCosto]?.toString() || '',
        descripcion: row[columnMapping.descripcion]?.toString() || '',
        glosa: row[columnMapping.glosa]?.toString() || '', // ✅ NUEVO: Incluir glosa en preview
        monto: columnMapping.monto !== undefined ? formatAmount(row[columnMapping.monto]) : undefined // ✅ NUEVO: Incluir monto en preview
      }));
    
    return {
      headers,
      mappedFields,
      sampleData,
      totalRows: data.length - headerRowIndex - 1
    };
  } catch (error) {
    console.error('❌ Error en preview detalles:', error);
    throw error;
  }
};

// Mantener funciones existentes para compatibilidad hacia atrás
export const handleOrdenCompraExcelUpload = async (file: File): Promise<OrdenCompra[]> => {
  console.log('⚠️ Usando función individual - considera usar handleConsolidatedExcelUpload');
  
  // Cargar datos de referencia
  const referenceData = await getReferenceData();
  const { costCenters, accountCategories } = referenceData;
  
  const data = await readExcelFile(file);
  const ordenesBasicas = processOrdenesBasicas(data, file.name);
  const apiData = await convertToApiFormat(
    ordenesBasicas.map(orden => ({ ...orden, detalles: [] })),
    costCenters,
    accountCategories
  );
  
  const response = await createOrdenesCompraBatch(apiData);
  
  let ids: number[] = [];
  if (Array.isArray(response)) {
    ids = response;
  } else if (response && typeof response === 'object' && 'data' in response) {
    ids = response.data?.ids || [];
  }
  
  return ids.map((id: number, index: number) => {
    const apiItem = apiData[index];
    return {
      id: id,
      name: apiItem.name,
      orderNumber: apiItem.orderNumber,
      supplierName: apiItem.supplierName,
      providerId: apiItem.providerId || 0,
      amount: apiItem.amount,
      date: apiItem.date,
      state: apiItem.state,
      cuentaContable: apiItem.cuentaContable || '',
      grupoCuenta: apiItem.grupoCuenta || '',
      centroCostoId: apiItem.centroCostoId,
      centroCostoNombre: apiItem.centroCostoNombre,
      deliveryDate: apiItem.deliveryDate,
      paymentTerms: apiItem.paymentTerms,
      tieneFactura: apiItem.tieneFactura || false,
      estadoPago: apiItem.estadoPago || 'pendiente',
      fechaVencimiento: apiItem.fechaVencimiento,
      notes: apiItem.notes,
      companyId: 1 // Valor por defecto
    } as OrdenCompra;
  });
};

export const handleOrdenCompraDetalladoExcelUpload = async (file: File): Promise<OrdenCompra[]> => {
  console.log('⚠️ Usando función individual - considera usar handleConsolidatedExcelUpload');
  
  // Cargar datos de referencia
  const referenceData = await getReferenceData();
  const { costCenters, accountCategories } = referenceData;
  
  const data = await readExcelFile(file);
  const ordenesDetalles = processOrdenesDetalles(data, file.name);
  
  // Convertir detalles a órdenes básicas
  const ordenesBasicas = ordenesDetalles.map(detalle => ({
    nOC: detalle.nOC,
    nombreOC: detalle.descripcion || `Orden ${detalle.nOC}`,
    fecha: new Date().toISOString().split('T')[0],
    obra: 'Por definir',
    proveedor: 'Por definir',
    condicionPago: 'Por definir',
    monto: 1,
    detalles: [detalle]
  }));
  
  const apiData = await convertToApiFormat(ordenesBasicas, costCenters, accountCategories);
  
  const response = await createOrdenesCompraBatch(apiData);
  
  let ids: number[] = [];
  if (Array.isArray(response)) {
    ids = response;
  } else if (response && typeof response === 'object' && 'data' in response) {
    ids = response.data?.ids || [];
  }
  
  return ids.map((id: number, index: number) => {
    const apiItem = apiData[index];
    return {
      id: id,
      name: apiItem.name,
      orderNumber: apiItem.orderNumber,
      supplierName: apiItem.supplierName,
      providerId: apiItem.providerId || 0,
      amount: apiItem.amount,
      date: apiItem.date,
      state: apiItem.state,
      cuentaContable: apiItem.cuentaContable || '',
      grupoCuenta: apiItem.grupoCuenta || '',
      centroCostoId: apiItem.centroCostoId,
      centroCostoNombre: apiItem.centroCostoNombre,
      deliveryDate: apiItem.deliveryDate,
      paymentTerms: apiItem.paymentTerms,
      tieneFactura: apiItem.tieneFactura || false,
      estadoPago: apiItem.estadoPago || 'pendiente',
      fechaVencimiento: apiItem.fechaVencimiento,
      notes: apiItem.notes,
      companyId: 1 // Valor por defecto
    } as OrdenCompra;
  });
};

export const generateProcessingReport = (
  stats: ProcessingStats,
  errors: Array<{ index: number; item: any; error: string }>
): string => {
  const lines = [
    '📊 REPORTE DE PROCESAMIENTO DE ÓRDENES DE COMPRA',
    '='.repeat(50),
    '',
    `📈 ESTADÍSTICAS GENERALES:`,
    `   • Total de registros procesados: ${stats.total}`,
    `   • Órdenes creadas: ${stats.created}`,
    `   • Órdenes actualizadas: ${stats.updated}`,
    `   • Errores encontrados: ${stats.errors}`,
    `   • Tasa de éxito: ${stats.successRate.toFixed(1)}%`,
    '',
  ];
  
  if (stats.created > 0) {
    lines.push(`✅ NUEVAS CREACIONES (${stats.created}):`);
    lines.push(`   Se crearon ${stats.created} órdenes de compra nuevas en el sistema.`);
    lines.push('');
  }
  
  if (stats.updated > 0) {
    lines.push(`🔄 ACTUALIZACIONES (${stats.updated}):`);
    lines.push(`   Se actualizaron ${stats.updated} órdenes existentes con nueva información.`);
    lines.push('   Los números de OC ya existían en el sistema y fueron actualizados.');
    lines.push('');
  }
  
  if (stats.errors > 0) {
    lines.push(`❌ ERRORES ENCONTRADOS (${stats.errors}):`);
    errors.forEach((error, index) => {
      lines.push(`   ${index + 1}. ${error.item.orderNumber || 'N/A'}: ${error.error}`);
    });
    lines.push('');
  }
  
  lines.push('🔗 PROCESO DE CONSOLIDACIÓN:');
  lines.push('   • Se combinaron datos de archivos principal y de detalles');
  lines.push('   • Se utilizó el campo "N° OC" como clave de consolidación');
  lines.push('   • Se preservaron datos existentes mientras se actualizó información relevante');
  
  return lines.join('\n');
};