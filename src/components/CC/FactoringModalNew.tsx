import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";
import { FactoringEntity, CostCenter, CreateFactoringRequest, Factoring, FACTORING_STATUS_OPTIONS } from '../../types/factoring';

interface FactoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFactoringRequest) => void;
  onCreateEntity?: (name: string) => Promise<FactoringEntity>;
  factoring?: Factoring | null;
  factoringEntities: FactoringEntity[];
  costCenters: CostCenter[];
}

interface FormErrorState {
  mount?: string;
  interest_rate?: string;
  date_factoring?: string;
  date_expiration?: string;
  factoring_entities_id?: string;
  cost_center_id?: string;
  status?: string;
}

const FactoringModalNew: React.FC<FactoringModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  onCreateEntity,
  factoring = null,
  factoringEntities = [],
  costCenters = []
}) => {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState<CreateFactoringRequest>({
    factoring_entities_id: 0,
    cost_center_id: 0,
    interest_rate: 0,
    mount: 0,
    date_factoring: "",
    date_expiration: "",
    payment_status: 0,
    status: "Pendiente"
  });

  // Estado para el formateo del monto
  const [montoFormateado, setMontoFormateado] = useState<string>("");
  
  // Estado para el formateo de la tasa de interés
  const [tasaFormateada, setTasaFormateada] = useState<string>("");
  
  // Estados para los selectores
  const [entitySeleccionada, setEntitySeleccionada] = useState<string>("");
  const [costCenterSeleccionado, setCostCenterSeleccionado] = useState<string>("");
  const [statusSeleccionado, setStatusSeleccionado] = useState<string>("Pendiente");
  
  // Estado para errores de validación
  const [errors, setErrors] = useState<FormErrorState>({});
  
  // Estado para el modal de nueva entidad
  const [showNewEntityModal, setShowNewEntityModal] = useState<boolean>(false);
  const [newEntityName, setNewEntityName] = useState<string>("");
  const [isCreatingEntity, setIsCreatingEntity] = useState<boolean>(false);

  // Formatear número con puntos de miles
  const formatearNumero = (numero: number): string => {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Efecto para cargar datos del factoring cuando se edita
  useEffect(() => {
    if (factoring && isOpen) {
      setFormData({
        factoring_entities_id: factoring.factoring_entities_id,
        cost_center_id: factoring.cost_center_id,
        interest_rate: factoring.interest_rate,
        mount: factoring.mount,
        date_factoring: factoring.date_factoring,
        date_expiration: factoring.date_expiration,
        payment_status: factoring.payment_status,
        status: factoring.status
      });
      setMontoFormateado(formatearNumero(factoring.mount));
      setTasaFormateada(factoring.interest_rate.toString());
      setEntitySeleccionada(factoring.factoring_entities_id.toString());
      setCostCenterSeleccionado(factoring.cost_center_id.toString());
      setStatusSeleccionado(factoring.status);
    } else if (isOpen) {
      // Resetear formulario para nuevo factoring
      setFormData({
        factoring_entities_id: 0,
        cost_center_id: 0,
        interest_rate: 0,
        mount: 0,
        date_factoring: "",
        date_expiration: "",
        payment_status: 0,
        status: "Pendiente"
      });
      setMontoFormateado("");
      setTasaFormateada("");
      setEntitySeleccionada("");
      setCostCenterSeleccionado("");
      setStatusSeleccionado("Pendiente");
      setErrors({});
    }
  }, [factoring, isOpen]);
  
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
  
  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "mount") {
      const numeroLimpio = value.replace(/\D/g, "");
      if (numeroLimpio) {
        const numeroEntero = parseInt(numeroLimpio, 10);
        setMontoFormateado(formatearNumero(numeroEntero));
        setFormData(prev => ({
          ...prev,
          mount: numeroEntero
        }));
      } else {
        setMontoFormateado("");
        setFormData(prev => ({
          ...prev,
          mount: 0
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
            interest_rate: numeroDecimal
          }));
        }
      } else {
        setTasaFormateada("");
        setFormData(prev => ({
          ...prev,
          interest_rate: 0
        }));
      }
    } else if (name === "payment_status") {
      const numeroEntero = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        payment_status: numeroEntero
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
      factoring_entities_id: parseInt(value) || 0
    }));
    
    if (errors.factoring_entities_id) {
      setErrors(prev => ({
        ...prev,
        factoring_entities_id: undefined
      }));
    }
  };
  
  // Manejar cambio en el centro de costo
  const handleCostCenterChange = (value: string) => {
    setCostCenterSeleccionado(value);
    setFormData(prev => ({
      ...prev,
      cost_center_id: parseInt(value) || 0
    }));
    
    if (errors.cost_center_id) {
      setErrors(prev => ({
        ...prev,
        cost_center_id: undefined
      }));
    }
  };

  // Manejar cambio en el status
  const handleStatusChange = (value: string) => {
    setStatusSeleccionado(value);
    setFormData(prev => ({
      ...prev,
      status: value as "Pendiente" | "Girado y no pagado" | "Girado y pagado"
    }));
  };
  
  // Manejar cambio en la fecha de factoring
  const handleDateFactoringChange = (selectedDates: Date[], dateStr: string) => {
    if (selectedDates.length > 0) {
      setFormData(prev => ({
        ...prev,
        date_factoring: dateStr
      }));
      
      if (errors.date_factoring) {
        setErrors(prev => ({
          ...prev,
          date_factoring: undefined
        }));
      }
    }
  };

  // Manejar cambio en la fecha de vencimiento
  const handleDateExpirationChange = (selectedDates: Date[], dateStr: string) => {
    if (selectedDates.length > 0) {
      setFormData(prev => ({
        ...prev,
        date_expiration: dateStr
      }));
      
      if (errors.date_expiration) {
        setErrors(prev => ({
          ...prev,
          date_expiration: undefined
        }));
      }
    }
  };
  
  // Validar el formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrorState = {};
    
    if (!formData.mount) newErrors.mount = "El monto es obligatorio";
    if (!formData.interest_rate && formData.interest_rate !== 0) newErrors.interest_rate = "La tasa de interés es obligatoria";
    if (!formData.date_factoring) newErrors.date_factoring = "La fecha de factoring es obligatoria";
    if (!formData.date_expiration) newErrors.date_expiration = "La fecha de vencimiento es obligatoria";
    if (!formData.factoring_entities_id) newErrors.factoring_entities_id = "La entidad es obligatoria";
    if (!formData.cost_center_id) newErrors.cost_center_id = "El centro de costo es obligatorio";
    if (!formData.status) newErrors.status = "El estado es obligatorio";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar el envío del formulario
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  // Manejar la creación de una nueva entidad
  const handleCreateEntity = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newEntityName.trim()) {
      // No crear entidades vacías
      return;
    }
    
    if (!onCreateEntity) {
      console.error("No se proporcionó la función onCreateEntity");
      return;
    }
    
    try {
      setIsCreatingEntity(true);
      const newEntity = await onCreateEntity(newEntityName);
      
      // Actualizar el selector con la nueva entidad
      setEntitySeleccionada(newEntity.id.toString());
      setFormData(prev => ({
        ...prev,
        factoring_entities_id: newEntity.id
      }));
      
      // Limpiar y cerrar modal
      setNewEntityName("");
      setShowNewEntityModal(false);
    } catch (error) {
      console.error("Error al crear entidad:", error);
      alert("Error al crear la entidad. Inténtelo de nuevo.");
    } finally {
      setIsCreatingEntity(false);
    }
  };
  
  // Crear opciones para los selectores
  const entityOptions = factoringEntities.map(entity => ({
    value: entity.id.toString(),
    label: entity.name
  }));
  
  const costCenterOptions = costCenters.map(cc => ({
    value: cc.id.toString(),
    label: `${cc.code ? cc.code + ' - ' : ''}${cc.name}`
  }));

  const statusOptions = FACTORING_STATUS_OPTIONS.map(option => ({
    value: option.value,
    label: option.label
  }));
  
  // Modal para añadir nueva entidad
  const renderNewEntityModal = () => {
    if (!showNewEntityModal) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60]"
        onClick={() => setShowNewEntityModal(false)}
      >
        <div 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Nueva Entidad de Factoring
          </h3>
          
          <form onSubmit={handleCreateEntity}>
            <div className="mb-4">
              <Label htmlFor="newEntityName">Nombre de la Entidad</Label>
              <Input
                id="newEntityName"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="Ingrese el nombre de la entidad"
                className="w-full"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => setShowNewEntityModal(false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-brand-500 hover:bg-brand-600 text-white"
                disabled={isCreatingEntity || !newEntityName.trim()}
              >
                {isCreatingEntity ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Modal para crear nueva entidad */}
      {renderNewEntityModal()}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {factoring ? 'Editar Factoring' : 'Nuevo Factoring'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Monto */}
            <div>
              <Label htmlFor="mount">Monto *</Label>
              <Input
                id="mount"
                name="mount"
                type="text"
                value={montoFormateado}
                onChange={handleInputChange}
                placeholder="Ingrese el monto"
                className={errors.mount ? "border-red-500" : ""}
              />
              {errors.mount && (
                <span className="text-red-500 text-sm">{errors.mount}</span>
              )}
            </div>

            {/* Tasa de Interés */}
            <div>
              <Label htmlFor="interest_rate">Tasa de Interés (%) *</Label>
              <Input
                id="interest_rate"
                name="interest_rate"
                type="text"
                value={tasaFormateada}
                onChange={handleInputChange}
                placeholder="Ej: 5.5"
                className={errors.interest_rate ? "border-red-500" : ""}
              />
              {errors.interest_rate && (
                <span className="text-red-500 text-sm">{errors.interest_rate}</span>
              )}
            </div>

            {/* Entidad de Factoring */}
            <div>
              <Label htmlFor="factoring_entities_id">Entidad de Factoring *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    options={entityOptions}
                    value={entitySeleccionada}
                    onChange={handleEntityChange}
                    placeholder="Seleccione una entidad"
                    className={errors.factoring_entities_id ? "border-red-500" : ""}
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowNewEntityModal(true);
                  }}
                  className="flex items-center justify-center w-10 h-10 bg-brand-500 hover:bg-brand-600 text-white rounded-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              {errors.factoring_entities_id && (
                <span className="text-red-500 text-sm">{errors.factoring_entities_id}</span>
              )}
            </div>

            {/* Centro de Costo */}
            <div>
              <Label htmlFor="cost_center_id">Centro de Costo *</Label>
              <Select
                options={costCenterOptions}
                value={costCenterSeleccionado}
                onChange={handleCostCenterChange}
                placeholder="Seleccione un centro de costo"
                className={errors.cost_center_id ? "border-red-500" : ""}
              />
              {errors.cost_center_id && (
                <span className="text-red-500 text-sm">{errors.cost_center_id}</span>
              )}
            </div>

            {/* Fecha de Factoring */}
            <div>
              <DatePicker
                id="date_factoring"
                label="Fecha de Factoring *"
                placeholder="Seleccione fecha de factoring"
                defaultDate={formData.date_factoring}
                onChange={handleDateFactoringChange}
                className={errors.date_factoring ? "border-red-500" : ""}
              />
              {errors.date_factoring && (
                <span className="text-red-500 text-sm">{errors.date_factoring}</span>
              )}
            </div>

            {/* Fecha de Vencimiento */}
            <div>
              <DatePicker
                id="date_expiration"
                label="Fecha de Vencimiento *"
                placeholder="Seleccione fecha de vencimiento"
                defaultDate={formData.date_expiration}
                onChange={handleDateExpirationChange}
                className={errors.date_expiration ? "border-red-500" : ""}
              />
              {errors.date_expiration && (
                <span className="text-red-500 text-sm">{errors.date_expiration}</span>
              )}
            </div>

            {/* Payment Status */}
            <div>
              <Label htmlFor="payment_status">Estado de Pago</Label>
              <Input
                id="payment_status"
                name="payment_status"
                type="number"
                value={formData.payment_status.toString()}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="status">Estado *</Label>
              <Select
                options={statusOptions}
                value={statusSeleccionado}
                onChange={handleStatusChange}
                placeholder="Seleccione un estado"
                className={errors.status ? "border-red-500" : ""}
              />
              {errors.status && (
                <span className="text-red-500 text-sm">{errors.status}</span>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white px-6"
            >
              {factoring ? 'Actualizar' : 'Crear'} Factoring
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FactoringModalNew;