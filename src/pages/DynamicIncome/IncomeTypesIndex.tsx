// src/pages/DynamicIncome/IncomeTypesIndex.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { incomeTypeService } from '../../services/incomeTypeService';
import type { IncomeType } from '../../types/income';

export default function IncomeTypesIndex() {
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    loadIncomeTypes();
  }, []);

  const loadIncomeTypes = async () => {
    try {
      setLoading(true);
      const data = await incomeTypeService.getAll();
      setIncomeTypes(data);
    } catch (err: any) {
      setError(err.message || 'Error cargando tipos de ingresos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Está seguro de desactivar el tipo "${name}"?`)) {
      return;
    }

    try {
      setDeleteLoading(id);
      await incomeTypeService.delete(id);
      await loadIncomeTypes();
    } catch (err: any) {
      alert(err.message || 'Error desactivando tipo de ingreso');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getAllFields = (type: IncomeType) => {
    const fields = [
      { label: 'Nombre', required: true, always: true },
      { label: 'Monto', required: true, always: true },
      { label: 'Fecha', required: true, always: true },
      { label: 'Estado', required: true, always: true },
      { label: 'Descripción', required: true, always: true },
      { label: 'Centro de Costo', required: true, always: true },
    ];

    // Add optional fields if they are shown
    if (type.show_category) {
      fields.push({ label: 'Categoría', required: !!type.required_category, always: false });
    }
    if (type.show_payment_date) {
      fields.push({ label: 'Fecha Vencimiento', required: !!type.required_payment_date, always: false });
    }
    if (type.show_reference_number) {
      fields.push({ label: 'Identificador', required: !!type.required_reference_number, always: false });
    }
    if (type.show_currency) {
      fields.push({ label: 'Moneda', required: !!type.required_currency, always: false });
    }
    if (type.show_exchange_rate) {
      fields.push({ label: 'Tipo de Cambio', required: !!type.required_exchange_rate, always: false });
    }

    return fields;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando tipos de ingresos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tipos de Ingresos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona los diferentes tipos de ingresos de tu organización
          </p>
        </div>
        <Link
          to="/ingresos/tipos/nuevo"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo Tipo
        </Link>
      </div>

      {incomeTypes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay tipos de ingresos</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comienza creando tu primer tipo de ingreso
            </p>
            <div className="mt-6">
              <Link
                to="/ingresos/tipos/nuevo"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Crear Primer Tipo
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incomeTypes.map((type) => (
            <div
              key={type.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {type.name}
                </h3>
                <span className={`px-2 py-1 text-xs rounded ${
                  type.is_active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {type.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {type.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {type.description}
                </p>
              )}

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campos Configurados ({getAllFields(type).length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {getAllFields(type).map((field, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 text-xs rounded ${
                        field.always
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {field.label}{field.required ? '*' : ''}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  * = Campo obligatorio
                </p>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/ingresos/tipos/${type.id}/editar`}
                  className="flex-1 px-3 py-2 text-center text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(type.id!, type.name)}
                  disabled={deleteLoading === type.id}
                  className="flex-1 px-3 py-2 text-sm border border-red-300 dark:border-red-600 rounded text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {deleteLoading === type.id ? '...' : 'Desactivar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
