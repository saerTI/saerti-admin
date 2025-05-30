import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";

interface CostoFijoCreateData {
  name: string;
  description?: string;
  quota_value: number;
  paymentDate: string;
  quota_count: string;
  startDate: string;
  projectId?: string;
}

interface ProjectSimple {
  id: number;
  name: string;
}

interface CostoFijoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CostoFijoCreateData) => void;
  projects: ProjectSimple[]; // Cambiado de Project[]
}

interface FormErrorState {
  name?: string;
  quota_value?: string;
  paymentDate?: string;
  quota_count?: string;
  startDate?: string;
  projectId?: string;
}

const CostoFijoModal: React.FC<CostoFijoModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projects = []
}) => {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState<CostoFijoCreateData>({
    name: "",
    description: "",
    quota_value: 0,
    paymentDate: "",
    quota_count: "",
    startDate: "",
    projectId: ""
  });

  // Estado para el formateo del valor de cuota
  const [valorFormateado, setValorFormateado] = useState<string>("");
  
  // Estados para los selectores
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
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      
      // Restaurar overflow cuando se cierra el modal
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscKey]);
  
  // Formatear número con puntos de miles
  const formatearNumero = (numero: number): string => {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  
  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "quota_value") {
      const numeroLimpio = value.replace(/\D/g, "");
      if (numeroLimpio) {
        const numeroEntero = parseInt(numeroLimpio, 10);
        setValorFormateado(formatearNumero(numeroEntero));
        setFormData(prev => ({
          ...prev,
          [name]: numeroEntero
        }));
      } else {
        setValorFormateado("");
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
  
  // Manejar cambio en el proyecto
  const handleProyectoChange = (value: string) => {
    setProyectoSeleccionado(value);
    setFormData(prev => ({
      ...prev,
      projectId: value
    }));
  };
  
  // Manejar cambio en la fecha de inicio
  const handleStartDateChange = (selectedDates: Date[], dateStr: string) => {
    if (selectedDates.length > 0) {
      setFormData(prev => ({
        ...prev,
        startDate: dateStr
      }));
    }
  };
  
  // Manejar cambio en la fecha de pago
  const handlePaymentDateChange = (selectedDates: Date[], dateStr: string) => {
    if (selectedDates.length > 0) {
      setFormData(prev => ({
        ...prev,
        paymentDate: dateStr
      }));
    }
  };
  
  // Validar el formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrorState = {};
    
    if (!formData.name) newErrors.name = "El nombre es obligatorio";
    if (!formData.quota_value) newErrors.quota_value = "El valor de cuota es obligatorio";
    if (!formData.paymentDate) newErrors.paymentDate = "La fecha de pago es obligatoria";
    if (!formData.quota_count) newErrors.quota_count = "La cantidad de cuotas es obligatoria";
    if (!formData.startDate) newErrors.startDate = "La fecha de inicio es obligatoria";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      handleReset();
    }
  };
  
  // Resetear el formulario
  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      quota_value: 0,
      paymentDate: "",
      quota_count: "",
      startDate: "",
      projectId: ""
    });
    setValorFormateado("");
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
  
  // Opciones para cantidad de cuotas
  const quotaOptions = [
    { value: "", label: "Seleccione cantidad de cuotas" },
    ...Array.from({ length: 24 }, (_, i) => i + 1).map(num => ({
      value: num.toString(),
      label: num.toString()
    }))
  ];
  
  // Crear opciones de proyectos
  const projectOptions = [
    { value: "", label: "Seleccione un proyecto" },
    ...projects.map(project => ({
      value: project.id.toString(),
      label: project.name
    }))
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
            Nuevo Costo Fijo
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
            {/* Nombre */}
            <div>
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Arriendo de Oficina"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <span className="text-red-500 text-sm">{errors.name}</span>
              )}
            </div>
            
            {/* Descripción */}
            <div>
              <Label htmlFor="description">
                Descripción
              </Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descripción detallada del costo fijo"
                className="h-24 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            
            {/* Valor de Cuota */}
            <div>
              <Label htmlFor="quota_value">
                Valor de Cuota <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="quota_value"
                name="quota_value"
                value={valorFormateado}
                onChange={handleInputChange}
                placeholder="Ej: 500.000"
                className={errors.quota_value ? "border-red-500" : ""}
              />
              {errors.quota_value && (
                <span className="text-red-500 text-sm">{errors.quota_value}</span>
              )}
            </div>
            
            {/* Cantidad de Cuotas */}
            <div>
              <Label htmlFor="quota_count">
                Cantidad de Cuotas <span className="text-red-500">*</span>
              </Label>
              <Select
                options={quotaOptions}
                defaultValue={formData.quota_count}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    quota_count: value
                  }));
                }}
                className={errors.quota_count ? "border-red-500" : ""}
              />
              {errors.quota_count && (
                <span className="text-red-500 text-sm">{errors.quota_count}</span>
              )}
            </div>
            
            {/* Fecha de Inicio */}
            <div>
              <DatePicker
                id="startDate"
                label="Fecha de Inicio"
                placeholder="Seleccione fecha de inicio"
                onChange={handleStartDateChange}
                options={{
                  dateFormat: "Y-m-d"
                }}
              />
              {errors.startDate && (
                <span className="text-red-500 text-sm">{errors.startDate}</span>
              )}
            </div>
            
            {/* Fecha de Pago */}
            <div>
              <DatePicker
                id="paymentDate"
                label="Día de Pago"
                placeholder="Seleccione día de pago mensual"
                onChange={handlePaymentDateChange}
                options={{
                  dateFormat: "Y-m-d"
                }}
              />
              {errors.paymentDate && (
                <span className="text-red-500 text-sm">{errors.paymentDate}</span>
              )}
            </div>
            
            {/* Proyecto (opcional) */}
            <div>
              <Label htmlFor="projectId">
                Proyecto
              </Label>
              <Select
                options={projectOptions}
                defaultValue={proyectoSeleccionado}
                onChange={handleProyectoChange}
                className={errors.projectId ? "border-red-500" : ""}
              />
              {errors.projectId && (
                <span className="text-red-500 text-sm">{errors.projectId}</span>
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

export default CostoFijoModal;