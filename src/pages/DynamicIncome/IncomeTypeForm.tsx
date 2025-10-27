// src/pages/DynamicIncome/IncomeTypeForm.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { incomeTypeService } from '../../services/incomeTypeService';
import type { IncomeType } from '../../types/income';
import { useSidebar } from '../../context/SidebarContext';
import StatusTable, { type StatusTableHandle } from './StatusTable';
import CategoryTable, { type CategoryTableHandle } from './CategoryTable';

interface FieldConfig {
  key: keyof IncomeType;
  label: string;
  showKey: keyof IncomeType;
  requiredKey: keyof IncomeType;
}

// Campos configurables (opcionales)
const configurableFields: FieldConfig[] = [
  { key: 'show_category', label: 'Categoría', showKey: 'show_category', requiredKey: 'required_category' },
  { key: 'show_payment_date', label: 'Fecha de Vencimiento', showKey: 'show_payment_date', requiredKey: 'required_payment_date' },
  { key: 'show_reference_number', label: 'Número de Referencia', showKey: 'show_reference_number', requiredKey: 'required_reference_number' },
  { key: 'show_invoice_number', label: 'Número de Factura', showKey: 'show_invoice_number', requiredKey: 'required_invoice_number' },
  { key: 'show_payment_method', label: 'Método de Pago', showKey: 'show_payment_method', requiredKey: 'required_payment_method' },
  { key: 'show_payment_status', label: 'Estado de Pago', showKey: 'show_payment_status', requiredKey: 'required_payment_status' },
  { key: 'show_currency', label: 'Moneda', showKey: 'show_currency', requiredKey: 'required_currency' },
  { key: 'show_exchange_rate', label: 'Tipo de Cambio', showKey: 'show_exchange_rate', requiredKey: 'required_exchange_rate' },
];

// Campos base obligatorios (no aparecen en la lista porque son obligatorios siempre):
// - Nombre (obligatorio) - required_name - siempre
// - Monto (obligatorio) - required_amount - siempre
// - Fecha (obligatorio) - required_date - siempre
// - Estado (obligatorio) - required_status - siempre
// - Descripción (obligatorio) - description (campo TEXT) - siempre
// - Centro de Costo (obligatorio) - required_cost_center - siempre

