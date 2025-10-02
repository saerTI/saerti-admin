// src/services/CC/ordenesCompraItemService.ts
import { api } from '../apiService';

export interface OrdenCompraItem {
  id: number;
  purchase_order_id: number;
  cost_center_id?: number | null;
  account_category_id?: number | null;
  date: string; // YYYY-MM-DD
  description?: string | null;
  glosa?: string | null;
  currency: string; // 'CLP', 'USD', etc.
  total: number;
  created_at?: string;
  updated_at?: string;
  // Campos adicionales del JOIN y consultas relacionadas
  cost_center_name?: string;
  cost_center_code?: string;
  account_category_name?: string;
  account_category_code?: string;
  account_category_type?: string;
  purchase_order_number?: string;
  purchase_order_date?: string;
}

// Alias for consistency with the specification
export interface PurchaseOrderItem extends OrdenCompraItem {}

export interface OrdenCompraItemCreate {
  cost_center_id?: number | null;
  account_category_id?: number | null;
  date?: string; // default hoy
  description?: string;
  glosa?: string;
  currency?: string; // default CLP
  total: number;
}

export interface BulkCreateItemsPayload {
  items: OrdenCompraItemCreate[];
}

export interface CostCenter {
  id: number;
  code: string;
  name: string;
  type: string;
  status: string;
}

export interface AccountCategory {
  id: number;
  code: string;
  name: string;
  type: string;
  group_name: string;
}

export interface ReferenceData {
  costCenters: CostCenter[];
  accountCategories: AccountCategory[];
}

export interface ItemStatsByCostCenter {
  cost_center_id: number | null;
  cost_center_name: string | null;
  cost_center_code: string | null;
  items_count: number;
  total_amount: number;
}

export interface ItemStatsByCategory {
  account_category_id: number | null;
  category_name: string | null;
  category_code: string | null;
  category_group: string | null;
  items_count: number;
  total_amount: number;
}

export interface ItemsStats {
  by_cost_center: ItemStatsByCostCenter[];
  by_account_category: ItemStatsByCategory[];
}

// ============================================================================
// NEW INTERFACES FOR FILTERING AND SUMMARIES
// ============================================================================

/**
 * Filters for purchase order items queries
 */
export interface ItemFilters {
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
  currency?: string;  // 'CLP', 'USD', etc.
}

/**
 * Summary data for cost center analysis
 */
export interface CostCenterSummary {
  cost_center_id: number;
  cost_center_name: string;
  cost_center_code: string;
  total_items: number;
  total_amount: number;
  average_amount: number;
  first_date: string;
  last_date: string;
  currencies: string; // Comma-separated list of currencies used
}

/**
 * Summary data for account category analysis
 */
export interface AccountCategorySummary {
  account_category_id: number;
  account_category_name: string;
  account_category_code: string;
  account_category_type: string;
  total_items: number;
  total_amount: number;
  average_amount: number;
  first_date: string;
  last_date: string;
  currencies: string; // Comma-separated list of currencies used
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function normalizeCreatePayload(item: OrdenCompraItemCreate): OrdenCompraItemCreate {
  return {
    cost_center_id: item.cost_center_id && item.cost_center_id > 0 ? item.cost_center_id : null,
    account_category_id: item.account_category_id && item.account_category_id > 0 ? item.account_category_id : null,
    date: item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : today(),
    description: item.description?.trim() || undefined,
    glosa: item.glosa?.trim() || undefined,
    currency: (item.currency || 'CLP').trim(),
    total: Number(item.total) || 0
  };
}

/**
 * Helper para construir query parameters con filtros
 */
export function buildFilterQuery(filters?: ItemFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.date_from) {
    params.append('date_from', filters.date_from);
  }

  if (filters.date_to) {
    params.append('date_to', filters.date_to);
  }

  if (filters.currency) {
    params.append('currency', filters.currency);
  }

  return params.toString();
}

/**
 * Helper para formatear fechas al formato requerido (YYYY-MM-DD)
 */
export function formatDateForFilter(date: Date | string): string {
  if (typeof date === 'string') {
    // Asume que ya está en formato correcto o es parseable
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Fecha inválida: ${date}`);
    }
    return parsedDate.toISOString().split('T')[0];
  }

  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }

  throw new Error('Tipo de fecha inválido');
}

/**
 * Helper para agrupar items por centro de costo
 */
export function groupItemsByCostCenter(items: PurchaseOrderItem[]): Record<number, PurchaseOrderItem[]> {
  const grouped: Record<number, PurchaseOrderItem[]> = {};

  items.forEach(item => {
    const costCenterId = item.cost_center_id || 0; // 0 para items sin centro de costo
    if (!grouped[costCenterId]) {
      grouped[costCenterId] = [];
    }
    grouped[costCenterId].push(item);
  });

  return grouped;
}

/**
 * Helper para agrupar items por categoría contable
 */
export function groupItemsByAccountCategory(items: PurchaseOrderItem[]): Record<number, PurchaseOrderItem[]> {
  const grouped: Record<number, PurchaseOrderItem[]> = {};

  items.forEach(item => {
    const categoryId = item.account_category_id || 0; // 0 para items sin categoría
    if (!grouped[categoryId]) {
      grouped[categoryId] = [];
    }
    grouped[categoryId].push(item);
  });

  return grouped;
}

/**
 * Validar filtros de fecha
 */
export function validateDateFilters(filters: ItemFilters): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (filters.date_from && !/^\d{4}-\d{2}-\d{2}$/.test(filters.date_from)) {
    errors.push('date_from debe tener formato YYYY-MM-DD');
  }

  if (filters.date_to && !/^\d{4}-\d{2}-\d{2}$/.test(filters.date_to)) {
    errors.push('date_to debe tener formato YYYY-MM-DD');
  }

  if (filters.date_from && filters.date_to) {
    const fromDate = new Date(filters.date_from);
    const toDate = new Date(filters.date_to);
    if (fromDate > toDate) {
      errors.push('date_from no puede ser mayor que date_to');
    }
  }

  return { valid: errors.length === 0, errors };
}

// Obtener datos de referencia para formularios
export async function getReferenceData(): Promise<ReferenceData> {
  const res = await api.get<{ success: boolean; data: ReferenceData }>('/ordenes-compra/items/reference-data');
  if (!res.success) throw new Error('No se pudieron obtener los datos de referencia');
  return res.data;
}

// Listar ítems de una orden
export async function listItems(purchaseOrderId: number): Promise<OrdenCompraItem[]> {
  const res = await api.get<{ success: boolean; data: OrdenCompraItem[] }>(`/ordenes-compra/${purchaseOrderId}/items`);
  if (!res.success) throw new Error('No se pudieron obtener los ítems');
  return res.data;
}

// Obtener un ítem por ID
export async function getItem(id: number): Promise<OrdenCompraItem> {
  const res = await api.get<{ success: boolean; data: OrdenCompraItem }>(`/ordenes-compra/items/${id}`);
  if (!res.success) throw new Error('Ítem no encontrado');
  return res.data;
}

// Crear ítem
export async function createItem(purchaseOrderId: number, item: OrdenCompraItemCreate): Promise<OrdenCompraItem> {
  const payload = normalizeCreatePayload(item);
  if (payload.total <= 0) throw new Error('El total debe ser > 0');
  const res = await api.post<{ success: boolean; data: OrdenCompraItem }>(`/ordenes-compra/${purchaseOrderId}/items`, payload);
  if (!res.success) throw new Error('No se pudo crear el ítem');
  return res.data;
}

// Crear ítems en lote
export async function bulkCreateItems(purchaseOrderId: number, items: OrdenCompraItemCreate[]): Promise<{ inserted: number; firstInsertId?: number }> {
  const cleaned = items.map(normalizeCreatePayload).filter(i => i.total > 0);
  if (cleaned.length === 0) return { inserted: 0 };
  const res = await api.post<{ success: boolean; data: { inserted: number; firstInsertId?: number } }>(`/ordenes-compra/${purchaseOrderId}/items/bulk`, { items: cleaned });
  if (!res.success) throw new Error('No se pudieron crear los ítems');
  return res.data;
}

// Actualizar ítem
export async function updateItem(id: number, item: Partial<OrdenCompraItemCreate>): Promise<OrdenCompraItem> {
  const res = await api.put<{ success: boolean; data: OrdenCompraItem }>(`/ordenes-compra/items/${id}`, item);
  if (!res.success) throw new Error('No se pudo actualizar el ítem');
  return res.data;
}

// Eliminar ítem
export async function deleteItem(id: number): Promise<boolean> {
  const res = await api.delete<{ success: boolean; message: string }>(`/ordenes-compra/items/${id}`);
  if (!res.success) throw new Error('No se pudo eliminar el ítem');
  return true;
}

// Eliminar todos los ítems de una orden
export async function deleteAllItems(purchaseOrderId: number): Promise<number> {
  const res = await api.delete<{ success: boolean; removed: number }>(`/ordenes-compra/${purchaseOrderId}/items`);
  if (!res.success) throw new Error('No se pudieron eliminar los ítems');
  return res.removed;
}

// Obtener totales calculados de una orden
export async function getTotals(purchaseOrderId: number): Promise<{ purchase_order_id: number; amount: number }> {
  const res = await api.get<{ success: boolean; data: { purchase_order_id: number; amount: number } }>(`/ordenes-compra/${purchaseOrderId}/items/totals`);
  if (!res.success) throw new Error('No se pudo obtener el total');
  return res.data;
}

// Obtener estadísticas detalladas por centro de costo y categoría contable
export async function getItemsStats(purchaseOrderId: number): Promise<ItemsStats> {
  const res = await api.get<{ success: boolean; data: ItemsStats }>(`/ordenes-compra/${purchaseOrderId}/items/stats`);
  if (!res.success) throw new Error('No se pudieron obtener las estadísticas');
  return res.data;
}

// ============================================================================
// NEW FILTERING FUNCTIONS
// ============================================================================

/**
 * Obtener items por centro de costo
 */
export async function getItemsByCostCenter(costCenterId: number, filters?: ItemFilters): Promise<PurchaseOrderItem[]> {
  try {
    if (!costCenterId || costCenterId <= 0) {
      throw new Error('ID de centro de costo inválido');
    }

    // Validar filtros si se proporcionan
    if (filters) {
      const validation = validateDateFilters(filters);
      if (!validation.valid) {
        throw new Error(`Filtros inválidos: ${validation.errors.join(', ')}`);
      }
    }

    const queryString = buildFilterQuery(filters);
    const url = queryString
      ? `/ordenes-compra/items/by-cost-center/${costCenterId}?${queryString}`
      : `/ordenes-compra/items/by-cost-center/${costCenterId}`;

    const res = await api.get<{ success: boolean; data: PurchaseOrderItem[] }>(url);
    if (!res.success) throw new Error('No se pudieron obtener los items por centro de costo');

    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error(`Error fetching items by cost center ${costCenterId}:`, error);
    throw error;
  }
}

/**
 * Obtener items por categoría contable
 */
export async function getItemsByAccountCategory(accountCategoryId: number, filters?: ItemFilters): Promise<PurchaseOrderItem[]> {
  try {
    if (!accountCategoryId || accountCategoryId <= 0) {
      throw new Error('ID de categoría contable inválido');
    }

    // Validar filtros si se proporcionan
    if (filters) {
      const validation = validateDateFilters(filters);
      if (!validation.valid) {
        throw new Error(`Filtros inválidos: ${validation.errors.join(', ')}`);
      }
    }

    const queryString = buildFilterQuery(filters);
    const url = queryString
      ? `/ordenes-compra/items/by-account-category/${accountCategoryId}?${queryString}`
      : `/ordenes-compra/items/by-account-category/${accountCategoryId}`;

    const res = await api.get<{ success: boolean; data: PurchaseOrderItem[] }>(url);
    if (!res.success) throw new Error('No se pudieron obtener los items por categoría contable');

    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error(`Error fetching items by account category ${accountCategoryId}:`, error);
    throw error;
  }
}

/**
 * Obtener items por centro de costo Y categoría contable
 */
export async function getItemsByCostCenterAndAccountCategory(
  costCenterId: number,
  accountCategoryId: number,
  filters?: ItemFilters
): Promise<PurchaseOrderItem[]> {
  try {
    if (!costCenterId || costCenterId <= 0) {
      throw new Error('ID de centro de costo inválido');
    }

    if (!accountCategoryId || accountCategoryId <= 0) {
      throw new Error('ID de categoría contable inválido');
    }

    // Validar filtros si se proporcionan
    if (filters) {
      const validation = validateDateFilters(filters);
      if (!validation.valid) {
        throw new Error(`Filtros inválidos: ${validation.errors.join(', ')}`);
      }
    }

    const queryString = buildFilterQuery(filters);
    const url = queryString
      ? `/ordenes-compra/items/by-cost-center-and-category/${costCenterId}/${accountCategoryId}?${queryString}`
      : `/ordenes-compra/items/by-cost-center-and-category/${costCenterId}/${accountCategoryId}`;

    const res = await api.get<{ success: boolean; data: PurchaseOrderItem[] }>(url);
    if (!res.success) throw new Error('No se pudieron obtener los items por centro de costo y categoría contable');

    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error(`Error fetching items by cost center ${costCenterId} and account category ${accountCategoryId}:`, error);
    throw error;
  }
}

// ============================================================================
// SUMMARY/STATISTICS FUNCTIONS
// ============================================================================

/**
 * Resumen por centro de costo
 */
export async function getSummaryByCostCenter(costCenterId: number, filters?: ItemFilters): Promise<CostCenterSummary> {
  try {
    if (!costCenterId || costCenterId <= 0) {
      throw new Error('ID de centro de costo inválido');
    }

    // Validar filtros si se proporcionan
    if (filters) {
      const validation = validateDateFilters(filters);
      if (!validation.valid) {
        throw new Error(`Filtros inválidos: ${validation.errors.join(', ')}`);
      }
    }

    const queryString = buildFilterQuery(filters);
    const url = queryString
      ? `/ordenes-compra/items/summary/cost-center/${costCenterId}?${queryString}`
      : `/ordenes-compra/items/summary/cost-center/${costCenterId}`;

    const res = await api.get<{ success: boolean; data: CostCenterSummary }>(url);
    if (!res.success) throw new Error('No se pudo obtener el resumen por centro de costo');

    return res.data;
  } catch (error) {
    console.error(`Error fetching cost center summary for ${costCenterId}:`, error);
    throw error;
  }
}

/**
 * Resumen por categoría contable
 */
export async function getSummaryByAccountCategory(accountCategoryId: number, filters?: ItemFilters): Promise<AccountCategorySummary> {
  try {
    if (!accountCategoryId || accountCategoryId <= 0) {
      throw new Error('ID de categoría contable inválido');
    }

    // Validar filtros si se proporcionan
    if (filters) {
      const validation = validateDateFilters(filters);
      if (!validation.valid) {
        throw new Error(`Filtros inválidos: ${validation.errors.join(', ')}`);
      }
    }

    const queryString = buildFilterQuery(filters);
    const url = queryString
      ? `/ordenes-compra/items/summary/account-category/${accountCategoryId}?${queryString}`
      : `/ordenes-compra/items/summary/account-category/${accountCategoryId}`;

    const res = await api.get<{ success: boolean; data: AccountCategorySummary }>(url);
    if (!res.success) throw new Error('No se pudo obtener el resumen por categoría contable');

    return res.data;
  } catch (error) {
    console.error(`Error fetching account category summary for ${accountCategoryId}:`, error);
    throw error;
  }
}

// Funciones de utilidad
export function formatCostCenterDisplay(item: OrdenCompraItem): string {
  if (!item.cost_center_id) return 'Sin centro de costo';
  return `${item.cost_center_code || 'N/A'} - ${item.cost_center_name || 'Sin nombre'}`;
}

export function formatAccountCategoryDisplay(item: OrdenCompraItem): string {
  if (!item.account_category_id) return 'Sin categoría contable';
  const group = item.account_category_code ? `[${item.account_category_code}]` : '';
  return `${group} ${item.account_category_name || 'Sin nombre'}`;
}

export function formatCurrency(amount: number, currency: string = 'CLP'): string {
  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency === 'CLP' ? 'CLP' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
}

export function validateItem(item: OrdenCompraItemCreate): string[] {
  const errors: string[] = [];
  
  if (!item.total || item.total <= 0) {
    errors.push('El total debe ser mayor a 0');
  }
  
  if (item.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
    errors.push('La fecha debe tener formato YYYY-MM-DD');
  }
  
  if (item.currency && item.currency.length > 10) {
    errors.push('La moneda no puede tener más de 10 caracteres');
  }
  
  return errors;
}

export default {
  // Existing functions
  getReferenceData,
  listItems,
  getItem,
  createItem,
  bulkCreateItems,
  updateItem,
  deleteItem,
  deleteAllItems,
  getTotals,
  getItemsStats,

  // New filtering functions
  getItemsByCostCenter,
  getItemsByAccountCategory,
  getItemsByCostCenterAndAccountCategory,

  // New summary functions
  getSummaryByCostCenter,
  getSummaryByAccountCategory,

  // Utility functions
  buildFilterQuery,
  formatDateForFilter,
  groupItemsByCostCenter,
  groupItemsByAccountCategory,
  validateDateFilters,
  formatCostCenterDisplay,
  formatAccountCategoryDisplay,
  formatCurrency,
  validateItem
};

// Export purchaseOrderItemsService for easier imports
export const purchaseOrderItemsService = {
  // Existing functions
  getReferenceData,
  listItems,
  getItem,
  createItem,
  bulkCreateItems,
  updateItem,
  deleteItem,
  deleteAllItems,
  getTotals,
  getItemsStats,

  // New filtering functions
  getItemsByCostCenter,
  getItemsByAccountCategory,
  getItemsByCostCenterAndAccountCategory,

  // New summary functions
  getSummaryByCostCenter,
  getSummaryByAccountCategory,

  // Utility functions
  buildFilterQuery,
  formatDateForFilter,
  groupItemsByCostCenter,
  groupItemsByAccountCategory,
  validateDateFilters,
  formatCostCenterDisplay,
  formatAccountCategoryDisplay,
  formatCurrency,
  validateItem
};
