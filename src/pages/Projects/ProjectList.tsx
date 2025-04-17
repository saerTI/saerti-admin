import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import projectApiService, { Project, ProjectFilter } from '../../services/projectService';
import Button from '../../components/ui/button/Button';

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

  // Load projects on component mount and when filters change
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectApiService.getProjects(filters);
        setProjects(data || []); // Ensure we always have an array even if data is undefined
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar proyectos');
        console.error('Error fetching projects:', err);
        // Initialize with empty array to prevent rendering errors
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [filters]);

  // Delete project handler
  const handleDeleteProject = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await projectApiService.deleteProject(id);
      // Remove the deleted project from the state
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
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

      {/* Filters */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="in_progress">En Progreso</option>
              <option value="on_hold">En Pausa</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          
          {/* Add more filters as needed */}
        </div>
      </div>

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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_MAP[project.state]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {PROJECT_STATUS_MAP[project.state]?.label || project.state}
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
                      {formatCurrency(project.total_budget || 0)}
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