export default function IncomeTypeForm() {
  const navigate = useNavigate();
  const { refreshIncomeTypes } = useSidebar();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs for child tables
  const statusTableRef = useRef<StatusTableHandle>(null);
  const categoryTableRef = useRef<CategoryTableHandle>(null);

  // Log refs when component renders
  useEffect(() => {
    console.log('🟡 Form rendered, statusTableRef.current:', statusTableRef.current);
    console.log('🟡 Form rendered, categoryTableRef.current:', categoryTableRef.current);
  });

  const [formData, setFormData] = useState<Partial<IncomeType>>({
    name: '',
    description: '',

    // Campos base obligatorios (siempre activos y requeridos, no editables)
    required_name: true,           // Nombre (obligatorio) - siempre
    required_date: true,            // Fecha (obligatorio) - siempre
    required_status: true,          // Estado (obligatorio) - siempre
    required_cost_center: true,     // Centro de Costo (obligatorio) - siempre

    // Monto (obligatorio por defecto, pero editable)
    show_amount: true,
    required_amount: true,          // Monto (obligatorio)

    // Categoría (opcional)
    show_category: true,
    required_category: false,       // Categoría (opcional)

    // Fecha de Vencimiento (opcional)
    show_payment_date: false,
    required_payment_date: false,

    // Identificador (antes "Número de Factura")
    show_reference_number: false,
    required_reference_number: false,

    // Moneda (opcional)
    show_currency: false,
    required_currency: false,

    // Tipo de Cambio (opcional)
    show_exchange_rate: false,
    required_exchange_rate: false,
  });

  useEffect(() => {
    if (isEditing) {
      loadIncomeType();
    }
  }, [id]);

  const loadIncomeType = async () => {
    try {
      setLoading(true);
      const data = await incomeTypeService.getById(Number(id));
      setFormData(data);
    } catch (err: any) {
      setError(err.message || 'Error cargando tipo de ingreso');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.name?.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    // CRITICAL: Capture refs BEFORE any state changes
    const statusRef = statusTableRef.current;
    const categoryRef = categoryTableRef.current;
    console.log('🔵 Captured refs BEFORE loading:', { statusRef, categoryRef });

    try {
      setLoading(true);
      console.log('🔵 Starting save process...');
      
      // First save or create the income type
      let incomeTypeId: number;
      if (isEditing) {
        console.log('🔵 Updating income type:', id);
        await incomeTypeService.update(Number(id), formData);
        incomeTypeId = Number(id);
        console.log('✅ Income type updated');
      } else {
        console.log('🔵 Creating new income type');
        const result = await incomeTypeService.create(formData);
        incomeTypeId = result.id;
        console.log('✅ Income type created with ID:', incomeTypeId);
      }

      // Then save statuses and categories (both for create and edit)
      if (incomeTypeId) {
        console.log('🔵 Saving statuses for type:', incomeTypeId);
        console.log('🔵 Status ref current:', statusRef);
        
        if (statusRef) {
          await statusRef.saveAll(incomeTypeId);
          console.log('✅ Statuses saved');
        } else {
          console.warn('⚠️ Status table ref is null');
        }
        
        if (formData.show_category) {
          console.log('🔵 Saving categories for type:', incomeTypeId);
          console.log('🔵 Category ref current:', categoryRef);
          
          if (categoryRef) {
            await categoryRef.saveAll(incomeTypeId);
            console.log('✅ Categories saved');
          } else {
            console.warn('⚠️ Category table ref is null');
          }
        }
      }

      setSuccessMessage('Datos guardados exitosamente');
      console.log('✅ All data saved successfully');
      
      // Refresh sidebar and navigate to income types list
      refreshIncomeTypes();
      setTimeout(() => navigate('/ingresos/tipos'), 1000);
    } catch (err: any) {
      console.error('❌ Error saving:', err);
      setError(err.message || 'Error guardando tipo de ingreso');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (showKey: keyof IncomeType, requiredKey: keyof IncomeType) => {
    const currentShowValue = formData[showKey];
    const isRequired = formData[requiredKey];

    // No permitir desmarcar si el campo es obligatorio
    if (currentShowValue && isRequired) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [showKey]: !currentShowValue,
      // If disabling show, also disable required
      [requiredKey]: currentShowValue ? false : prev[requiredKey]
    }));
  };

  const handleRequiredToggle = (requiredKey: keyof IncomeType, showKey: keyof IncomeType) => {
    const isCurrentlyRequired = formData[requiredKey];

    // Si está marcando como obligatorio, asegurar que show esté activo
    if (!isCurrentlyRequired) {
      setFormData(prev => ({
        ...prev,
        [showKey]: true,
        [requiredKey]: true
      }));
    } else {
      // Si está desmarcando obligatorio
      setFormData(prev => ({
        ...prev,
        [requiredKey]: false
      }));
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Tipo de Ingreso' : 'Crear Tipo de Ingreso'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure los campos que desea utilizar para este tipo de ingreso
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => navigate('/ingresos/tipos')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Row 1: Basic Info (50%) + Field Configuration (50%) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Información Básica
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Tipo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ej: Ventas, Servicios, Arriendos..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Descripción opcional del tipo de ingreso"
              />
            </div>
          </div>
        </div>

          {/* Field Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Configuración de Campos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Seleccione los campos que desea mostrar y marque cuáles son obligatorios
          </p>

          {/* Campos siempre obligatorios */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-300 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Campos Base (siempre obligatorios)
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                Nombre
              </span>
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                Monto
              </span>
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                Fecha
              </span>
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                Estado
              </span>
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                Descripción
              </span>
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                Centro de Costo
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Estos campos siempre estarán activos y serán obligatorios
            </p>
          </div>

          <div className="space-y-3">
            {configurableFields.map((field) => {
              const isShown = formData[field.showKey] as boolean;
              const isRequired = formData[field.requiredKey] as boolean;
              const isLocked = isRequired;

              return (
                <div
                  key={field.label}
                  className={`p-4 rounded-lg border transition-all ${
                    isRequired
                      ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : isShown
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className={`flex items-center ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={isShown}
                          onChange={() => handleFieldToggle(field.showKey, field.requiredKey)}
                          disabled={isLocked}
                          className={`w-5 h-5 rounded focus:ring-2 ${
                            isLocked
                              ? 'text-red-600 opacity-60 cursor-not-allowed'
                              : 'text-blue-600 focus:ring-blue-500'
                          }`}
                        />
                        <span className={`ml-3 text-sm font-medium ${
                          isLocked
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {field.label}
                          {isLocked && <span className="ml-2 text-xs">(bloqueado)</span>}
                        </span>
                      </label>
                    </div>

                    {isShown && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isRequired}
                          onChange={() => handleRequiredToggle(field.requiredKey, field.showKey)}
                          className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Obligatorio
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Row 2: Estados (50%) + Categorías (50% if enabled) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estados Section - Always visible */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Estados
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Define los diferentes estados que puede tener un ingreso de este tipo
          </p>
          <StatusTable ref={statusTableRef} incomeTypeId={id ? Number(id) : undefined} />
        </div>

          {/* Categorías Section - Only if show_category is enabled */}
          {formData.show_category && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Categorías
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Define las categorías disponibles para este tipo de ingreso
            </p>
              <CategoryTable ref={categoryTableRef} incomeTypeId={id ? Number(id) : undefined} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
