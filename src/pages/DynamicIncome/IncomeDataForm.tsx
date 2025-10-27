// src/pages/DynamicIncome/IncomeDataForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { incomeTypeService } from '../../services/incomeTypeService';
import { incomeDataService } from '../../services/incomeDataService';
import type { IncomeType, IncomeData, IncomeCategory, IncomeStatus, VisibleFields } from '../../types/income';

export default function IncomeDataForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const typeIdParam = searchParams.get('tipo');

  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<any[]>([]);

  const [incomeType, setIncomeType] = useState<IncomeType | null>(null);
  const [visibleFields, setVisibleFields] = useState<VisibleFields | null>(null);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [statuses, setStatuses] = useState<IncomeStatus[]>([]);

  const [formData, setFormData] = useState<Partial<IncomeData>>({
    name: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadInitialData();
  }, [id, typeIdParam]);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      if (isEditing) {
        // Load existing income data
        const data = await incomeDataService.getById(Number(id));
        setFormData(data);

        // Load type configuration
        const typeConfig = await incomeTypeService.getById(data.income_type_id!);
        setIncomeType(typeConfig);

        const fields = await incomeTypeService.getFields(data.income_type_id!);
        setVisibleFields(fields);

        if (fields.show_category) {
          const cats = await incomeTypeService.getCategories(data.income_type_id!);
          setCategories(cats);
        }

        if (fields.show_status) {
          const stats = await incomeTypeService.getStatuses(data.income_type_id!);
          setStatuses(stats);
        }
      } else if (typeIdParam) {
        // Creating new income with specific type
        const typeConfig = await incomeTypeService.getById(Number(typeIdParam));
        setIncomeType(typeConfig);

        const fields = await incomeTypeService.getFields(Number(typeIdParam));
        setVisibleFields(fields);

        setFormData(prev => ({ ...prev, income_type_id: Number(typeIdParam) }));

        if (fields.show_category) {
          const cats = await incomeTypeService.getCategories(Number(typeIdParam));
          setCategories(cats);
        }

        if (fields.show_status) {
          const stats = await incomeTypeService.getStatuses(Number(typeIdParam));
          setStatuses(stats);
        }
      } else {
        setError('Debe especificar un tipo de ingreso');
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando datos');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarnings([]);

    try {
      setLoading(true);

      if (isEditing) {
        const result = await incomeDataService.update(Number(id), formData);
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
        }
      } else {
        const result = await incomeDataService.create(formData);
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
        }
      }

      // Navigate back to list
      if (typeIdParam) {
        navigate(`/ingresos/datos?tipo=${typeIdParam}`);
      } else {
        navigate('/ingresos/datos');
      }
    } catch (err: any) {
      setError(err.message || 'Error guardando ingreso');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof IncomeData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error && !visibleFields) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Editar Ingreso' : 'Crear Ingreso'}
        </h1>
        {incomeType && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Tipo: {incomeType.name}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Advertencias:</h3>
          <ul className="list-disc list-inside text-yellow-800 dark:text-yellow-300">
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name - Always shown */}
          {visibleFields?.show_name && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre {incomeType?.required_name && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_name}
              />
            </div>
          )}

          {/* Amount */}
          {visibleFields?.show_amount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monto {incomeType?.required_amount && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_amount}
              />
            </div>
          )}

          {/* Date */}
          {visibleFields?.show_date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha {incomeType?.required_date && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_date}
              />
            </div>
          )}

          {/* Category */}
          {visibleFields?.show_category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría {incomeType?.required_category && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => handleChange('category_id', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_category}
              >
                <option value="">Seleccione categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          {visibleFields?.show_status && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado {incomeType?.required_status && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.status_id || ''}
                onChange={(e) => handleChange('status_id', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_status}
              >
                <option value="">Seleccione estado</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method */}
          {visibleFields?.show_payment_method && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Método de Pago {incomeType?.required_payment_method && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.payment_method || ''}
                onChange={(e) => handleChange('payment_method', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_payment_method}
              >
                <option value="">Seleccione método</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          )}

          {/* Due Date */}
          {visibleFields?.show_due_date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Vencimiento {incomeType?.required_due_date && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => handleChange('due_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_due_date}
              />
            </div>
          )}

          {/* Invoice Number */}
          {visibleFields?.show_invoice_number && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Factura {incomeType?.required_invoice_number && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formData.invoice_number || ''}
                onChange={(e) => handleChange('invoice_number', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_invoice_number}
              />
            </div>
          )}

          {/* Currency */}
          {visibleFields?.show_currency && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Moneda {incomeType?.required_currency && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.currency || 'CLP'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_currency}
              >
                <option value="CLP">Peso Chileno (CLP)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
          )}

          {/* Exchange Rate */}
          {visibleFields?.show_exchange_rate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Cambio {incomeType?.required_exchange_rate && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.exchange_rate || ''}
                onChange={(e) => handleChange('exchange_rate', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_exchange_rate}
              />
            </div>
          )}

          {/* Description */}
          {visibleFields?.show_description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción {incomeType?.required_description && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required={incomeType?.required_description}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
