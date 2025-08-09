import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gastosApiService,{ IOrdenCompraDetail }  from '../../services/costsService';

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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL').format(date);
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
            onClick={() => navigate('/egresos/ordenes-compra')}
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
              onClick={() => navigate('/egresos/ordenes-compra')}
            >
              Volver
            </button>
            <button
              className="px-4 py-2 border border-brand-500 text-brand-500 rounded hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400"
              onClick={() => navigate(`/egresos/ordenes-compra/${id}/edit`)}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Monto</p>
              <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                {formatCurrency(purchaseOrder.amount)}
              </p>
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
                  <dd className="mt-1 text-gray-800 dark:text-white">{purchaseOrder.categoria_name}</dd>
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
      </div>
    </div>
  );
};

export default OrdenCompraDetail;