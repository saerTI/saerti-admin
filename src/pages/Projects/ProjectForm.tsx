// src/components/projects/ProjectForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import projectApiService, { ProjectCreateData } from '../../services/projectService';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import Button from '../../components/ui/button/Button';

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
    client_id: 0,
    start_date: '',
    expected_end_date: '',
    total_budget: 0,
    description: '',
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  
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
          client_id: projectData.client.id,
          start_date: projectData.start_date || '',
          expected_end_date: projectData.expected_end_date || '',
          total_budget: projectData.total_budget,
          description: projectData.description || '',
        });
        
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
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_budget' || name === 'client_id' ? parseFloat(value) || 0 : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form data
    if (!formData.name || !formData.code || !formData.client_id || formData.total_budget <= 0) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isEditMode) {
        // Update existing project
        await projectApiService.updateProject(parseInt(id as string), formData);
      } else {
        // Create new project
        await projectApiService.createProject(formData);
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
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
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
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Ej: ERA-2023-01"
                required
              />
            </div>
            
            {/* Client */}
            <div>
              <Label htmlFor="client_id">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              <Label htmlFor="start_date">
                Fecha de Inicio
              </Label>
              <Input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
              />
            </div>
            
            {/* Expected End Date */}
            <div>
              <Label htmlFor="expected_end_date">
                Fecha de Finalización Esperada
              </Label>
              <Input
                type="date"
                id="expected_end_date"
                name="expected_end_date"
                value={formData.expected_end_date}
                onChange={handleInputChange}
              />
            </div>
            
            {/* Budget */}
            <div>
              <Label htmlFor="total_budget">
                Presupuesto Total <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                id="total_budget"
                name="total_budget"
                value={formData.total_budget}
                onChange={handleInputChange}
                min="0"
                step={1000}
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
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Descripción detallada del proyecto"
              />
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              onClick={() => navigate('/projects')}
              variant="outline"  // Change from "secondary" to "outline"
              disabled={submitting}
              >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white"
              disabled={submitting}
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