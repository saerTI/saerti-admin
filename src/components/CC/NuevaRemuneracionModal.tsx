import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from "react";
import { Project } from "../../types/project";
import { RemuneracionCreateData } from "../../types/CC/remuneracion";
import { Empleado } from "../../types/CC/empleados";
import { getEmpleados } from "../../services/CC/empleadosService";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";

interface NuevaRemuneracionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RemuneracionCreateData) => void;
  projects: Project[];
}

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

const NuevaRemuneracionModal: React.FC<NuevaRemuneracionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projects = [] 
}) => {
  // ✅ ACTUALIZADO: Estado para los datos del formulario con nueva estructura
  const [formData, setFormData] = useState<RemuneracionCreateData>({
    // ✅ NUEVO CAMPO REQUERIDO: employee_id
    employee_id: 0, // Inicializar en 0 para que el usuario deba seleccionar un empleado
    
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
  
  // Estado para errores de validación
  const [errors, setErrors] = useState<FormErrorState>({});
  
  // Handler para cerrar el modal con la tecla Escape
  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  // Añadir/remover event listener para la tecla Escape
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      
      // Añadir clase al body para evitar scroll
      document.body.style.overflow = 'hidden';
      
      // Al abrir el modal, establecer el mes y año actuales como valores predeterminados
      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = now.getFullYear().toString();
      
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
      updateFechaValue(currentMonth, currentYear);
    } else {
      // Limpiar datos cuando se cierre el modal
      setEmpleadoEncontrado(null);
      setMontoFormateado("");
      setErrors({});
      setFormData({
        employee_id: 0,
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
        rut: "",
        nombre: "",
        tipo: "REMUNERACION",
        sueldoLiquido: 0,
        anticipo: 0,
        fecha: ""
      });
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      
      // Restaurar overflow cuando se cierra el modal
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscKey]);

  // Cargar empleados cuando se abre el modal
  useEffect(() => {
    const fetchEmpleados = async () => {
      if (isOpen) {
        try {
          setLoadingEmpleados(true);
          const empleadosResponse = await getEmpleados({ per_page: 1000 });
          setEmpleados(empleadosResponse.items || []);
        } catch (error) {
          console.error("Error al cargar empleados", error);
        } finally {
          setLoadingEmpleados(false);
        }
      }
    };
    fetchEmpleados();
  }, [isOpen]);
  
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
          // Actualizar también los campos legacy
          rut: empleado.tax_id || '',
          nombre: empleado.full_name || ''
        }));
        setErrors(prev => ({ ...prev, employee_id: '' }));
      }
    } else {
      setEmpleadoEncontrado(null);
      setFormData(prev => ({ 
        ...prev, 
        employee_id: 0,
        rut: '',
        nombre: ''
      }));
    }
  };
  
  // ✅ ACTUALIZADO: Manejar cambios en los inputs con nueva estructura
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Si es un campo de monto (sueldoLiquido o anticipo)
    if (name === 'sueldoLiquido' || name === 'anticipo') {
      // Lógica de formateo de números (mantener igual)
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
  };  // ✅ ACTUALIZADO: Manejar cambio en el tipo de remuneración
  const handleTipoChange = (value: string) => {
    setTipoSeleccionado(value);
    const newType = value === 'REMUNERACION' ? 'remuneracion' : 'anticipo';
    
    setFormData(prev => ({
      ...prev,
      // ✅ NUEVOS CAMPOS
      type: newType,
      // Resetear campos monetarios
      net_salary: 0,
      advance_payment: 0,
      amount: 0,
      // ✅ CAMPOS LEGACY
      tipo: value as 'REMUNERACION' | 'ANTICIPO',
      sueldoLiquido: 0,
      anticipo: 0
    }));
    setMontoFormateado("");
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
  
  // ✅ ACTUALIZADO: Validar el formulario con nueva estructura
  const validateForm = (): boolean => {
    const newErrors: FormErrorState = {};
    
    // Validar selección de empleado
    if (!formData.employee_id || formData.employee_id <= 0) {
      newErrors.employee_id = "Debe seleccionar un empleado";
    }
    
    // Validar campos legacy para compatibilidad
    if (!formData.rut) newErrors.rut = "El RUT es obligatorio";
    if (!formData.nombre) newErrors.nombre = "El nombre es obligatorio";
    
    // Validar montos según el tipo
    if (formData.tipo === "REMUNERACION" && formData.sueldoLiquido === 0) {
      newErrors.sueldoLiquido = "El sueldo líquido es obligatorio";
    }
    
    if (formData.tipo === "ANTICIPO" && formData.anticipo === 0) {
      newErrors.anticipo = "El anticipo es obligatorio";
    }
    
    // Validar período
    if (!formData.fecha) newErrors.fecha = "El período es obligatorio";
    
    // Validar campos de la nueva estructura
    if (formData.employee_id <= 0) {
      newErrors.rut = "Debe seleccionar un empleado válido";
    }
    
    if (formData.amount <= 0) {
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
  
  // ✅ ACTUALIZADO: Manejar envío del formulario con nueva estructura
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // ✅ PREPARAR DATOS CON NUEVA ESTRUCTURA COMPLETA
    const dataToSubmit: RemuneracionCreateData = {
      // ✅ CAMPOS NUEVOS REQUERIDOS
      employee_id: 1, // TODO: Implementar selección de empleado
      type: formData.type,
      amount: formData.amount,
      net_salary: formData.net_salary,
      advance_payment: formData.advance_payment,
      date: formData.date,
      month_period: formData.month_period,
      year_period: formData.year_period,
      work_days: formData.work_days || 30,
      payment_method: formData.payment_method || "transferencia",
      status: formData.status || "pendiente",
      notes: formData.notes || `Creado desde formulario: ${formData.nombre}`,
      
      // ✅ CAMPOS LEGACY PARA COMPATIBILIDAD
      rut: formData.rut,
      nombre: formData.nombre,
      tipo: formData.tipo,
      sueldoLiquido: formData.sueldoLiquido,
      anticipo: formData.anticipo,
      fecha: formData.fecha,
      estado: "pendiente",
      diasTrabajados: formData.work_days || 30,
      metodoPago: formData.payment_method || "transferencia",
      montoTotal: formData.amount
    };
    
    if (validateForm()) {
      console.log('✅ Submitting form data with new structure:', dataToSubmit);
      onSubmit(dataToSubmit);
      handleReset();
    }
  };
  
  // ✅ ACTUALIZADO: Resetear el formulario con nueva estructura
  const handleReset = () => {
    setFormData({
      // ✅ CAMPOS DE LA NUEVA ESTRUCTURA PAYROLL
      employee_id: 1,
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
      payment_date: "",
      notes: "",
      
      // ✅ CAMPOS LEGACY PARA COMPATIBILIDAD
      rut: "",
      nombre: "",
      tipo: "REMUNERACION",
      sueldoLiquido: 0,
      anticipo: 0,
      fecha: ""
    });
    setMontoFormateado("");
    setSelectedMonth("");
    setSelectedYear("");
    setTipoSeleccionado("REMUNERACION");
    setErrors({});
  };
  
  // Cuando el modal se cierra, resetear el formulario
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);
  
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;
  
  // Handler para cerrar el modal cuando se hace clic en el fondo
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Solo cerrar si se hizo clic exactamente en el backdrop, no en el contenido del modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[1px]"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Nueva Remuneración
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Seleccionar Empleado */}
            <div>
              <Label htmlFor="empleado">
                Seleccionar Empleado <span className="text-red-500">*</span>
              </Label>
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
                  Tipo <span className="text-red-500">*</span>
                </Label>
                <Select
                  options={tipoOptions}
                  defaultValue={tipoSeleccionado}
                  onChange={handleTipoChange}
                  className={errors.tipo ? "border-red-500" : ""}
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
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevaRemuneracionModal;