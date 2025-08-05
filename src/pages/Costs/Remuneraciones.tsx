import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RemuneracionFilter } from '../../types/CC/remuneracion';
import Button from '../../components/ui/button/Button';
import { formatCurrency } from '../../utils/formatters';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';
import { Project } from '../../types/project';
import { Remuneracion, RemuneracionCreateData } from '../../types/CC/remuneracion';
import NuevaRemuneracionModal from '../../components/CC/NuevaRemuneracionModal';

// Importar servicios y utilidades
import { 
  deleteRemuneracion, 
  createRemuneracion 
} from '../../services/CC/remuneracionesService';
import { getProjects } from '../../services/projectService';
import SimpleResponsiveTable from '../../components/tables/SimpleResponsiveTable';
import { handleRemuneracionExcelUpload } from '../../utils/remuneracionUtils';

// Hook personalizado para búsqueda y paginación
import { useRemuneracionesSearch } from '../../hooks/useRemuneracionesSearch';

// Hook para debounce
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Status translation and styling
const GASTO_STATUS_MAP: Record<string, { label: string, color: BadgeColor }> = {
  'draft': { label: 'Borrador', color: 'warning' },
  'pending': { label: 'Pendiente', color: 'warning' },
  'approved': { label: 'Aprobado', color: 'success' },
  'rejected': { label: 'Rechazado', color: 'error' },
  'paid': { label: 'Pagado', color: 'success' },
  'cancelled': { label: 'Cancelado', color: 'error' }
};

const Remuneraciones = () => {
  const navigate = useNavigate();
  
  // 🆕 Usar el hook personalizado para búsqueda y paginación
  const {
    remuneraciones,
    loading,
    error: searchError,
    pagination,
    filters,
    stats,
    searchByText,
    updateFilter,
    clearFilters,
    goToPage,
    nextPage,
    prevPage,
    changePerPage,
    refresh
  } = useRemuneracionesSearch({
    initialPageSize: 25, // 🔥 Establecer 25 como default
    autoLoad: true       // 🔥 Cargar automáticamente al iniciar
  });

  // Estados locales
  const [searchInput, setSearchInput] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Referencias
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🆕 Debounce para búsqueda en tiempo real
  const debouncedSearch = useDebounce(searchInput, 500);

  // 🆕 Ejecutar búsqueda cuando cambie el valor debounced
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      searchByText(debouncedSearch);
    }
  }, [debouncedSearch, filters.search, searchByText]);

  // Manejar cambio en input de búsqueda
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  // Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchInput('');
    searchByText('');
  }, [searchByText]);

  // Función para obtener el rango de páginas (copiada de OrdenesCompra)
  const getPaginationRange = () => {
    if (!pagination) return [];
    
    const { current_page, total_pages } = pagination;
    
    // 🔥 Si total_pages es null, 0 o 1, devolver array con solo 1
    if (!total_pages || total_pages <= 1) {
      return [1];
    }
    
    const delta = 2;
    const range = [];
    
    for (let i = Math.max(2, current_page - delta); 
         i <= Math.min(total_pages - 1, current_page + delta); 
         i++) {
      range.push(i);
    }
    
    if (current_page - delta > 2) {
      range.unshift("...");
    }
    if (current_page + delta < total_pages - 1) {
      range.push("...");
    }
    
    range.unshift(1);
    if (total_pages !== 1) {
      range.push(total_pages);
    }
    
    return range;
  };

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

  // Cargar proyectos al montar el componente
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // TODO: Cargar proyectos cuando se implemente la funcionalidad
        // const projectsData = await getProjects();
        // setProjects(projectsData);
        setProjects([]); // TEMPORAL: Lista vacía
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };

    fetchProjects();
  }, []);

  // Manejador para cargar archivo Excel
  const handleFileUpload = async (file: File) => {
    try {
      setLocalError(null);
      
      // Procesar el archivo Excel utilizando la utilidad específica para remuneraciones
      const nuevasRemuneraciones = await handleRemuneracionExcelUpload(file);
      
      if (nuevasRemuneraciones.length > 0) {
        // Refrescar los datos
        refresh();
        
        // Mostrar mensaje de éxito
        alert(`Se importaron ${nuevasRemuneraciones.length} registros correctamente`);
      } else {
        alert('No se pudieron importar registros. Verifique el formato del archivo.');
      }
    } catch (error) {
      console.error("Error al procesar el archivo:", error);
      const errorMessage = error instanceof Error ? error.message : 'Verifique el formato e intente nuevamente';
      setLocalError(`Error al procesar el archivo: ${errorMessage}`);
      alert(`Error al procesar el archivo: ${errorMessage}`);
    }
  };

  // Manejador para eliminar remuneración
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar esta remuneración? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Llamar al servicio para eliminar
      await deleteRemuneracion(id);
      
      // Refrescar los datos
      refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la remuneración';
      setLocalError(errorMessage);
      alert(errorMessage);
      console.error('Error deleting remuneración:', err);
    }
  };

  // Funciones para el modal
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // Manejador para crear nueva remuneración
  const handleSubmitRemuneracion = async (formData: RemuneracionCreateData) => {
    try {
      setLocalError(null);
      
      // Debug - log the data being sent
      console.log('Submitting to createRemuneracion:', formData);
      
      // Llamar al servicio para crear remuneración
      const createdId = await createRemuneracion(formData);
      
      // Debug - log the response
      console.log('Created remuneración with ID:', createdId);
      
      // Cerrar el modal
      closeModal();
      
      // Refrescar los datos
      refresh();
      
      // Mostrar mensaje de éxito
      alert("Remuneración creada con éxito");
    } catch (err) {
      console.error("Error al crear remuneración:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al crear la remuneración. Por favor, inténtelo de nuevo.";
      setLocalError(errorMessage);
      alert(errorMessage);
    }
  };

  // 🆕 Obtener períodos únicos para multi-select
  const uniquePeriods = [...new Set(remuneraciones.map(r => r.period))];
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
    selected: selectedPeriods.includes(period)
  }));
  
  // Opciones para filtros
  const positionOptions = [
    { value: '', label: 'Todos los cargos' },
    { value: 'Obrero', label: 'Obrero' },
    { value: 'Capataz', label: 'Capataz' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Técnico', label: 'Técnico' },
    { value: 'Ingeniero', label: 'Ingeniero' },
    { value: 'Administrativo', label: 'Administrativo' },
    { value: 'No especificado', label: 'No especificado' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'paid', label: 'Pagado' }
  ];

  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'REMUNERACION', label: 'Remuneración' },
    { value: 'ANTICIPO', label: 'Anticipo' }
  ];

  // TODO: Cuando se implemente proyectos, usar projects reales
  const projectOptions = [
    { value: '', label: 'Todos los proyectos' }
  ];

  // Combinar errores
  const displayError = searchError || localError;

  return (
    <div className="container px-4 py-6 mx-auto">
      <PageBreadcrumb pageTitle="Remuneraciones" />

      {/* 🆕 Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-6">
        <ComponentCard title='Total Remuneraciones'>
          <h3 className="mt-1 text-2xl font-bold text-brand-500">
            {formatCurrency(stats.total_remuneraciones)}
          </h3>
        </ComponentCard>
        
        <ComponentCard title='Total Anticipos'>
          <h3 className="mt-1 text-2xl font-bold text-purple-500">
            {formatCurrency(stats.total_anticipos)}
          </h3>
        </ComponentCard>
        
        <ComponentCard title='Pendientes'>
          <h3 className="mt-1 text-2xl font-bold text-yellow-500">{stats.pending}</h3>
        </ComponentCard>
        
        <ComponentCard title='Pagados'>
          <h3 className="mt-1 text-2xl font-bold text-green-500">{stats.paid}</h3>
        </ComponentCard>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Remuneraciones</h1>
        <div className="relative" ref={dropdownRef}>
          <Button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-2"
          >
            <span>Nueva Remuneración</span>
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

      {/* Modal de Nueva Remuneración */}
      <NuevaRemuneracionModal 
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitRemuneracion}
        projects={projects}
      />

      {/* 🆕 Barra de búsqueda y filtros mejorada */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-6">
          {/* Filtros en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</Label>
              <Select
                options={statusOptions}
                placeholder="Todos los estados"
                onChange={(value) => updateFilter('state', value)}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo</Label>
              <Select
                options={typeOptions}
                placeholder="Todos los tipos"
                onChange={(value) => updateFilter('type', value)}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cargo</Label>
              <Select
                options={positionOptions}
                placeholder="Todos los cargos"
                onChange={(value) => updateFilter('employeePosition', value)}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Área</Label>
              <input
                type="text"
                placeholder="Filtrar por área..."
                value={filters.area || ''}
                onChange={(e) => updateFilter('area', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Controles inferiores */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex gap-2">
              <div className="relative max-w-md">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre o RUT..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                {searchInput && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {loading && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Limpiar filtros
              </button>
              <button
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {displayError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-100">
          {displayError}
        </div>
      )}

      {/* Loading indicator */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          <span className="ml-4 text-gray-600 dark:text-gray-400">Cargando remuneraciones...</span>
        </div>
      ) : remuneraciones.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No se encontraron remuneraciones con los criterios de búsqueda.</p>
        </div>
      ) : (
        /* Table Component usando SimpleResponsiveTable mejorado */
        <SimpleResponsiveTable 
          hasData={remuneraciones.length > 0}
          emptyMessage="No se encontraron remuneraciones con los filtros seleccionados."
          enableSmoothScroll={true}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="sticky-first-column px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  RUT
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Remuneración
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Anticipo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
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
              {remuneraciones.map((rem, index) => {
                const nombres = (rem.employeeName || '').split(' ').filter(n => n.length > 0);
                const primerNombre = nombres[0] || '';
                const apellidoPaterno = nombres[nombres.length - 1] || '';
                const nombreParaAvatar = primerNombre === apellidoPaterno ? primerNombre : `${primerNombre} ${apellidoPaterno}`;
                
                // Determinar el tipo basado en los valores
                const tipo = (rem.sueldoLiquido && rem.sueldoLiquido > 0) ? 'REMUNERACION' : 'ANTICIPO';
                
                // Key único usando ID y index para evitar duplicados
                const uniqueKey = `rem-${rem.id}-${index}`;
                
                return (
                  <tr key={uniqueKey} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <td className="sticky-first-column px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 overflow-hidden rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm flex-shrink-0">
                          {primerNombre.charAt(0).toUpperCase()}{apellidoPaterno.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link 
                            to={`/gastos/remuneraciones/${rem.id}`}
                            className="block font-medium text-gray-800 dark:text-white/90 hover:text-brand-500 truncate"
                          >
                            {nombreParaAvatar}
                          </Link>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {rem.employeeRut || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right dark:text-gray-300">
                      {rem.sueldoLiquido && rem.sueldoLiquido > 0 
                        ? formatCurrency(rem.sueldoLiquido) 
                        : '-'
                      }
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right dark:text-gray-300">
                      {rem.anticipo && rem.anticipo > 0 
                        ? formatCurrency(rem.anticipo) 
                        : '-'
                      }
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right dark:text-gray-100 font-semibold">
                      {formatCurrency(rem.amount)}
                    </td>
                                                
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {rem.area || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {rem.projectCode ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-500">
                            {rem.projectCode}
                          </span>
                          {rem.projectName && rem.projectName.trim() !== '' && rem.projectName !== rem.projectCode && (
                            <span className="text-xs text-gray-500 truncate max-w-[150px]">
                              {rem.projectName}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {rem.period}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        size="sm"
                        color={GASTO_STATUS_MAP[rem.state]?.color || 'secondary'}
                      >
                        {GASTO_STATUS_MAP[rem.state]?.label || rem.state}
                      </Badge>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        <Link 
                          to={`/gastos/remuneraciones/${rem.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm px-2 py-1"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(rem.id)}
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

      {/* 🔥 Paginación mejorada - SIEMPRE VISIBLE */}
      {pagination && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {(pagination.current_page - 1) * pagination.per_page + 1} a{' '}
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de{' '}
            {pagination.total} resultados
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botón Anterior */}
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_prev}
              onClick={prevPage}
              className="px-3 py-1 text-xs"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </Button>

            {/* Números de página - SIEMPRE MOSTRAR AL MENOS LA PÁGINA 1 */}
            <div className="hidden sm:flex space-x-1">
              {pagination.total_pages > 1 ? (
                // Múltiples páginas: mostrar rango completo
                getPaginationRange().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && goToPage(page)}
                    disabled={page === '...' || page === pagination.current_page}
                    className={`px-3 py-1 text-xs rounded ${
                      page === pagination.current_page
                        ? 'bg-brand-500 text-white'
                        : page === '...'
                        ? 'text-gray-500 cursor-default'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))
              ) : (
                // Una sola página: mostrar solo "1" activa
                <button
                  disabled
                  className="px-3 py-1 text-xs rounded bg-brand-500 text-white cursor-default"
                >
                  1
                </button>
              )}
            </div>

            {/* Página actual (solo en móvil) */}
            <div className="sm:hidden text-xs text-gray-600 dark:text-gray-400">
              Página {pagination.current_page} de {pagination.total_pages || 1}
            </div>

            {/* Botón Siguiente */}
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_next}
              onClick={nextPage}
              className="px-3 py-1 text-xs"
            >
              Siguiente
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Información adicional cuando no hay datos */}
      {!loading && remuneraciones.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay remuneraciones</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comience creando una nueva remuneración o importando desde Excel.
          </p>
          <div className="mt-6">
            <Button 
              onClick={openModal}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Remuneración
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Remuneraciones;