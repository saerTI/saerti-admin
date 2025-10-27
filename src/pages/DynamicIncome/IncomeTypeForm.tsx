// src/pages/DynamicIncome/IncomeTypeForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { incomeTypeService } from '../../services/incomeTypeService';
import type { IncomeType } from '../../types/income';

interface FieldConfig {
  key: keyof IncomeType;
  label: string;
  showKey: keyof IncomeType;
  requiredKey: keyof IncomeType;
}

const configurableFields: FieldConfig[] = [
  { key: 'show_amount', label: 'Monto', showKey: 'show_amount', requiredKey: 'required_amount' },
  { key: 'show_category', label: 'Categoría', showKey: 'show_category', requiredKey: 'required_category' },
  { key: 'show_status', label: 'Estado', showKey: 'show_status', requiredKey: 'required_status' },
  { key: 'show_date', label: 'Fecha', showKey: 'show_date', requiredKey: 'required_date' },
  { key: 'show_due_date', label: 'Fecha de Vencimiento', showKey: 'show_due_date', requiredKey: 'required_due_date' },
  { key: 'show_payment_method', label: 'Método de Pago', showKey: 'show_payment_method', requiredKey: 'required_payment_method' },
  { key: 'show_invoice_number', label: 'Número de Factura', showKey: 'show_invoice_number', requiredKey: 'required_invoice_number' },
  { key: 'show_description', label: 'Descripción', showKey: 'show_description', requiredKey: 'required_description' },
  { key: 'show_cost_center', label: 'Centro de Costo', showKey: 'show_cost_center', requiredKey: 'required_cost_center' },
  { key: 'show_currency', label: 'Moneda', showKey: 'show_currency', requiredKey: 'required_currency' },
  { key: 'show_exchange_rate', label: 'Tipo de Cambio', showKey: 'show_exchange_rate', requiredKey: 'required_exchange_rate' },
  { key: 'show_attachments', label: 'Archivos Adjuntos', showKey: 'show_attachments', requiredKey: 'required_attachments' },
];

export default function IncomeTypeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<IncomeType>>({
    name: '',
    description: '',
    show_amount: true,
    required_amount: false,
    show_category: true,
    required_category: false,
    show_status: true,
    required_status: false,
    show_date: true,
    required_date: true,
    show_due_date: false,
    required_due_date: false,
    show_payment_method: true,
    required_payment_method: false,
    show_invoice_number: false,
    required_invoice_number: false,
    show_description: true,
    required_description: false,
    show_cost_center: true,
    required_cost_center: false,
    show_currency: false,
    required_currency: false,
    show_exchange_rate: false,
    required_exchange_rate: false,
    show_attachments: false,
    required_attachments: false,
    required_name: true, // Name is always required
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name?.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await incomeTypeService.update(Number(id), formData);
      } else {
        await incomeTypeService.create(formData);
      }
      navigate('/ingresos/tipos');
    } catch (err: any) {
      setError(err.message || 'Error guardando tipo de ingreso');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (showKey: keyof IncomeType, requiredKey: keyof IncomeType) => {
    const currentShowValue = formData[showKey];

    setFormData(prev => ({
      ...prev,
      [showKey]: !currentShowValue,
      // If disabling show, also disable required
      [requiredKey]: currentShowValue ? false : prev[requiredKey]
    }));
  };

  const handleRequiredToggle = (requiredKey: keyof IncomeType) => {
    setFormData(prev => ({
      ...prev,
      [requiredKey]: !prev[requiredKey]
    }));
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Editar Tipo de Ingreso' : 'Crear Tipo de Ingreso'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure los campos que desea utilizar para este tipo de ingreso
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Seleccione los campos que desea mostrar y marque cuáles son obligatorios
          </p>

          <div className="space-y-3">
            {configurableFields.map((field) => {
              const isShown = formData[field.showKey] as boolean;
              const isRequired = formData[field.requiredKey] as boolean;

              return (
                <div
                  key={field.label}
                  className={`p-4 rounded-lg border ${
                    isShown
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isShown}
                          onChange={() => handleFieldToggle(field.showKey, field.requiredKey)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                          {field.label}
                        </span>
                      </label>
                    </div>

                    {isShown && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isRequired}
                          onChange={() => handleRequiredToggle(field.requiredKey)}
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

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/ingresos/tipos')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}
