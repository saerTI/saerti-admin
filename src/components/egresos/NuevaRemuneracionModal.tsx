import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from "react";
import { Project } from "../../types/project";
import { RemuneracionCreateData } from "../../types/CC/remuneracion";

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
  rut?: string;
  nombre?: string;
  tipo?: string;
  sueldoLiquido?: string;
  anticipo?: string;
  proyectoId?: string;
  fecha?: string;
}

const NuevaRemuneracionModal: React.FC<NuevaRemuneracionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projects = [] 
}) => {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState<RemuneracionCreateData>({
    rut: "",
    nombre: "",
    tipo: "REMUNERACION",
    sueldoLiquido: 0,
    anticipo: 0,
    proyectoId: "",
    fecha: ""
  });

  // Estado para el formateo del monto (sueldo líquido o anticipo)
  const [montoFormateado, setMontoFormateado] = useState<string>("");
  
  // Estados para los selectores de mes y año
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  
  // Estados para mantener los valores seleccionados de los Select
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("REMUNERACION");
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string>("");
  
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
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      
      // Restaurar overflow cuando se cierra el modal
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscKey]);
  
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
  
  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Para los campos de monto, aplicar formato
    if (name === "sueldoLiquido" || name === "anticipo") {
      const numeroLimpio = value.replace(/\D/g, "");
      if (numeroLimpio) {
        const numeroEntero = parseInt(numeroLimpio, 10);
        setMontoFormateado(formatearNumero(numeroEntero));
        setFormData(prev => ({
          ...prev,
          [name]: numeroEntero
        }));
      } else {
        setMontoFormateado("");
        setFormData(prev => ({
          ...prev,
          [name]: 0
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
  
  // Manejar cambio en el tipo de remuneración
  const handleTipoChange = (value: string) => {
    setTipoSeleccionado(value);
    setFormData(prev => ({
      ...prev,
      tipo: value as 'REMUNERACION' | 'ANTICIPO',
      // Resetear los campos de monto al cambiar el tipo
      sueldoLiquido: 0,
      anticipo: 0
    }));
    setMontoFormateado("");
  };
  
  // Manejar cambio en el proyecto
  const handleProyectoChange = (value: string) => {
    setProyectoSeleccionado(value);
    setFormData(prev => ({
      ...prev,
      proyectoId: value
    }));
    
    // Limpiar error si existía
    if (errors.proyectoId) {
      setErrors(prev => ({
        ...prev,
        proyectoId: undefined
      }));
    }
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
  
  // Actualizar el valor de fecha en formato YYYY-MM-DD (para la API)
  const updateFechaValue = (month: string, year: string) => {
    if (month && year) {
      // Crear fecha en formato YYYY-MM-DD para la API
      const formattedDate = `${year}-${month}-01`;
      setFormData(prev => ({
        ...prev,
        fecha: formattedDate
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
  
  // Validar el formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrorState = {};
    
    if (!formData.rut) newErrors.rut = "El RUT es obligatorio";
    if (!formData.nombre) newErrors.nombre = "El nombre es obligatorio";
    
    if (formData.tipo === "REMUNERACION" && formData.sueldoLiquido === 0) {
      newErrors.sueldoLiquido = "El sueldo líquido es obligatorio";
    }
    
    if (formData.tipo === "ANTICIPO" && formData.anticipo === 0) {
      newErrors.anticipo = "El anticipo es obligatorio";
    }
    
    // TODO: Implementar funcionalidad de proyectos
    // Cuando se implemente, descomentar:
    // if (!formData.proyectoId) newErrors.proyectoId = "El proyecto es obligatorio";
    
    if (!formData.fecha) newErrors.fecha = "El período es obligatorio";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Asegurarse de que ambos campos tengan un valor numérico válido
    const dataToSubmit = {
      ...formData,
      sueldoLiquido: formData.tipo === "REMUNERACION" ? (formData.sueldoLiquido || 0) : 0,
      anticipo: formData.tipo === "ANTICIPO" ? (formData.anticipo || 0) : 0,
      // TODO: Cuando se implemente proyectos, usar formData.proyectoId
      proyectoId: "", // TEMPORAL: Siempre vacío
      // Calcular monto total
      montoTotal: formData.tipo === "REMUNERACION" ? (formData.sueldoLiquido || 0) : (formData.anticipo || 0)
    };
    
    if (validateForm()) {
      // Log what we're submitting for debugging
      console.log('Submitting form data:', dataToSubmit);
      
      onSubmit(dataToSubmit);
      handleReset();
    }
  };
  
  // Resetear el formulario
  const handleReset = () => {
    setFormData({
      rut: "",
      nombre: "",
      tipo: "REMUNERACION",
      sueldoLiquido: 0,
      anticipo: 0,
      proyectoId: "",
      fecha: ""
    });
    setMontoFormateado("");
    setSelectedMonth("");
    setSelectedYear("");
    setTipoSeleccionado("REMUNERACION");
    setProyectoSeleccionado("");
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
  
  // Crear opciones de proyectos - TEMPORAL: Solo mostrar mensaje informativo
  const projectOptions = [
    { value: "", label: "Funcionalidad en desarrollo..." }
  ];
  
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
          <div className="space-y-4">
            {/* RUT */}
            <div>
              <Label htmlFor="rut">
                RUT <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="rut"
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                placeholder="Ej: 12.345.678-9"
                className={errors.rut ? "border-red-500" : ""}
              />
              {errors.rut && (
                <span className="text-red-500 text-sm">{errors.rut}</span>
              )}
            </div>
            
            {/* Nombre */}
            <div>
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Nombre del empleado"
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && (
                <span className="text-red-500 text-sm">{errors.nombre}</span>
              )}
            </div>
            
            {/* Tipo de Remuneración */}
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
            
            {/* Proyecto - TEMPORAL: Deshabilitado visualmente pero sin usar prop disabled */}
            <div>
              <Label htmlFor="proyectoId">
                Proyecto <span className="text-gray-400">(próximamente)</span>
              </Label>
              <div className="relative">
                <Select
                  options={projectOptions}
                  defaultValue=""
                  onChange={() => {}} // No hacer nada por ahora
                  className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-60"
                />
                {/* Overlay para evitar interacción */}
                <div className="absolute inset-0 cursor-not-allowed" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                📋 La selección de proyectos se habilitará próximamente
              </p>
            </div>
            
            {/* Período - Selector de mes y año */}
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