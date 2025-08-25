// src/hooks/usePurchaseOrderItems.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as itemsService from '../services/CC/ordenesCompraItemService';

export interface UsePurchaseOrderItemsOptions {
  autoLoad?: boolean;
  autoLoadReferenceData?: boolean;
  autoLoadStats?: boolean;
  purchaseOrderId?: number;
}

export function usePurchaseOrderItems(purchaseOrderId?: number, options: UsePurchaseOrderItemsOptions = {}) {
  const { autoLoad = true, autoLoadReferenceData = false, autoLoadStats = false } = options;
  const [items, setItems] = useState<itemsService.OrdenCompraItem[]>([]);
  const [totals, setTotals] = useState<{ purchase_order_id: number; amount: number } | null>(null);
  const [referenceData, setReferenceData] = useState<itemsService.ReferenceData | null>(null);
  const [stats, setStats] = useState<itemsService.ItemsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingReferenceData, setLoadingReferenceData] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const canOperate = !!purchaseOrderId;

  const load = useCallback(async () => {
    if (!canOperate) return;
    setLoading(true);
    setError(null);
    try {
      const [list, totalData] = await Promise.all([
        itemsService.listItems(purchaseOrderId!),
        itemsService.getTotals(purchaseOrderId!)
      ]);
      setItems(list);
      setTotals(totalData);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Error cargando ítems');
    } finally {
      setLoading(false);
    }
  }, [canOperate, purchaseOrderId]);

  const loadReferenceData = useCallback(async () => {
    setLoadingReferenceData(true);
    try {
      const data = await itemsService.getReferenceData();
      setReferenceData(data);
    } catch (e: any) {
      setError(e.message || 'Error cargando datos de referencia');
    } finally {
      setLoadingReferenceData(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!canOperate) return;
    setLoadingStats(true);
    try {
      const statsData = await itemsService.getItemsStats(purchaseOrderId!);
      setStats(statsData);
    } catch (e: any) {
      setError(e.message || 'Error cargando estadísticas');
    } finally {
      setLoadingStats(false);
    }
  }, [canOperate, purchaseOrderId]);

  const createItem = useCallback(async (data: itemsService.OrdenCompraItemCreate) => {
    if (!canOperate) throw new Error('purchaseOrderId requerido');
    const created = await itemsService.createItem(purchaseOrderId!, data);
    setItems(prev => [...prev, created]);
    // Recalcular totales
    const totalAmount = (totals?.amount || 0) + created.total;
    setTotals({ purchase_order_id: purchaseOrderId!, amount: totalAmount });
    setLastUpdated(new Date());
    // Actualizar estadísticas si están cargadas
    if (stats) {
      await loadStats();
    }
    return created;
  }, [canOperate, purchaseOrderId, totals, stats, loadStats]);

  const bulkCreate = useCallback(async (data: itemsService.OrdenCompraItemCreate[]) => {
    if (!canOperate) throw new Error('purchaseOrderId requerido');
    await itemsService.bulkCreateItems(purchaseOrderId!, data);
    await load();
    // Actualizar estadísticas si están cargadas
    if (stats) {
      await loadStats();
    }
  }, [canOperate, purchaseOrderId, load, stats, loadStats]);

  const updateItem = useCallback(async (id: number, data: Partial<itemsService.OrdenCompraItemCreate>) => {
    const updated = await itemsService.updateItem(id, data);
    setItems(prev => prev.map(it => it.id === id ? updated : it));
    await refreshTotals();
    // Actualizar estadísticas si están cargadas
    if (stats) {
      await loadStats();
    }
    return updated;
  }, [stats, loadStats]);

  const deleteItem = useCallback(async (id: number) => {
    await itemsService.deleteItem(id);
    setItems(prev => prev.filter(it => it.id !== id));
    await refreshTotals();
    // Actualizar estadísticas si están cargadas
    if (stats) {
      await loadStats();
    }
  }, [stats, loadStats]);

  const deleteAll = useCallback(async () => {
    if (!canOperate) return;
    await itemsService.deleteAllItems(purchaseOrderId!);
    setItems([]);
    setTotals({ purchase_order_id: purchaseOrderId!, amount: 0 });
    setLastUpdated(new Date());
    // Limpiar estadísticas
    setStats(null);
  }, [canOperate, purchaseOrderId]);

  const refreshTotals = useCallback(async () => {
    if (!canOperate) return;
    try {
      const totalData = await itemsService.getTotals(purchaseOrderId!);
      setTotals(totalData);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Error recalculando totales');
    }
  }, [canOperate, purchaseOrderId]);

  useEffect(() => {
    if (autoLoad && canOperate) {
      load();
    }
  }, [autoLoad, canOperate, load]);

  useEffect(() => {
    if (autoLoadReferenceData) {
      loadReferenceData();
    }
  }, [autoLoadReferenceData, loadReferenceData]);

  useEffect(() => {
    if (autoLoadStats && canOperate) {
      loadStats();
    }
  }, [autoLoadStats, canOperate, loadStats]);

  const totalAmount = useMemo(() => totals?.amount || 0, [totals]);

  // Computed values para facilitar el uso
  const costCenters = useMemo(() => referenceData?.costCenters || [], [referenceData]);
  const accountCategories = useMemo(() => referenceData?.accountCategories || [], [referenceData]);
  
  // Agrupaciones útiles de las categorías contables
  const accountCategoriesByGroup = useMemo(() => {
    const grouped: Record<string, itemsService.AccountCategory[]> = {};
    accountCategories.forEach(cat => {
      const group = cat.group_name || 'Sin Grupo';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(cat);
    });
    return grouped;
  }, [accountCategories]);

  // Estadísticas computadas
  const itemsCount = useMemo(() => items.length, [items]);
  const hasItems = useMemo(() => itemsCount > 0, [itemsCount]);
  const averageItemValue = useMemo(() => hasItems ? totalAmount / itemsCount : 0, [hasItems, totalAmount, itemsCount]);

  // Funciones de utilidad
  const getItemById = useCallback((id: number) => {
    return items.find(item => item.id === id);
  }, [items]);

  const getItemsByCostCenter = useCallback((costCenterId: number | null) => {
    return items.filter(item => item.cost_center_id === costCenterId);
  }, [items]);

  const getItemsByAccountCategory = useCallback((categoryId: number | null) => {
    return items.filter(item => item.account_category_id === categoryId);
  }, [items]);

  const validateItemData = useCallback((data: itemsService.OrdenCompraItemCreate) => {
    return itemsService.validateItem(data);
  }, []);

  return {
    // Datos principales
    items,
    totals,
    totalAmount,
    
    // Datos de referencia
    referenceData,
    costCenters,
    accountCategories,
    accountCategoriesByGroup,
    
    // Estadísticas
    stats,
    
    // Estados de carga
    loading,
    loadingReferenceData,
    loadingStats,
    error,
    lastUpdated,
    
    // Estadísticas computadas
    itemsCount,
    hasItems,
    averageItemValue,
    
    // Funciones de carga
    load,
    loadReferenceData,
    loadStats,
    refreshTotals,
    
    // Operaciones CRUD
    createItem,
    bulkCreate,
    updateItem,
    deleteItem,
    deleteAll,
    
    // Funciones de utilidad
    getItemById,
    getItemsByCostCenter,
    getItemsByAccountCategory,
    validateItemData
  };
}

export default usePurchaseOrderItems;
