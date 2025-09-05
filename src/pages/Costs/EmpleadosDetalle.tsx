import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Empleado } from '../../types/CC/empleados';
import empleadosService from '../../services/CC/empleadosService';

const EmpleadosDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Mover los hooks aquí, antes de cualquier return
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmpleado, setEditedEmpleado] = useState<Empleado>({} as Empleado);

  useEffect(() => {
    loadEmpleado();
  }, [id]);

  const loadEmpleado = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await empleadosService.getEmpleadoById(parseInt(id));
      setEmpleado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('¿Está seguro que desea eliminar este empleado? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      setLoading(true);
      await empleadosService.deleteEmpleado(parseInt(id));
      navigate('/gastos/empleados');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el empleado');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  if (loading && !empleado) {
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
            onClick={loadEmpleado}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedEmpleado(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Detalle del Empleado
          </h1>
          <div className="space-x-2">
            <button
              onClick={() => navigate('/gastos/empleados')}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              Volver
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RUT
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={editedEmpleado.tax_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombres
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={editedEmpleado.first_name || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apellidos
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={editedEmpleado.last_name || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editedEmpleado.email || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editedEmpleado.phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono de Emergencia
                </label>
                <input
                  type="tel"
                  name="emergency_phone"
                  value={editedEmpleado.emergency_phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  name="position"
                  value={editedEmpleado.position || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  name="department"
                  value={editedEmpleado.department || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Contratación
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={editedEmpleado.hire_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Centro de Costo
                </label>
                <input
                  type="number"
                  name="default_cost_center_id"
                  value={editedEmpleado.default_cost_center_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Salario Base
                </label>
                <input
                  type="number"
                  name="salary_base"
                  value={editedEmpleado.salary_base || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  name="active"
                  value={editedEmpleado.active?.toString()}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
          ) : (
            // Vista de detalle
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">RUT</h3>
                <p className="mt-1">{empleado?.tax_id || '-'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Nombre Completo</h3>
                <p className="mt-1">{`${empleado?.first_name || ''} ${empleado?.last_name || ''}`}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Email</h3>
                <p className="mt-1">{empleado?.email || '-'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Teléfono</h3>
                <p className="mt-1">{empleado?.phone || '-'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Teléfono de Emergencia</h3>
                <p className="mt-1">{empleado?.emergency_phone || '-'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Cargo</h3>
                <p className="mt-1">{empleado?.position || '-'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Departamento</h3>
                <p className="mt-1">{empleado?.department || '-'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Fecha de Contratación</h3>
                <p className="mt-1">{formatDate(empleado?.hire_date)}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Centro de Costo</h3>
                <p className="mt-1">{empleado?.cost_center_name || empleado?.default_cost_center_id || '-'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Salario Base</h3>
                <p className="mt-1">{formatCurrency(empleado?.salary_base)}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Estado</h3>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      empleado?.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {empleado?.active ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
              </div>

              {empleado?.created_at && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Fecha de Creación</h3>
                  <p className="mt-1">{formatDate(empleado.created_at)}</p>
                </div>
              )}

              {empleado?.updated_at && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Última Actualización</h3>
                  <p className="mt-1">{formatDate(empleado.updated_at)}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-end space-x-2">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              Eliminar
            </button>
            <button
              onClick={() => navigate(`/gastos/empleados/${id}/edit`)}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg"
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpleadosDetalle;
