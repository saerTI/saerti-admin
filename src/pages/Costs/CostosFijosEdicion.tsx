import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FixedCost, 
  FixedCostUpdateData,
  FIXED_COST_STATUS_MAP
} from '../../types/CC/fixedCosts';
import Button from '../../components/ui/button/Button';
import InputField from '../../components/form/input/InputField';
import TextArea from '../../components/form/input/TextArea';
import Select from '../../components/form/Select';
import DatePicker from '../../components/form/date-picker';
import Label from '../../components/form/Label';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { useFixedCostOperations } from '../../hooks/useFixedCosts';
import { useCostCenters } from '../../hooks/useCostCenters';
import * as fixedCostsService from '../../services/CC/fixedCostsService';

export const CostosFijosEdicion = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [fixedCost, setFixedCost] = useState<FixedCost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FixedCostUpdateData>({
    id: 0,
    name: '',
    description: '',
    quota_value: 0,
    quota_count: 0,
    start_date: '',
    payment_date: '',
    cost_center_id: undefined,
    state: 'active'
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { updateFixedCost } = useFixedCostOperations();
  const { costCenters, loading: costCentersLoading } = useCostCenters();

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
        
        // Llenar el formulario con los datos existentes
        setFormData({
          id: data.id,
          name: data.name,
          description: data.description || '',
          quota_value: data.quota_value,
          quota_count: data.quota_count,
          start_date: data.start_date,
          payment_date: data.payment_date,
          cost_center_id: data.cost_center_id,
          state: data.state
        });
        
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

  // Manejar cambios en el formulario
  const handleInputChange = (name: keyof FixedCostUpdateData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error de validación si existe
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!formData.quota_value || formData.quota_value <= 0) {
      errors.quota_value = 'El valor de la cuota debe ser mayor a 0';
    }

    if (!formData.quota_count || formData.quota_count <= 0) {
      errors.quota_count = 'El número de cuotas debe ser mayor a 0';
    }

    if (!formData.start_date) {
      errors.start_date = 'La fecha de inicio es requerida';
    }

    if (!formData.payment_date) {
      errors.payment_date = 'La fecha de pago es requerida';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const success = await updateFixedCost(formData);
      
      if (success) {
        navigate(`/egresos/costos-fijos/${id}`);
      }
    } catch (err) {
      console.error('Error updating fixed cost:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el costo fijo');
    } finally {
      setSaving(false);
    }
  };

  // Manejar cancelación
  const handleCancel = () => {
    navigate(`/egresos/costos-fijos/${id}`);
  };

  // Opciones para selects
  const stateOptions = Object.entries(FIXED_COST_STATUS_MAP).map(([value, config]) => ({
    value,
    label: config.label
  }));

  const costCenterOptions = [
    { value: '', label: 'Seleccione un centro de costo' },
    ...costCenters
      .filter(cc => cc.type === 'project' || cc.type === 'administrative')
      .map(cc => ({
        value: cc.id.toString(),
        label: `${cc.code} - ${cc.name}`
      }))
  ];

  if (loading) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  if (error && !fixedCost) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <PageBreadcrumb 
          pageTitle="Error" 
          items={[
            { label: 'Egresos', path: '/egresos' },
            { label: 'Costos Fijos', path: '/egresos/costos-fijos' },
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
            <Link to="/egresos/costos-fijos">
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
            { label: 'Costos Fijos', path: '/egresos/costos-fijos' },
            { label: 'No encontrado', path: '#' }
          ]}
        />
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Costo fijo no encontrado</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            El costo fijo solicitado no existe o no tienes permisos para editarlo.
          </p>
          <div className="mt-6">
            <Link to="/egresos/costos-fijos">
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
        pageTitle={`Editar: ${fixedCost.name}`} 
        items={[
          { label: 'Egresos', path: '/egresos' },
          { label: 'Costos Fijos', path: '/egresos/costos-fijos' },
          { label: fixedCost.name, path: `/egresos/costos-fijos/${fixedCost.id}` },
          { label: 'Editar', path: '#' }
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Editar Costo Fijo
        </h1>
      </div>

      {/* Mensaje de error general */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <ComponentCard title="Información Básica">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <InputField
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nombre del costo fijo"
                error={!!validationErrors.name}
                hint={validationErrors.name}
                required
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Select
                options={stateOptions}
                defaultValue={formData.state || ''}
                onChange={(value) => handleInputChange('state', value)}
                placeholder="Seleccione estado"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <TextArea
                value={formData.description || ''}
                onChange={(value) => handleInputChange('description', value)}
                placeholder="Descripción del costo fijo"
                rows={3}
              />
            </div>
          </div>
        </ComponentCard>

        {/* Información financiera */}
        <ComponentCard title="Información Financiera">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="quota_value">Valor por Cuota *</Label>
              <InputField
                id="quota_value"
                type="number"
                value={formData.quota_value}
                onChange={(e) => handleInputChange('quota_value', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step={0.01}
                min="0"
                error={!!validationErrors.quota_value}
                hint={validationErrors.quota_value}
                required
              />
            </div>

            <div>
              <Label htmlFor="quota_count">Número de Cuotas *</Label>
              <InputField
                id="quota_count"
                type="number"
                value={formData.quota_count}
                onChange={(e) => handleInputChange('quota_count', parseInt(e.target.value) || 0)}
                placeholder="1"
                min="1"
                error={!!validationErrors.quota_count}
                hint={validationErrors.quota_count}
                required
              />
            </div>
          </div>
        </ComponentCard>

        {/* Fechas */}
        <ComponentCard title="Fechas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <DatePicker
                id="start_date"
                label="Fecha de Inicio *"
                placeholder="Seleccione fecha de inicio"
                defaultDate={formData.start_date || undefined}
                onChange={(selectedDates, dateStr) => {
                  handleInputChange('start_date', dateStr);
                }}
              />
              {validationErrors.start_date && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.start_date}</p>
              )}
            </div>

            <div>
              <DatePicker
                id="payment_date"
                label="Día de Pago *"
                placeholder="Seleccione día de pago"
                defaultDate={formData.payment_date || undefined}
                onChange={(selectedDates, dateStr) => {
                  handleInputChange('payment_date', dateStr);
                }}
              />
              {validationErrors.payment_date && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.payment_date}</p>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Centro de costo */}
        <ComponentCard title="Clasificación">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <Label htmlFor="cost_center">Centro de Costo</Label>
              <Select
                options={costCenterOptions}
                defaultValue={formData.cost_center_id ? formData.cost_center_id.toString() : ''}
                onChange={(value) => handleInputChange('cost_center_id', value ? parseInt(value) : 0)}
                placeholder="Seleccione centro de costo"
                disabled={costCentersLoading}
              />
            </div>
          </div>
        </ComponentCard>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-brand-500 hover:bg-brand-600 text-white"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
};