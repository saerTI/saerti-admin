import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GastoFilter } from '../../services/gastosService';
import Button from '../../components/ui/button/Button';
import { formatCurrency, formatDate, formatDisplayName } from '../../utils/formatters';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';
import MultiSelect from '../../components/form/MultiSelect';
import { Project } from '../../types/project';
import { Previsional, PrevisionalCreateData } from '../../types/CC/previsional';
import SimpleResponsiveTable from '../../components/tables/SimpleResponsiveTable';

// Importar servicios y utilidades
import { 
  getPrevisionales, 
  deletePrevisional, 
  createPrevisional 
} from '../../services/CC/previsionalesService';
import { getProjects } from '../../services/projectService'; // Fixed: projectService instead of projectsService
import { handlePrevisionalExcelUpload } from '../../utils/previsionalUtils'; // Use specialized function for previsionales
import NuevaPrevisionalModal from '../../components/egresos/NuevaPrevisionalModal';

// Status translation and styling
const GASTO_STATUS_MAP: Record<string, { label: string, color: BadgeColor }> = {
  'draft': { label: 'Borrador', color: 'warning' },
  'pending': { label: 'Pendiente', color: 'warning' },
  'approved': { label: 'Aprobado', color: 'success' },
  'rejected': { label: 'Rechazado', color: 'error' },
  'paid': { label: 'Pagado', color: 'success' },
  'cancelled': { label: 'Cancelado', color: 'error' }
};

const Previsionales = () => {
  const [previsionales, setPrevisionales] = useState<Previsional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GastoFilter>({});
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const navigate = useNavigate();
  
  // Estado para controlar la visibilidad del modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  
  // Lista de proyectos para el modal
  const [projects, setProjects] = useState<Project[]>([]);

  // Estado para el dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Cargar previsionales y proyectos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar previsionales - modified to match your API
        const previsionalesData = await getPrevisionales(filters);
        
        // Filter by periods manually if needed
        const filteredData = selectedPeriods.length > 0 
          ? previsionalesData.filter(prev => selectedPeriods.includes(prev.period))
          : previsionalesData;
          
        setPrevisionales(filteredData);
        
        // Cargar proyectos desde el servicio real
        const projectsData = await getProjects();
        setProjects(projectsData);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, selectedPeriods]);

  // Manejador para cargar archivo Excel
  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      
      // Procesar el archivo Excel utilizando la utilidad específica para previsionales
      const nuevosPrevisionales = await handlePrevisionalExcelUpload(file);
      
      // Actualizar el estado con los nuevos previsionales
      setPrevisionales(prev => [...nuevosPrevisionales, ...prev]);
      
      // Mostrar mensaje de éxito
      alert(`Se importaron ${nuevosPrevisionales.length} registros correctamente`);
    } catch (error) {
      console.error("Error al procesar el archivo:", error);
      alert(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Verifique el formato e intente nuevamente'}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejador para eliminar previsional
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este previsional? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Llamar al servicio para eliminar
      await deletePrevisional(id);
      
      // Actualizar el estado local
      setPrevisionales(previsionales.filter(item => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el previsional');
      console.error('Error deleting previsional:', err);
    }
  };

  // Manejador para filtros
  const handleFilterChange = (filterName: keyof GastoFilter) => (value: string) => {
    if (value === '') {
      // Remove the filter if empty value
      const newFilters = { ...filters };
      delete newFilters[filterName];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [filterName]: value });
    }
  };

  // Funciones para el modal
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // Manejador para crear nuevo previsional
  const handleSubmitPrevisional = async (formData: PrevisionalCreateData) => {
    try {
      // Llamar al servicio para crear previsional
      const createdId = await createPrevisional(formData);
      
      // Si createPrevisional solo devuelve un ID, construimos un objeto temporal para la UI
      // hasta que se recarguen los datos
      const project = projects.find(p => p.id.toString() === formData.proyectoId);
      
      // Crear un objeto temporal con los datos del formulario y el ID devuelto
      const newPrevisional: Previsional = {
        id: createdId as number,
        name: formData.nombre,
        employeeName: formData.nombre,
        employeeRut: formData.rut,
        type: formData.tipo,
        amount: formData.monto,
        date: formData.fecha,
        period: formData.fecha.substring(0, 7).replace('-', '/'),
        state: formData.estado || 'pending',
        companyId: 1, // Default company ID
        employeeId: 0, // Placeholder
        projectId: project?.id,
        projectName: project?.name,
        projectCode: project?.code,
        area: formData.area || '',
        centroCosto: formData.centroCosto || '',
        centroCostoNombre: '',
        descuentosLegales: 0,
        notes: formData.notas || ''
      };
      
      // Actualizar el estado local con el nuevo previsional
      setPrevisionales(prev => [newPrevisional, ...prev]);
      
      // Cerrar el modal
      closeModal();
      
      // Mostrar mensaje de éxito
      alert("Previsional creado con éxito");
    } catch (err) {
      console.error("Error al crear previsional:", err);
      alert("Error al crear el previsional. Por favor, inténtelo de nuevo.");
    }
  };

  // Calcular totales para el resumen
  const totalAmount = previsionales.reduce((sum, prev) => sum + prev.amount, 0);
  const pendingCount = previsionales.filter(prev => prev.state === 'pending').length;
  const approvedAmount = previsionales
    .filter(prev => prev.state === 'approved' || prev.state === 'paid')
    .reduce((sum, prev) => sum + prev.amount, 0);
    
  // Obtener períodos únicos para multi-select
  const uniquePeriods = [...new Set(previsionales.map(p => p.period))];
  const periodOptions = uniquePeriods.map(period => ({
    value: period,
    text: `${period.split('/')[0] === '01' ? 'Enero' : 
           period.split('/')[0] === '02' ? 'Febrero' :
           period.split('/')[0] === '03' ? 'Marzo' :
           period.split('/')[0] === '04' ? 'Abril' :
           period.split('/')[0] === '05' ? 'Mayo' :
           period.split('/')[0] === '06' ? 'Junio' :
           period.split('/')[0] === '07' ? 'Julio' :
           period.split('/')[0] === '08' ? 'Agosto' :
           period.split('/')[0] === '09' ? 'Septiembre' :
           period.split('/')[0] === '10' ? 'Octubre' :
           period.split('/')[0] === '11' ? 'Noviembre' : 'Diciembre'} ${period.split('/')[1]}`,
    selected: false
  }));
  
  // Opciones para filtros
  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'AFP', label: 'AFP' },
    { value: 'Isapre', label: 'Isapre' },
    { value: 'Isapre 7%', label: 'Isapre 7%' },
    { value: 'Seguro Cesantía', label: 'Seguro Cesantía' },
    { value: 'Mutual', label: 'Mutual' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'paid', label: 'Pagado' }
  ];

  const areaOptions = [
    { value: '', label: 'Todas las áreas' },
    { value: 'Administración', label: 'Administración' },
    { value: 'Operaciones', label: 'Operaciones' },
    { value: 'Ventas', label: 'Ventas' },
    { value: 'Producción', label: 'Producción' },
    { value: 'Finanzas', label: 'Finanzas' },
    { value: 'Logística', label: 'Logística' }
  ];

  const projectOptions = [
    { value: '', label: 'Todos los proyectos' },
    ...projects.map(project => ({
      value: project.id.toString(),
      label: project.name
    }))
  ];

  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb pageTitle="Previsionales" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-6">
        <ComponentCard title='Total Previsionales'>
          <h3 className="mt-1 text-2xl font-bold text-brand-500">{formatCurrency(totalAmount)}</h3>
        </ComponentCard>
        
        <ComponentCard title='Pendientes'>
          <h3 className="mt-1 text-2xl font-bold text-yellow-500">{pendingCount}</h3>
        </ComponentCard>
        
        <ComponentCard title='Pagado'>
          <h3 className="mt-1 text-2xl font-bold text-green-500">{formatCurrency(approvedAmount)}</h3>
        </ComponentCard>
      </div>

      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Previsionales</h1>
          <div className="relative" ref={dropdownRef}>
            <Button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-2"
            >
              <span>Nuevo Previsional</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
        
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 z-10 border border-gray-200 dark:border-gray-700">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      openModal();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Ingresar manualmente
                  </button>
                  
                  <label className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Importar desde Excel
                    <input 
                      type="file" 
                      className="sr-only"
                      onChange={(event) => {
                        if (event.target.files && event.target.files[0]) {
                          setDropdownOpen(false);
                          handleFileUpload(event.target.files[0]);
                        }
                      }}
                      accept=".xlsx,.xls,.csv"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Modal de Nuevo Previsional */}
      <NuevaPrevisionalModal 
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitPrevisional}
        projects={projects}
      />

      {/* Filters */}
      <ComponentCard title="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <Label>Estado</Label>
            <Select
              options={statusOptions}
              placeholder="Seleccione Estado"
              onChange={handleFilterChange('state')}
              className="dark:bg-gray-900"
            />
          </div>
          
          <div>
            <Label>Tipo</Label>
            <Select
              options={typeOptions}
              placeholder="Seleccione Tipo"
              onChange={handleFilterChange('category')}
              className="dark:bg-gray-900"
            />
          </div>
          
          <div>
            <MultiSelect
              label="Períodos"
              placeholder="Seleccione períodos"
              options={periodOptions}
              defaultSelected={[]}
              onChange={(values) => setSelectedPeriods(values)}
            />
          </div>

          <div>
            <Label>Área</Label>
            <Select
              options={areaOptions}
              placeholder="Seleccione Área"
              onChange={handleFilterChange('area')}
              className="dark:bg-gray-900"
            />
          </div>
          
          <div>
            <Label htmlFor="projectId">Proyecto</Label>
            <Select
              options={projectOptions}
              defaultValue={filters.projectId ? String(filters.projectId) : ''}
              onChange={handleFilterChange('projectId')}
              placeholder="Seleccione proyecto"
            />
          </div>
        </div>
      </ComponentCard>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        /* Table Component usando SimpleResponsiveTable mejorado */
        <SimpleResponsiveTable 
          hasData={previsionales.length > 0}
          emptyMessage="No se encontraron previsionales con los filtros seleccionados."
          enableSmoothScroll={true}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* Primera columna con clase sticky */}
                <th className="sticky-first-column px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  RUT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descuentos Legales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Centro Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {previsionales.map((prev) => {
                const nombres = prev.employeeName.split(' ').filter(n => n.length > 0);
                const primerNombre = nombres[0] || '';
                const apellidoPaterno = nombres[nombres.length - 1] || '';
                const nombreParaAvatar = primerNombre === apellidoPaterno ? primerNombre : `${primerNombre} ${apellidoPaterno}`;
                
                return (
                  <tr key={prev.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    {/* Primera columna con clase sticky */}
                    <td className="sticky-first-column px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 overflow-hidden rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm flex-shrink-0">
                          {primerNombre.charAt(0).toUpperCase()}{apellidoPaterno.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link 
                            to={`/gastos/previsionales/${prev.id}`}
                            className="block font-medium text-gray-800 dark:text-white/90 hover:text-brand-500 truncate"
                          >
                            {nombreParaAvatar}
                          </Link>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {prev.employeeRut || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {prev.type}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right dark:text-gray-100 font-semibold">
                      {formatCurrency(prev.amount)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right dark:text-gray-100">
                      {prev.descuentosLegales ? formatCurrency(prev.descuentosLegales) : '-'}
                    </td>
                                              
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {prev.area || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {prev.centroCosto ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-500">
                            {prev.centroCosto}
                          </span>
                          {prev.centroCostoNombre && prev.centroCostoNombre.trim() !== '' && prev.centroCostoNombre !== prev.centroCosto && (
                            <span className="text-xs text-gray-500 truncate max-w-[150px]">
                              {prev.centroCostoNombre}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {prev.period}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        size="sm"
                        color={GASTO_STATUS_MAP[prev.state]?.color || 'secondary'}
                      >
                        {GASTO_STATUS_MAP[prev.state]?.label || prev.state}
                      </Badge>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        <Link 
                          to={`/gastos/previsionales/${prev.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm px-2 py-1"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(prev.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm px-2 py-1"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SimpleResponsiveTable>
      )}
    </div>
  );
};

export default Previsionales;