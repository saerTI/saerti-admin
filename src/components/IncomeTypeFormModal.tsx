// src/components/IncomeTypeFormModal.tsx
import { useState, useEffect, useRef } from 'react';
import { incomeTypeService } from '../services/incomeTypeService';
import type { IncomeType } from '../types/income';
import { useSidebar } from '../context/SidebarContext';
import StatusTable, { type StatusTableHandle } from '../pages/DynamicIncome/StatusTable';
import CategoryTable, { type CategoryTableHandle } from '../pages/DynamicIncome/CategoryTable';
import { Modal } from './ui/modal';
import { X } from 'lucide-react';

interface IncomeTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomeTypeId?: number;
  onSuccess?: () => void;
}

interface FieldConfig {
  key: keyof IncomeType;
  label: string;
  showKey: keyof IncomeType;
  requiredKey: keyof IncomeType;
}

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

export default function IncomeTypeFormModal({ isOpen, onClose, incomeTypeId, onSuccess }: IncomeTypeFormModalProps) {
  const { refreshIncomeTypes } = useSidebar();
  const isEditing = Boolean(incomeTypeId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const statusTableRef = useRef<StatusTableHandle>(null);
  const categoryTableRef = useRef<CategoryTableHandle>(null);

  const [formData, setFormData] = useState<Partial<IncomeType>>({
    name: '',
    description: '',
    required_name: true,
    required_date: true,
    required_status: true,
    required_cost_center: true,
    show_amount: true,
    required_amount: true,
    show_category: true,
    required_category: false,
    show_payment_date: false,
    required_payment_date: false,
    show_reference_number: false,
    required_reference_number: false,
    show_currency: false,
    required_currency: false,
    show_exchange_rate: false,
    required_exchange_rate: false,
  });

  useEffect(() => {
    if (isOpen && isEditing && incomeTypeId) {
      loadIncomeType();
    } else if (isOpen && !isEditing) {
      // Reset form when opening for create
      setFormData({
        name: '',
        description: '',
        required_name: true,
        required_date: true,
        required_status: true,
        required_cost_center: true,
        show_amount: true,
        required_amount: true,
        show_category: true,
        required_category: false,
        show_payment_date: false,
        required_payment_date: false,
        show_reference_number: false,
        required_reference_number: false,
        show_currency: false,
        required_currency: false,
        show_exchange_rate: false,
        required_exchange_rate: false,
      });
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, isEditing, incomeTypeId]);

  const loadIncomeType = async () => {
    try {
      setLoading(true);
      const data = await incomeTypeService.getById(incomeTypeId!);
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

    const statusRef = statusTableRef.current;
    const categoryRef = categoryTableRef.current;

    try {
      setLoading(true);

      let typeId: number;
      if (isEditing) {
        await incomeTypeService.update(incomeTypeId!, formData);
        typeId = incomeTypeId!;
      } else {
        const result = await incomeTypeService.create(formData);
        typeId = result.id;
      }

      if (typeId) {
        if (statusRef) {
          await statusRef.saveAll(typeId);
        }

        if (formData.show_category && categoryRef) {
          await categoryRef.saveAll(typeId);
        }
      }

      setSuccessMessage('Datos guardados exitosamente');
      refreshIncomeTypes();

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error guardando tipo de ingreso');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (showKey: keyof IncomeType, requiredKey: keyof IncomeType) => {
    const currentShowValue = formData[showKey];
    const isRequired = formData[requiredKey];

    if (currentShowValue && isRequired) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [showKey]: !currentShowValue,
      [requiredKey]: currentShowValue ? false : prev[requiredKey]
    }));
  };

  const handleRequiredToggle = (requiredKey: keyof IncomeType, showKey: keyof IncomeType) => {
    const isCurrentlyRequired = formData[requiredKey];

    if (!isCurrentlyRequired) {
      setFormData(prev => ({
        ...prev,
        [showKey]: true,
        [requiredKey]: true
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [requiredKey]: false
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-7xl max-h-[90vh] overflow-hidden" showCloseButton={false}>
      <div className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Tipo de Ingreso' : 'Crear Tipo de Ingreso'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure los campos que desea utilizar para este tipo de ingreso
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
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
            {/* Row 1: Single card with all configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Basic Info - More compact */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Información Básica
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ej: Ventas, Servicios..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Descripción opcional..."
                      />
                    </div>
                  </div>
                </div>

                {/* Field Configuration - Takes more space */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Configuración de Campos
                  </h3>

                  {/* Campos siempre obligatorios - more compact */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-300 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Campos Base (siempre obligatorios):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Nombre', 'Monto', 'Fecha', 'Estado', 'Descripción', 'Centro de Costo'].map(field => (
                        <span key={field} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Campo
                        </th>
                        <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Mostrar
                        </th>
                        <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Obligatorio
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {configurableFields.map((field) => {
                        const isShown = formData[field.showKey] as boolean;
                        const isRequired = formData[field.requiredKey] as boolean;
                        const isLocked = isRequired;

                        return (
                          <tr
                            key={field.label}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="py-3 px-3 text-sm text-gray-900 dark:text-white">
                              {field.label}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isShown}
                                onChange={() => handleFieldToggle(field.showKey, field.requiredKey)}
                                disabled={isLocked}
                                className={`w-4 h-4 rounded focus:ring-2 ${
                                  isLocked
                                    ? 'text-red-600 opacity-60 cursor-not-allowed'
                                    : 'text-green-600 focus:ring-green-500 cursor-pointer'
                                }`}
                                aria-label={`Mostrar ${field.label}`}
                              />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isRequired}
                                onChange={() => handleRequiredToggle(field.requiredKey, field.showKey)}
                                disabled={!isShown}
                                className={`w-4 h-4 rounded focus:ring-2 ${
                                  !isShown
                                    ? 'text-gray-400 opacity-40 cursor-not-allowed'
                                    : 'text-red-600 focus:ring-red-500 cursor-pointer'
                                }`}
                                aria-label={`${field.label} obligatorio`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Estados + Categorías */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estados */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Estados
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Define los diferentes estados que puede tener un ingreso de este tipo
                </p>
                <StatusTable ref={statusTableRef} incomeTypeId={incomeTypeId} />
              </div>

              {/* Categorías */}
              {formData.show_category && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Categorías
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Define las categorías disponibles para este tipo de ingreso
                  </p>
                  <CategoryTable ref={categoryTableRef} incomeTypeId={incomeTypeId} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
