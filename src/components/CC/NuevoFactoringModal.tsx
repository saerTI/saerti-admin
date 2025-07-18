import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";

interface FactoringCreateData {
  amount: number;
  interest_rate: number;
  paymentDate: string;
  entity: string;
  projectId?: string;
}

interface ProjectSimple {
  id: number;
  name: string;
}

interface FactoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FactoringCreateData) => void;
  projects: ProjectSimple[]; // Cambiado de Project[]
  entities: string[];
}

interface FormErrorState {
  amount?: string;
  interest_rate?: string;
  paymentDate?: string;
  entity?: string;
  projectId?: string;
}

const FactoringModal: React.FC<FactoringModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projects = [],
  entities = []
}) => {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState<FactoringCreateData>({
    amount: 0,
    interest_rate: 0,
    paymentDate: "",
    entity: "",
    projectId: ""
  });

  // Estado para el formateo del monto
  const [montoFormateado, setMontoFormateado] = useState<string>("");
  
  // Estado para el formateo de la tasa de interés
  const [tasaFormateada, setTasaFormateada] = useState<string>("");
  
  // Estados para los selectores
  const [entitySeleccionada, setEntitySeleccionada] = useState<string>("");
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
  
  // Formatear tasa de interés
  const formatearTasa = (tasa: number): string => {
    return tasa.toString();
  };
  
  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "amount") {
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
    } else if (name === "interest_rate") {
      // Permitir solo números y un punto decimal
      const numeroLimpio = value.replace(/[^\d.]/g, "");
      // Asegurar que solo haya un punto decimal
      const puntos = numeroLimpio.match(/\./g);
      if (puntos && puntos.length > 1) {
        return; // No seguir si hay más de un punto
      }
      
      if (numeroLimpio) {
        const numeroDecimal = parseFloat(numeroLimpio);
        if (numeroDecimal <= 100) { // Asegurar que no exceda el 100%
          setTasaFormateada(numeroLimpio);
          setFormData(prev => ({
            ...prev,
            [name]: numeroDecimal
          }));
        }
      } else {
        setTasaFormateada("");
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
  
  // Manejar cambio en la entidad
  const handleEntityChange = (value: string) => {
    setEntitySeleccionada(value);
    setFormData(prev => ({
      ...prev,
      entity: value
    }));
  };
  
  // Manejar cambio en el proyecto
  const handleProyectoChange = (value: string) => {
    setProyectoSeleccionado(value);
    setFormData(prev => ({
      ...prev,
      projectId: value
    }));
  };
  
  // Manejar cambio en la fecha
  const handleDateChange = (selectedDates: Date[], dateStr: string) => {
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
    
    if (!formData.amount) newErrors.amount = "El monto es obligatorio";
    if (!formData.interest_rate && formData.interest_rate !== 0) newErrors.interest_rate = "La tasa de interés es obligatoria";
    if (!formData.paymentDate) newErrors.paymentDate = "La fecha de pago es obligatoria";
    if (!formData.entity) newErrors.entity = "La entidad es obligatoria";
    
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
      amount: 0,
      interest_rate: 0,
      paymentDate: "",
      entity: "",
      projectId: ""
    });
    setMontoFormateado("");
    setTasaFormateada("");
    setEntitySeleccionada("");
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
  
  // Crear opciones de entidades
  const entityOptions = [
    ...entities.map(entity => ({
      value: entity,
      label: entity
    }))
  ];
  
  // Crear opciones de proyectos
  const projectOptions = [
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
            Nuevo Factoring
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
            {/* Monto */}
            <div>
              <Label htmlFor="amount">
                Monto <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="amount"
                name="amount"
                value={montoFormateado}
                onChange={handleInputChange}
                placeholder="Ej: 10.000.000"
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <span className="text-red-500 text-sm">{errors.amount}</span>
              )}
            </div>
            
            {/* Tasa de Interés */}
            <div>
              <Label htmlFor="interest_rate">
                Tasa de Interés (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="interest_rate"
                name="interest_rate"
                value={tasaFormateada}
                onChange={handleInputChange}
                placeholder="Ej: 3.5"
                className={errors.interest_rate ? "border-red-500" : ""}
              />
              {errors.interest_rate && (
                <span className="text-red-500 text-sm">{errors.interest_rate}</span>
              )}
            </div>
            
            {/* Entidad */}
            <div>
              <Label htmlFor="entity">
                Entidad Financiera <span className="text-red-500">*</span>
              </Label>
              <Select
                placeholder="Selecciona la Entidad"
                options={entityOptions}
                defaultValue={entitySeleccionada}
                onChange={handleEntityChange}
                className={errors.entity ? "border-red-500" : ""}
              />
              {errors.entity && (
                <span className="text-red-500 text-sm">{errors.entity}</span>
              )}
            </div>
            
            {/* Fecha de Pago */}
            <div>
              <DatePicker
                id="paymentDate"
                label="Fecha de Pago"
                placeholder="Seleccione fecha de pago"
                onChange={handleDateChange}
                options={{
                  // Renderizar el calendario en el body del documento, fuera del modal
                  appendTo: document.body,
                  // No usar modo estático para que aparezca como popup
                  static: false,
                  // Configurar posicionamiento automático
                  position: "auto",
                  // Mantener el formato de fecha
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
                placeholder="Selecciona el Proyecto"
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

export default FactoringModal;