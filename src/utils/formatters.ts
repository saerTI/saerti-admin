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

/**
 * Format a date string to localized format
 * @param dateString Date string in any valid format (ISO, etc.)
 * @param locale Locale for formatting (default: es-CL)
 * @param options Date formatting options
 * @returns Formatted date string or empty string if date is invalid
 */
export const formatDate = (
  dateString: string | null | undefined,
  locale: string = 'es-CL',
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }
): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date with time
 * @param dateString Date string in any valid format
 * @param locale Locale for formatting (default: es-CL)
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  dateString: string | null | undefined,
  locale: string = 'es-CL'
): string => {
  return formatDate(dateString, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format a date as a relative time (e.g., "2 days ago")
 * @param dateString Date string in any valid format
 * @param locale Locale for formatting (default: es-CL)
 * @returns Relative time string
 */
export const formatRelativeTime = (
  dateString: string | null | undefined,
  locale: string = 'es-CL'
): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Define time units in seconds
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
    
    // Create formatting options based on time difference
    let formatter;
    let value;
    
    if (diffInSeconds < minute) {
      return 'Justo ahora';
    } else if (diffInSeconds < hour) {
      value = Math.floor(diffInSeconds / minute);
      formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return formatter.format(-value, 'minute');
    } else if (diffInSeconds < day) {
      value = Math.floor(diffInSeconds / hour);
      formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return formatter.format(-value, 'hour');
    } else if (diffInSeconds < week) {
      value = Math.floor(diffInSeconds / day);
      formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return formatter.format(-value, 'day');
    } else if (diffInSeconds < month) {
      value = Math.floor(diffInSeconds / week);
      formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return formatter.format(-value, 'week');
    } else if (diffInSeconds < year) {
      value = Math.floor(diffInSeconds / month);
      formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return formatter.format(-value, 'month');
    } else {
      value = Math.floor(diffInSeconds / year);
      formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return formatter.format(-value, 'year');
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};