import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIngresos } from '../../hooks/useIngresos';
import { useCostCenterSelect } from '../../hooks/useCostCenterSelect';
import IncomeCategorySelect from '../../components/incomes/IncomeCategorySelect';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import TextArea from '../../components/form/input/TextArea';
import Select from '../../components/form/Select';
import Button from '../../components/ui/button/Button';
import {
  IngresoCreateData,
  IngresoUpdateData,
  IngresoState,
  PaymentStatus
} from '../../types/CC/ingreso';

interface FormErrors {
  [key: string]: string;
}

export const IngresosForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const {
    createIngreso,
    updateIngreso,
    fetchIngresoById,
    selectedIngreso,
    loading,
    error,
    clearError,
    clearSelectedIngreso
  } = useIngresos({
    autoFetch: false
  });

  // Hook para centros de costos
  const {
    costCenterOptions,
    loading: costCenterLoading,
    error: costCenterError
  } = useCostCenterSelect();

  // Estado del formulario
  const [formData, setFormData] = useState<IngresoCreateData>({
    document_number: '',
    ep_detail: '',
    client_name: '',
    client_tax_id: '',
    ep_value: 0,
    adjustments: 0,
    ep_total: 0,
    fine: 0,
    retention: 0,
    advance: 0,
    exempt: 0,
    net_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    factoring: '',
    payment_date: '',
    factoring_due_date: '',
    state: 'borrador',
    payment_status: 'no_pagado',
    date: new Date().toISOString().split('T')[0],
    cost_center_code: '',
    category_id: undefined,
    description: '',
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones para los select
  const stateOptions = [
    { value: 'borrador', label: 'Borrador' },
    { value: 'activo', label: 'Activo' },
    { value: 'facturado', label: 'Facturado' },
    { value: 'pagado', label: 'Pagado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const paymentStatusOptions = [
    { value: 'no_pagado', label: 'No Pagado' },
    { value: 'pago_parcial', label: 'Pago Parcial' },
    { value: 'pagado', label: 'Pagado' }
  ];

  // Cargar datos en modo edición
  useEffect(() => {
    if (isEditMode && id) {
      fetchIngresoById(parseInt(id));
    }

    return () => {
      clearSelectedIngreso();
      clearError();
    };
  }, [isEditMode, id, fetchIngresoById, clearSelectedIngreso, clearError]);

  // Función auxiliar para convertir fecha ISO a formato date input (yyyy-MM-dd)
  const formatDateForInput = (isoDate: string | null | undefined): string => {
    if (!isoDate) return '';
    try {
      // Si la fecha ya está en formato yyyy-MM-dd, devolverla tal como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
        return isoDate;
      }
      // Si es una fecha ISO, extraer solo la parte de la fecha
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error parsing date:', isoDate, error);
      return '';
    }
  };

  // Actualizar formulario cuando se carga el ingreso seleccionado
  useEffect(() => {
    if (selectedIngreso && isEditMode) {
      console.log('IngresosForm - Loading selected ingreso:', selectedIngreso);
      console.log('IngresosForm - selectedIngreso.category_id:', selectedIngreso.category_id);
      
      const newFormData = {
        document_number: selectedIngreso.document_number || '',
        ep_detail: selectedIngreso.ep_detail || '',
        client_name: selectedIngreso.client_name || '',
        client_tax_id: selectedIngreso.client_tax_id || '',
        ep_value: selectedIngreso.ep_value || 0,
        adjustments: selectedIngreso.adjustments || 0,
        ep_total: selectedIngreso.ep_total || 0,
        fine: selectedIngreso.fine || 0,
        retention: selectedIngreso.retention || 0,
        advance: selectedIngreso.advance || 0,
        exempt: selectedIngreso.exempt || 0,
        net_amount: selectedIngreso.net_amount || 0,
        tax_amount: selectedIngreso.tax_amount || 0,
        total_amount: selectedIngreso.total_amount || 0,
        factoring: selectedIngreso.factoring || '',
        payment_date: formatDateForInput(selectedIngreso.payment_date),
        factoring_due_date: formatDateForInput(selectedIngreso.factoring_due_date),
        state: selectedIngreso.state || 'borrador',
        payment_status: selectedIngreso.payment_status || 'no_pagado',
        date: formatDateForInput(selectedIngreso.date),
        cost_center_code: selectedIngreso.cost_center_code || '',
        category_id: selectedIngreso.category_id || undefined,
        description: selectedIngreso.description || '',
        notes: selectedIngreso.notes || ''
      };
      
      console.log('IngresosForm - Setting form data, category_id:', newFormData.category_id);
      setFormData(newFormData);
    }
  }, [selectedIngreso, isEditMode]);

  // Debug: monitorear cambios en category_id
  useEffect(() => {
    console.log('IngresosForm - formData.category_id changed:', formData.category_id);
  }, [formData.category_id]);

  // Calcular totales automáticamente
  useEffect(() => {
    const epTotal = (formData.ep_value || 0) + (formData.adjustments || 0);
    const netAmount = epTotal - (formData.fine || 0) - (formData.retention || 0) - (formData.advance || 0) + (formData.exempt || 0);
    const totalAmount = netAmount + (formData.tax_amount || 0);

    setFormData(prev => ({
      ...prev,
      ep_total: epTotal,
      net_amount: netAmount,
      total_amount: totalAmount
    }));
  }, [
    formData.ep_value,
    formData.adjustments,
    formData.fine,
    formData.retention,
    formData.advance,
    formData.exempt,
    formData.tax_amount
  ]);

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof IngresoCreateData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Campos requeridos
    if (!formData.document_number?.trim()) {
      newErrors.document_number = 'El número de documento es requerido';
    }

    if (!formData.client_name?.trim()) {
      newErrors.client_name = 'El nombre del cliente es requerido';
    }

    if (!formData.client_tax_id?.trim()) {
      newErrors.client_tax_id = 'El RUT del cliente es requerido';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    if (formData.ep_total <= 0) {
      newErrors.ep_total = 'El total EP debe ser mayor a cero';
    }

    // Validación de RUT básica (formato chileno)
    if (formData.client_tax_id && !isValidRUT(formData.client_tax_id)) {
      newErrors.client_tax_id = 'Formato de RUT inválido';
    }

    // Validación de fechas
    if (formData.payment_date && new Date(formData.payment_date) < new Date(formData.date)) {
      newErrors.payment_date = 'La fecha de pago no puede ser anterior a la fecha del ingreso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar RUT chileno básico
  const isValidRUT = (rut: string): boolean => {
    const rutRegex = /^[0-9]+-[0-9kK]{1}$/;
    return rutRegex.test(rut.trim());
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Enviando datos del formulario:', formData); // ✅ AGREGADO para debug
      
      if (isEditMode && id) {
        const updateData: IngresoUpdateData = { ...formData };
        console.log('📝 Datos de actualización:', updateData); // ✅ AGREGADO para debug
        await updateIngreso(parseInt(id), updateData);
      } else {
        console.log('➕ Datos de creación:', formData); // ✅ AGREGADO para debug
        await createIngreso(formData);
      }

      // Redirigir a la lista
      navigate('/ingresos', { 
        state: { 
          message: isEditMode ? 'Ingreso actualizado exitosamente' : 'Ingreso creado exitosamente',
          type: 'success'
        }
      });

    } catch (error) {
      console.error('Error saving ingreso:', error);
      // El error se maneja automáticamente por el hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cancelación
  const handleCancel = () => {
    if (window.confirm('¿Está seguro de cancelar? Se perderán los cambios no guardados.')) {
      navigate('/ingresos');
    }
  };

  return (
    <div className="w-full px-4 py-6">
      <PageBreadcrumb pageTitle={isEditMode ? 'Editar Ingreso' : 'Nuevo Ingreso'} />

      {/* Mensaje de error global */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-4 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Layout en dos columnas para las primeras cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Información Básica */}
          <ComponentCard title="Información Básica" className="bg-white dark:bg-gray-800 h-fit" compact>
            <div className="grid grid-cols-3 gap-4">
              {/* Primera fila */}
              <div>
                <Label htmlFor="document_number">Número de Documento *</Label>
                <Input
                  id="document_number"
                  type="text"
                  value={formData.document_number}
                  onChange={(e) => handleInputChange('document_number', e.target.value)}
                  placeholder="Ej: DOC-001, EP-2024-001"
                  error={!!errors.document_number}
                  hint={errors.document_number}
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  error={!!errors.date}
                  hint={errors.date}
                  required
                />
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Select
                  options={stateOptions}
                  value={formData.state}
                  onChange={(value) => handleInputChange('state', value as IngresoState)}
                  placeholder="Seleccionar estado"
                />
              </div>

              {/* Segunda fila */}
              <div>
                <Label htmlFor="cost_center_code">Centro de Costo</Label>
                <Select
                  options={costCenterOptions}
                  value={formData.cost_center_code}
                  onChange={(value) => handleInputChange('cost_center_code', value)}
                  placeholder={costCenterLoading ? "Cargando..." : "Seleccionar centro de costo"}
                  disabled={costCenterLoading}
                />
                {costCenterError && (
                  <p className="text-sm text-red-500 mt-1">{costCenterError}</p>
                )}
              </div>

              <div>
                <IncomeCategorySelect
                  value={formData.category_id}
                  onChange={(categoryId) => handleInputChange('category_id', categoryId)}
                  placeholder="Seleccionar categoría"
                  allowEmpty={true}
                  showLabel={true}
                  error={errors.category_id}
                />
              </div>

              <div>
                <Label htmlFor="ep_detail">Detalle EP</Label>
                <Input
                  id="ep_detail"
                  type="text"
                  value={formData.ep_detail}
                  onChange={(e) => handleInputChange('ep_detail', e.target.value)}
                  placeholder="Descripción del estado de pago"
                />
              </div>
            </div>
          </ComponentCard>

          {/* Información de Pago */}
          <ComponentCard title="Información de Pago" className="bg-white dark:bg-gray-800 h-fit" compact>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_status">Estado de Pago</Label>
                <Select
                  options={paymentStatusOptions}
                  value={formData.payment_status}
                  onChange={(value) => handleInputChange('payment_status', value as PaymentStatus)}
                  placeholder="Seleccionar estado de pago"
                />
              </div>

              <div>
                <Label htmlFor="payment_date">Fecha de Pago</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => handleInputChange('payment_date', e.target.value)}
                  error={!!errors.payment_date}
                  hint={errors.payment_date}
                />
              </div>

              <div>
                <Label htmlFor="factoring">Factoring</Label>
                <Input
                  id="factoring"
                  type="text"
                  value={formData.factoring}
                  onChange={(e) => handleInputChange('factoring', e.target.value)}
                  placeholder="Empresa de factoring"
                />
              </div>

              <div>
                <Label htmlFor="factoring_due_date">Fecha Vencimiento</Label>
                <Input
                  id="factoring_due_date"
                  type="date"
                  value={formData.factoring_due_date}
                  onChange={(e) => handleInputChange('factoring_due_date', e.target.value)}
                />
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Información Financiera - Card más grande que ocupa todo el ancho */}
        <ComponentCard title="Información Financiera" className="bg-white dark:bg-gray-800" compact>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="ep_value">Valor EP</Label>
              <Input
                id="ep_value"
                type="number"
                value={formData.ep_value}
                onChange={(e) => handleInputChange('ep_value', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step={0.01}
              />
            </div>

            <div>
              <Label htmlFor="adjustments">Reajustes</Label>
              <Input
                id="adjustments"
                type="number"
                value={formData.adjustments}
                onChange={(e) => handleInputChange('adjustments', parseFloat(e.target.value) || 0)}
                placeholder="0"
                step={0.01}
              />
            </div>

            <div>
              <Label htmlFor="ep_total">Total EP</Label>
              <Input
                id="ep_total"
                type="number"
                value={formData.ep_total}
                disabled
                className="bg-gray-100 dark:bg-gray-700"
                error={!!errors.ep_total}
                hint={errors.ep_total}
              />
            </div>

            <div>
              <Label htmlFor="fine">Multa</Label>
              <Input
                id="fine"
                type="number"
                value={formData.fine}
                onChange={(e) => handleInputChange('fine', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step={0.01}
              />
            </div>

            <div>
              <Label htmlFor="retention">Retención</Label>
              <Input
                id="retention"
                type="number"
                value={formData.retention}
                onChange={(e) => handleInputChange('retention', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step={0.01}
              />
            </div>

            <div>
              <Label htmlFor="advance">Anticipo</Label>
              <Input
                id="advance"
                type="number"
                value={formData.advance}
                onChange={(e) => handleInputChange('advance', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step={0.01}
              />
            </div>

            <div>
              <Label htmlFor="exempt">Exento</Label>
              <Input
                id="exempt"
                type="number"
                value={formData.exempt}
                onChange={(e) => handleInputChange('exempt', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step={0.01}
              />
            </div>

            <div>
              <Label htmlFor="tax_amount">Monto IVA</Label>
              <Input
                id="tax_amount"
                type="number"
                value={formData.tax_amount}
                onChange={(e) => handleInputChange('tax_amount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step={0.01}
              />
            </div>

            <div>
              <Label htmlFor="net_amount">Monto Neto</Label>
              <Input
                id="net_amount"
                type="number"
                value={formData.net_amount}
                disabled
                className="bg-gray-100 dark:bg-gray-700"
              />
            </div>

            <div className="col-span-2 md:col-span-3">
              <Label htmlFor="total_amount">Monto Total</Label>
              <Input
                id="total_amount"
                type="number"
                value={formData.total_amount}
                disabled
                className="bg-gray-100 dark:bg-gray-700 text-lg font-bold"
              />
            </div>
          </div>
        </ComponentCard>

        {/* Layout en dos columnas para cliente e información adicional */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Información del Cliente */}
          <ComponentCard title="Información del Cliente" className="bg-white dark:bg-gray-800 h-fit" compact>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Nombre del Cliente *</Label>
                <Input
                  id="client_name"
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  placeholder="Nombre completo o razón social"
                  error={!!errors.client_name}
                  hint={errors.client_name}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_tax_id">RUT del Cliente *</Label>
                <Input
                  id="client_tax_id"
                  type="text"
                  value={formData.client_tax_id}
                  onChange={(e) => handleInputChange('client_tax_id', e.target.value)}
                  placeholder="12345678-9"
                  error={!!errors.client_tax_id}
                  hint={errors.client_tax_id}
                  required
                />
              </div>
            </div>
          </ComponentCard>

          {/* Información Adicional */}
          <ComponentCard title="Información Adicional" className="bg-white dark:bg-gray-800 h-fit" compact>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción adicional del ingreso"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Notas internas"
                  className="w-full"
                />
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            isDisabled={isSubmitting || loading}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            isDisabled={isSubmitting || loading}
            isLoading={isSubmitting}
          >
            {isEditMode ? 'Actualizar Ingreso' : 'Crear Ingreso'}
          </Button>
        </div>
      </form>
    </div>
  );
};
