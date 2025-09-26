import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gastosApiService, { IOrdenCompraDetail } from '../../services/costsService';
import { updateOrdenCompra } from '../../services/CC/ordenesCompraService';
import { 
  listItems, 
  OrdenCompraItem, 
  createItem, 
  updateItem, 
  deleteItem,
  getReferenceData,
  ReferenceData
} from '../../services/CC/ordenesCompraItemService';
import { useCostCenters } from '../../hooks/useCostCenters';

// Status options for the order
const ORDER_STATUS_OPTIONS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'anulada', label: 'Anulada' }
];

interface ItemFormData {
  id?: number;
  cost_center_id: number | null;
  account_category_id: number | null;
  date: string;
  description: string;
  glosa: string;
  currency: string;
  total: number;
}

const OrdenCompraEdicion = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Order data states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<IOrdenCompraDetail | null>(null);
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null); // ✅ Datos originales

  // Items states
  const [items, setItems] = useState<OrdenCompraItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState<boolean>(true);
  const [editingItem, setEditingItem] = useState<ItemFormData | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);

  // Reference data
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const { costCenters } = useCostCenters();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    order_number: '',
    supplier_name: '',
    date: '',
    state: 'borrador',
    notes: '',
    cost_center_id: null as number | null
  });
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  
  // Notification states
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Load order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) {
        setError("ID de orden de compra no proporcionado.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const purchaseOrderId = parseInt(id);
        if (isNaN(purchaseOrderId)) {
          throw new Error("ID de orden de compra inválido.");
        }
        
        const response = await gastosApiService.getOrdenCompraById(purchaseOrderId);
        const purchaseOrderData = response && typeof response === 'object' ? response : null;

        if (!purchaseOrderData) {
          throw new Error("Orden de compra no encontrada.");
        }

        setPurchaseOrder(purchaseOrderData as IOrdenCompraDetail);
        
        // Set form data
        const initialFormData = {
          name: purchaseOrderData.name || '',
          order_number: purchaseOrderData.order_number || '',
          supplier_name: purchaseOrderData.supplier_name || '',
          date: purchaseOrderData.date ? purchaseOrderData.date.split('T')[0] : '',
          state: purchaseOrderData.state || 'borrador',
          notes: purchaseOrderData.notes || '',
          cost_center_id: purchaseOrderData.cost_center_id || null
        };
        
        setFormData(initialFormData);
        setOriginalFormData(initialFormData); // ✅ Guardar datos originales
        
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos de la orden de compra.';
        setError(errorMessage);
        console.error('Error al cargar los datos de la orden de compra:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]);

  // Load items
  useEffect(() => {
    const fetchItems = async () => {
      if (!id) return;
      try {
        setItemsLoading(true);
        const purchaseOrderId = parseInt(id);
        if (isNaN(purchaseOrderId)) return;
        const data = await listItems(purchaseOrderId);
        setItems(data || []);
      } catch (err) {
        console.error('Error al cargar los ítems de la orden:', err);
        setItems([]);
      } finally {
        setItemsLoading(false);
      }
    };
    fetchItems();
  }, [id]);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const data = await getReferenceData();
        setReferenceData(data);
      } catch (err) {
        console.error('Error loading reference data:', err);
      }
    };
    loadReferenceData();
  }, []);

  // Calculate total amount from items
  const calculateTotalAmount = () => {
    return items.reduce((total, item) => {
      const itemTotal = parseFloat(String(item.total || 0));
      return total + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  };

  // Get only modified fields
  const getModifiedFields = () => {
    if (!originalFormData) return {};
    
    const modifiedFields: Partial<typeof formData> & { id?: number } = {};
    
    // Comparar cada campo
    (Object.keys(formData) as Array<keyof typeof formData>).forEach(key => {
      const currentValue = formData[key];
      const originalValue = originalFormData[key];
      
      // Solo incluir si el valor ha cambiado realmente
      // Manejar null y undefined como equivalentes para cost_center_id
      if (key === 'cost_center_id') {
        const currentNormalized = currentValue || null;
        const originalNormalized = originalValue || null;
        if (currentNormalized !== originalNormalized) {
          (modifiedFields as any)[key] = currentValue;
        }
      } else {
        // Para otros campos, comparación estricta
        if (currentValue !== originalValue) {
          (modifiedFields as any)[key] = currentValue;
        }
      }
    });
    
    console.log('🔍 Modified fields:', modifiedFields);
    console.log('📋 Original data:', originalFormData);
    console.log('📋 Current data:', formData);
    
    return modifiedFields;
  };

  // Check if field is modified
  const isFieldModified = (fieldName: keyof typeof formData) => {
    if (!originalFormData) return false;
    return formData[fieldName] !== originalFormData[fieldName];
  };

  // Get field changes for display
  const getFieldChanges = () => {
    if (!originalFormData) return {};
    
    const changes: Record<string, { before: any; after: any; label: string }> = {};
    
    (Object.keys(formData) as Array<keyof typeof formData>).forEach(key => {
      const currentValue = formData[key];
      const originalValue = originalFormData[key];
      
      if (currentValue !== originalValue) {
        const labels: Record<string, string> = {
          name: 'Nombre',
          order_number: 'Número de Orden',
          supplier_name: 'Proveedor',
          date: 'Fecha',
          state: 'Estado',
          notes: 'Notas',
          cost_center_id: 'Centro de Costo'
        };
        
        let beforeDisplay = originalValue;
        let afterDisplay = currentValue;
        
        // Format display values
        if (key === 'cost_center_id') {
          const beforeCostCenter = costCenters.find(cc => cc.id === originalValue);
          const afterCostCenter = costCenters.find(cc => cc.id === currentValue);
          beforeDisplay = beforeCostCenter ? `${beforeCostCenter.code} - ${beforeCostCenter.name}` : 'Sin asignar';
          afterDisplay = afterCostCenter ? `${afterCostCenter.code} - ${afterCostCenter.name}` : 'Sin asignar';
        } else if (key === 'state') {
          const stateLabels = { 
            borrador: 'Borrador', 
            pendiente: 'Pendiente', 
            aprobada: 'Aprobada', 
            rechazada: 'Rechazada', 
            anulada: 'Anulada' 
          };
          beforeDisplay = stateLabels[originalValue as keyof typeof stateLabels] || originalValue;
          afterDisplay = stateLabels[currentValue as keyof typeof stateLabels] || currentValue;
        } else if (key === 'date') {
          beforeDisplay = originalValue ? formatDate(String(originalValue)) : 'Sin fecha';
          afterDisplay = currentValue ? formatDate(String(currentValue)) : 'Sin fecha';
        }
        
        changes[key] = {
          before: beforeDisplay || 'Vacío',
          after: afterDisplay || 'Vacío',
          label: labels[key] || key
        };
      }
    });
    
    return changes;
  };

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Hide notification
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = parseFloat(String(amount || 0));
    if (isNaN(numAmount)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(numAmount);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cost_center_id' 
        ? (value === '' ? null : parseInt(value))
        : value
    }));
  };

  // Save order changes
  const handleSaveOrder = async () => {
    if (!id || !purchaseOrder) return;
    
    // Obtener solo los campos modificados
    const modifiedFields = getModifiedFields();
    
    console.log('🎯 Modified fields detected:', modifiedFields);
    console.log('🎯 Modified fields count:', Object.keys(modifiedFields).length);
    
    // Si no hay cambios, no hacer nada
    if (Object.keys(modifiedFields).length === 0) {
      showNotification('info', 'Sin cambios', 'No hay cambios para guardar');
      return;
    }
    
    // Preparar datos para el modal de confirmación
    const updateData: any = {
      id: parseInt(id)
    };
    
    // Mapear campos modificados al formato esperado por el servicio
    if (modifiedFields.name !== undefined) {
      updateData.name = modifiedFields.name;
    }
    if (modifiedFields.order_number !== undefined) {
      updateData.orderNumber = modifiedFields.order_number;
    }
    if (modifiedFields.supplier_name !== undefined) {
      updateData.supplierName = modifiedFields.supplier_name;
    }
    if (modifiedFields.date !== undefined) {
      updateData.date = modifiedFields.date;
    }
    if (modifiedFields.state !== undefined) {
      updateData.state = modifiedFields.state;
    }
    if (modifiedFields.notes !== undefined) {
      updateData.notes = modifiedFields.notes;
    }
    if (modifiedFields.cost_center_id !== undefined) {
      // Solo incluir si realmente cambió a un valor específico
      updateData.centroCostoId = modifiedFields.cost_center_id;
    }
    
    // Solo incluir el amount calculado si los ítems han cambiado
    // Por ahora lo incluimos siempre, pero en el futuro podríamos mejorarlo
    updateData.amount = calculateTotalAmount();
    
    console.log('📦 Final updateData to be sent:', updateData);
    console.log('📦 Update data keys:', Object.keys(updateData));
    
    // Guardar los cambios pendientes y mostrar modal
    setPendingChanges(updateData);
    setShowConfirmModal(true);
  };

  // Confirm and save changes
  const confirmSaveChanges = async () => {
    if (!pendingChanges) return;
    
    try {
      setSaving(true);
      
      console.log('💾 Sending update data:', pendingChanges);
      
      await updateOrdenCompra(pendingChanges);
      
      // Refresh order data
      const response = await gastosApiService.getOrdenCompraById(parseInt(id!));
      setPurchaseOrder(response as IOrdenCompraDetail);
      
      // Update original form data
      setOriginalFormData({ ...formData });
      
      // Close modal
      setShowConfirmModal(false);
      setPendingChanges(null);
      
      showNotification('success', '¡Éxito!', 'Orden de compra actualizada exitosamente');
    } catch (err) {
      console.error('Error updating order:', err);
      showNotification('error', 'Error', 'Error al actualizar la orden de compra');
    } finally {
      setSaving(false);
    }
  };

  // Initialize item form
  const initializeItemForm = (item?: OrdenCompraItem) => {
    setEditingItem({
      id: item?.id,
      cost_center_id: item?.cost_center_id || null,
      account_category_id: item?.account_category_id || null,
      date: item?.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
      description: item?.description || '',
      glosa: item?.glosa || '',
      currency: item?.currency || 'CLP',
      total: item?.total || 0
    });
    setShowItemForm(true);
  };

  // Handle item form changes
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editingItem) return;
    
    const { name, value } = e.target;
    setEditingItem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: name === 'cost_center_id' || name === 'account_category_id' || name === 'total'
          ? value === '' ? null : (name === 'total' ? parseFloat(value) || 0 : parseInt(value))
          : value
      };
    });
  };

  // Save item
  const handleSaveItem = async () => {
    if (!editingItem || !id) return;
    
    try {
      const purchaseOrderId = parseInt(id);
      if (editingItem.id) {
        // Update existing item
        await updateItem(editingItem.id, {
          cost_center_id: editingItem.cost_center_id,
          account_category_id: editingItem.account_category_id,
          date: editingItem.date,
          description: editingItem.description,
          glosa: editingItem.glosa,
          currency: editingItem.currency,
          total: editingItem.total
        });
      } else {
        // Create new item
        await createItem(purchaseOrderId, {
          cost_center_id: editingItem.cost_center_id,
          account_category_id: editingItem.account_category_id,
          date: editingItem.date,
          description: editingItem.description,
          glosa: editingItem.glosa,
          currency: editingItem.currency,
          total: editingItem.total
        });
      }
      
      // Refresh items list
      const data = await listItems(purchaseOrderId);
      setItems(data || []);
      
      // Close form
      setShowItemForm(false);
      setEditingItem(null);
      
      showNotification('success', 'Ítem guardado', 'El ítem se ha guardado correctamente');
    } catch (err) {
      console.error('Error saving item:', err);
      showNotification('error', 'Error', 'Error al guardar el ítem');
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este ítem?')) return;
    
    try {
      await deleteItem(itemId);
      
      // Refresh items list
      if (id) {
        const data = await listItems(parseInt(id));
        setItems(data || []);
      }
      
      showNotification('success', 'Ítem eliminado', 'El ítem se ha eliminado correctamente');
    } catch (err) {
      console.error('Error deleting item:', err);
      showNotification('error', 'Error', 'Error al eliminar el ítem');
    }
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return new Intl.DateTimeFormat('es-CL').format(date);
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
          <p className="text-gray-700 dark:text-gray-300">{error || 'No se pudo cargar la orden de compra'}</p>
          <button
            className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded"
            onClick={() => navigate('/costos/ordenes-compra')}
          >
            Volver a Órdenes de Compra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Editar Orden de Compra
              {Object.keys(getModifiedFields()).length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full dark:bg-orange-900/30 dark:text-orange-300">
                  {Object.keys(getModifiedFields()).length} cambio{Object.keys(getModifiedFields()).length !== 1 ? 's' : ''} sin guardar
                </span>
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {formData.order_number}
            </p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              onClick={() => navigate('/costos/ordenes-compra')}
            >
              Cancelar
            </button>
            <button
              className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                Object.keys(getModifiedFields()).length > 0
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-brand-500 hover:bg-brand-600'
              }`}
              onClick={handleSaveOrder}
              disabled={saving}
            >
              {saving ? 'Guardando...' : Object.keys(getModifiedFields()).length > 0 ? 'Guardar Cambios' : 'Sin Cambios'}
            </button>
          </div>
        </div>

        {/* Order Form */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Información de la Orden
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  isFieldModified('name') 
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500' 
                    : 'border-gray-300'
                }`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Orden
              </label>
              <input
                type="text"
                name="order_number"
                value={formData.order_number}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  isFieldModified('order_number') 
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500' 
                    : 'border-gray-300'
                }`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proveedor
              </label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  isFieldModified('supplier_name') 
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500' 
                    : 'border-gray-300'
                }`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total de Ítems
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-600 dark:border-gray-500 text-gray-700 dark:text-gray-300">
                {itemsLoading ? 'Calculando...' : formatCurrency(calculateTotalAmount())}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Calculado automáticamente desde los ítems
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  isFieldModified('date') 
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500' 
                    : 'border-gray-300'
                }`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Centro de Costo
              </label>
              <select
                name="cost_center_id"
                value={formData.cost_center_id || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  isFieldModified('cost_center_id') 
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500' 
                    : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar centro de costo</option>
                {costCenters.map(cc => (
                  <option key={cc.id} value={cc.id}>
                    {cc.code} - {cc.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  isFieldModified('state') 
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500' 
                    : 'border-gray-300'
                }`}
              >
                {ORDER_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                isFieldModified('notes') 
                  ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500' 
                  : 'border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Ítems de la Orden</h2>
            <button
              onClick={() => initializeItemForm()}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg"
            >
              Agregar Ítem
            </button>
          </div>

          {/* Items Table */}
          {itemsLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Cargando ítems…</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">No hay ítems asociados a esta orden.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Centro de Costo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        <div>
                          <div>{item.description || '-'}</div>
                          {item.glosa && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.glosa}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {item.account_category_name ? (
                          <div>
                            <div className="font-medium">{item.account_category_name}</div>
                            {item.account_category_code && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.account_category_code}
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {item.cost_center_name ? (
                          <div>
                            <div className="font-medium">{item.cost_center_name}</div>
                            {item.cost_center_code && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.cost_center_code}
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => initializeItemForm(item)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Item Form Modal */}
        {showItemForm && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                {editingItem.id ? 'Editar Ítem' : 'Nuevo Ítem'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={editingItem.date}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={editingItem.description}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Glosa
                  </label>
                  <input
                    type="text"
                    name="glosa"
                    value={editingItem.glosa}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Centro de Costo
                  </label>
                  <select
                    name="cost_center_id"
                    value={editingItem.cost_center_id || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Seleccionar centro de costo</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>
                        {cc.code} - {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría de Cuenta
                  </label>
                  <select
                    name="account_category_id"
                    value={editingItem.account_category_id || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Seleccionar categoría</option>
                    {referenceData?.accountCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.code} - {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Moneda
                  </label>
                  <select
                    name="currency"
                    value={editingItem.currency}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="CLP">CLP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto
                  </label>
                  <input
                    type="number"
                    name="total"
                    value={editingItem.total}
                    onChange={handleItemChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Confirmar Cambios
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                ¿Está seguro de que desea guardar los siguientes cambios en la orden de compra?
              </p>
              
              <div className="space-y-4 mb-6">
                {Object.entries(getFieldChanges()).map(([key, change]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="font-medium text-gray-800 dark:text-white mb-2">
                      {change.label}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Antes:</div>
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          {change.before}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Después:</div>
                        <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                          {change.after}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingChanges(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSaveChanges}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Confirmar y Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification.show && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className={`flex items-start p-4 rounded-lg shadow-lg max-w-md ${
              notification.type === 'success' 
                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                : notification.type === 'error'
                ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
                : 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
            }`}>
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-medium ${
                  notification.type === 'success' 
                    ? 'text-green-800 dark:text-green-200' 
                    : notification.type === 'error'
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {notification.title}
                </h3>
                <p className={`mt-1 text-sm ${
                  notification.type === 'success' 
                    ? 'text-green-700 dark:text-green-300' 
                    : notification.type === 'error'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-4">
                <button
                  onClick={hideNotification}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === 'success' 
                      ? 'text-green-500 hover:bg-green-100 focus:ring-green-600 dark:hover:bg-green-800/30' 
                      : notification.type === 'error'
                      ? 'text-red-500 hover:bg-red-100 focus:ring-red-600 dark:hover:bg-red-800/30'
                      : 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600 dark:hover:bg-blue-800/30'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdenCompraEdicion;
