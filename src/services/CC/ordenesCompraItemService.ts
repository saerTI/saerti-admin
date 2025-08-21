// src/services/CC/ordenesCompraItemService.ts
import { api } from '../apiService';

export interface OrdenCompraItem {
  id: number;
  purchase_order_id: number;
  cost_center_id?: number | null;
  account_category_id?: number | null;
  date: string;
  description?: string | null;
  glosa?: string | null;
  currency: string;
  total: number;
  created_at?: string;
  updated_at?: string;
  // Campos adicionales del JOIN
  cost_center_name?: string;
  cost_center_code?: string;
  account_category_name?: string;
  account_category_code?: string;
}

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
  formatCostCenterDisplay,
  formatAccountCategoryDisplay,
  formatCurrency,
  validateItem
};
