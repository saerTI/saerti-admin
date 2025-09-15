import React, { useState, useEffect, useCallback } from 'react';
import { Previsional, NewPrevisionalData, UpdatePrevisionalData } from '../../types/CC/previsional';
import { Empleado } from '../../types/CC/empleados';
import { previsionalesService } from '../../services/CC/previsionalesService';
import { getEmpleados } from '../../services/CC/empleadosService';
import { getCostCenters, CostCenter } from '../../services/costCenterService';
import Button from '../../components/ui/button/Button';

interface PrevisionalFormProps {
  previsional?: Previsional | null;
  onSave: () => void;
  onClose: () => void;
}

const PrevisionalForm: React.FC<PrevisionalFormProps> = ({ previsional, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<NewPrevisionalData | UpdatePrevisionalData>>({
    employee_id: previsional?.employee_id || 0,
    cost_center_id: previsional?.cost_center_id || 0,
    type: previsional?.type || 'afp',
    amount: previsional?.amount || 0,
    date: previsional?.date || new Date().toISOString().split('T')[0],
    status: previsional?.status || 'pendiente',
    notes: previsional?.notes || ''
  });
  
  // Estados para el periodo
  const [periodoMes, setPeriodoMes] = useState(new Date().getMonth() + 1);
  const [periodoAno, setPeriodoAno] = useState(new Date().getFullYear());
  
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState<Empleado | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hook para cerrar modal con tecla Escape
  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  // Añadir/remover event listener para la tecla Escape
  useEffect(() => {
    document.addEventListener('keydown', handleEscKey);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [handleEscKey]);

  // Inicializar valores del período si estamos editando
  useEffect(() => {
    if (previsional) {
      // Si tenemos month_period y year_period del registro, usarlos
      if (previsional.month_period) {
        setPeriodoMes(previsional.month_period);
      }
      if (previsional.year_period) {
        setPeriodoAno(previsional.year_period);
      }
    }
  }, [previsional]);

  // Cargar centros de costo y empleados al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar centros de costo
        const costCentersResponse = await getCostCenters();
        setCostCenters(costCentersResponse);

        // Cargar empleados
        setLoadingEmpleados(true);
        const empleadosResponse = await getEmpleados({ per_page: 1000 }); // Cargar todos los empleados
        setEmpleados(empleadosResponse.items || []);
      } catch (error) {
        console.error("Error al cargar datos", error);
      } finally {
        setLoadingEmpleados(false);
      }
    };
    fetchData();
  }, []);

  // Función para manejar la selección de empleado
  const handleEmpleadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = Number(e.target.value);
    if (employeeId) {
      const empleado = empleados.find(emp => emp.id === employeeId);
      if (empleado) {
        setEmpleadoEncontrado(empleado);
        setFormData(prev => ({ 
          ...prev, 
          employee_id: employeeId,
          // Establecer automáticamente el centro de costo por defecto si existe
          cost_center_id: empleado.default_cost_center_id || prev.cost_center_id || 0
        }));
        setErrors(prev => ({ ...prev, employee_id: '' }));
      }
    } else {
      setEmpleadoEncontrado(null);
      setFormData(prev => ({ ...prev, employee_id: 0 }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'employee_id' || name === 'cost_center_id' ? Number(value) || 0 : value
    }));
  };

  // Función para manejar cambios en el periodo
  const handlePeriodoChange = (tipo: 'mes' | 'ano', value: number) => {
    if (tipo === 'mes') {
      setPeriodoMes(value);
    } else {
      setPeriodoAno(value);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.employee_id || formData.employee_id === 0) {
      newErrors.employee_id = 'Debe seleccionar un empleado.';
    }
    
    if (!formData.cost_center_id || formData.cost_center_id === 0) {
      newErrors.cost_center_id = 'Debe seleccionar un centro de costo.';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0.';
    }
    
    if (!formData.date) {
      newErrors.date = 'La fecha de pago es obligatoria.';
    }

    if (!periodoMes || periodoMes < 1 || periodoMes > 12) {
      newErrors.periodo = 'Debe seleccionar un mes válido.';
    }

    if (!periodoAno || periodoAno < 2020) {
      newErrors.periodo = 'Debe ingresar un año válido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Extraer mes y año del periodo seleccionado
      const month_period = periodoMes;
      const year_period = periodoAno;
      
      // Agregar estos campos al objeto de datos
      const completeData = {
        ...formData,
        month_period,
        year_period
      };

      if (previsional && previsional.id) {
        await previsionalesService.updatePrevisional(previsional.id, completeData as UpdatePrevisionalData);
      } else {
        await previsionalesService.createPrevisional(completeData as NewPrevisionalData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Error al guardar el registro previsional", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {previsional ? 'Editar' : 'Nuevo'} Registro Previsional
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-6">
            {/* Seleccionar empleado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Seleccionar Empleado <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.employee_id || ''}
                onChange={handleEmpleadoChange}
                disabled={loadingEmpleados}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingEmpleados ? 'Cargando empleados...' : 'Seleccionar empleado'}
                </option>
                {empleados.map(empleado => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.full_name} - {empleado.tax_id}
                  </option>
                ))}
              </select>
              {errors.employee_id && (
                <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>
              )}
              
            </div>

            {/* Grid de campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Centro de Costo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Centro de Costo <span className="text-red-500">*</span>
                  {empleadoEncontrado?.default_cost_center_id && (
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-normal">
                      {" "}(Por defecto: {empleadoEncontrado.cost_center_name})
                    </span>
                  )}
                </label>
                <select
                  name="cost_center_id"
                  value={formData.cost_center_id?.toString() || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
                >
                  <option value="">Seleccionar centro de costo</option>
                  {costCenters.map(cc => (
                    <option 
                      key={cc.id} 
                      value={cc.id}
                      className={cc.id === empleadoEncontrado?.default_cost_center_id ? 'font-semibold' : ''}
                    >
                      {cc.name}
                      {cc.id === empleadoEncontrado?.default_cost_center_id ? ' (Por defecto)' : ''}
                    </option>
                  ))}
                </select>
                {errors.cost_center_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.cost_center_id}</p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Previsional <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type || 'afp'}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
                >
                  <option value="afp">AFP</option>
                  <option value="isapre">Isapre</option>
                  <option value="isapre_7">Isapre 7%</option>
                  <option value="seguro_cesantia">Seguro Cesantía</option>
                  <option value="mutual">Mutual</option>
                </select>
                {errors.type && (
                  <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                )}
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monto <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount || ''}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              {/* Fecha de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Pago <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                )}
              </div>

              {/* Período */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Período <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Mes */}
                  <select
                    value={periodoMes}
                    onChange={(e) => handlePeriodoChange('mes', Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
                  >
                    <option value={1}>Enero</option>
                    <option value={2}>Febrero</option>
                    <option value={3}>Marzo</option>
                    <option value={4}>Abril</option>
                    <option value={5}>Mayo</option>
                    <option value={6}>Junio</option>
                    <option value={7}>Julio</option>
                    <option value={8}>Agosto</option>
                    <option value={9}>Septiembre</option>
                    <option value={10}>Octubre</option>
                    <option value={11}>Noviembre</option>
                    <option value={12}>Diciembre</option>
                  </select>
                  {/* Año */}
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={periodoAno}
                    onChange={(e) => handlePeriodoChange('ano', Number(e.target.value))}
                    placeholder="Año"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
                  />
                </div>
                {errors.periodo && (
                  <p className="text-red-500 text-sm mt-1">{errors.periodo}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status || 'pendiente'}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                )}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary dark:text-white"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrevisionalForm;