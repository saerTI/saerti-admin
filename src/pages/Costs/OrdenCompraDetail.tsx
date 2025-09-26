import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gastosApiService,{ IOrdenCompraDetail }  from '../../services/costsService';
import { listItems, OrdenCompraItem } from '../../services/CC/ordenesCompraItemService';

// Status translation and styling
const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  'borrador': { label: 'Borrador', color: 'bg-gray-200 text-gray-800' },
  'pendiente': { label: 'Pendiente', color: 'bg-yellow-200 text-yellow-800' },
  'aprobada': { label: 'Aprobada', color: 'bg-green-200 text-green-800' },
  'rechazada': { label: 'Rechazada', color: 'bg-red-200 text-red-800' },
  'anulada': { label: 'Anulada', color: 'bg-gray-200 text-gray-800' }
};



const OrdenCompraDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<IOrdenCompraDetail | null>(null);
  const [items, setItems] = useState<OrdenCompraItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState<boolean>(true);
  const [itemsError, setItemsError] = useState<string | null>(null);

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

  // Fetch items for this order
  useEffect(() => {
    const fetchItems = async () => {
      if (!id) return;
      try {
        setItemsLoading(true);
        setItemsError(null);
        const purchaseOrderId = parseInt(id);
        if (isNaN(purchaseOrderId)) return;
        const data = await listItems(purchaseOrderId);
        setItems(data || []);
      } catch (err) {
        console.error('Error al cargar los ítems de la orden:', err);
        setItemsError('No se pudieron cargar los ítems de la orden.');
        setItems([]);
      } finally {
        setItemsLoading(false);
      }
    };
    fetchItems();
  }, [id]);

  // Calculate total amount from items
  const calculateTotalAmount = () => {
    return items.reduce((total, item) => {
      const itemTotal = parseFloat(String(item.total || 0));
      return total + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  };

  // Generate categories summary from items
  const generateCategoriesSummary = () => {
    if (!items || items.length === 0) {
      return 'Sin categorías';
    }

    // Count categories
    const categoryCounts = new Map<string, { code: string; name: string; count: number }>();
    
    items.forEach(item => {
      if (item.account_category_id && item.account_category_name) {
        const key = `${item.account_category_id}`;
        const existing = categoryCounts.get(key);
        
        if (existing) {
          existing.count++;
        } else {
          categoryCounts.set(key, {
            code: item.account_category_code || '',
            name: item.account_category_name,
            count: 1
          });
        }
      }
    });

    if (categoryCounts.size === 0) {
      return 'Sin categorías asignadas';
    }

    // Format as requested: [Codigo] [Nombre] [Cantidad]
    const summaryParts = Array.from(categoryCounts.values()).map(category => {
      const code = category.code ? `${category.code} ` : '';
      return `${code}${category.name} (${category.count})`;
    });

    return summaryParts.join(', ');
  };

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = parseFloat(String(amount || 0));
    if (isNaN(numAmount)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(numAmount);
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

  const status = ORDER_STATUS_MAP[purchaseOrder.state] || ORDER_STATUS_MAP['borrador'];

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header with actions */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {purchaseOrder.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Orden de Compra: {purchaseOrder.order_number}
            </p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              onClick={() => navigate('/costos/ordenes-compra')}
            >
              Volver
            </button>
            <button
              className="px-4 py-2 border border-brand-500 text-brand-500 rounded hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400"
              onClick={() => navigate(`/costos/ordenes-compra/${id}/edit`)}
            >
              Editar Orden
            </button>
          </div>
        </div>

        {/* Order status and details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Centro de Costo</p>
              <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                {purchaseOrder.center_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de Ítems</p>
              <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                {itemsLoading ? (
                  <span className="text-gray-500">Calculando...</span>
                ) : (
                  formatCurrency(calculateTotalAmount())
                )}
              </p>
              {!itemsLoading && items.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Calculado desde {items.length} ítem{items.length !== 1 ? 's' : ''}
                </p>
              )}
              {!itemsLoading && items.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sin ítems asociados
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fecha</p>
              <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                {formatDate(purchaseOrder.date)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Información General
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Categoría de Cuenta</dt>
                  <dd className="mt-1 text-gray-800 dark:text-white">
                    {itemsLoading ? (
                      <span className="text-gray-500">Cargando categorías...</span>
                    ) : (
                      generateCategoriesSummary()
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Proveedor</dt>
                  <dd className="mt-1 text-gray-800 dark:text-white">
                    {purchaseOrder.supplier_name || 'No especificado'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Tipo de Pago</dt>
                  <dd className="mt-1 text-gray-800 dark:text-white capitalize">
                    {purchaseOrder.payment_type === 'credit' ? 'Crédito' : 'Contado'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Detalles Adicionales
              </h2>
              <dl className="space-y-4">
                
                {purchaseOrder.notes && (
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Notas</dt>
                    <dd className="mt-1 text-gray-800 dark:text-white whitespace-pre-wrap">
                      {purchaseOrder.notes}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Fechas</dt>
                  <dd className="mt-1 space-y-1">
                    <p className="text-gray-800 dark:text-white">
                      Creado: {formatDate(purchaseOrder.date)}
                    </p>
                    <p className="text-gray-800 dark:text-white">
                      Última actualización: {formatDate(purchaseOrder.date)}
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Ítems de la Orden</h2>
          </div>

          {itemsLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">Cargando ítems…</div>
          ) : itemsError ? (
            <div className="py-8 text-center text-red-600 dark:text-red-400">{itemsError}</div>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Glosa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Moneda</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatDate(item.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.description || '-'}</td>
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
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.glosa || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{item.currency || 'CLP'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdenCompraDetail;