import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrdenCompra } from '../../services/CC/ordenesCompraService';
import { 
  createItem, 
  getReferenceData,
  ReferenceData,
  OrdenCompraItemCreate
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
  cost_center_id: number | null;
  account_category_id: number | null;
  date: string;
  description: string;
  glosa: string;
  currency: string;
  total: number;
}

const OrdenCompraForm = () => {
  const navigate = useNavigate();

  // Form states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference data
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const { costCenters } = useCostCenters();

  // Items states
  const [items, setItems] = useState<ItemFormData[]>([]);
  const [editingItem, setEditingItem] = useState<ItemFormData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    order_number: '',
    supplier_name: '',
    date: new Date().toISOString().split('T')[0],
    state: 'borrador',
    notes: '',
    cost_center_id: null as number | null,
    account_category_id: null as number | null
  });

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
      [name]: name === 'cost_center_id' || name === 'account_category_id' 
        ? (value === '' ? null : parseInt(value))
        : value
    }));
  };

  // Initialize item form
  const initializeItemForm = (item?: ItemFormData, index?: number) => {
    setEditingItem({
      cost_center_id: item?.cost_center_id || null,
      account_category_id: item?.account_category_id || null,
      date: item?.date || new Date().toISOString().split('T')[0],
      description: item?.description || '',
      glosa: item?.glosa || '',
      currency: item?.currency || 'CLP',
      total: item?.total || 0
    });
    setEditingIndex(index !== undefined ? index : null);
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
  const handleSaveItem = () => {
    if (!editingItem) return;
    
    const newItems = [...items];
    if (editingIndex !== null) {
      // Update existing item
      newItems[editingIndex] = editingItem;
    } else {
      // Add new item
      newItems.push(editingItem);
    }
    
    setItems(newItems);
    setShowItemForm(false);
    setEditingItem(null);
    setEditingIndex(null);
  };

  // Delete item
  const handleDeleteItem = (index: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este ítem?')) return;
    
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Generate order number
  const generateOrderNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `OC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${timestamp}`;
  };

  // Auto-generate order number if empty
  const handleGenerateOrderNumber = () => {
    if (!formData.order_number) {
      setFormData(prev => ({
        ...prev,
        order_number: generateOrderNumber()
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre de la orden es requerido');
      return false;
    }
    if (!formData.order_number.trim()) {
      setError('El número de orden es requerido');
      return false;
    }
    if (!formData.supplier_name.trim()) {
      setError('El nombre del proveedor es requerido');
      return false;
    }
    if (items.length === 0) {
      setError('Debe agregar al menos un ítem a la orden');
      return false;
    }
    return true;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Create the purchase order
      const orderData = {
        name: formData.name,
        orderNumber: formData.order_number,
        supplierName: formData.supplier_name,
        amount: calculateTotalAmount(),
        date: formData.date,
        state: formData.state as any,
        notes: formData.notes,
        centroCostoId: formData.cost_center_id || undefined,
        accountCategoryId: formData.account_category_id || undefined
      };
      
      const result = await createOrdenCompra(orderData);
      
      if (!result.id) {
        throw new Error('No se pudo crear la orden de compra');
      }
      
      const purchaseOrderId = result.id;
      
      // Create all items
      for (const item of items) {
        await createItem(purchaseOrderId, {
          cost_center_id: item.cost_center_id,
          account_category_id: item.account_category_id,
          date: item.date,
          description: item.description,
          glosa: item.glosa,
          currency: item.currency,
          total: item.total
        });
      }
      
      // Navigate to the created order
      navigate(`/egresos/ordenes-compra/${purchaseOrderId}`);
      
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la orden de compra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Nueva Orden de Compra
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Complete la información para crear una nueva orden de compra
              </p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                onClick={() => navigate('/egresos/ordenes-compra')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Creando...' : 'Crear Orden'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Order Form */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Información de la Orden
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de Orden *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    name="order_number"
                    value={formData.order_number}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGenerateOrderNumber}
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 dark:bg-gray-600 dark:border-gray-600 dark:hover:bg-gray-500"
                    title="Generar número automático"
                  >
                    🎲
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proveedor *
                </label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total de Ítems
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-600 dark:border-gray-500 text-gray-700 dark:text-gray-300">
                  {formatCurrency(calculateTotalAmount())}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  Estado
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Ítems de la Orden *
              </h2>
              <button
                type="button"
                onClick={() => initializeItemForm()}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg"
              >
                Agregar Ítem
              </button>
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">No hay ítems agregados</p>
                <p className="text-sm">Agregue al menos un ítem para crear la orden de compra</p>
              </div>
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
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {new Date(item.date).toLocaleDateString('es-CL')}
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
                          {item.account_category_id ? (
                            <div>
                              {referenceData?.accountCategories.find(cat => cat.id === item.account_category_id)?.name || 'Categoría no encontrada'}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                          {item.cost_center_id ? (
                            <div>
                              {costCenters.find(cc => cc.id === item.cost_center_id)?.name || 'Centro no encontrado'}
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
                            type="button"
                            onClick={() => initializeItemForm(item, index)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(index)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(calculateTotalAmount())}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </form>

        {/* Item Form Modal */}
        {showItemForm && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                {editingIndex !== null ? 'Editar Ítem' : 'Nuevo Ítem'}
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
                  type="button"
                  onClick={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                    setEditingIndex(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdenCompraForm;
