// src/pages/DynamicExpense/ExpenseDataForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { expenseTypeService } from '@/services/expenseTypeService';
import { expenseDataService } from '@/services/expenseDataService';
import DatePicker from '@/components/form/date-picker';
import type { ExpenseType, ExpenseData, ExpenseCategory, ExpenseStatus } from '@/types/expense';

export default function ExpenseDataForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const typeIdParam = searchParams.get('tipo');

  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<any[]>([]);

  const [expenseType, setExpenseType] = useState<ExpenseType | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [statuses, setStatuses] = useState<ExpenseStatus[]>([]);

  const [formData, setFormData] = useState<Partial<ExpenseData>>({
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
        // Load existing expense data
        const data = await expenseDataService.getById(Number(id));
        setFormData(data);

        // Load type configuration
        const typeConfig = await expenseTypeService.getById(data.expense_type_id!);
        setExpenseType(typeConfig);

        if (typeConfig.show_category) {
          const cats = await expenseTypeService.getCategories(data.expense_type_id!);
          setCategories(cats);
        }

        const stats = await expenseTypeService.getStatuses(data.expense_type_id!);
        setStatuses(stats);
      } else if (typeIdParam) {
        // Creating new expense with specific type
        const typeConfig = await expenseTypeService.getById(Number(typeIdParam));
        setExpenseType(typeConfig);

        setFormData(prev => ({ ...prev, expense_type_id: Number(typeIdParam) }));

        if (typeConfig.show_category) {
          const cats = await expenseTypeService.getCategories(Number(typeIdParam));
          setCategories(cats);
        }

        const stats = await expenseTypeService.getStatuses(Number(typeIdParam));
        setStatuses(stats);
      } else {
        setError('Debe especificar un tipo de egreso');
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
        const result = await expenseDataService.update(Number(id), formData);
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
        }
      } else {
        const result = await expenseDataService.create(formData);
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
        }
      }

      // Navigate back to list
      if (typeIdParam) {
        navigate(`/egresos/datos?tipo=${typeIdParam}`);
      } else {
        navigate('/egresos/datos');
      }
    } catch (err: any) {
      setError(err.message || 'Error guardando egreso');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ExpenseData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error && !expenseType) {
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
          {isEditing ? 'Editar Egreso' : 'Crear Egreso'}
        </h1>
        {expenseType && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Tipo: {expenseType.name}
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre {expenseType?.required_name && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              required={expenseType?.required_name}
            />
          </div>

          {/* Amount */}
          {expenseType?.show_amount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monto {expenseType?.required_amount && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_amount}
              />
            </div>
          )}

          {/* Date */}
          <div>
            <DatePicker
              id="form-date"
              label={<>Fecha {expenseType?.required_date && <span className="text-red-500">*</span>}</>}
              defaultDate={formData.date || new Date().toISOString().split('T')[0]}
              onChange={(selectedDates) => {
                if (selectedDates.length > 0) {
                  const date = selectedDates[0];
                  const formattedDate = date.toISOString().split('T')[0];
                  handleChange('date', formattedDate);
                }
              }}
              placeholder="Seleccionar fecha"
            />
          </div>

          {/* Category */}
          {expenseType?.show_category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría {expenseType?.required_category && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => handleChange('category_id', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_category}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado {expenseType?.required_status && <span className="text-red-500">*</span>}
            </label>
            <select
              value={formData.status_id || ''}
              onChange={(e) => handleChange('status_id', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              required={expenseType?.required_status}
            >
              <option value="">Seleccione estado</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          {expenseType?.show_payment_method && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Método de Pago {expenseType?.required_payment_method && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.payment_method || ''}
                onChange={(e) => handleChange('payment_method', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_payment_method}
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

          {/* Payment Date */}
          {expenseType?.show_payment_date && (
            <div>
              <DatePicker
                id="form-payment-date"
                label={<>Fecha de Pago {expenseType?.required_payment_date && <span className="text-red-500">*</span>}</>}
                defaultDate={formData.payment_date || ''}
                onChange={(selectedDates) => {
                  if (selectedDates.length > 0) {
                    const date = selectedDates[0];
                    const formattedDate = date.toISOString().split('T')[0];
                    handleChange('payment_date', formattedDate);
                  }
                }}
                placeholder="Seleccionar fecha de pago"
              />
            </div>
          )}

          {/* Invoice Number */}
          {expenseType?.show_invoice_number && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Factura {expenseType?.required_invoice_number && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formData.invoice_number || ''}
                onChange={(e) => handleChange('invoice_number', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_invoice_number}
              />
            </div>
          )}

          {/* Currency */}
          {expenseType?.show_currency && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Moneda {expenseType?.required_currency && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.currency || 'CLP'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_currency}
              >
                <option value="CLP">Peso Chileno (CLP)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
          )}

          {/* Exchange Rate */}
          {expenseType?.show_exchange_rate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Cambio {expenseType?.required_exchange_rate && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.exchange_rate || ''}
                onChange={(e) => handleChange('exchange_rate', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_exchange_rate}
              />
            </div>
          )}



          {/* Reference Number */}
          {expenseType?.show_reference_number && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Referencia {expenseType?.required_reference_number && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formData.reference_number || ''}
                onChange={(e) => handleChange('reference_number', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_reference_number}
              />
            </div>
          )}

          {/* Payment Status */}
          {expenseType?.show_payment_status && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado de Pago {expenseType?.required_payment_status && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.payment_status || ''}
                onChange={(e) => handleChange('payment_status', e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_payment_status}
              >
                <option value="">Seleccione estado</option>
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Parcial</option>
                <option value="pagado">Pagado</option>
                <option value="anulado">Anulado</option>
              </select>
            </div>
          )}

          {/* Tax Amount */}
          {expenseType?.show_tax_amount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monto de Impuesto (IVA) {expenseType?.required_tax_amount && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tax_amount || ''}
                onChange={(e) => handleChange('tax_amount', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_tax_amount}
              />
            </div>
          )}

          {/* Net Amount */}
          {expenseType?.show_net_amount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monto Neto {expenseType?.required_net_amount && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.net_amount || ''}
                onChange={(e) => handleChange('net_amount', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_net_amount}
              />
            </div>
          )}

          {/* Total Amount */}
          {expenseType?.show_total_amount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monto Total {expenseType?.required_total_amount && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.total_amount || ''}
                onChange={(e) => handleChange('total_amount', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                required={expenseType?.required_total_amount}
              />
            </div>
          )}
          {/* Description - Always shown */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
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
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}
