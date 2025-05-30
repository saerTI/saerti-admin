import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import projectApiService, { ProjectCreateData } from '../../services/projectService';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import Button from '../../components/ui/button/Button';
import DatePicker from '../../components/form/date-picker';

// Define interface for clients
interface Client {
  id: number;
  name: string;
}

const ProjectForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<ProjectCreateData>({
    name: '',
    code: '',
    clientId: 0,
    status: 'draft', // Añadido valor por defecto
    startDate: '',
    expectedEndDate: '',
    totalBudget: 0,
    description: '',
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [formattedBudget, setFormattedBudget] = useState<string>('');
  
  // Code validation state
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null);
  
  // Load project data if in edit mode
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const projectId = parseInt(id as string);
        const projectData = await projectApiService.getProjectById(projectId);
        
        // Update form data with project details
        setFormData({
          name: projectData.name,
          code: projectData.code,
          clientId: projectData.client.id,
          startDate: projectData.startDate || '',
          expectedEndDate: projectData.expectedEndDate || '',
          totalBudget: projectData.totalBudget,
          description: projectData.description || '',
          status: projectData.status || 'draft' // Add this line
        });
        
        // Format the budget for display
        setFormattedBudget(formatNumberWithDots(projectData.totalBudget));
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del proyecto');
        console.error('Error loading project data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch clients (this would normally come from an API)
    const fetchClients = async () => {
      try {
        // In a real implementation, fetch clients from your API
        // const clientsData = await clientApiService.getClients();
        
        // For now, using mock data
        const mockClients = [
          { id: 1, name: 'Constructora Santiago S.A.' },
          { id: 2, name: 'Inmobiliaria Los Andes' },
          { id: 3, name: 'Desarrollo Urbano Ltda.' }
        ];
        
        setClients(mockClients);
      } catch (err) {
        console.error('Error loading clients:', err);
      }
    };
    
    fetchProjectData();
    fetchClients();
  }, [id, isEditMode]);

    
  // Código para validar el código del proyecto
  const validateCode = useCallback(
    async (code: string) => {
      if (!code || code.length < 3 || isEditMode) {
        setCodeError(null);
        setCodeAvailable(null);
        return;
      }

      setCodeValidating(true);
      try {
        // Validación local básica
        const regex = /^[a-zA-Z0-9-_]+$/;
        if (!regex.test(code)) {
          setCodeError('El código solo puede contener letras, números, guiones y guiones bajos');
          setCodeAvailable(false);
          return;
        }

        // Validación en el servidor
        const result = await projectApiService.checkCodeAvailability(code);
        setCodeAvailable(result.available);
        if (!result.available) {
          setCodeError(result.message || 'Este código ya está en uso');
        } else {
          setCodeError(null);
        }
      } catch (err) {
        console.error('Error validating code:', err);
        setCodeError('Error al validar el código');
        setCodeAvailable(false);
      } finally {
        setCodeValidating(false);
      }
    },
    [isEditMode]
  );

  // Efecto para validar el código cuando cambia
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (formData.code && formData.code.length >= 3) {
  //       validateCode(formData.code);
  //     } else {
  //       setCodeError(null);
  //       setCodeAvailable(null);
  //     }
  //   }, 500); // Debounce de 500ms

  //   return () => clearTimeout(timer);
  // }, [formData.code, validateCode]);
  
  // Format a number with dot thousand separators (123456 -> 123.456)
  const formatNumberWithDots = (number: number): string => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  
  // Remove all non-digit characters and parse to number
  const parseFormattedNumber = (formattedValue: string): number => {
    const numericValue = formattedValue.replace(/\D/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'totalBudget') {
      // For budget field, handle formatting
      const numericValue = parseFormattedNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      setFormattedBudget(formatNumberWithDots(numericValue));
    } else if (name === 'clientId') {
      // For clientId, parse to number
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      // For other fields, use value as is
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle budget input change
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Remove all non-digit characters
    const digitsOnly = rawValue.replace(/\D/g, '');
    
    // Parse to number
    const numericValue = digitsOnly ? parseInt(digitsOnly, 10) : 0;
    
    // Update the form data with the numeric value
    setFormData(prev => ({
      ...prev,
      totalBudget: numericValue
    }));
    
    // Format for display
    setFormattedBudget(formatNumberWithDots(numericValue));
  };

  // Handle date changes
  const handleDateChange = (name: string) => (selectedDates: Date[], dateStr: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateStr
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form data
    if (!formData.name || !formData.code || !formData.clientId || formData.totalBudget <= 0) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    
    // Evitar envío si el código está siendo validado o no está disponible
    if (!isEditMode && (codeValidating || codeAvailable === false)) {
      setError('Por favor corrija los errores del código del proyecto antes de continuar');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isEditMode) {
        // Update existing project
        await projectApiService.updateProject(parseInt(id as string), formData);
      } else {
        // Create new project
        const projectId = await projectApiService.createProject(formData);
        console.log('Project created successfully with ID:', projectId);
      }
      
      // Navigate back to projects list
      navigate('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el proyecto');
      console.error('Error saving project:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          {isEditMode ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div className="col-span-2">
              <Label htmlFor="name">
                Nombre del Proyecto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Edificio Residencial Aurora"
                required
              />
            </div>
            
            {/* Project Code */}
            <div>
              <Label htmlFor="code">
                Código <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Ej: ERA-2023-01"
                  className={`${codeError ? "border-red-500" : codeAvailable ? "border-green-500" : ""}`}
                  required
                />
                {codeValidating && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-blue-500 rounded-full"></div>
                  </div>
                )}
                {!codeValidating && codeAvailable && formData.code && (
                  <div className="absolute right-3 top-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              {codeError && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{codeError}</span>
                </div>
              )}
              {!codeValidating && codeAvailable && !codeError && formData.code && (
                <div className="text-green-500 text-sm mt-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Código disponible</span>
                </div>
              )}
            </div>
            
            {/* Client */}
            <div>
              <Label htmlFor="clientId">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                className="h-11 w-full rounded-lg border border-gray-300 appearance-none px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                required
              >
                <option value="">Seleccione un cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Start Date */}
            <div>
              <DatePicker
                id="startDate"
                label="Fecha de Inicio"
                placeholder="Seleccione fecha de inicio"
                defaultDate={formData.startDate ? new Date(formData.startDate) : undefined}
                onChange={handleDateChange('startDate')}
              />
            </div>
            
            {/* Expected End Date */}
            <div>
              <DatePicker
                id="expectedEndDate"
                label="Fecha de Finalización Esperada"
                placeholder="Seleccione fecha de finalización"
                defaultDate={formData.expectedEndDate ? new Date(formData.expectedEndDate) : undefined}
                onChange={handleDateChange('expectedEndDate')}
              />
            </div>
            
            {/* Budget */}
            <div>
              <Label htmlFor="totalBudget">
                Presupuesto Total <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="totalBudget"
                name="totalBudget"
                value={formattedBudget}
                onChange={handleBudgetChange}
                placeholder="Ej: 50.000.000"
                required
              />
            </div>
            
            {/* Description */}
            <div className="col-span-2">
              <Label htmlFor="description">
                Descripción
              </Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-lg border border-gray-300 appearance-none px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                placeholder="Descripción detallada del proyecto"
              />
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              onClick={() => navigate('/projects')}
              variant="outline"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white"
              disabled={submitting || (!isEditMode && (codeValidating || codeAvailable === false))}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar Proyecto'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;