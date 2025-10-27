// src/pages/DynamicIncome/IncomeTypesIndex.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { incomeTypeService } from '../../services/incomeTypeService';
import type { IncomeType } from '../../types/income';

export default function IncomeTypesIndex() {
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIncomeTypes();
  }, []);

  const loadIncomeTypes = async () => {
    try {
      setLoading(true);
      const data = await incomeTypeService.getAll();
      setIncomeTypes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tipos de ingresos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tipos de Ingresos</h1>
        <Link
          to="/ingresos/tipos/nuevo"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Crear Nuevo Tipo
        </Link>
      </div>

      <div className="grid gap-4">
        {incomeTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay tipos de ingresos configurados.</p>
            <p className="mt-2">Crea tu primer tipo para comenzar.</p>
          </div>
        ) : (
          incomeTypes.map((type) => (
            <div
              key={type.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{type.name}</h3>
                  {type.description && (
                    <p className="text-gray-600 mb-3">{type.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {type.show_amount && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Monto
                      </span>
                    )}
                    {type.show_category && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Categoría
                      </span>
                    )}
                    {type.show_payment_date && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        Fecha Pago
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/ingresos/tipos/${type.id}/editar`}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Editar
                  </Link>
                  <Link
                    to={`/ingresos/tipo/${type.id}`}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                  >
                    Ver Ingresos
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
