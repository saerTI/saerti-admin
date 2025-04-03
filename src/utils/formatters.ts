/**
 * Funciones de formateo para la aplicación
 */

/**
 * Formatea un número como moneda en formato chileno
 * @param value - Valor numérico a formatear
 * @returns String formateado con símbolo de moneda y separador de miles con punto
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value);
};

/**
 * Formatea un número con separador de miles en formato chileno
 * @param value - Valor numérico a formatear
 * @returns String formateado con separador de miles con punto
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formatea un número como moneda personalizada con símbolo $ y formato chileno
 * @param value - Valor numérico a formatear
 * @returns String formateado con $ y separador de miles con punto
 */
export const formatCurrencyCustom = (value: number): string => {
  const formattedNumber = new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(value);
  
  return `$${formattedNumber}`;
};