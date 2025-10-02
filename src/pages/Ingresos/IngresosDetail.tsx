import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIngresos } from '../../hooks/useIngresos';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Ingreso, IngresoState, PaymentStatus } from '../../types/CC/ingreso';

// Mapping de estados para mostrar en español
const STATE_LABELS: Record<IngresoState, string> = {
  'borrador': 'Borrador',
  'activo': 'Activo',
  'facturado': 'Facturado',
  'pagado': 'Pagado',
  'cancelado': 'Cancelado'
};

// Mapping de estados de pago para mostrar en español
const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  'no_pagado': 'No Pagado',
  'pago_parcial': 'Pago Parcial',
  'pagado': 'Pagado'
};

// Colores para los badges de estado
const STATE_COLORS: Record<IngresoState, string> = {
  'borrador': 'bg-gray-100 text-gray-800',
  'activo': 'bg-blue-100 text-blue-800',
  'facturado': 'bg-yellow-100 text-yellow-800',
  'pagado': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800'
};

// Colores para los badges de estado de pago
const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  'no_pagado': 'bg-red-100 text-red-800',
  'pago_parcial': 'bg-yellow-100 text-yellow-800',
  'pagado': 'bg-green-100 text-green-800'
};

const IngresosFormDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    fetchIngresoById,
    deleteIngreso,
    selectedIngreso,
    loading,
    error,
    clearError,
    clearSelectedIngreso
  } = useIngresos({
    autoFetch: false
  });

  // Cargar el ingreso cuando el componente se monta
  useEffect(() => {
    if (id) {
      fetchIngresoById(parseInt(id));
    }

    // Limpiar al desmontar
    return () => {
      clearSelectedIngreso();
      clearError();
    };
  }, [id, fetchIngresoById, clearSelectedIngreso, clearError]);

  // Función para manejar la eliminación
  const handleDelete = async () => {
    if (!selectedIngreso?.id) return;

    try {
      await deleteIngreso(selectedIngreso.id);
      navigate('/ingresos', { 
        state: { 
          message: 'Ingreso eliminado exitosamente',
          type: 'success' 
        }
      });
    } catch (error) {
      console.error('Error deleting ingreso:', error);
      // El error se manejará automáticamente por el hook
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <PageBreadcrumb pageTitle="Detalle de Ingreso" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Mostrar error si no se encuentra el ingreso
  if (error || !selectedIngreso) {
    return (
      <div className="w-full px-4 py-6">
        <PageBreadcrumb pageTitle="Detalle de Ingreso" />
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.994-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Ingreso no encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'El ingreso que buscas no existe o ha sido eliminado.'}
          </p>
          <Link
            to="/ingresos"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Ingresos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6">
      <PageBreadcrumb pageTitle={`Ingreso ${selectedIngreso.document_number}`} />

      {/* Header con acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Detalle de Ingreso
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Documento: {selectedIngreso.document_number}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to={`/ingresos/editar/${selectedIngreso.id}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>

          <Button
            variant="outline"
            color="red"
            onClick={() => setShowDeleteConfirm(true)}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </Button>

          <Link
            to="/ingresos"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
        </div>
      </div>

      {/* Grid de información */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <ComponentCard title="Información General" className="bg-white dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Documento
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedIngreso.document_number}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(selectedIngreso.date)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATE_COLORS[selectedIngreso.state]}`}>
                  {STATE_LABELS[selectedIngreso.state]}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado de Pago
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[selectedIngreso.payment_status]}`}>
                  {PAYMENT_STATUS_LABELS[selectedIngreso.payment_status]}
                </span>
              </div>

              {selectedIngreso.ep_detail && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Detalle EP
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedIngreso.ep_detail}
                  </p>
                </div>
              )}

              {selectedIngreso.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedIngreso.description}
                  </p>
                </div>
              )}

              {selectedIngreso.notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedIngreso.notes}
                  </p>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Información del Cliente */}
          <ComponentCard title="Información del Cliente" className="bg-white dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del Cliente
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedIngreso.client_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RUT del Cliente
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedIngreso.client_tax_id}
                </p>
              </div>
            </div>
          </ComponentCard>

          {/* Información del Proyecto */}
          {(selectedIngreso.center_name || selectedIngreso.project_name || selectedIngreso.cost_center_code) && (
            <ComponentCard title="Información del Proyecto" className="bg-white dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedIngreso.cost_center_code && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código de Centro de Costo
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedIngreso.cost_center_code}
                    </p>
                  </div>
                )}

                {selectedIngreso.center_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Centro de Costo
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedIngreso.center_name}
                    </p>
                  </div>
                )}

                {selectedIngreso.project_name && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Proyecto
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedIngreso.project_name}
                    </p>
                  </div>
                )}
              </div>
            </ComponentCard>
          )}

          {/* Información de Pagos */}
          {(selectedIngreso.factoring || selectedIngreso.payment_date || selectedIngreso.factoring_due_date) && (
            <ComponentCard title="Información de Pagos" className="bg-white dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedIngreso.factoring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Factoring
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedIngreso.factoring}
                    </p>
                  </div>
                )}

                {selectedIngreso.payment_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Pago
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(selectedIngreso.payment_date)}
                    </p>
                  </div>
                )}

                {selectedIngreso.factoring_due_date && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Vencimiento Factoring
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(selectedIngreso.factoring_due_date)}
                    </p>
                  </div>
                )}
              </div>
            </ComponentCard>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <ComponentCard title="Resumen Financiero" className="bg-white dark:bg-gray-800">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Valor EP
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(selectedIngreso.ep_value || 0)}
                </span>
              </div>

              {selectedIngreso.adjustments !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ajustes
                  </span>
                  <span className={`text-lg font-semibold ${selectedIngreso.adjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedIngreso.adjustments)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total EP
                </span>
                <span className="text-lg font-semibold text-blue-600">
                  {formatCurrency(selectedIngreso.ep_total)}
                </span>
              </div>

              <hr className="border-gray-200 dark:border-gray-600" />

              {selectedIngreso.fine !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Multas
                  </span>
                  <span className="text-red-600 font-medium">
                    -{formatCurrency(selectedIngreso.fine)}
                  </span>
                </div>
              )}

              {selectedIngreso.retention !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Retenciones
                  </span>
                  <span className="text-red-600 font-medium">
                    -{formatCurrency(selectedIngreso.retention)}
                  </span>
                </div>
              )}

              {selectedIngreso.advance !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Anticipos
                  </span>
                  <span className="text-red-600 font-medium">
                    -{formatCurrency(selectedIngreso.advance)}
                  </span>
                </div>
              )}

              {selectedIngreso.exempt !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Exentos
                  </span>
                  <span className="text-gray-600 font-medium">
                    {formatCurrency(selectedIngreso.exempt)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monto Neto
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(selectedIngreso.net_amount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  IVA
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(selectedIngreso.tax_amount)}
                </span>
              </div>

              <hr className="border-gray-200 dark:border-gray-600" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Total
                </span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(selectedIngreso.total_amount)}
                </span>
              </div>
            </div>
          </ComponentCard>

          {/* Información de Auditoría */}
          <ComponentCard title="Información de Auditoría" className="bg-white dark:bg-gray-800">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Creación
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(selectedIngreso.created_at)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Última Modificación
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(selectedIngreso.updated_at)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID del Registro
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  #{selectedIngreso.id}
                </p>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.994-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Confirmar Eliminación
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                ¿Está seguro que desea eliminar el ingreso "{selectedIngreso.document_number}"? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  color="red"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2"
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngresosFormDetail;
