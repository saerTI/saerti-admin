/**
 * Funciones de utilidad para procesar los ítems de órdenes de compra desde archivos CSV
 */
import { OrdenCompraItemCreate } from './ordenesCompraItemService';

// Tipo extendido que incluye el número de orden
export interface OrdenCompraItemCreateWithOrderNumber extends OrdenCompraItemCreate {
  orderNumber: string;
}

/**
 * Parsea una fecha en formato chileno DD-MM-YYYY a formato ISO YYYY-MM-DD
 * @param fechaStr String de fecha en formato chileno
 * @returns Fecha en formato ISO o string vacío si no es válida
 */
export function parseFechaChilena(fechaStr: string): string {
  if (!fechaStr) return '';

  // Intentar detectar separador
  const separators = ['-', '/', '.'];
  let parts: string[] = [];
  
  for (const separator of separators) {
    if (fechaStr.includes(separator)) {
      parts = fechaStr.split(separator);
      break;
    }
  }
  
  if (parts.length === 3) {
    const dia = parts[0].trim().padStart(2, '0');
    const mes = parts[1].trim().padStart(2, '0');
    let anio = parts[2].trim();
    
    // Asumimos que años de 2 dígitos son de 2000
    if (anio.length === 2) {
      anio = '20' + anio;
    }
    
    return `${anio}-${mes}-${dia}`;
  }
  
  return '';
}

/**
 * Convierte un número en formato chileno "1.234.567,89" a un número JS
 * @param montoStr String del monto con formato chileno
 * @returns Número parseado o 0 si no es válido
 */
export function parseMontoChileno(montoStr: string): number {
  if (!montoStr) return 0;
  
  // Eliminar caracteres no numéricos excepto punto y coma
  const cleanStr = montoStr.toString().replace(/[^\d.,]/g, '');
  
  // Convertir formato chileno a JS: quitar puntos y cambiar coma por punto
  const jsNumberStr = cleanStr.replace(/\./g, '').replace(',', '.');
  
  const monto = parseFloat(jsNumberStr);
  return isNaN(monto) ? 0 : monto;
}

/**
 * Extrae los ítems desde detalles del CSV de ordenes de compra
 * @param detalles Array de objetos del archivo CSV
 * @param defaultDate Fecha por defecto si no se encuentra en el CSV
 * @returns Array de items listos para crear en la API
 */
export function extraerItemsDesdeCSV(detalles: any[], defaultDate: string): OrdenCompraItemCreateWithOrderNumber[] {
  const items: OrdenCompraItemCreateWithOrderNumber[] = [];
  
  if (!detalles?.length) return items;
  
  for (const detalle of detalles) {
    try {
      console.log('[CSV Parser] Procesando detalle:', detalle);
      
      // FECHA: Buscar en varios formatos posibles y convertir
      let dateStr = defaultDate;
      let fechaValue = '';
      
      // Buscar el campo de fecha con varios nombres posibles
      if (detalle.Fecha) {
        fechaValue = detalle.Fecha;
      } else if (detalle.fecha) {
        fechaValue = detalle.fecha;
      } else {
        // Búsqueda de campo que contenga "fecha"
        const fechaKeys = Object.keys(detalle).filter(k => 
          k.toLowerCase().includes('fecha')
        );
        
        if (fechaKeys.length > 0) {
          fechaValue = detalle[fechaKeys[0]] || '';
        }
      }
      
      if (fechaValue) {
        const parsedDate = parseFechaChilena(fechaValue.toString());
        if (parsedDate) {
          dateStr = parsedDate;
        }
      }
      
      // DESCRIPCIÓN: Buscar en varios campos posibles
      let description = '';
      if (detalle.Descripcion) {
        description = detalle.Descripcion;
      } else if (detalle.descripcion) {
        description = detalle.descripcion;
      } else if (detalle['Descripción']) {
        description = detalle['Descripción'];
      } else {
        // Buscar campos que podrían contener descripciones
        const descKeys = Object.keys(detalle).filter(k => 
          k.toLowerCase().includes('desc') || 
          k.toLowerCase().includes('concepto')
        );
        
        if (descKeys.length > 0) {
          description = detalle[descKeys[0]] || '';
        }
      }
      
      // NÚMERO DE ORDEN: Buscar el número de OC
      let orderNumber = '';
      if (detalle['N° OC']) {
        orderNumber = detalle['N° OC'];
      } else if (detalle['Numero OC']) {
        orderNumber = detalle['Numero OC'];
      } else if (detalle['numeroOC']) {
        orderNumber = detalle['numeroOC'];
      } else if (detalle['numero_oc']) {
        orderNumber = detalle['numero_oc'];
      } else {
        // Buscar campos que contengan "oc" o "orden"
        const ocKeys = Object.keys(detalle).filter(k => 
          k.toLowerCase().includes('oc') || 
          k.toLowerCase().includes('orden')
        );
        
        if (ocKeys.length > 0) {
          orderNumber = detalle[ocKeys[0]] || '';
        }
      }
      
      // Verificar que tengamos el número de orden
      if (!orderNumber) {
        console.warn('[CSV Parser] No se encontró número de OC, saltando ítem:', detalle);
        continue;
      }
      
      // GLOSA: Buscar específicamente este campo
      let glosa = '';
      if (detalle.Glosa) {
        glosa = detalle.Glosa;
      } else if (detalle.glosa) {
        glosa = detalle.glosa;
      } else {
        // Buscar campos que podrían contener la glosa
        const glosaKeys = Object.keys(detalle).filter(k => 
          k.toLowerCase().includes('glosa') || 
          k.toLowerCase().includes('detalle')
        );
        
        if (glosaKeys.length > 0) {
          glosa = detalle[glosaKeys[0]] || '';
        }
      }
      
      // SUBTOTAL: Buscar y parsear el subtotal en formato chileno
      let subtotalValue: any = null;
      
      // Buscar el campo de subtotal con varios nombres posibles
      if (detalle.subTotal !== undefined) {
        subtotalValue = detalle.subTotal;
      } else if (detalle['Sub total'] !== undefined) {
        subtotalValue = detalle['Sub total'];
      } else if (detalle['Sub Total'] !== undefined) {
        subtotalValue = detalle['Sub Total'];
      } else if (detalle['Subtotal'] !== undefined) {
        subtotalValue = detalle['Subtotal'];
      } else {
        // Buscar cualquier propiedad que pueda contener el subtotal
        const possibleKeys = Object.keys(detalle).filter(k => 
          k.toLowerCase().includes('total') || 
          k.toLowerCase().includes('subtotal') ||
          k.toLowerCase().includes('sub')
        );
        
        if (possibleKeys.length > 0) {
          subtotalValue = detalle[possibleKeys[0]];
        }
      }
      
      // Convertir el valor a número
      const total = parseMontoChileno(subtotalValue?.toString() || '0');
      
      console.log('[CSV Parser] Datos extraídos:', {
        fecha: dateStr,
        descripcion: description,
        glosa,
        total
      });
      
      // Verificar si el total es válido
      if (total <= 0) {
        console.warn('[CSV Parser] Subtotal <= 0. Ítem ignorado:', description);
        continue;
      }
      
      // Crear el objeto de item
      const itemData: OrdenCompraItemCreateWithOrderNumber = {
        date: dateStr,
        description: description.toString().trim(),
        glosa: glosa.toString().trim(),
        currency: 'CLP',
        total,
        orderNumber: orderNumber.toString().trim()
      };
      
      items.push(itemData);
    } catch (error) {
      console.error('[CSV Parser] Error al procesar detalle:', error);
    }
  }
  
  return items;
}
