// src/pages/Income/IncomeDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { incomeApiService } from '../../services/incomeService';
import { type IncomeDetail } from '@/types/income';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const IncomeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [income, setIncome] = useState<IncomeDetail | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Helper function for status badges
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      borrador: { label: 'Borrador', className: 'bg-gray-100 text-gray-800' },
      activo: { label: 'Activo', className: 'bg-blue-100 text-blue-800' },
      facturado: { label: 'Facturado', className: 'bg-yellow-100 text-yellow-800' },
      pagado: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
      no_pagado: { label: 'No Pagado', className: 'bg-red-100 text-red-800' },
      pago_parcial: { label: 'Pago Parcial', className: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.borrador;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // **CARGAR DATOS DEL INGRESO**
  useEffect(() => {
    const fetchIncome = async () => {
      if (!id || !isAuthenticated || !user) {
        setError('ID de ingreso no válido o no autenticado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const incomeData = await incomeApiService.getIncomeById(parseInt(id));
        
        if (!incomeData) {
          setError('Ingreso no encontrado');
          return;
        }
        
        // Asegurar que center_name tenga un valor por defecto
        const processedIncomeData: IncomeDetail = {
          ...incomeData,
          center_name: incomeData.center_name || 'Sin asignar',
          project_name: incomeData.project_name || 'Sin proyecto',
          // Ensure other potentially missing fields have defaults
          cost_center_code: incomeData.cost_center_code || '',
          description: incomeData.description || '',
          notes: incomeData.notes || ''
        };

        setIncome(processedIncomeData);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar el ingreso';
        setError(errorMessage);
        console.error('Error fetching income:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
  }, [id, isAuthenticated, user]);

  // **MANEJADORES DE EVENTOS**
  const handleEdit = () => {
    navigate(`/ingresos/${id}/edit`);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!income) return;

    try {
      setDeleting(true);
      const success = await incomeApiService.deleteIncome(income.id);
      
      if (success) {
        navigate('/ingresos', { 
          state: { message: 'Ingreso eliminado exitosamente' }
        });
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      setError('Error al eliminar el ingreso');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };


  // **RENDERIZADO CONDICIONAL**
  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <PageBreadcrumb pageTitle="Cargando..." titleSize="2xl" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-6">
        <PageBreadcrumb pageTitle="Error" titleSize="2xl" />
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 mb-4">{error}</div>
          <Button onClick={() => navigate('/ingresos')} variant="outline">
            Volver a la Lista
          </Button>
        </div>
      </div>
    );
  }

  if (!income) {
    return (
      <div className="w-full px-4 py-6">
        <PageBreadcrumb pageTitle="Ingreso no encontrado" titleSize="2xl" />
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-yellow-800 mb-4">El ingreso solicitado no existe.</div>
          <Button onClick={() => navigate('/ingresos')} variant="outline">
            Volver a la Lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6">
      {/* **HEADER CON BREADCRUMB Y ACCIONES** */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <PageBreadcrumb 
            pageTitle={`Ingreso ${income.document_number}`} 
            titleSize="2xl" 
          />
          <div className="flex items-center gap-4 mt-2">
            {getStatusBadge(income.state)}
            {income.factoring && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Factoring: {income.factoring}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={handleEdit} variant="outline">
            Editar
          </Button>
          <Button 
            onClick={handleDeleteClick} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* **INFORMACIÓN PRINCIPAL** */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Información del Documento */}
        <ComponentCard title="Información del Documento" className="bg-white dark:bg-gray-800">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Número de Documento
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {income.document_number}
              </p>
            </div>
            
            {income.ep_detail && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Detalle EP
                </label>
                <p className="text-gray-900 dark:text-white">{income.ep_detail}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Fecha
              </label>
              <p className="text-gray-900 dark:text-white">{formatDate(income.date)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Estado de Pago
              </label>
              {getStatusBadge(income.payment_status)}
            </div>
          </div>
        </ComponentCard>

        {/* Información del Cliente */}
        <ComponentCard title="Información del Cliente" className="bg-white dark:bg-gray-800">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Nombre del Cliente
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {income.client_name}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                RUT
              </label>
              <p className="text-gray-900 dark:text-white">{income.client_tax_id}</p>
            </div>
          </div>
        </ComponentCard>

        {/* Información del Proyecto */}
        <ComponentCard title="Información del Proyecto" className="bg-white dark:bg-gray-800">
          <div className="space-y-4">
            {income.center_name ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Centro de Costo
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {income.center_name}
                  </p>
                </div>
                
                {income.cost_center_code && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Código
                    </label>
                    <p className="text-gray-900 dark:text-white">{income.cost_center_code}</p>
                  </div>
                )}
                
                {income.project_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Proyecto
                    </label>
                    <p className="text-gray-900 dark:text-white">{income.project_name}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Sin centro de costo asignado
                </p>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* **INFORMACIÓN FINANCIERA** */}
      <ComponentCard title="Información Financiera" className="bg-white dark:bg-gray-800 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Columna 1: Valores Base */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">
              Valores Base
            </h4>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Valor EP
              </label>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(income.ep_value)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Reajustes
              </label>
              <p className={`text-lg font-semibold ${income.adjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(income.adjustments)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total EP
              </label>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(income.ep_total)}
              </p>
            </div>
          </div>

          {/* Columna 2: Deducciones */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">
              Deducciones
            </h4>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Multas
              </label>
              <p className={`text-lg font-semibold ${income.fine > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {formatCurrency(income.fine)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Retenciones
              </label>
              <p className={`text-lg font-semibold ${income.retention !== 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {formatCurrency(income.retention)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Anticipos
              </label>
              <p className={`text-lg font-semibold ${income.advance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {formatCurrency(income.advance)}
              </p>
            </div>
          </div>

          {/* Columna 3: Montos Finales */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">
              Montos Finales
            </h4>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Exento
              </label>
              <p className="text-lg font-semibold text-gray-600">
                {formatCurrency(income.exempt)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Neto
              </label>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(income.net_amount)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                IVA
              </label>
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(income.tax_amount)}
              </p>
            </div>
          </div>

          {/* Columna 4: Total y Fechas */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">
              Total y Fechas
            </h4>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Final
              </label>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(income.total_amount)}
              </p>
            </div>
            
            {income.payment_date && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha de Pago
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(income.payment_date)}
                </p>
              </div>
            )}
            
            {income.factoring_due_date && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Vencimiento Factoring
                </label>
                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {formatDate(income.factoring_due_date)}
                </p>
              </div>
            )}
          </div>
        </div>
      </ComponentCard>

      {/* **DESCRIPCIÓN Y NOTAS** */}
      {(income.description || income.notes) && (
        <ComponentCard title="Descripción y Notas" className="bg-white dark:bg-gray-800 mb-6">
          <div className="space-y-4">
            {income.description && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Descripción
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {income.description}
                </p>
              </div>
            )}
            
            {income.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Notas
                </label>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {income.notes}
                </p>
              </div>
            )}
          </div>
        </ComponentCard>
      )}

      {/* **INFORMACIÓN DE AUDITORÍA** */}
      <ComponentCard title="Información de Auditoría" className="bg-white dark:bg-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Fecha de Creación
            </label>
            <p className="text-gray-900 dark:text-white">
              {income.created_at ? formatDate(income.created_at) : 'No disponible'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Última Actualización
            </label>
            <p className="text-gray-900 dark:text-white">
              {income.updated_at ? formatDate(income.updated_at) : 'No disponible'}
            </p>
          </div>
        </div>
      </ComponentCard>

      {/* **MODAL DE CONFIRMACIÓN DE ELIMINACIÓN** */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Eliminar Ingreso
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            ¿Está seguro que desea eliminar el ingreso <strong>{income.document_number}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={handleDeleteCancel}
              variant="outline"
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              isLoading={deleting}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IncomeDetail;