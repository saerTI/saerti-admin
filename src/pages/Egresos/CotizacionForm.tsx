import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import gastosApiService, { Cotizacion } from '../../services/gastosService';
import projectApiService from '../../services/projectService';
import Button from '../../components/ui/button/Button';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import InputField from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import TextArea from '../../components/form/input/TextArea';
import Select from '../../components/form/Select';

// Default empty cotizacion
const emptyCotizacion: Omit<Cotizacion, 'id' | 'companyId'> = {
  name: '',
  date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  amount: 0,
  state: 'draft',
  providerId: 0,
  supplierName: '',
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  is_approved: false,
  notes: ''
};

const CotizacionForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const [cotizacion, setCotizacion] = useState<any>(emptyCotizacion);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: number; name: string }[]>([]);

  // Load cotizacion data if editing
  useEffect(() => {
    const fetchCotizacion = async () => {
      if (!isEditing) return;
      
      try {
        setLoading(true);
        const data = await gastosApiService.getCotizacionById(parseInt(id));
        setCotizacion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la cotización');
        console.error('Error fetching cotizacion:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCotizacion();
  }, [id, isEditing]);

  // Load projects and providers for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Load projects
        const projectsData = await projectApiService.getProjects();
        setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));
        
        // Here you would fetch providers - this is a mockup for now
        // In a real implementation, you'd have a service for this
        setProviders([
          { id: 1, name: 'Proveedor A' },
          { id: 2, name: 'Proveedor B' },
          { id: 3, name: 'Proveedor C' },
        ]);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
      }
    };

    fetchDropdownData();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCotizacion({ ...cotizacion, [name]: checked });
    } else if (type === 'number') {
      setCotizacion({ ...cotizacion, [name]: parseFloat(value) || 0 });
    } else {
      setCotizacion({ ...cotizacion, [name]: value });
    }
  };

  // Adapter for TextArea onChange (expects string, not event)
  const handleTextAreaChange = (name: string) => (value: string) => {
    setCotizacion({ ...cotizacion, [name]: value });
  };

  // Adapter for Select onChange (expects string, not event)
  const handleSelectChange = (name: string) => (value: string) => {
    if (name === 'projectId' && value) {
      // For projectId, convert to number if not empty
      setCotizacion({ ...cotizacion, [name]: parseInt(value) });
    } else {
      setCotizacion({ ...cotizacion, [name]: value });
    }
  };

  // Handle provider selection with adapted onChange
  const handleProviderChange = (value: string) => {
    const providerId = parseInt(value);
    const selectedProvider = providers.find(p => p.id === providerId);
    
    setCotizacion({
      ...cotizacion,
      providerId: providerId,
      supplierName: selectedProvider?.name || ''
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      if (isEditing) {
        // Update existing cotizacion
        await gastosApiService.updateCotizacion(parseInt(id), cotizacion);
      } else {
        // Create new cotizacion
        await gastosApiService.createCotizacion(cotizacion);
      }
      
      // Redirect back to list on success
      navigate('/gastos/cotizaciones');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la cotización');
      console.error('Error saving cotizacion:', err);
      setSaving(false);
    }
  };

  // Convert projects array to options format required by Select
  const projectOptions = [
    { value: '', label: 'Sin proyecto' },
    ...projects.map(project => ({ 
      value: String(project.id), 
      label: project.name 
    }))
  ];

  // Convert providers array to options format required by Select
  const providerOptions = [
    { value: '', label: 'Seleccione un proveedor' },
    ...providers.map(provider => ({ 
      value: String(provider.id), 
      label: provider.name 
    }))
  ];

  // Status options for dropdown
  const statusOptions = [
    { value: 'draft', label: 'Borrador' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'rejected', label: 'Rechazado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb pageTitle={isEditing ? 'Editar Cotización' : 'Nueva Cotización'} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
        </h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Nombre / Descripción</Label>
              <InputField
                id="name"
                name="name"
                type="text"
                value={cotizacion.name}
                onChange={handleChange}
                required
                placeholder="Nombre de la cotización"
              />
            </div>

            <div>
              <Label htmlFor="providerId">Proveedor</Label>
              <Select
                options={providerOptions}
                defaultValue={String(cotizacion.providerId) || ''}
                onChange={handleProviderChange}
                placeholder="Seleccione un proveedor"
              />
            </div>

            <div>
              <Label htmlFor="date">Fecha de Cotización</Label>
              <InputField
                id="date"
                name="date"
                type="date"
                value={cotizacion.date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="valid_until">Válida Hasta</Label>
              <InputField
                id="valid_until"
                name="valid_until"
                type="date"
                value={cotizacion.valid_until}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Monto</Label>
              <InputField
                id="amount"
                name="amount"
                type="number"
                step={0.01}
                value={cotizacion.amount}
                onChange={handleChange}
                required
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="projectId">Proyecto (Opcional)</Label>
              <Select
                options={projectOptions}
                defaultValue={cotizacion.projectId ? String(cotizacion.projectId) : ''}
                onChange={handleSelectChange('projectId')}
                placeholder="Sin proyecto"
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Select
                options={statusOptions}
                defaultValue={cotizacion.state}
                onChange={handleSelectChange('state')}
                placeholder="Seleccione un estado"
              />
            </div>

            <div className="flex items-center pt-6">
              <input
                id="is_approved"
                name="is_approved"
                type="checkbox"
                checked={cotizacion.is_approved}
                onChange={(e) => setCotizacion({ ...cotizacion, is_approved: e.target.checked })}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="is_approved" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                Cotización Aprobada
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notas / Observaciones</Label>
            <TextArea
              value={cotizacion.notes || ''}
              onChange={handleTextAreaChange('notes')}
              rows={4}
              placeholder="Añada notas o información adicional sobre esta cotización"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => navigate('/gastos/cotizaciones')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                isEditing ? 'Guardar Cambios' : 'Crear Cotización'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CotizacionForm;