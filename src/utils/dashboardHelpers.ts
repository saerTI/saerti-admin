// src/utils/dashboardHelpers.ts
// Funciones auxiliares y utilidades para dashboards

/**
 * Formatear moneda chilena
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formatear número compacto (1.5K, 2.3M, etc.)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Formatear etiquetas de período
 */
export function formatPeriodLabel(label: string, period: 'week' | 'month' | 'quarter' | 'year'): string {
  switch (period) {
    case 'week': {
      const parts = label.split('-');
      if (parts.length === 2) {
        return `Semana ${parts[1]}, ${parts[0]}`;
      }
      return label;
    }
    case 'month': {
      const [year, month] = label.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} ${year}`;
    }
    case 'quarter': {
      return label; // Ej: "2025-Q1"
    }
    case 'year': {
      return label;
    }
    default:
      return label;
  }
}

/**
 * Obtener primer día del mes actual
 */
export function getFirstDayOfMonth(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Obtener primer día del año actual
 */
export function getFirstDayOfYear(): string {
  const date = new Date();
  return `${date.getFullYear()}-01-01`;
}

/**
 * Obtener último día del año actual
 */
export function getLastDayOfYear(): string {
  const date = new Date();
  return `${date.getFullYear()}-12-31`;
}

/**
 * Obtener rango de fechas para todo el año actual
 */
export function getFullYearDateRange(): { date_from: string; date_to: string } {
  return {
    date_from: getFirstDayOfYear(),
    date_to: getLastDayOfYear()
  };
}

/**
 * Obtener fecha de hoy en formato YYYY-MM-DD
 */
export function getToday(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcular porcentaje de cambio
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Determinar dirección de tendencia
 */
export function getTrendDirection(percentage: number): 'up' | 'down' | 'stable' {
  if (percentage > 1) return 'up';
  if (percentage < -1) return 'down';
  return 'stable';
}

/**
 * Formatear fecha en formato legible
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/**
 * Obtener rango de fechas para el período seleccionado
 */
export function getDateRangeForPeriod(period: 'week' | 'month' | 'quarter' | 'year'): { date_from: string; date_to: string } {
  const today = new Date();
  const date_to = getToday();
  let date_from: string;

  switch (period) {
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      date_from = weekAgo.toISOString().split('T')[0];
      break;
    }
    case 'month': {
      date_from = getFirstDayOfMonth();
      break;
    }
    case 'quarter': {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const quarterStartMonth = currentQuarter * 3;
      date_from = `${today.getFullYear()}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`;
      break;
    }
    case 'year': {
      date_from = getFirstDayOfYear();
      break;
    }
    default:
      date_from = getFirstDayOfMonth();
  }

  return { date_from, date_to };
}

/**
 * Obtener nombre del período en español
 */
export function getPeriodName(period: 'week' | 'month' | 'quarter' | 'year'): string {
  const names = {
    week: 'Semana',
    month: 'Mes',
    quarter: 'Trimestre',
    year: 'Año'
  };
  return names[period];
}

/**
 * Calcular estadísticas básicas de un array de números
 */
export function calculateStats(numbers: number[]): {
  min: number;
  max: number;
  avg: number;
  sum: number;
} {
  if (numbers.length === 0) {
    return { min: 0, max: 0, avg: 0, sum: 0 };
  }

  const sum = numbers.reduce((acc, val) => acc + val, 0);
  const avg = sum / numbers.length;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  return { min, max, avg, sum };
}
