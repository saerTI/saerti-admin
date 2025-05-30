import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import gastosApiService, { Previsional } from '../../services/gastosService';
import Button from '../../components/ui/button/Button';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import InputField from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import TextArea from '../../components/form/input/TextArea';
import Select from '../../components/form/Select';

// Default empty previsional
const emptyPrevisional: Omit<Previsional, 'id' | 'companyId'> = {
  name: '',
  date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  amount: 0,
  state: 'draft',
  employee_id: 0,
  employeeName: '',
  period: new Date().getMonth() + 1 + '/' + new Date().getFullYear(),
  type: '',
  notes: ''
};

const PrevisionalForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const [previsional, setPrevisional] = useState<any>(emptyPrevisional);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);

  // Load previsional data if editing
  useEffect(() => {
    const fetchPrevisional = async () => {
      if (!isEditing) return;
      
      try {
        setLoading(true);
        // In a real app, this would fetch from API
        // const data = await gastosApiService.getPrevisionalById(parseInt(id));
        // For now, we'll use mock data
        const data = getMockPrevisional(parseInt(id));
        setPrevisional(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el registro previsional');
        console.error('Error fetching previsional:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrevisional();
  }, [id, isEditing]);

  // Mock data function
  const getMockPrevisional = (id: number): Previsional => {
    return {
      id,
      name: `Previsional ${id}`,
      employee_id: 100 + id,
      employeeName: `Empleado ${100 + id}`,
      period: `${Math.floor(Math.random() * 12) + 1}/2023`,
      type: ['AFP', 'Isapre', 'Seguro Cesantía', 'Mutual'][Math.floor(Math.random() * 4)],
      date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      amount: Math.floor(Math.random() * 500000) + 100000,
      state: ['draft', 'pending', 'approved', 'paid', 'rejected'][Math.floor(Math.random() * 5)],
      projectId: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : undefined,
      projectName: Math.random() > 0.3 ? `Proyecto ${Math.floor(Math.random() * 5) + 1}` : undefined,
      companyId: 1,
      notes: Math.random() > 0.7 ? `Notas para previsional ${id}` : ''
    };
  };

  // Load projects and employees for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // In a real app, these would be API calls
        // const projectsData = await projectApiService.getProjects();
        // setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));
        
        // Mock data for demonstration
        setProjects([
          { id: 1, name: 'Proyecto A' },
          { id: 2, name: 'Proyecto B' },
          { id: 3, name: 'Proyecto C' },
          { id: 4, name: 'Proyecto D' },
          { id: 5, name: 'Proyecto E' },
        ]);
        
        setEmployees([
          { id: 101, name: 'Empleado 101' },
          { id: 102, name: 'Empleado 102' },
          { id: 103, name: 'Empleado 103' },
          { id: 104, name: 'Empleado 104' },
          { id: 105, name: 'Empleado 105' },
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
      setPrevisional({ ...previsional, [name]: checked });
    } else if (type === 'number') {
      setPrevisional({ ...previsional, [name]: parseFloat(value) || 0 });
    } else {
      setPrevisional({ ...previsional, [name]: value });
    }
  };

  // Adapter for TextArea onChange (expects string, not event)
  const handleTextAreaChange = (name: string) => (value: string) => {
    setPrevisional({ ...previsional, [name]: value });
  };

  // Adapter for Select onChange (expects string, not event)
  const handleSelectChange = (name: string) => (value: string) => {
    if (name === 'projectId' && value) {
      // For projectId, convert to number if not empty
      setPrevisional({ ...previsional, [name]: parseInt(value) });
    } else {
      setPrevisional({ ...previsional, [name]: value });
    }
  };

  // Handle employee selection with adapted onChange
  const handleEmployeeChange = (value: string) => {
    const employeeId = parseInt(value);
    const selectedEmployee = employees.find(e => e.id === employeeId);
    
    setPrevisional({
      ...previsional,
      employee_id: employeeId,
      employeeName: selectedEmployee?.name || ''
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // In a real app, these would be API calls
      if (isEditing) {
        // await gastosApiService.updatePrevisional(parseInt(id), previsional);
        console.log('Updating previsional:', previsional);
      } else {
        // await gastosApiService.createPrevisional(previsional);
        console.log('Creating previsional:', previsional);
      }
      
      // For demo purposes, just wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect back to list on success
      navigate('/gastos/previsionales');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el registro');
      console.error('Error saving previsional:', err);
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

  // Convert employees array to options format required by Select
  const employeeOptions = [
    { value: '', label: 'Seleccione un empleado' },
    ...employees.map(employee => ({ 
      value: String(employee.id), 
      label: employee.name 
    }))
  ];

  // Status options for dropdown
  const statusOptions = [
    { value: 'draft', label: 'Borrador' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'rejected', label: 'Rechazado' },
    { value: 'paid', label: 'Pagado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  // Previsional type options
  const typeOptions = [
    { value: '', label: 'Seleccione un tipo' },
    { value: 'AFP', label: 'AFP' },
    { value: 'Isapre', label: 'Isapre' },
    { value: 'Seguro Cesantía', label: 'Seguro Cesantía' },
    { value: 'Mutual', label: 'Mutual' }
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
      <PageBreadcrumb pageTitle={isEditing ? 'Editar Previsional' : 'Nuevo Previsional'} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {isEditing ? 'Editar Previsional' : 'Nuevo Previsional'}
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
              <Label htmlFor="name">Descripción</Label>
              <InputField
                id="name"
                name="name"
                type="text"
                value={previsional.name}
                onChange={handleChange}
                required
                placeholder="Descripción del pago previsional"
              />
            </div>

            <div>
              <Label htmlFor="employee_id">Empleado</Label>
              <Select
                options={employeeOptions}
                defaultValue={String(previsional.employee_id) || ''}
                onChange={handleEmployeeChange}
                placeholder="Seleccione un empleado"
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo de Previsional</Label>
              <Select
                options={typeOptions}
                defaultValue={previsional.type}
                onChange={handleSelectChange('type')}
                placeholder="Seleccione un tipo"
              />
            </div>

            <div>
              <Label htmlFor="period">Periodo</Label>
              <InputField
                id="period"
                name="period"
                type="text"
                value={previsional.period}
                onChange={handleChange}
                required
                placeholder="MM/YYYY"
              />
            </div>

            <div>
              <Label htmlFor="date">Fecha de Pago</Label>
              <InputField
                id="date"
                name="date"
                type="date"
                value={previsional.date}
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
                value={previsional.amount}
                onChange={handleChange}
                required
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="projectId">Proyecto (Opcional)</Label>
              <Select
                options={projectOptions}
                defaultValue={previsional.projectId ? String(previsional.projectId) : ''}
                onChange={handleSelectChange('projectId')}
                placeholder="Sin proyecto"
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Select
                options={statusOptions}
                defaultValue={previsional.state}
                onChange={handleSelectChange('state')}
                placeholder="Seleccione un estado"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notas / Observaciones</Label>
            <TextArea
              value={previsional.notes || ''}
              onChange={handleTextAreaChange('notes')}
              rows={4}
              placeholder="Añada notas o información adicional sobre este pago previsional"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => navigate('/gastos/previsionales')}
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
                isEditing ? 'Guardar Cambios' : 'Crear Previsional'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrevisionalForm;