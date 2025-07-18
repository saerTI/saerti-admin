import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import projectApiService, { getProjects } from '../../services/projectService';
import { Project, ProjectFilter } from '../../types/project';
import Button from '../../components/ui/button/Button';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

// Status translation and styling
const PROJECT_STATUS_MAP: Record<string, { label: string, color: string }> = {
  'draft': { label: 'Borrador', color: 'bg-gray-200 text-gray-800' },
  'in_progress': { label: 'En Progreso', color: 'bg-blue-200 text-blue-800' },
  'on_hold': { label: 'En Pausa', color: 'bg-yellow-200 text-yellow-800' },
  'completed': { label: 'Completado', color: 'bg-green-200 text-green-800' },
  'cancelled': { label: 'Cancelado', color: 'bg-red-200 text-red-800' }
};

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilter>({});
  const navigate = useNavigate();
  
  // Get auth context (removed tenant references)
  const { user, isAuthenticated } = useAuth();

  // Create status options for the filter
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'en_progreso', label: 'En Progreso' },
    { value: 'suspendido', label: 'En Pausa' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'activo', label: 'Activo' },
  ];

  // Load projects on component mount and when filters change
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        setError('Error loading projects');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Delete project handler
  const handleDeleteProject = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await projectApiService.deleteProject(id);
      // Remove the deleted project from the status
      setProjects(projects.filter(project => project.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el proyecto');
      console.error('Error deleting project:', err);
    }
  };

  // Update filter handler
  const handleFilterChange = (filterName: keyof ProjectFilter, value: any) => {
    if (value === '') {
      // Remove the filter if empty value
      const newFilters = { ...filters };
      delete newFilters[filterName];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [filterName]: value });
    }
  };

  // Retry fetching if there was an error
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Force re-fetch by triggering the useEffect
    setFilters({...filters});
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Proyectos</h1>
        <Button 
          onClick={() => navigate('/projects/new')}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          Nuevo Proyecto
        </Button>
      </div>

      {/* Filters - Improved implementation */}
      <div className="flex flex-wrap gap-6 mb-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="statusFilter">Estado</Label>
              <Select
                options={statusOptions}
                defaultValue={filters.status || ''}
                onChange={(value) => handleFilterChange('status', value)}
                placeholder="Seleccione estado"
              />
            </div>
            
            {/* Add more filters as needed */}
          </div>
        </div>
      </div>

      {/* Error message with retry button */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <div>{error}</div>
            <Button 
              onClick={handleRetry}
              className="bg-red-500 hover:bg-red-600 text-white text-sm"
              size="sm"
            >
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        /* Projects table */
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          {projects.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No se encontraron proyectos con los filtros seleccionados.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Presupuesto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {project.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <Link 
                        to={`/projects/${project.id}`}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {project.client?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_MAP[project.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {PROJECT_STATUS_MAP[project.status]?.label || project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div 
                          className="bg-brand-500 h-2.5 rounded-full" 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{project.progress || 0}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatCurrency(project.budget || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          to={`/projects/${project.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectList;