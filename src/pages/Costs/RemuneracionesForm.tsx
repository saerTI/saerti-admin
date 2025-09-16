import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { Remuneracion, RemuneracionUpdateData } from '../../types/CC/remuneracion';
import { Empleado } from "../../types/CC/empleados";
import { getEmpleados } from "../../services/CC/empleadosService";
import remuneracionesService from '../../services/CC/remuneracionesService';
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";

interface FormErrorState {
  employee_id?: string;
  rut?: string;
  nombre?: string;
  tipo?: string;
  sueldoLiquido?: string;
  anticipo?: string;
  fecha?: string;
  diasTrabajados?: string;
  metodoPago?: string;
}

const RemuneracionesForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // ✅ ACTUALIZADO: Estado para los datos del formulario con nueva estructura
  const [formData, setFormData] = useState<Partial<RemuneracionUpdateData>>({
    // ✅ NUEVO CAMPO REQUERIDO: employee_id
    employee_id: 0, // Se cargará desde los datos existentes
    
    // ✅ CAMPOS DE LA NUEVA ESTRUCTURA PAYROLL
    type: "remuneracion",
    amount: 0,
    net_salary: 0,
    advance_payment: 0,
    date: "",
    month_period: new Date().getMonth() + 1,
    year_period: new Date().getFullYear(),
    work_days: 30,
    payment_method: "transferencia",
    status: "pendiente",
    notes: "",
    
    // ✅ CAMPOS LEGACY PARA COMPATIBILIDAD
    rut: "",
    nombre: "",
    tipo: "REMUNERACION",
    sueldoLiquido: 0,
    anticipo: 0,
    fecha: ""
  });

  // Estado para el formateo del monto (sueldo líquido o anticipo)
  const [montoFormateado, setMontoFormateado] = useState<string>("");
  
  // Estados para los selectores de mes y año
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  
  // Estados para mantener los valores seleccionados de los Select  
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("REMUNERACION");
  
  // Estados para manejar empleados
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState<Empleado | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  
  // Estados originales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrorState>({});

  useEffect(() => {
    loadEmpleados();
  }, []);

  // Separar la carga de remuneración para que se ejecute después de cargar empleados
  useEffect(() => {
    if (empleados.length > 0) {
      loadRemuneracion();
    }
  }, [id, empleados.length]);

  // Cargar empleados
  const loadEmpleados = async () => {
    try {
      setLoadingEmpleados(true);
      const empleadosResponse = await getEmpleados({ per_page: 1000 });
      setEmpleados(empleadosResponse.items || []);
    } catch (error) {
      console.error("Error al cargar empleados", error);
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const loadRemuneracion = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await remuneracionesService.getRemuneracionById(parseInt(id));
      
      // Determinar el tipo basado en los datos existentes
      let tipoDeterm = "REMUNERACION";
      if (data.anticipo && data.anticipo > 0 && (!data.sueldoLiquido || data.sueldoLiquido === 0)) {
        tipoDeterm = "ANTICIPO";
      }
      setTipoSeleccionado(tipoDeterm);
      
      // Extraer mes y año del período si existe
      let monthPeriod = new Date().getMonth() + 1;
      let yearPeriod = new Date().getFullYear();
      if (data.period) {
        const [month, year] = data.period.split('/');
        monthPeriod = parseInt(month);
        yearPeriod = parseInt(year);
        setSelectedMonth(month.padStart(2, '0'));
        setSelectedYear(year);
      }
      
      // Buscar el empleado correspondiente después de que se hayan cargado los empleados
      let empleadoEncontradoLocal: Empleado | null = null;
      if (empleados.length > 0) {
        empleadoEncontradoLocal = empleados.find(emp => emp.tax_id === data.employeeRut) || null;
        setEmpleadoEncontrado(empleadoEncontradoLocal);
      }
      
      // Actualizar formData con los datos cargados
      setFormData({
        // ✅ CAMPOS DE LA NUEVA ESTRUCTURA PAYROLL
        employee_id: empleadoEncontradoLocal?.id || 0,
        type: tipoDeterm === "REMUNERACION" ? "remuneracion" : "anticipo",
        amount: data.amount || 0,
        net_salary: data.sueldoLiquido || 0,
        advance_payment: data.anticipo || 0,
        date: data.date || "",
        month_period: monthPeriod,
        year_period: yearPeriod,
        work_days: data.workDays || 30,
        payment_method: (data.paymentMethod || "transferencia") as "transferencia" | "cheque" | "efectivo",
        status: (data.state || "pendiente") as "pendiente" | "aprobado" | "pagado" | "rechazado" | "cancelado",
        payment_date: data.paymentDate || "",
        notes: data.notes || "",
        
        // ✅ CAMPOS LEGACY PARA COMPATIBILIDAD
        rut: data.employeeRut || "",
        nombre: data.employeeName || "",
        tipo: tipoDeterm as 'REMUNERACION' | 'ANTICIPO',
        sueldoLiquido: data.sueldoLiquido || 0,
        anticipo: data.anticipo || 0,
        fecha: data.date || ""
      });
      
      // Formatear el monto para mostrar
      const monto = tipoDeterm === "ANTICIPO" ? data.anticipo : data.sueldoLiquido;
      if (monto) {
        setMontoFormateado(formatearNumero(monto));
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la remuneración');
    } finally {
      setLoading(false);
    }
  };

  // Opciones para el tipo de remuneración
  const tipoOptions = [
    { value: "REMUNERACION", label: "Remuneración" },
    { value: "ANTICIPO", label: "Anticipo" }
  ];
  
  // Opciones para los meses
  const monthOptions = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ];
  
  // Opciones para los años (5 años atrás y 5 años adelante)
  const yearOptions = (() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
      .map(year => ({ value: year.toString(), label: year.toString() }));
  })();
  
  // Formatear número con puntos de miles
  const formatearNumero = (numero: number): string => {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Función para manejar la selección de empleado (deshabilitada en edición)
  const handleEmpleadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // En modo edición, no se permite cambiar de empleado
    return;
  };

  // ✅ ACTUALIZADO: Manejar cambios en los inputs con nueva estructura
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Si es un campo de monto (sueldoLiquido o anticipo)
    if (name === 'sueldoLiquido' || name === 'anticipo') {
      // Lógica de formateo de números
      const numeroLimpio = value.replace(/\D/g, '');
      
      if (numeroLimpio) {
        const numeroEntero = parseInt(numeroLimpio, 10);
        setMontoFormateado(formatearNumero(numeroEntero));
        
        // ✅ ACTUALIZAR AMBAS ESTRUCTURAS
        setFormData(prev => ({
          ...prev,
          // Campos legacy
          [name]: numeroEntero,
          // Campos nuevos
          ...(name === 'sueldoLiquido' ? {
            net_salary: numeroEntero,
            amount: numeroEntero
          } : {
            advance_payment: numeroEntero,
            amount: numeroEntero
          })
        }));
      } else {
        setMontoFormateado("");
        setFormData(prev => ({
          ...prev,
          [name]: 0,
          ...(name === 'sueldoLiquido' ? {
            net_salary: 0,
            amount: 0
          } : {
            advance_payment: 0,
            amount: 0
          })
        }));
      }
    } else {
      // Para los demás campos
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error del campo cuando el usuario escribe
    if (errors[name as keyof FormErrorState]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // ✅ ACTUALIZADO: Manejar cambio en el tipo de remuneración (deshabilitado en edición)
  const handleTipoChange = (value: string) => {
    // En modo edición, no se permite cambiar el tipo
    return;
  };
  
  // Manejar cambio en el mes
  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    updateFechaValue(value, selectedYear);
  };
  
  // Manejar cambio en el año
  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    updateFechaValue(selectedMonth, value);
  };
  
  // ✅ ACTUALIZADO: Actualizar valores de fecha y período
  const updateFechaValue = (month: string, year: string) => {
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      // ✅ NUEVA ESTRUCTURA: Actualizar month_period y year_period
      setFormData(prev => ({
        ...prev,
        date: `${year}-${month}-01`, // Formato YYYY-MM-DD para la API
        month_period: monthNum,
        year_period: yearNum,
        // También actualizar campos legacy
        fecha: `${year}-${month}-01`
      }));
      
      // Limpiar error si existía
      if (errors.fecha) {
        setErrors(prev => ({
          ...prev,
          fecha: undefined
        }));
      }
    }
  };

  const handleInputChangeOld = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number = value;
    
    if (type === 'number') {
      processedValue = value === '' ? 0 : Number(value);
    }

    if (name === 'type') {
      // Esta función ya no se usa
      return;
    }

    // Esta función ya no se usa
  };

  // ✅ ACTUALIZADO: Validar el formulario con nueva estructura (adaptado para edición)
  const validateForm = (): boolean => {
    const newErrors: FormErrorState = {};
    
    // En modo edición, el empleado ya está establecido, no necesita validación
    // Validar campos legacy para compatibilidad
    if (!formData.rut) newErrors.rut = "El RUT es obligatorio";
    if (!formData.nombre) newErrors.nombre = "El nombre es obligatorio";
    
    // Validar montos según el tipo
    if (formData.tipo === "REMUNERACION" && (!formData.sueldoLiquido || formData.sueldoLiquido === 0)) {
      newErrors.sueldoLiquido = "El sueldo líquido es obligatorio";
    }
    
    if (formData.tipo === "ANTICIPO" && (!formData.anticipo || formData.anticipo === 0)) {
      newErrors.anticipo = "El anticipo es obligatorio";
    }
    
    // Validar período
    if (!formData.fecha && !formData.date) newErrors.fecha = "El período es obligatorio";
    
    // Validar campos de la nueva estructura
    if (formData.amount && formData.amount <= 0) {
      if (formData.type === "remuneracion") {
        newErrors.sueldoLiquido = "El monto es obligatorio";
      } else {
        newErrors.anticipo = "El monto es obligatorio";
      }
    }

    // Validar días trabajados
    if (!formData.work_days || formData.work_days < 1 || formData.work_days > 31) {
      newErrors.diasTrabajados = "Los días trabajados deben estar entre 1 y 31";
    }

    // Validar método de pago
    if (!formData.payment_method) {
      newErrors.metodoPago = "El método de pago es obligatorio";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // ✅ ACTUALIZADO: Preparar los datos para actualizar con nueva estructura
      const updateData: RemuneracionUpdateData = {
        // ✅ CAMPOS NUEVOS REQUERIDOS
        employee_id: formData.employee_id || 1,
        type: formData.type || "remuneracion",
        amount: formData.amount || 0,
        net_salary: formData.net_salary || 0,
        advance_payment: formData.advance_payment || 0,
        date: formData.date || "",
        month_period: formData.month_period || new Date().getMonth() + 1,
        year_period: formData.year_period || new Date().getFullYear(),
        work_days: formData.work_days || 30,
        payment_method: formData.payment_method || "transferencia",
        status: formData.status || "pendiente",
        notes: formData.notes || "",
        
        // ✅ CAMPOS LEGACY PARA COMPATIBILIDAD
        rut: formData.rut || "",
        nombre: formData.nombre || "",
        sueldoLiquido: formData.sueldoLiquido || 0,
        anticipo: formData.anticipo || 0,
        fecha: formData.fecha || "",
        estado: formData.status || "pendiente",
        diasTrabajados: formData.work_days || 30,
        metodoPago: formData.payment_method || "transferencia"
      };

      await remuneracionesService.updateRemuneracion(parseInt(id), updateData);
      navigate(`/gastos/remuneraciones/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la remuneración');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Si el componente está cargando y no tenemos ID, mostrar spinner
  if (loading && !id) {
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
          <Button
            onClick={() => navigate(`/gastos/remuneraciones/${id}`)}
            variant="outline"
          >
            Volver
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Seleccionar Empleado */}
              <div>
                <Label htmlFor="empleado">
                  Empleado <span className="text-gray-500">(no editable)</span>
                </Label>
                <select
                  value={formData.employee_id || ''}
                  onChange={handleEmpleadoChange}
                  disabled={true}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">
                    Empleado no seleccionado
                  </option>
                  {empleados.map(empleado => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.full_name} - {empleado.tax_id}
                    </option>
                  ))}
                </select>
                {errors.employee_id && (
                  <span className="text-red-500 text-sm">{errors.employee_id}</span>
                )}
                {/* Mostrar datos del empleado seleccionado */}
                {empleadoEncontrado && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                    <p><strong>RUT:</strong> {empleadoEncontrado.tax_id}</p>
                    <p><strong>Nombre:</strong> {empleadoEncontrado.full_name}</p>
                    {empleadoEncontrado.position && (
                      <p><strong>Cargo:</strong> {empleadoEncontrado.position}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* FILA 1: Tipo y Sueldo Líquido/Anticipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">
                    Tipo <span className="text-gray-500">(no editable)</span>
                  </Label>
                  <Select
                    options={tipoOptions}
                    defaultValue={tipoSeleccionado}
                    onChange={handleTipoChange}
                    disabled={true}
                    className={`${errors.tipo ? "border-red-500" : ""} opacity-75 cursor-not-allowed bg-gray-100 dark:bg-gray-600`}
                  />
                  {errors.tipo && (
                    <span className="text-red-500 text-sm">{errors.tipo}</span>
                  )}
                </div>
                
                {/* Sueldo Líquido o Anticipo (mostrar según el tipo) */}
                {formData.tipo === "REMUNERACION" ? (
                  <div>
                    <Label htmlFor="sueldoLiquido">
                      Sueldo líquido <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="sueldoLiquido"
                      name="sueldoLiquido"
                      value={montoFormateado}
                      onChange={handleInputChange}
                      placeholder="Ej: 500.000"
                      className={errors.sueldoLiquido ? "border-red-500" : ""}
                    />
                    {errors.sueldoLiquido && (
                      <span className="text-red-500 text-sm">{errors.sueldoLiquido}</span>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="anticipo">
                      Anticipo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="anticipo"
                      name="anticipo"
                      value={montoFormateado}
                      onChange={handleInputChange}
                      placeholder="Ej: 200.000"
                      className={errors.anticipo ? "border-red-500" : ""}
                    />
                    {errors.anticipo && (
                      <span className="text-red-500 text-sm">{errors.anticipo}</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* FILA 2: Período y Días Trabajados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha">
                    Período <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        options={monthOptions}
                        defaultValue={selectedMonth}
                        onChange={handleMonthChange}
                        placeholder="Mes"
                        className={errors.fecha ? "border-red-500" : ""}
                      />
                    </div>
                    <div className="flex-1">
                      <Select
                        options={yearOptions}
                        defaultValue={selectedYear}
                        onChange={handleYearChange}
                        placeholder="Año"
                        className={errors.fecha ? "border-red-500" : ""}
                      />
                    </div>
                  </div>
                  {errors.fecha && (
                    <span className="text-red-500 text-sm">{errors.fecha}</span>
                  )}
                </div>

                <div>
                  <Label htmlFor="diasTrabajados">
                    Días Trabajados <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    id="diasTrabajados"
                    name="diasTrabajados"
                    value={formData.work_days || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 30;
                      setFormData(prev => ({
                        ...prev,
                        work_days: value,
                        diasTrabajados: value
                      }));
                    }}
                    placeholder="30"
                    min="1"
                    max="31"
                    className={errors.diasTrabajados ? "border-red-500" : ""}
                  />
                  {errors.diasTrabajados && (
                    <span className="text-red-500 text-sm">{errors.diasTrabajados}</span>
                  )}
                </div>
              </div>

              {/* FILA 3: Método de Pago y Fecha de Pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metodoPago">
                    Método de Pago <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={[
                      { value: "transferencia", label: "Transferencia" },
                      { value: "efectivo", label: "Efectivo" },
                      { value: "cheque", label: "Cheque" }
                    ]}
                    defaultValue={formData.payment_method}
                    onChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        payment_method: value as "transferencia" | "efectivo" | "cheque",
                        metodoPago: value
                      }));
                    }}
                    placeholder="Seleccionar método"
                    className={errors.metodoPago ? "border-red-500" : ""}
                  />
                  {errors.metodoPago && (
                    <span className="text-red-500 text-sm">{errors.metodoPago}</span>
                  )}
                </div>

                <div>
                  <Label htmlFor="fechaPago">
                    Fecha de Pago
                  </Label>
                  <Input
                    type="date"
                    id="fechaPago"
                    name="fechaPago"
                    value={formData.payment_date || ""}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        payment_date: e.target.value
                      }));
                    }}
                    className=""
                  />
                </div>
              </div>

              {/* FILA 4: Estado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estado">
                    Estado <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={[
                      { value: "pendiente", label: "Pendiente" },
                      { value: "aprobado", label: "Aprobado" },
                      { value: "pagado", label: "Pagado" },
                      { value: "rechazado", label: "Rechazado" },
                      { value: "cancelado", label: "Cancelado" }
                    ]}
                    defaultValue={formData.status}
                    onChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        status: value as "pendiente" | "aprobado" | "pagado" | "rechazado" | "cancelado"
                      }));
                    }}
                    placeholder="Seleccionar estado"
                  />
                </div>
              </div>

              {/* Notas - campo que ocupe toda la fila */}
              <div>
                <Label htmlFor="notas">
                  Notas
                </Label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notes || ""}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }));
                  }}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                onClick={() => navigate(`/gastos/remuneraciones/${id}`)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RemuneracionesForm;
