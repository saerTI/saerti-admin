import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empleado } from '../../types/CC/empleados';
import empleadosService from '../../services/CC/empleadosService';

const EmpleadosNuevo: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [empleado, setEmpleado] = useState<Partial<Empleado>>({
    active: true,
    tax_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    emergency_phone: '',
    position: '',
    department: '',
    hire_date: '',
    default_cost_center_id: undefined,
    salary_base: undefined
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | boolean = value;
    
    // Handle special input types
    if (type === 'number') {
      processedValue = value === '' ? 0 : Number(value);
    } else if (name === 'active') {
      processedValue = value === 'true';
    }

    setEmpleado(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Combine first_name and last_name into full_name for the backend
      const empleadoData = {
        ...empleado,
        full_name: `${empleado.first_name || ''} ${empleado.last_name || ''}`.trim()
      };
      
      await empleadosService.createEmpleado(empleadoData);
      navigate('/gastos/empleados');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el empleado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Nuevo Empleado
          </h1>
          <button
            type="button"
            onClick={() => navigate('/gastos/empleados')}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            Volver
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                Información Personal
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                RUT
              </label>
              <input
                type="text"
                name="tax_id"
                value={empleado.tax_id || ''}
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
                value={empleado.first_name || ''}
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
                value={empleado.last_name || ''}
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
                value={empleado.email || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Información de Contacto */}
            <div className="col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                Información de Contacto
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={empleado.phone || ''}
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
                value={empleado.emergency_phone || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Información Laboral */}
            <div className="col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                Información Laboral
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cargo
              </label>
              <input
                type="text"
                name="position"
                value={empleado.position || ''}
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
                value={empleado.department || ''}
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
                value={empleado.hire_date || ''}
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
                value={empleado.default_cost_center_id || ''}
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
                value={empleado.salary_base || ''}
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
                value={empleado.active?.toString()}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/gastos/empleados')}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpleadosNuevo;
