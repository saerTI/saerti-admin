import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Remuneracion, RemuneracionUpdateData } from '../../types/CC/remuneracion';
import remuneracionesService from '../../services/CC/remuneracionesService';

const RemuneracionesForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [remuneracion, setRemuneracion] = useState<Partial<Remuneracion>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRemuneracion();
  }, [id]);

  const loadRemuneracion = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await remuneracionesService.getRemuneracionById(parseInt(id));
      setRemuneracion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la remuneración');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number = value;
    
    if (type === 'number') {
      processedValue = value === '' ? 0 : Number(value);
    }

    setRemuneracion(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setLoading(true);
      
      // Preparar los datos para actualizar
      const updateData: RemuneracionUpdateData = {
        rut: remuneracion.employeeRut,
        nombre: remuneracion.employeeName,
        sueldoLiquido: remuneracion.sueldoLiquido,
        anticipo: remuneracion.anticipo,
        proyectoId: remuneracion.projectId?.toString(),
        fecha: remuneracion.date,
        estado: remuneracion.state,
        cargo: remuneracion.employeePosition,
        diasTrabajados: remuneracion.workDays,
        metodoPago: remuneracion.paymentMethod
      };

      await remuneracionesService.updateRemuneracion(parseInt(id), updateData);
      navigate(`/gastos/remuneraciones/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la remuneración');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !remuneracion.id) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            className="px-4 py-2 mt-3 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={loadRemuneracion}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Editar Remuneración
          </h1>
          <button
            onClick={() => navigate(`/gastos/remuneraciones/${id}`)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            Volver
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                RUT del Empleado
              </label>
              <input
                type="text"
                name="employeeRut"
                value={remuneracion.employeeRut || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Empleado
              </label>
              <input
                type="text"
                name="employeeName"
                value={remuneracion.employeeName || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cargo
              </label>
              <input
                type="text"
                name="employeePosition"
                value={remuneracion.employeePosition || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Área
              </label>
              <input
                type="text"
                name="area"
                value={remuneracion.area || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Período
              </label>
              <input
                type="text"
                name="period"
                value={remuneracion.period || ''}
                onChange={handleInputChange}
                placeholder="MM/YYYY"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={remuneracion.date || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Días Trabajados
              </label>
              <input
                type="number"
                name="workDays"
                value={remuneracion.workDays || ''}
                onChange={handleInputChange}
                min="0"
                max="31"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sueldo Líquido
              </label>
              <input
                type="number"
                name="sueldoLiquido"
                value={remuneracion.sueldoLiquido || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Anticipo
              </label>
              <input
                type="number"
                name="anticipo"
                value={remuneracion.anticipo || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monto Total
              </label>
              <input
                type="number"
                name="amount"
                value={remuneracion.amount || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Método de Pago
              </label>
              <select
                name="paymentMethod"
                value={remuneracion.paymentMethod || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              >
                <option value="">Seleccionar método</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                name="state"
                value={remuneracion.state || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              >
                <option value="">Seleccionar estado</option>
                <option value="draft">Borrador</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="paid">Pagado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Pago
              </label>
              <input
                type="date"
                name="paymentDate"
                value={remuneracion.paymentDate || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas
              </label>
              <textarea
                name="notes"
                value={remuneracion.notes || ''}
                onChange={(e) => setRemuneracion(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => navigate(`/gastos/remuneraciones/${id}`)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RemuneracionesForm;
