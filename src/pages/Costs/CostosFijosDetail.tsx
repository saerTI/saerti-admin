import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FixedCost, 
  FIXED_COST_STATUS_MAP, 
  PAYMENT_STATUS_MAP 
} from '../../types/CC/fixedCosts';
import Button from '../../components/ui/button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Badge from '../../components/ui/badge/Badge';
import { useFixedCostOperations } from '../../hooks/useFixedCosts';
import * as fixedCostsService from '../../services/CC/fixedCostsService';

export const CostosFijosDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [fixedCost, setFixedCost] = useState<FixedCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { 
    deleteFixedCost, 
    updatePaidQuotas, 
    loading: operationLoading 
  } = useFixedCostOperations();

  // Cargar datos del costo fijo
  useEffect(() => {
    const loadFixedCost = async () => {
      if (!id) {
        setError('ID de costo fijo no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fixedCostsService.getFixedCostById(parseInt(id));
        setFixedCost(data);
        setError(null);
      } catch (err) {
        console.error('Error loading fixed cost:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el costo fijo');
      } finally {
        setLoading(false);
      }
    };

    loadFixedCost();
  }, [id]);

  // Manejar eliminación
  const handleDelete = async () => {
    if (!fixedCost) return;

    if (!confirm('¿Está seguro que desea eliminar este costo fijo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const success = await deleteFixedCost(fixedCost.id);
      if (success) {
        navigate('/costos/costos-fijos');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el costo fijo');
      console.error('Error deleting fixed cost:', err);
    }
  };

  // Manejar actualización de cuotas pagadas
  const handleUpdatePaidQuotas = async () => {
    if (!fixedCost) return;

    const newPaidQuotas = prompt(
      `Cuotas pagadas actuales: ${fixedCost.paid_quotas}/${fixedCost.quota_count}\nIngrese el nuevo número de cuotas pagadas:`,
      fixedCost.paid_quotas.toString()
    );

    if (newPaidQuotas === null) return; // Usuario canceló

    const paidQuotasNumber = parseInt(newPaidQuotas);
    
    if (isNaN(paidQuotasNumber) || paidQuotasNumber < 0 || paidQuotasNumber > fixedCost.quota_count) {
      alert(`El número de cuotas pagadas debe estar entre 0 y ${fixedCost.quota_count}`);
      return;
    }

    try {
      const success = await updatePaidQuotas(fixedCost.id, paidQuotasNumber);
      if (success) {
        // Recargar los datos
        const updatedData = await fixedCostsService.getFixedCostById(fixedCost.id);
        setFixedCost(updatedData);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar cuotas pagadas');
      console.error('Error updating paid quotas:', err);
    }
  };

  // Funciones auxiliares
  const getStatusBadge = (status: string) => {
    const config = FIXED_COST_STATUS_MAP[status as keyof typeof FIXED_COST_STATUS_MAP];
    if (!config) return null;
    
    return (
      <Badge color={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const config = PAYMENT_STATUS_MAP[status as keyof typeof PAYMENT_STATUS_MAP];
    if (!config) return null;
    
    return (
      <Badge color={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Calcular progreso de pagos
  const getProgressPercentage = () => {
    if (!fixedCost || fixedCost.quota_count === 0) return 0;
    return Math.round((fixedCost.paid_quotas / fixedCost.quota_count) * 100);
  };

  if (loading) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <PageBreadcrumb 
          pageTitle="Error" 
          items={[
            { label: 'Egresos', path: '/egresos' },
            { label: 'Costos Fijos', path: '/costos/costos-fijos' },
            { label: 'Error', path: '#' }
          ]}
        />
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
          <div className="mt-4">
            <Link to="/costos/costos-fijos">
              <Button variant="outline">Volver a Costos Fijos</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!fixedCost) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <PageBreadcrumb 
          pageTitle="Costo Fijo no encontrado" 
          items={[
            { label: 'Egresos', path: '/egresos' },
            { label: 'Costos Fijos', path: '/costos/costos-fijos' },
            { label: 'No encontrado', path: '#' }
          ]}
        />
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Costo fijo no encontrado</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            El costo fijo solicitado no existe o no tienes permisos para verlo.
          </p>
          <div className="mt-6">
            <Link to="/costos/costos-fijos">
              <Button className="bg-brand-500 hover:bg-brand-600 text-white">
                Volver a Costos Fijos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb 
        pageTitle={fixedCost.name} 
        items={[
          { label: 'Egresos', path: '/egresos' },
          { label: 'Costos Fijos', path: '/costos/costos-fijos' },
          { label: fixedCost.name, path: '#' }
        ]}
      />

      {/* Header con acciones */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {fixedCost.name}
          </h1>
          {getStatusBadge(fixedCost.state)}
        </div>
        
        <div className="flex space-x-3">
          <Link to={`/costos/costos-fijos/${fixedCost.id}/editar`}>
            <Button variant="outline" disabled={operationLoading}>
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleUpdatePaidQuotas}
            disabled={operationLoading}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            Actualizar Cuotas
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={operationLoading}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-6">
        <ComponentCard title='Valor Total' titleCenter={true} centerContent={true}>
          <h3 className="mt-1 text-2xl font-bold text-brand-500">
            {formatCurrency(fixedCost.total_amount)}
          </h3>
        </ComponentCard>
        
        <ComponentCard title='Monto Pagado'>
          <div className="flex flex-col items-center justify-center">
            <h3 className="mt-1 text-2xl font-bold text-green-500">
              {formatCurrency(fixedCost.paid_amount)}
            </h3>
          </div>
        </ComponentCard>
        
        <ComponentCard title='Saldo Pendiente'>
          <div className="flex flex-col items-center justify-center">
            <h3 className="mt-1 text-2xl font-bold text-orange-500">
              {formatCurrency(fixedCost.remaining_amount)}
            </h3>
          </div>
        </ComponentCard>
        
        <ComponentCard title='Progreso'>
          <div className="flex flex-col items-center justify-center">
            <h3 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">
              {getProgressPercentage()}%
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-brand-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Información detallada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información general */}
        <ComponentCard title="Información General">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {fixedCost.name}
              </p>
            </div>

            {fixedCost.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {fixedCost.description}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado
              </label>
              <div className="mt-1">
                {getStatusBadge(fixedCost.state)}
              </div>
            </div>

            {fixedCost.payment_status && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado de Pago
                </label>
                <div className="mt-1">
                  {getPaymentStatusBadge(fixedCost.payment_status)}
                </div>
              </div>
            )}

            {fixedCost.center_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Centro de Costo
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {fixedCost.center_code} - {fixedCost.center_name}
                </p>
              </div>
            )}

            {fixedCost.category_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoría
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {fixedCost.category_code ? `${fixedCost.category_code} - ` : ''}{fixedCost.category_name}
                </p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Información de pagos */}
        <ComponentCard title="Información de Pagos">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Valor por Cuota
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
                {formatCurrency(fixedCost.quota_value)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cuotas
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {fixedCost.paid_quotas} de {fixedCost.quota_count} pagadas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de Inicio
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(fixedCost.start_date)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de Fin
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(fixedCost.end_date)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Día de Pago
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(fixedCost.payment_date)}
              </p>
            </div>

            {fixedCost.next_payment_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Próximo Pago
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
                  {formatDate(fixedCost.next_payment_date)}
                </p>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* Información de auditoría */}
      <div className="mt-6">
        <ComponentCard title="Información de Auditoría">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de Creación
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(fixedCost.created_at)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Última Modificación
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(fixedCost.updated_at)}
              </p>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Botón para volver */}
      <div className="mt-6 flex justify-start">
        <Link to="/costos/costos-fijos">
          <Button variant="outline">
            ← Volver a Costos Fijos
          </Button>
        </Link>
      </div>
    </div>
  );
};
